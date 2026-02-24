import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, HelpCircle, Save, Info, Activity, Users, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
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
                    const { data } = await supabase
                        .from('entrenamientos')
                        .select('evento')
                        .eq('id_entrenamiento', initialEventId)
                        .single();
                    if (data && data.evento) {
                        console.log('Resolved Training ID', initialEventId, 'to Event ID', data.evento);
                        setSelectedEventId(data.evento);
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
            // 1. Fetch relevant Eventos sorted by date (Future -> Past)
            // We limit to 50 to get a good range of recent past and upcoming future
            let query = supabase
                .from('eventos')
                .select('id, tipo, fecha, hora')
                .eq('tipo', 'Entrenamiento')
                .order('fecha', { ascending: false }); // Most recent/future first

            if (filterDate) {
                query = query.eq('fecha', filterDate);
            } else {
                query = query.limit(50);
            }

            const { data: eventos, error: eventosError } = await query;

            if (eventosError) {
                console.error('Error fetching eventos:', eventosError);
                throw eventosError;
            }

            if (!eventos || eventos.length === 0) {
                console.log('No training events found');
                setEvents([]);
                return;
            }

            // 2. Get the list of IDs to query Entrenamientos.
            // IMPORTANT: Entrenamientos.evento links to Eventos.id
            const eventLinkIds = eventos.map(e => e.id).filter(Boolean);

            if (eventLinkIds.length === 0) {
                setEvents([]);
                return;
            }

            // 3. Fetch corresponding Entrenamientos for these events
            const { data: trainings, error: trainingsError } = await supabase
                .from('entrenamientos')
                .select('id_entrenamiento, evento')
                .in('evento', eventLinkIds);

            if (trainingsError) {
                console.error('Error fetching trainings:', trainingsError);
                throw trainingsError;
            }

            // 4. Map Eventos to their Trainings
            // Create a map: Key = evento (UUID) (from data), Value = Training Record
            const trainingMap = {};
            trainings.forEach(t => {
                trainingMap[t.evento] = t;
            });

            // 5. Combine and Format
            const formattedEvents = eventos
                .filter(e => trainingMap[e.id]) // Link via id (UUID)
                .map(e => {
                    const training = trainingMap[e.id];
                    return {
                        trainingId: training.id_entrenamiento,
                        eventId: e.id,          // We keep the internal UUID for React keys
                        title: e.tipo || 'Entrenamiento',
                        date: e.fecha,
                        time: e.hora
                    };
                });

            // Ensure initial selection is handled/preserved if needed
            if (initialEventId && !formattedEvents.find(e => e.eventId === initialEventId || e.trainingId === initialEventId)) {
                // Logic to fetch single missing event if needed, but keeping it simple for now as requested.
            }

            setEvents(formattedEvents);

            // Auto-select the event closest to today's date
            if (formattedEvents.length > 0) {

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Find the event closest to today
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

                // Auto-select if no initial selection or if we want to enforce it?
                // Only if !initialEventId.
                if (!initialEventId) {
                    setSelectedEventId(closestEvent.eventId);
                    console.log('Auto-selected closest event:', closestEvent);
                }
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            alert('Error al cargar eventos: ' + err.message);
        }
    };

    const fetchPlayers = async () => {
        try {
            const data = await playerService.getAll();

            // RBAC: If user is a Player, only show themselves
            if (user?.role === 'JUGADOR' && user.playerId) {
                const myself = data.find(p => p.id === user.playerId);
                setPlayers(myself ? [myself] : []);
            } else {
                setPlayers(data || []);
            }
        } catch (err) {
            console.error('Error fetching players:', err);
            alert('Error al cargar jugadores');
        }
    };

    const fetchExistingAttendance = async () => {
        setLoading(true);
        try {
            const selectedEvent = events.find(e => e.eventId === selectedEventId);
            if (!selectedEvent) return;

            const data = await attendanceService.getByTrainingId(selectedEvent.trainingId);

            // Convert to attendance map
            const attendanceMap = {};
            data.forEach(record => {
                attendanceMap[record.jugador] = mapStatusToSpanish(record.asistencia);
            });

            // Initialize all players with 'Pendiente' if not in map
            const initialAttendance = {};
            players.forEach(player => {
                initialAttendance[player.id] = attendanceMap[player.id] || 'Pendiente';
            });

            setAttendance(initialAttendance);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            // Initialize all as Pendiente
            const initialAttendance = {};
            players.forEach(player => {
                initialAttendance[player.id] = 'Pendiente';
            });
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

        const selectedEvent = events.find(e => e.eventId === selectedEventId);
        if (!selectedEvent) {
            alert('Evento no encontrado');
            return;
        }

        setSaving(true);
        try {
            const records = Object.entries(attendance)
                .filter(([_, status]) => status !== 'Pendiente')
                .map(([playerId, status]) => ({
                    entrenamiento: selectedEvent.trainingId,
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
