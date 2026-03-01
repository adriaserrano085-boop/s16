import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, HelpCircle, Save, Info, Activity, Users, Filter } from 'lucide-react';
import { apiGet } from '../lib/apiClient';
import playerService from '../services/playerService';
import attendanceService from '../services/attendanceService';
import './AttendanceModal.css';

const AttendanceModal = ({ onClose, initialEventId, user }) => {
    // initialEventId here is actually treated as trainingId when passed from CalendarPage for a specific training. 
    // The prop name is kept generic but the logic will act on it.
    // If it's a UUID (36 chars), it's likely an Event ID (from the generic picker).
    // If it's an Integer (or string integer), it's a Training ID? No, Training IDs are also Serial/Int usually?
    // Wait, entrenamientos.id_entrenamiento is Serial (Int). CalendarPage passes training_id (Int).
    // initialEventId (from generic picker) is Event ID (UUID).

    // To distinguish:
    // If we pass an integer-like ID, treat as Training ID.
    // If we pass a UUID, treat as Event ID.
    // OR we change the prop name to 'initialId' and 'initialIdType' ('event' or 'training').
    // But for minimal changes:


    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
    const [filterDate, setFilterDate] = useState('');
    const [players, setPlayers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Status cycle: Presente -> Retraso -> Falta -> Falta Justificada -> Lesion -> Catalana -> Emfermo -> Pendiente
    // Note: 'Emfermo' contains a typo but matches the user provided image/requirement.
    const statusCycle = ['Presente', 'Retraso', 'Falta', 'Falta Justificada', 'Lesion', 'Catalana', 'Emfermo', 'Pendiente'];

    useEffect(() => {
        fetchEvents();
        fetchPlayers();
    }, [filterDate]);

    useEffect(() => {
        if (initialEventId) {
            console.log('Setting initial selection. ID:', initialEventId);
            // Check if it's a training ID (numeric) or Event UUID
            const isTrainingId = !isNaN(initialEventId);

            if (isTrainingId) {
                // We need to find the event ID for this training ID
                // We can't do it synchronously here. 
                // We will rely on fetchEvents to populate the events list, 
                // and then we can find the event ID from the list?
                // OR we fetch it here separately?
                // Better: fetchEvents logic handles populating the list. 
                // But we need to set selectedEventId to the EVENT UUID.

                // Let's resolve the event ID effectively.
                const resolveEventId = async () => {
                    try {
                        const training = await apiGet(`/entrenamientos/${initialEventId}`);
                        if (training && training.evento) {
                            console.log('Resolved Training ID', initialEventId, 'to Event ID', training.evento);
                            setSelectedEventId(training.evento);
                        }
                    } catch (e) {
                        console.error("Error resolving event ID:", e);
                    }
                };
                resolveEventId();
            } else {
                setSelectedEventId(initialEventId);
            }
        }
    }, [initialEventId]);

    useEffect(() => {
        if (selectedEventId) {
            fetchExistingAttendance();
        }
    }, [selectedEventId]);

    const fetchEvents = async () => {
        try {
            // Fetch training events — just events, no nested training data
            const eventos = await apiGet(`/eventos?tipo=Entrenamiento${filterDate ? `&fecha=${filterDate}` : ''}`);

            if (!eventos || eventos.length === 0) {
                console.log('No training events found');
                setEvents([]);
                return;
            }

            // Sort by date descending, take the most recent 20
            const sorted = [...eventos]
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 20);

            // Format for display — trainingId will be resolved lazily
            const formattedEvents = sorted.map(e => ({
                trainingId: null, // resolved on demand
                eventId: e.id,
                title: e.tipo || 'Entrenamiento',
                date: e.fecha,
                time: e.hora
            }));

            setEvents(formattedEvents);

            // Auto-select the event closest to today
            if (formattedEvents.length > 0 && !initialEventId) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let closestEvent = formattedEvents[0];
                let minDiff = Math.abs(new Date(formattedEvents[0].date) - today);

                formattedEvents.forEach(event => {
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    const diff = Math.abs(eventDate - today);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestEvent = event;
                    }
                });

                setSelectedEventId(closestEvent.eventId);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    // Resolve training ID for selected event on demand (lightweight)
    const resolveTrainingId = async (eventId) => {
        const existing = events.find(e => e.eventId === eventId);
        if (existing?.trainingId) return existing.trainingId;

        try {
            const trainings = await apiGet(`/entrenamientos?evento=${eventId}`);
            if (trainings && trainings.length > 0) {
                const tid = trainings[0].id_entrenamiento;
                // Cache it in the events list
                setEvents(prev => prev.map(e =>
                    e.eventId === eventId ? { ...e, trainingId: tid } : e
                ));
                return tid;
            }
        } catch (e) {
            console.error('[Attendance] Error resolving training ID:', e);
        }
        return null;
    };

    const fetchPlayers = async () => {
        try {
            const data = await playerService.getAll();

            // Sort by apellidos (last name) alphabetically
            const sortedData = (data || []).sort((a, b) =>
                (a.apellidos || "").localeCompare(b.apellidos || "", 'es', { sensitivity: 'base' })
            );

            // RBAC: If user is a Player, only show themselves
            if (user?.role === 'JUGADOR' && user.playerId) {
                const myself = sortedData.find(p => p.id === user.playerId);
                setPlayers(myself ? [myself] : []);
            } else {
                setPlayers(sortedData);
            }
        } catch (err) {
            console.error('Error fetching players:', err);
            alert('Error al cargar jugadores');
        }
    };

    const fetchExistingAttendance = async () => {
        setLoading(true);
        try {
            // Resolve training ID lazily (fetches /entrenamientos?evento=X only once per event)
            const trainingId = await resolveTrainingId(selectedEventId);

            if (!trainingId) {
                console.warn('[Attendance] No training record found for event:', selectedEventId);
                // Still show all players as Pendiente so staff can take attendance
                const initialAttendance = {};
                players.forEach(player => { initialAttendance[player.id] = 'Pendiente'; });
                setAttendance(initialAttendance);
                return;
            }

            const data = await attendanceService.getByTrainingId(trainingId);

            // Build map from existing records, default rest to Pendiente
            const attendanceMap = {};
            players.forEach(player => { attendanceMap[player.id] = 'Pendiente'; });
            (data || []).forEach(record => {
                attendanceMap[record.jugador] = mapStatusToSpanish(record.asistencia);
            });

            setAttendance(attendanceMap);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            const initialAttendance = {};
            players.forEach(player => { initialAttendance[player.id] = 'Pendiente'; });
            setAttendance(initialAttendance);
        } finally {
            setLoading(false);
        }
    };

    const mapStatusToSpanish = (status) => {
        if (statusCycle.includes(status)) return status;

        const map = {
            'present': 'Presente',
            'late': 'Retraso',
            'absent': 'Falta',
            'justified': 'Falta Justificada',
            'injured': 'Lesion',
            'sick': 'Emfermo',
            'catalana': 'Catalana'
        };
        return map[status] || 'Pendiente';
    };

    const handleAttendanceToggle = (playerId) => {
        // RBAC: Players cannot edit attendance
        if (user?.role === 'JUGADOR') return;

        setAttendance(prev => {
            const current = prev[playerId] || 'Pendiente';
            const currentIndex = statusCycle.indexOf(current);
            const nextIndex = (currentIndex + 1) % statusCycle.length;
            return { ...prev, [playerId]: statusCycle[nextIndex] };
        });
    };

    const handleSave = async () => {
        if (!selectedEventId) {
            alert('Por favor selecciona un evento');
            return;
        }

        setSaving(true);
        try {
            const trainingId = await resolveTrainingId(selectedEventId);
            if (!trainingId) {
                alert('No se encontró el registro de entrenamiento para este evento.');
                setSaving(false);
                return;
            }

            const records = Object.entries(attendance)
                .filter(([_, status]) => status !== 'Pendiente')
                .map(([playerId, status]) => ({
                    entrenamiento: trainingId,
                    jugador: playerId,
                    asistencia: status
                }));

            if (records.length === 0) {
                alert('No hay asistencia para guardar');
                setSaving(false);
                return;
            }

            await attendanceService.upsert(records);
            alert('Asistencia guardada correctamente');
            onClose();
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Error al guardar asistencia: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Presente': return CheckCircle;
            case 'Retraso': return Clock;
            case 'Falta': return XCircle;
            case 'Falta Justificada': return Info;
            case 'Lesion': return Activity;
            case 'Emfermo': return HelpCircle;
            case 'Enfermo': return HelpCircle;
            case 'Catalana': return Users;
            default: return HelpCircle;
        }
    };

    return (
        <div className="attendance-modal-overlay">
            <div className="attendance-modal-content">
                {/* Header */}
                <div className="attendance-header">
                    <h2 className="attendance-title">Pasar Lista</h2>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Event Selector */}
                <div className="event-selector-section">
                    <label className="section-label">
                        Seleccionar Evento
                    </label>
                    <div className="filter-group">
                        <div className="filter-label">
                            <Filter size={16} />
                            <span>Filtrar por fecha:</span>
                        </div>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="form-control"
                    >
                        <option value="">-- Selecciona un entrenamiento --</option>
                        {events.map(event => (
                            <option key={event.eventId} value={event.eventId}>
                                {event.title} - {new Date(event.date).toLocaleDateString('es-ES')} {event.time || ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Players List */}
                <div className="players-list-container">
                    {loading ? (
                        <div className="status-message">Cargando...</div>
                    ) : !selectedEventId ? (
                        <div className="status-message">
                            Selecciona un evento para pasar lista
                        </div>
                    ) : players.length === 0 ? (
                        <div className="status-message">
                            No hay jugadores disponibles
                        </div>
                    ) : (
                        players.map(player => {
                            const status = attendance[player.id] || 'Pendiente';
                            const StatusIcon = getStatusIcon(status);

                            return (
                                <div
                                    key={player.id}
                                    onClick={() => handleAttendanceToggle(player.id)}
                                    className={`player-item ${user?.role === 'JUGADOR' ? 'read-only' : ''}`}
                                    style={{ cursor: user?.role === 'JUGADOR' ? 'default' : 'pointer' }}
                                >
                                    <div className="player-left">
                                        {player.foto ? (
                                            <img src={player.foto} alt={player.nombre} className="player-avatar" />
                                        ) : (
                                            <div className="player-avatar-placeholder">
                                                {player.nombre.charAt(0)}{player.apellidos.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="player-info-name">
                                                {player.nombre} {player.apellidos}
                                            </div>
                                            {player.posiciones && (
                                                <div className="player-info-pos">
                                                    {player.posiciones}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`player-status-badge status-${status.replace(' ', '-')}`}>
                                        <StatusIcon size={20} />
                                        <span>{status}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="btn-modal-cancel"
                    >
                        {user?.role === 'JUGADOR' ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {user?.role !== 'JUGADOR' && (
                        <button
                            onClick={handleSave}
                            disabled={!selectedEventId || saving}
                            className="btn-modal-save"
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AttendanceModal;
