import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import {
    ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Users, Trophy,
    Settings, LogOut, Search, Filter, Plus, User, Activity, Clock,
    MapPin, Info, CheckCircle, XCircle, Zap, Target
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
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
    ArcElement,
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
    const [averageStats, setAverageStats] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // New State for Player Attendance Tabs
    const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(new Date().getMonth());

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const resolveUser = async () => {
            if (propUser) {
                // Respect the role passed from App.jsx
                setCurrentUser(propUser);
                fetchDashboardData(propUser);
            } else {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const staffUser = { ...authUser, role: 'STAFF', email: authUser.email };
                    setCurrentUser(staffUser);
                    fetchDashboardData(staffUser);
                } else {
                    navigate('/login');
                }
            }
        };
        resolveUser();
    }, [navigate, propUser]);

    const fetchDashboardData = async (user = currentUser) => {
        setLoading(true);
        try {
            console.log('Fetching dashboard data from standardized services...');

            // Optimization: Fetch only relevant attendance for players
            const attendancePromise = (user?.role === 'JUGADOR' && user.playerId)
                ? attendanceService.getByPlayerId(user.playerId)
                : attendanceService.getAll();

            const [eventData, matchData, rivalData, trainingData, playersData, attData, leagueData] = await Promise.all([
                eventService.getAll(),
                matchService.getAll(),
                rivalService.getAll(),
                trainingService.getAll(),
                playerService.getAll(),
                attendancePromise,
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

            // Fetch average stats for players
            if (user?.role === 'JUGADOR' && user.playerId) {
                const { data: playerStatsData } = await supabase
                    .from('estadisticas_jugador')
                    .select('*')
                    .eq('jugador', user.playerId);

                if (playerStatsData && playerStatsData.length > 0) {
                    const playedMatches = playerStatsData.filter(s => (s.minutos_jugados || 0) > 0 || s.es_titular);
                    const totalMatches = playedMatches.length;

                    if (totalMatches > 0) {
                        const totals = playerStatsData.reduce((acc, s) => {
                            acc.minutos += (s.minutos_jugados || (s.es_titular ? 70 : 20));
                            acc.ensayos += (s.ensayos || 0);
                            acc.puntos += (s.ensayos || 0) * 5 + (s.transformaciones || 0) * 2 + (s.penales || 0) * 3;
                            return acc;
                        }, { minutos: 0, ensayos: 0, puntos: 0 });

                        setAverageStats({
                            minutos: (totals.minutos / totalMatches).toFixed(1),
                            ensayos: (totals.ensayos / totalMatches).toFixed(1),
                            puntos: (totals.puntos / totalMatches).toFixed(1),
                            partidos: totalMatches
                        });
                    }
                }
            }

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
                                homeScore: matchRecord.marcador_local,
                                awayScore: matchRecord.marcador_visitante,
                                isFinished: e.estado === 'Finalizado',
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

    const staffAttendanceChartData = useMemo(() => {
        if (!events.length || !allAttendance.length) return null;

        // Find last 10 past events that actually HAVE attendance data recorded
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
            const justificada = pAtt.filter(a => ['Falta Justificada', 'Lesión', 'Lesion', 'Enfermo', 'Emfermo', 'Catalana'].includes(a.asistencia)).length;

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
    }, [events, allAttendance, hospitaletPlayers]);

    // Memoize matches list
    const dashboardMatches = useMemo(() => {
        const now = new Date();
        const allMatches = events.filter(e => e.extendedProps.isMatch);
        const pastMatches = allMatches.filter(e => new Date(e.start) < now).sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 4);
        const nextMatch = allMatches.filter(e => new Date(e.start) >= now).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 1);
        return [...nextMatch, ...pastMatches];
    }, [events]);

    const playerAttendanceData = useMemo(() => {
        if (!currentUser?.playerId || !hospitaletPlayers.length || !allAttendance.length) return null;

        const eventsInMonth = events.filter(e => {
            const d = new Date(e.start);
            const isMatch = e.extendedProps?.isMatch || e.title.toLowerCase().includes('partido') || e.title.toLowerCase().includes('match');
            return d.getMonth() === selectedAttendanceMonth && !isMatch;
        }).map(e => e.id);

        if (eventsInMonth.length === 0) return null;

        const playerAtt = allAttendance.filter(a =>
            a.jugador === currentUser.playerId &&
            eventsInMonth.includes(a.entrenamientos?.evento || a.evento || a.eventId)
        );

        const presente = playerAtt.filter(a => a.asistencia === 'Presente').length;
        const retraso = playerAtt.filter(a => a.asistencia === 'Retraso').length;
        const justificada = playerAtt.filter(a => ['Falta Justificada', 'Lesión', 'Lesion', 'Enfermo', 'Emfermo', 'Catalana'].includes(a.asistencia)).length;
        const falta = playerAtt.filter(a => ['Falta', 'Falta Injustificada'].includes(a.asistencia)).length;

        return {
            chartData: {
                labels: [`Presente (${presente})`, `Retraso (${retraso})`, `Justificada (${justificada})`, `Falta (${falta})`],
                datasets: [{
                    data: [presente, retraso, justificada, falta],
                    backgroundColor: ['#28a745', '#ffc107', '#17a2b8', '#dc3545'],
                    borderWidth: 1,
                }],
            },
            counts: { presente, retraso, justificada, falta },
            eventsInMonthCount: eventsInMonth.length
        };
    }, [currentUser?.playerId, hospitaletPlayers, allAttendance, events, selectedAttendanceMonth]);

    // Find current player details if user is a player
    const currentPlayer = currentUser?.role === 'JUGADOR' && currentUser.playerId
        ? hospitaletPlayers.find(p => p.id === currentUser.playerId)
        : null;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    {currentUser?.role === 'JUGADOR' && currentPlayer?.foto ? (
                        <img src={currentPlayer.foto} alt="Player" className="header-logo header-logo--player" />
                    ) : (
                        <img src={HOSPITALET_SHIELD} alt="Logo" className="header-logo" />
                    )}
                    <div className="header-title">
                        <h1 className="dashboard-title">
                            {currentUser?.role === 'JUGADOR' && currentPlayer
                                ? `${currentPlayer.nombre} ${currentPlayer.apellidos || ''}`.toUpperCase()
                                : 'Dashboard'}
                        </h1>
                        <div className="header-user-info">
                            {currentUser?.role !== 'JUGADOR' && <p className="user-email">{currentUser?.email}</p>}
                            <span className="user-role-badge user-role-badge--orange">{currentUser?.role || 'STAFF'}</span>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    <button onClick={() => navigate('/login')} className="btn btn-logout">Cerrar Sesión</button>
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
                        {dashboardMatches.length === 0 ? (
                            <p className="empty-state-text">No hay partidos registrados.</p>
                        ) : (
                            dashboardMatches.map((match, idx) => {
                                const props = match.extendedProps;
                                const isNext = new Date(match.start) >= new Date();
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
                            })
                        )}
                    </div>
                </div>

                {/* NEW: Average Stats Section for Players */}
                {currentUser?.role === 'JUGADOR' && averageStats && (
                    <div className="dashboard-card dashboard-card--average-stats">
                        <div className="card-header card-header--bordered">
                            <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png" alt="Stats" className="section-icon section-icon--lg" />
                            <div className="stats-header-info">
                                <h2 className="card-title card-title--section">ESTADÍSTICAS PROMEDIO</h2>
                                <p className="stats-subtitle">Tu rendimiento por partido esta temporada</p>
                            </div>
                            <div className="total-matches-badge">
                                <span className="matches-number">{averageStats.partidos}</span>
                                <span className="matches-label">PARTIDOS</span>
                            </div>
                        </div>
                        <div className="average-stats-visual-grid">
                            <div className="visual-stat-card stat-card--minutes">
                                <div className="stat-icon-wrapper">
                                    <Clock size={24} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">{averageStats.minutos}</span>
                                    <span className="stat-label">Minutos / PJ</span>
                                </div>
                                <div className="stat-progress-bar">
                                    <div className="progress-fill" style={{ width: `${Math.min((averageStats.minutos / 70) * 100, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="visual-stat-card stat-card--tries">
                                <div className="stat-icon-wrapper">
                                    <Target size={24} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">{averageStats.ensayos}</span>
                                    <span className="stat-label">Ensayos / PJ</span>
                                </div>
                                <div className="stat-trend">
                                    <Trophy size={14} className="trend-icon" />
                                    <span>Max: 3</span>
                                </div>
                            </div>

                            <div className="visual-stat-card stat-card--points">
                                <div className="stat-icon-wrapper">
                                    <Zap size={24} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">{averageStats.puntos}</span>
                                    <span className="stat-label">Puntos / PJ</span>
                                </div>
                                <div className="stat-bg-decorator">
                                    <Activity size={48} opacity={0.05} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                {standings.map((team, idx) => (
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
                        {currentUser?.role !== 'JUGADOR' && (
                            <button
                                onClick={() => navigate('/statistics')}
                                className="btn btn-light-green"
                            >
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png" alt="Stats" className="btn-icon-custom" />
                                VER ESTADÍSTICAS
                            </button>
                        )}
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
                            {currentUser?.role !== 'JUGADOR' && (
                                <button
                                    onClick={() => navigate('/calendario')}
                                    className="btn btn-light-green"
                                >
                                    <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Calendario.png" alt="Cal" className="btn-icon-custom" />
                                    CALENDARIO
                                </button>
                            )}
                        </div>
                    </div>

                    {currentUser?.role !== 'JUGADOR' && (
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
                    )}
                </div>


                {/* Asistencia Chart Section - Full Width at Bottom */}
                {staffAttendanceChartData ? (
                    currentUser?.role === 'JUGADOR' ? (
                        <div className="dashboard-card dashboard-card--attendance">
                            <div className="card-header card-header--bordered">
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Asistencia.png" alt="Asistencia" className="section-icon" />
                                <h2 className="card-title card-title--section">ASISTENCIA</h2>
                            </div>

                            {/* Month Tabs - Season Order (Aug - Jun) */}
                            <div className="month-tabs-container">
                                {(() => {
                                    // Season order: Aug (7) to Jun (5)
                                    const seasonMonths = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

                                    return seasonMonths.map((monthIndex) => {
                                        const monthName = new Date(2024, monthIndex).toLocaleString('es-ES', { month: 'short' }).toUpperCase();
                                        // Handle year display if needed, but for now just month name is fine.
                                        // Maybe add year for clarity if cross-year? e.g. ENE '25. 
                                        // Let's stick to simple 3-letter months as per request.

                                        return (
                                            <button
                                                key={monthIndex}
                                                className={`month-tab ${monthIndex === selectedAttendanceMonth ? 'active' : ''}`}
                                                onClick={() => setSelectedAttendanceMonth(monthIndex)}
                                            >
                                                {monthName}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="chart-container-radial">
                                {!playerAttendanceData ? (
                                    <p className="empty-state-text">No hubo eventos de entrenamiento en este mes.</p>
                                ) : (
                                    <div className="attendance-player-view">
                                        <div className="chart-wrapper-radial">
                                            <Doughnut
                                                data={playerAttendanceData.chartData}
                                                plugins={[
                                                    {
                                                        id: 'datalabels',
                                                        afterDatasetsDraw(chart) {
                                                            const { ctx, data } = chart;
                                                            ctx.save();
                                                            data.datasets.forEach((dataset, i) => {
                                                                const meta = chart.getDatasetMeta(i);
                                                                meta.data.forEach((element, index) => {
                                                                    const value = dataset.data[index];
                                                                    if (value > 0) {
                                                                        const { x, y, innerRadius, outerRadius, startAngle, endAngle } = element.getProps(['x', 'y', 'innerRadius', 'outerRadius', 'startAngle', 'endAngle'], true);
                                                                        const midAngle = (startAngle + endAngle) / 2;
                                                                        const midRadius = (innerRadius + outerRadius) / 2;

                                                                        const cx = x + Math.cos(midAngle) * midRadius;
                                                                        const cy = y + Math.sin(midAngle) * midRadius;

                                                                        ctx.fillStyle = '#FFFFFF';
                                                                        ctx.font = 'bold 12px sans-serif';
                                                                        ctx.textAlign = 'center';
                                                                        ctx.textBaseline = 'middle';
                                                                        ctx.fillText(value, cx, cy);
                                                                    }
                                                                });
                                                            });
                                                            ctx.restore();
                                                        }
                                                    }
                                                ]}
                                                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                                            />
                                        </div>

                                        {/* Event List */}
                                        <div className="attendance-events-list">
                                            <h4 className="attendance-list-title">Eventos del Mes</h4>
                                            {events.filter(e => {
                                                const d = new Date(e.start);
                                                const isMatch = e.extendedProps?.isMatch || e.title.toLowerCase().includes('partido') || e.title.toLowerCase().includes('match');
                                                return d.getMonth() === selectedAttendanceMonth && !isMatch;
                                            }).sort((a, b) => new Date(a.start) - new Date(b.start)).map(event => {
                                                const attRecord = allAttendance.find(a =>
                                                    a.jugador === currentUser.playerId &&
                                                    (a.entrenamientos?.evento === event.id || a.evento === event.id || a.eventId === event.id)
                                                );

                                                const status = attRecord?.asistencia || 'Pendiente';
                                                let statusClass = 'status-pending';
                                                if (status === 'Presente') statusClass = 'status-present';
                                                else if (status === 'Retraso') statusClass = 'status-late';
                                                else if (['Falta Justificada', 'Lesión', 'Enfermo', 'Catalana'].includes(status)) statusClass = 'status-justified';
                                                else if (status === 'Falta Injustificada') statusClass = 'status-absent';

                                                return (
                                                    <div key={event.id} className="attendance-event-item">
                                                        <div className="event-date-badge">
                                                            <span className="event-day">{new Date(event.start).getDate()}</span>
                                                            <span className="event-month">{new Date(event.start).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                                        </div>
                                                        <div className="event-info">
                                                            <span className="event-title">{event.title}</span>
                                                            <span className="event-time">{new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className={`attendance-status-badge ${statusClass}`}>
                                                            {status}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card dashboard-card--attendance">
                            <div className="card-header card-header--bordered">
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Asistencia%20ultimos%20eventos.png" alt="Asistencia" className="section-icon" />
                                <h2 className="card-title card-title--section">ASISTENCIA ÚLTIMOS EVENTOS</h2>
                            </div>
                            <div className={`chart-container ${isMobile ? 'chart-container--mobile' : 'chart-container--desktop'}`}>
                                <Bar
                                    data={staffAttendanceChartData}
                                    plugins={[
                                        {
                                            id: 'datalabels',
                                            afterDatasetsDraw(chart) {
                                                const { ctx, data } = chart;
                                                ctx.save();
                                                data.datasets.forEach((dataset, i) => {
                                                    const meta = chart.getDatasetMeta(i);
                                                    meta.data.forEach((element, index) => {
                                                        const value = dataset.data[index];
                                                        if (value > 0) {
                                                            const { x, y, base, horizontal } = element.getProps(['x', 'y', 'base', 'horizontal'], true);
                                                            ctx.fillStyle = '#FFFFFF'; // White color
                                                            ctx.font = 'bold 11px sans-serif';
                                                            ctx.textAlign = 'center';
                                                            ctx.textBaseline = 'middle';

                                                            let centerX, centerY;
                                                            if (horizontal) {
                                                                // Mobile: Horizontal bars
                                                                centerX = (x + base) / 2;
                                                                centerY = y;
                                                            } else {
                                                                // Desktop: Vertical bars
                                                                centerX = x;
                                                                centerY = (y + base) / 2;
                                                            }

                                                            ctx.fillText(value, centerX, centerY);
                                                        }
                                                    });
                                                });
                                                ctx.restore();
                                            }
                                        }
                                    ]}
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
                                {currentUser?.role !== 'JUGADOR' && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="dashboard-card dashboard-card--empty">
                        <p className="empty-state-hint">No hay datos de asistencia disponibles para los últimos eventos.</p>
                        <div className="card-actions-footer card-actions-footer--centered">
                            {currentUser?.role !== 'JUGADOR' && (
                                <button onClick={() => setShowAttendanceModal(true)} className="btn btn-light-green">
                                    <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pasar%20lista.png" alt="Lista" className="btn-icon-custom" />
                                    EMPEZAR A PASAR LISTA
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedMatch && (
                <MatchDetailsModal
                    match={selectedMatch}
                    currentUser={currentUser}
                    onClose={() => setSelectedMatch(null)}
                    // Calculate if this is the next match by date
                    isNextMatch={(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const nextMatch = events
                            .filter(e => e.extendedProps.isMatch && new Date(e.start) >= today)
                            .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

                        if (!nextMatch || !selectedMatch) return false;

                        // Robust ID comparison
                        const nextId = String(nextMatch.id || nextMatch.extendedProps?.id || '');
                        const selectedId = String(selectedMatch.id || selectedMatch.extendedProps?.id || '');

                        return nextId === selectedId && nextId !== '';
                    })()}
                />
            )}
            {selectedTraining && <TrainingDetailsModal event={selectedTraining} currentUser={currentUser} onClose={() => setSelectedTraining(null)} systemPlayers={hospitaletPlayers} />}
            {selectedSize && <SizeDetailsModal size={selectedSize} players={hospitaletPlayers.filter(p => (p.talla || 'N/A').toString().trim().toUpperCase() === selectedSize)} onClose={() => setSelectedSize(null)} />}
            {showAttendanceModal && <AttendanceModal onClose={() => setShowAttendanceModal(false)} />}
        </div>
    );
};

export default Dashboard;
