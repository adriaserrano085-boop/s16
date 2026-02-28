
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Activity, UserCheck, Users } from 'lucide-react';
import { apiGet } from '../lib/apiClient';
import attendanceService from '../services/attendanceService';
import './TrainingDetailsModal.css';

const TrainingDetailsModal = ({ event, onClose, systemPlayers = [], currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [attendanceList, setAttendanceList] = useState([]);
    const [stats, setStats] = useState({ presente: 0, retraso: 0, justificada: 0, ausente: 0 });

    useEffect(() => {
        if (event) {
            fetchAttendance();
        }
    }, [event]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            // 1. Get training ID from event ID
            // The event might have id_entrenamiento if mapped, or we query it.
            // But attendanceService.getByEventIds uses 'entrenamientos' table query.
            // Let's rely on retrieving the training record first.
            let trainingId = event.extendedProps?.trainingId;
            let trainingRecord = null;

            if (!trainingId) {
                try {
                    const allTrainings = await apiGet('/entrenamientos').catch(() => []);
                    const found = allTrainings.find(t => t.evento === event.id);
                    if (found) {
                        trainingId = found.id_entrenamiento;
                    }
                } catch (e) {
                    console.error("Error fetching training record:", e);
                }
            }

            if (!trainingId) {
                console.log("No training record found for this event.");
                setLoading(false);
                return;
            }

            // 2. Fetch Attendance
            const attendanceData = await apiGet(`/asistencia?entrenamiento=${trainingId}`).catch(() => []);

            // 3. Merge with Player Names
            // We use systemPlayers passed from props if available to get names. 
            // Otherwise we might show just "Jugador Unknown".
            // Ideally systemPlayers has all players.

            const processedList = systemPlayers.map(player => {
                const record = attendanceData.find(a => a.jugador === player.id);
                const status = record ? record.asistencia : 'No registrado';
                return {
                    ...player,
                    status: status,
                    statusLower: status.toLowerCase()
                };
            });

            // Sort: Presente/Retraso first, then others
            processedList.sort((a, b) => {
                const priority = {
                    'presente': 1,
                    'retraso': 2,
                    'falta justificada': 3,
                    'lesion': 4,
                    'emfermo': 5,
                    'catalana': 6,
                    'falta': 7,
                    'ausente': 8, // 'falta' might be 'ausente' in db or separate? DB has 'Falta'.
                    'no registrado': 9
                };
                const pA = priority[a.statusLower] || 99;
                const pB = priority[b.statusLower] || 99;
                return pA - pB;
            });

            setAttendanceList(processedList);

            // Calculate Stats
            const newStats = { presente: 0, retraso: 0, justificada: 0, ausente: 0 };
            attendanceData.forEach(record => {
                const s = record.asistencia?.toLowerCase();
                if (s === 'presente') newStats.presente++;
                else if (s === 'retraso') newStats.retraso++;
                else if (s === 'falta justificada') newStats.justificada++;
                else if (s === 'lesion' || s === 'emfermo' || s === 'catalana') newStats.justificada++; // Grouping these as justified/excused? Or should they be separate?
                // The user request was specific about "Falta Justificada" as a category. 
                // However, usually Lesion/Enfermo are considered justified in stats.
                // Let's count them as 'justificada' for the simple summary, but show distinct badges in the list.
                else if (s === 'falta' || s === 'ausente') newStats.ausente++;
            });
            setStats(newStats);

        } catch (error) {
            console.error("Error fetching training details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!event) return null;

    const dateStr = event.start ? new Date(event.start).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';

    const timeStr = event.extendedProps?.hora ? event.extendedProps.hora.slice(0, 5) :
        (event.start ? new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '');

    return (
        <div className="training-details-overlay" onClick={onClose}>
            <div className="training-details-content" onClick={e => e.stopPropagation()}>
                <div className="training-details-header">
                    <div className="training-details-type">
                        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/cono.png" alt="Entrenamiento" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <span>Detalles del Entrenamiento</span>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="training-details-body">
                    {/* Event Info */}
                    <div className="training-info-grid">
                        <div className="info-item">
                            <Calendar size={20} />
                            <div>
                                <label>Fecha</label>
                                <p>{dateStr}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <Clock size={20} />
                            <div>
                                <label>Hora</label>
                                <p>{timeStr} hs</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <MapPin size={20} />
                            <div>
                                <label>Lugar</label>
                                <p>{event.extendedProps?.lugar || 'Campo Municipal'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <Users size={20} />
                            <div>
                                <label>Convocados</label>
                                <p>{attendanceList.length > 0 ? attendanceList.length : '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Player View: Personal Attendance Only */}
                    {currentUser?.role === 'JUGADOR' ? (
                        <div className="player-attendance-view">
                            <h4 className="attendance-list-header">Tu Asistencia</h4>
                            {loading ? (
                                <p className="loading-text">Cargando tu estado...</p>
                            ) : (
                                (() => {
                                    const myStatus = attendanceList.find(p => p.id === currentUser.playerId);
                                    const status = myStatus?.status || 'No registrado';
                                    const statusLower = myStatus?.statusLower || 'no-registrado';
                                    let statusClass = `badge-${statusLower.replace(/\s+/g, '-')}`;

                                    // Fallback for unknown status classes
                                    const validClasses = [
                                        'badge-presente', 'badge-retraso', 'badge-falta-justificada',
                                        'badge-lesion', 'badge-emfermo', 'badge-catalana',
                                        'badge-falta', 'badge-ausente', 'badge-no-registrado'
                                    ];
                                    if (!validClasses.includes(statusClass)) statusClass = 'badge-unknown';

                                    return (
                                        <div className={`status-card-large ${statusClass}`}>
                                            <span className="status-large-text">{status}</span>
                                            {status === 'Presente' && <span className="status-icon">✅</span>}
                                            {status === 'Retraso' && <span className="status-icon">⏱️</span>}
                                            {(status === 'Lesion' || status === 'Enfermo') && <span className="status-icon">🏥</span>}
                                            {(status === 'Falta' || status === 'Ausente') && <span className="status-icon">❌</span>}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    ) : (
                        /* Staff View: Stats + List */
                        <>
                            <div>
                                <h4 className="attendance-list-header">Resumen de Asistencia</h4>
                                <div className="attendance-summary">
                                    <div className="stat-card stat-presente">
                                        <span className="stat-value">{stats.presente}</span>
                                        <span className="stat-label">Presente</span>
                                    </div>
                                    <div className="stat-card stat-retraso">
                                        <span className="stat-value">{stats.retraso}</span>
                                        <span className="stat-label">Retraso</span>
                                    </div>
                                    <div className="stat-card stat-justificada">
                                        <span className="stat-value">{stats.justificada}</span>
                                        <span className="stat-label">Justificada</span>
                                    </div>
                                    <div className="stat-card stat-ausente">
                                        <span className="stat-value">{stats.ausente}</span>
                                        <span className="stat-label">Ausente</span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance List */}
                            <div className="attendance-list-section">
                                <div className="attendance-list-header">
                                    <span>Listado de Jugadores</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
                                        {loading ? 'Cargando...' : ''}
                                    </span>
                                </div>

                                <div className="attendance-list">
                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>Cargando asistencia...</div>
                                    ) : attendanceList.length > 0 ? (
                                        attendanceList.map((player) => {
                                            let statusClass = `badge-${player.statusLower.replace(/\s+/g, '-')}`;

                                            const validClasses = [
                                                'badge-presente', 'badge-retraso', 'badge-falta-justificada',
                                                'badge-lesion', 'badge-emfermo', 'badge-catalana',
                                                'badge-falta', 'badge-ausente', 'badge-no-registrado'
                                            ];
                                            if (!validClasses.includes(statusClass)) statusClass = 'badge-unknown';

                                            const fullName = [player.nombre, player.apellidos].filter(Boolean).join(' ') || player.name || 'Jugador';
                                            const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

                                            return (
                                                <div key={player.id} className="attendance-item">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        {player.foto ? (
                                                            <img
                                                                src={player.foto}
                                                                alt={fullName}
                                                                style={{
                                                                    width: '36px', height: '36px',
                                                                    borderRadius: '50%', objectFit: 'cover',
                                                                    border: '2px solid #e2e8f0'
                                                                }}
                                                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            style={{
                                                                width: '36px', height: '36px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #003366, #FF6600)',
                                                                color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                                                                display: player.foto ? 'none' : 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <span className="player-name">{fullName}</span>
                                                    </div>
                                                    <span className={`attendance-badge ${statusClass}`}>
                                                        {player.status}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>No hay datos de asistencia disponibles.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="training-details-footer">
                    <button className="btn-close-modal" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetailsModal;
