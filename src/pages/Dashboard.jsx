import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import {
    ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Users, Trophy,
    Settings, LogOut, Search, Filter, Plus, User, Activity, Clock,
    MapPin, Info, CheckCircle, XCircle
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import { supabase } from '../lib/supabaseClient';
import { eventService } from '../services/eventService';
import { matchService } from '../services/matchService';
import { rivalService } from '../services/rivalService';
import { trainingService } from '../services/trainingService';
import playerService from '../services/playerService';
import attendanceService from '../services/attendanceService';
import { leagueService } from '../services/leagueService';

import AttendanceModal from '../components/AttendanceModal';
import MatchDetailsModal from '../components/MatchDetailsModal';
import TrainingDetailsModal from '../components/TrainingDetailsModal';
import SizeDetailsModal from '../components/SizeDetailsModal';

import './DashboardPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const HOSPITALET_SHIELD = 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png';

const MONTH_IMAGES = {
    0: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/enerodef6%20(1).png',
    1: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/febrerodef%20(1).png',
    2: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/marzodef%20(1).png',
    3: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/abrildef%20(1).png',
    4: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/mayodef%20(1).png',
    5: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/juniodef%20(1).png',
    6: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/juliodef%20(1).png',
    7: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/agostodef%20(1).png',
    8: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/septiembredef%20(1).png',
    9: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/octubredef%20(1).png',
    10: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/noviembredef%20(1).png',
    11: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Meses/diciembredef%20(1).png'
};

const getEventType = (e) => {
    return e?.displayTipo || e?.tipo || e?.Tipo || e?.Tipo_evento || e?.tipo_evento || 'Evento';
};

const Dashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const calendarRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(propUser || null);
    const [events, setEvents] = useState([]);
    const [hospitaletPlayers, setHospitaletPlayers] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [standings, setStandings] = useState([]);

    // Modal states
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const resolveUser = async () => {
            if (propUser) {
                setCurrentUser({ ...propUser, role: 'STAFF' });
                fetchDashboardData();
            } else {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    setCurrentUser({ ...authUser, role: 'STAFF', email: authUser.email });
                    fetchDashboardData();
                } else {
                    navigate('/login');
                }
            }
        };
        resolveUser();
    }, [navigate, propUser]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log('Fetching dashboard data from standardized services...');
            const [eventData, matchData, rivalData, trainingData, playersData, attData, leagueData] = await Promise.all([
                eventService.getAll(),
                matchService.getAll(),
                rivalService.getAll(),
                trainingService.getAll(),
                playerService.getAll(),
                attendanceService.getAll(),
                leagueService.getStandings()
            ]);

            console.log('Data received:', {
                events: eventData?.length || 0,
                matches: matchData?.length || 0,
                rivals: rivalData?.length || 0,
                trainings: trainingData?.length || 0,
                players: playersData?.length || 0,
                attendance: attData?.length || 0,
                league: leagueData?.length || 0
            });

            setHospitaletPlayers(playersData || []);
            setAllAttendance(attData || []);
            setStandings(leagueData || []);

            if (eventData) {
                const mappedEvents = eventData.map(e => {
                    const tipoContent = getEventType(e);
                    const isMatch = tipoContent.toLowerCase().includes('partido') || tipoContent.toLowerCase().includes('match');

                    let matchDetails = {};
                    if (isMatch && matchData) {
                        // Check for 'Evento' column matching Event UUID 'e.id'
                        const matchRecord = matchData.find(m => m.Evento && String(m.Evento) === String(e.id));
                        if (matchRecord) {
                            const rival = rivalData?.find(r => r.id_equipo == matchRecord.Rival);
                            const isHospitaletLocal = matchRecord.es_local === true || (matchRecord.lugar && matchRecord.lugar.toLowerCase().includes('feixa llarga'));
                            const rivalName = rival?.nombre_equipo || 'Rival';
                            const rivalShield = rival?.escudo;

                            matchDetails = {
                                isMatch: true,
                                match_id: matchRecord.id,
                                league: matchRecord.competicion || 'Liga',
                                homeTeamName: isHospitaletLocal ? 'RC HOSPITALET' : rivalName,
                                homeTeamShield: isHospitaletLocal ? HOSPITALET_SHIELD : rivalShield,
                                awayTeamName: isHospitaletLocal ? rivalName : 'RC HOSPITALET',
                                awayTeamShield: isHospitaletLocal ? rivalShield : HOSPITALET_SHIELD,
                                scoreDisplay: (matchRecord.marcador_local !== null && matchRecord.marcador_visitante !== null)
                                    ? `${matchRecord.marcador_local} - ${matchRecord.marcador_visitante}`
                                    : null,
                                rivalName: rivalName,
                                rivalShield: rivalShield
                            };
                        }
                    }

                    let trainingDetails = {};
                    const isTraining = tipoContent.toLowerCase().includes('entrenamiento') || tipoContent.toLowerCase().includes('training');
                    if (isTraining && trainingData) {
                        // Check for 'evento' column matching Event UUID 'e.id'
                        const trainingRecord = trainingData.find(t => t.evento == e.id);
                        if (trainingRecord) {
                            trainingDetails = {
                                isTraining: true,
                                training_id: trainingRecord.id_entrenamiento || trainingRecord.id
                            };
                        }
                    }

                    return {
                        id: e.id,
                        title: tipoContent,
                        start: e.fecha && e.hora ? `${e.fecha}T${e.hora}` : e.fecha,
                        extendedProps: {
                            ...e,
                            displayTipo: tipoContent,
                            ...matchDetails,
                            ...trainingDetails
                        }
                    };
                });
                console.log('Mapped events count:', mappedEvents.length);
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error('CRITICAL: Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => calendarRef.current?.getApi().prev();
    const handleNextMonth = () => calendarRef.current?.getApi().next();
    const handleToday = () => calendarRef.current?.getApi().today();

    const handleEventClick = (info) => {
        const props = info.event.extendedProps;
        if (props.isMatch) {
            setSelectedMatch(info.event);
        } else {
            const type = (props.displayTipo || props.Tipo || '').toLowerCase();
            if (type.includes('entrenamiento') || info.event.title.toLowerCase().includes('entrenamiento')) {
                setSelectedTraining(info.event);
            }
        }
    };

    const staffAttendanceChartData = (() => {
        if (!events.length || !allAttendance.length) return null;

        // Find last 10 past events that actually HAVE attendance data recorded
        // First, get all unique event IDs that have attendance
        const eventsWithAttendance = [...new Set(allAttendance.map(a => a.entrenamientos?.evento || a.evento))].filter(Boolean);

        const now = new Date();
        const pastEventsWithAttendance = events
            .filter(e => eventsWithAttendance.includes(e.id) && new Date(e.start) < now)
            .sort((a, b) => new Date(b.start) - new Date(a.start))
            .slice(0, 10);

        if (pastEventsWithAttendance.length === 0) return null;

        const pastEventIds = pastEventsWithAttendance.map(e => e.id);

        // Calculate stats for all players based ONLY on these 10 events
        const playerStats = hospitaletPlayers.map(p => {
            const pAtt = allAttendance.filter(a => {
                const eventId = a.entrenamientos?.evento || a.evento || a.eventId;
                return a.jugador === p.id && pastEventIds.includes(eventId);
            });

            const total = pAtt.length;
            if (total === 0) return { name: p.nombre, presente: 0, retraso: 0, justificada: 0 };

            const presente = pAtt.filter(a => a.asistencia === 'Presente').length;
            const retraso = pAtt.filter(a => a.asistencia === 'Retraso').length;

            // Justified includes: Falta Justificada, Lesion, Enfermo/Emfermo, Catalana
            const justifiedTypes = ['Falta Justificada', 'Lesión', 'Lesion', 'Enfermo', 'Emfermo', 'Catalana'];
            const justificada = pAtt.filter(a => justifiedTypes.includes(a.asistencia)).length;

            return { name: p.nombre, presente, retraso, justificada };
        });

        // Sort: 1. Presentes DESC, 2. Retrasos DESC, 3. Justificadas DESC
        const sortedStats = playerStats.sort((a, b) => {
            if (b.presente !== a.presente) return b.presente - a.presente;
            if (b.retraso !== a.retraso) return b.retraso - a.retraso;
            return b.justificada - a.justificada;
        });

        return {
            labels: sortedStats.map(s => s.name),
            datasets: [
                {
                    label: 'Presente',
                    data: sortedStats.map(s => s.presente),
                    backgroundColor: '#28a745',
                    borderRadius: 4
                },
                {
                    label: 'Retraso',
                    data: sortedStats.map(s => s.retraso),
                    backgroundColor: '#ffc107',
                    borderRadius: 4
                },
                {
                    label: 'Justificada',
                    data: sortedStats.map(s => s.justificada),
                    backgroundColor: '#17a2b8',
                    borderRadius: 4
                }
            ]
        };
    })();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <img src={HOSPITALET_SHIELD} alt="Logo" className="header-logo" />
                    <div className="header-title">
                        <h1 className="dashboard-title">Dashboard</h1>
                        <div className="header-user-info">
                            <p className="user-email">{currentUser?.email}</p>
                            <span className="user-role-badge user-role-badge--orange">{currentUser?.role || 'STAFF'}</span>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    <button onClick={() => navigate('/login')} className="btn btn-logout">Cerrar Sesión</button>
                    <div className="connection-status">
                        Conexión Establecida con Base de Datos
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Partidos Section */}
                <div className="dashboard-card dashboard-card--partidos">
                    <div className="card-header card-header--bordered">
                        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Partidos" className="section-icon section-icon--lg" />
                        <h2 className="card-title card-title--section">PARTIDOS</h2>
                    </div>
                    <div className="matches-grid">
                        {(() => {
                            const now = new Date();
                            const allMatches = events.filter(e => e.extendedProps.isMatch);
                            const pastMatches = allMatches.filter(e => new Date(e.start) < now).sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 4);
                            const nextMatch = allMatches.filter(e => new Date(e.start) >= now).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 1);
                            const displayMatches = [...nextMatch, ...pastMatches];

                            if (displayMatches.length === 0) return <p className="empty-state-text">No hay partidos registrados.</p>;

                            return displayMatches.map((match, idx) => {
                                const props = match.extendedProps;
                                const isNext = new Date(match.start) >= now;
                                return (
                                    <div key={match.id || idx} className={`match-card ${isNext ? 'next-match' : ''}`} onClick={() => setSelectedMatch(match)}>
                                        {isNext && <div className="next-match-badge">PRÓXIMO</div>}
                                        <div className="match-card-league">
                                            <span className="match-card-league-bold">{props.league}</span>
                                            <span className="match-card-date">{new Date(match.start).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                                        </div>
                                        <div className="match-card-team">
                                            {props.homeTeamShield && <img src={props.homeTeamShield} className="match-card-shield" alt="Shield" />}
                                            <span className="match-card-team-name">{props.homeTeamName}</span>
                                        </div>

                                        {props.scoreDisplay ? (
                                            <div className="match-card-score match-card-score--no-border">{props.scoreDisplay}</div>
                                        ) : (
                                            <div className="match-card-vs match-card-vs--spaced">vs</div>
                                        )}

                                        <div className="match-card-team">
                                            {props.awayTeamShield && <img src={props.awayTeamShield} className="match-card-shield" alt="Shield" />}
                                            <span className="match-card-team-name">{props.awayTeamName}</span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Classification Section */}
                <div className="dashboard-card dashboard-card--standings">
                    <div className="card-header card-header--bordered">
                        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png" alt="Clasificación" className="section-icon section-icon--lg" />
                        <h2 className="card-title card-title--section">CLASIFICACIÓN</h2>
                    </div>
                    <div className="standings-mini-table">
                        <table className="mini-table">
                            <thead>
                                <tr>
                                    <th className="th-rank">#</th>
                                    <th className="th-team">Equipo</th>
                                    <th className="th-pj">PJ</th>
                                    <th className="th-pts">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.slice(0, 6).map((team, idx) => (
                                    <tr key={idx} className={team.team === 'RC HOSPITALET' ? 'row-highlight' : ''}>
                                        <td className="td-rank">{team.ranking}</td>
                                        <td className="td-team">
                                            <div className="team-cell">
                                                {team.escudo && <img src={team.escudo} alt="" className="mini-shield" />}
                                                <span>{team.team}</span>
                                            </div>
                                        </td>
                                        <td className="td-pj">{team.jugados}</td>
                                        <td className="td-pts">{team.puntos}</td>
                                    </tr>
                                ))}
                                {standings.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="empty-table-text">No hay datos de clasificación.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="card-actions-footer">
                        <button
                            onClick={() => navigate('/statistics')}
                            className="btn btn-light-green"
                        >
                            <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png" alt="Stats" className="btn-icon-custom" />
                            VER ESTADÍSTICAS
                        </button>
                    </div>
                </div>

                <div className="dashboard-grid-bottom">
                    {/* Calendar Section */}
                    <div className="dashboard-card no-padding-card">
                        <div className="dashboard-banner-container dashboard-banner-container--flush">
                            <img
                                src={MONTH_IMAGES[currentDate.getMonth()]}
                                alt="Dashboard Banner"
                                className="dashboard-banner-image"
                            />
                            <div className="dashboard-banner-overlay">
                                <div className="header-controls-left">
                                    {/* Month navigation removed as requested for Dashboard */}
                                </div>
                                <div className="header-controls-right">
                                    {/* Calendar button moved below */}
                                </div>
                            </div>
                        </div>

                        <div className="calendar-section-padding">
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                                initialView={isMobile ? "listMonth" : "dayGridMonth"}
                                locale={esLocale}
                                events={events}
                                eventClick={handleEventClick}
                                headerToolbar={false}
                                datesSet={(arg) => {
                                    const midDate = new Date(arg.view.currentStart);
                                    midDate.setDate(midDate.getDate() + 15);
                                    setCurrentDate(midDate);
                                }}
                                height="auto"
                                eventClassNames={(arg) => {
                                    const type = (arg.event.extendedProps.displayTipo || arg.event.title || '').toLowerCase();
                                    if (type.includes('partido') || type.includes('match') || arg.event.extendedProps.isMatch) return ['evt-match'];
                                    if (type.includes('entrenamiento') || type.includes('training')) return ['evt-training'];
                                    return [];
                                }}
                                eventContent={(eventInfo) => {
                                    const props = eventInfo.event.extendedProps;
                                    const isMatch = props.isMatch;
                                    const isTraining = props.displayTipo?.toLowerCase().includes('entrenamiento') || props.displayTipo?.toLowerCase().includes('training') || eventInfo.event.title.toLowerCase().includes('entrenamiento');
                                    const hora = props.hora;

                                    return (
                                        <div className="event-content-simple">
                                            {isTraining && (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/cono.png" alt="Training" className="event-icon" />
                                            )}
                                            {isMatch && (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Match" className="event-icon" />
                                            )}
                                            <div className="event-text-truncate">
                                                {hora && <span className="event-time-bold">{hora.slice(0, 5)}</span>}
                                                {eventInfo.event.title}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                        <div className="card-actions-footer card-actions-footer--padded">
                            <button
                                onClick={() => navigate('/calendario')}
                                className="btn btn-light-green"
                            >
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Calendario.png" alt="Cal" className="btn-icon-custom" />
                                CALENDARIO
                            </button>
                        </div>
                    </div>

                    <div className="tallas-grid-wrapper">
                        {/* Tallas Section */}
                        <div className="dashboard-card">
                            <div className="card-header card-header--bordered">
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Tallas.png" alt="Tallas" className="section-icon section-icon--lg" />
                                <h2 className="card-title card-title--section">TALLAS ({hospitaletPlayers.length})</h2>
                            </div>
                            <div className="size-cards-container size-cards-container--padded">
                                {(() => {
                                    const grouped = hospitaletPlayers.reduce((acc, p) => {
                                        const s = (p.talla || 'N/A').toString().trim().toUpperCase();
                                        if (!acc[s]) acc[s] = [];
                                        acc[s].push(p);
                                        return acc;
                                    }, {});
                                    const order = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'N/A'];
                                    return Object.keys(grouped).sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))).map(size => (
                                        <div key={size} className="size-card" onClick={() => setSelectedSize(size)}>
                                            <div className="size-card-header"><span>{size}</span></div>
                                            <div className="size-card-body">
                                                <span className="size-card-count">{grouped[size].length}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div className="card-actions-footer">
                                <button
                                    onClick={() => navigate('/jugadores')}
                                    className="btn btn-light-green"
                                >
                                    <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Plantilla.png" alt="Plantilla" className="btn-icon-custom" />
                                    PLANTILLA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Asistencia Chart Section - Full Width at Bottom */}
                {staffAttendanceChartData ? (
                    <div className="dashboard-card dashboard-card--attendance">
                        <div className="card-header card-header--bordered">
                            <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Asistencia%20ultimos%20eventos.png" alt="Asistencia" className="section-icon" />
                            <h2 className="card-title card-title--section">ASISTENCIA ÚLTIMOS EVENTOS</h2>
                        </div>
                        <div className={`chart-container ${isMobile ? 'chart-container--mobile' : 'chart-container--desktop'}`}>
                            <Bar
                                data={staffAttendanceChartData}
                                options={{
                                    indexAxis: isMobile ? 'y' : 'x', // 'x' for vertical (PC), 'y' for horizontal (Mobile)
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top'
                                        },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false
                                        }
                                    },
                                    scales: {
                                        x: {
                                            stacked: true,
                                            title: { display: true, text: isMobile ? 'Nº Eventos' : 'Jugadores' }
                                        },
                                        y: {
                                            stacked: true,
                                            title: { display: true, text: isMobile ? 'Jugadores' : 'Nº Eventos' }
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="card-actions-footer">
                            <button
                                onClick={() => setShowAttendanceModal(true)}
                                className="btn btn-light-green"
                            >
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pasar%20lista.png" alt="Lista" className="btn-icon-custom" />
                                LISTA
                            </button>
                            <button
                                onClick={() => navigate('/asistencia')}
                                className="btn btn-light-green"
                            >
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Asistencia.png" alt="Asistencia" className="btn-icon-custom" />
                                ASISTENCIA
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="dashboard-card dashboard-card--empty">
                        <p className="empty-state-hint">No hay datos de asistencia disponibles para los últimos eventos.</p>
                        <div className="card-actions-footer card-actions-footer--centered">
                            <button onClick={() => setShowAttendanceModal(true)} className="btn btn-light-green">
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pasar%20lista.png" alt="Lista" className="btn-icon-custom" />
                                EMPEZAR A PASAR LISTA
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedMatch && <MatchDetailsModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
            {selectedTraining && <TrainingDetailsModal event={selectedTraining} onClose={() => setSelectedTraining(null)} systemPlayers={hospitaletPlayers} />}
            {selectedSize && <SizeDetailsModal size={selectedSize} players={hospitaletPlayers.filter(p => (p.talla || 'N/A').toString().trim().toUpperCase() === selectedSize)} onClose={() => setSelectedSize(null)} />}
            {showAttendanceModal && <AttendanceModal onClose={() => setShowAttendanceModal(false)} />}
        </div>
    );
};

export default Dashboard;
