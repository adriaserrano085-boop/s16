
import React, { useState, useEffect } from 'react';
import { apiGet } from '../lib/apiClient';
import { X, Calendar as CalendarIcon, Clock, Users, Save } from 'lucide-react';
import AttendanceList from './AttendanceList';
import attendanceService from '../services/attendanceService';
import { trainingService } from '../services/trainingService';

// Helper to format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
};

const QuickAttendanceModal = ({ onClose, players }) => {
    const [trainings, setTrainings] = useState([]);
    const [selectedTrainingId, setSelectedTrainingId] = useState('');
    const [loadingTrainings, setLoadingTrainings] = useState(true);
    const [attendance, setAttendance] = useState({});
    const [saving, setSaving] = useState(false);

    // Fetch recent and upcoming trainings (e.g., last 2 months and next 1 month)
    useEffect(() => {
        const fetchTrainings = async () => {
            try {
                // We need to join with eventos to get date and time
                // But supabase JS client join syntax is tricky if not set up as view or proper FK detection
                // Let's use the trainingService.getAll() which selects *
                // But wait, trainingService.getAll just gets from 'entrenamientos'.
                // 'entrenamientos' has 'evento' FK to 'eventos'.

                // Let's try to fetch trainings with event details manually for control
                const today = new Date();
                const pastDate = new Date();
                pastDate.setMonth(today.getMonth() - 2);
                const pastDateStr = pastDate.toISOString().split('T')[0];

                // Fetch events
                const events = await apiGet(`/eventos/?tipo=Entrenamiento&fecha_gte=${pastDateStr}`);

                // Fetch trainings
                const allTrainings = await apiGet('/entrenamientos/');

                // Filter valid trainings
                const validTrainings = (events || [])
                    .map(e => {
                        const training = (allTrainings || []).find(t => t.evento === e.id);
                        if (!training) return null;
                        return {
                            id: training.id_entrenamiento || training.id,
                            eventId: e.id,
                            date: e.fecha,
                            time: e.hora,
                            type: e.tipo
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20);

                setTrainings(validTrainings);

                // Select the most recent one by default if available
                if (validTrainings.length > 0) {
                    setSelectedTrainingId(validTrainings[0].id);
                }

            } catch (err) {
                console.error("Error fetching trainings for modal:", err);
            } finally {
                setLoadingTrainings(false);
            }
        };

        fetchTrainings();
    }, []);

    // Fetch attendance when selected training changes
    useEffect(() => {
        if (!selectedTrainingId) return;

        const loadAttendance = async () => {
            try {
                const data = await attendanceService.getByTrainingId(selectedTrainingId);
                const attMap = {};

                // Initialize all as Pending
                players.forEach(p => attMap[p.id] = 'Pendiente');

                // Overlay existing data
                if (data) {
                    data.forEach(record => {
                        if (record.jugador && record.jugador.id) {
                            attMap[record.jugador.id] = record.asistencia;
                        }
                    });
                }
                setAttendance(attMap);
            } catch (err) {
                console.error("Error loading attendance:", err);
            }
        };

        if (players.length > 0) {
            loadAttendance();
        }
    }, [selectedTrainingId, players]);

    const handleToggle = (playerId) => {
        setAttendance(prev => {
            const current = prev[playerId] || 'Pendiente';
            const statusCycle = ['Pendiente', 'Presente', 'Retraso', 'Falta', 'Falta Justificada', 'Lesionado', 'Enfermo', 'Catalana'];
            const currentIndex = statusCycle.indexOf(current);
            const nextIndex = (currentIndex + 1) % statusCycle.length;
            return { ...prev, [playerId]: statusCycle[nextIndex] };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const upsertData = Object.entries(attendance).map(([playerId, status]) => ({
                entrenamiento: selectedTrainingId,
                jugador: playerId,
                asistencia: status
            }));

            await attendanceService.upsert(upsertData);
            alert("Asistencia guardada correctamente");
            onClose(); // Close modal on success? Or keep open? Maybe close.
        } catch (err) {
            console.error("Error saving:", err);
            alert("Error al guardar asistencia");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-bg-orange)', borderRadius: '16px',
                width: '90%', maxWidth: '600px', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 102, 0, 0.2)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255, 102, 0, 0.05)'
                }}>
                    <h3 style={{ margin: 0, color: '#003366', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} /> Pasar Lista Rápida
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>

                    {/* Selector */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#495057' }}>Seleccionar Entrenamiento</label>
                        <select
                            value={selectedTrainingId}
                            onChange={(e) => setSelectedTrainingId(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem' }}
                            disabled={loadingTrainings}
                        >
                            {loadingTrainings ? (
                                <option>Cargando entrenamientos...</option>
                            ) : (
                                trainings.length > 0 ? (
                                    trainings.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {formatDate(t.date)} - {t.time?.slice(0, 5)} hrs ({t.type})
                                        </option>
                                    ))
                                ) : (
                                    <option>No se encontraron entrenamientos recientes</option>
                                )
                            )}
                        </select>
                    </div>

                    {/* List */}
                    {selectedTrainingId ? (
                        <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                            <AttendanceList
                                players={players}
                                attendance={attendance}
                                onToggle={handleToggle}
                            />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                            Selecciona un entrenamiento para gestionar la asistencia.
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem', justifyContent: 'flex-end', background: 'rgba(255, 102, 0, 0.05)' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#e9ecef', color: '#495057', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedTrainingId || saving}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
                            background: '#003366', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            opacity: (!selectedTrainingId || saving) ? 0.7 : 1
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Asistencia'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default QuickAttendanceModal;
