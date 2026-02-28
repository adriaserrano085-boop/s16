
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/apiClient';
import { eventService } from '../services/eventService';
import { matchService } from '../services/matchService';
import { rivalService } from '../services/rivalService';
import { trainingService } from '../services/trainingService';
import playerService from '../services/playerService';
import AttendanceList from '../components/AttendanceList';
import attendanceService from '../services/attendanceService';
import MatchDetailsModal from '../components/MatchDetailsModal';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Plus, Users, X, Info, Trash2, Activity, CheckCircle, XCircle, HelpCircle, Save } from 'lucide-react';
import './CalendarPage.css';

const TRAINING_LOCATION = 'Feixa Llarga Hospitalet';
const TRAINING_MAP_LINK = 'https://www.bing.com/ck/a?!&&p=421a1ddd4b397690647074aaa59070352dae6c302af39f3eea05f4b4750141d5JmltdHM9MTc3MDQyMjQwMA&ptn=3&ver=2&hsh=4&fclid=0f0438b7-b72d-6cb0-27b1-2e1cb6206d1f&u=a1L21hcHM_Jm1lcGk9MH5-RW1iZWRkZWR-QWRkcmVzc19MaW5rJnR5PTE4JnE9Q2FtcCUyMFJ1Z2JieSUyMFJDJTIwTCUyN0hvc3BpdGFsZXQmc3M9eXBpZC5ZTjYzMDZ4ODczOTc5MzkxNzE1OTc0ODg5M34mcHBvaXM9NDEuMzQ3MTMzNjM2NDc0NjFfMi4xMDM4MDkzNTY2ODk0NTNfQ2FtcCUyMFJ1Z2J5JTIwUkMlMjBMJTI3SG9zcGlfdF9ZTjYzMDZ4ODczOTc5MzkxNzE1OTc0ODg5M34mY3A9NDEuMzQ3MTM0XzIuMTAzODA5JnY9MiZzVj0xJkZPUk09TVBQUlAw';
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
    // Check extendedProps first (for sidebar events from state)
    return e?.extendedProps?.displayTipo ||
        e?.extendedProps?.tipo || e?.extendedProps?.Tipo ||
        e?.tipo || e?.Tipo || e?.Tipo_evento || e?.tipo_evento ||
        'Evento';
};

const getEventTitle = (e) => {
    const tipo = getEventType(e || {});
    // If it's a match, title is handled by specific renderer usually, but as fallback:
    if (e?.extendedProps?.isMatch) {
        return `${tipo} - VS ${e.extendedProps.rivalName || 'Rival'}`;
    }
    return tipo;
};

const CalendarPage = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date()); // Track current date for custom header

    // Match Modal State
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Training Modal State
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [showTrainingModal, setShowTrainingModal] = useState(false);


    // Attendance Modal state
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceEventId, setAttendanceEventId] = useState(null);

    const [hospitaletTeamId, setHospitaletTeamId] = useState(null);
    const [rivals, setRivals] = useState([]);
    const [activeTab, setActiveTab] = useState('details'); // For Details and Create/Edit Modals

    // Attendance State for Details Tab
    const [players, setPlayers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [newEvent, setNewEvent] = useState({
        Tipo: 'Entrenamiento',
        fecha: '',
        hora: '',
        location: '',
        observaciones: '',
        equip_id: null,
        Estado: 'Programado', // Changed default to valid enum if needed, or 'scheduled' if that's what DB uses (Probe showed 'Programado' might be better or 'scheduled' caused issues?)
        // Wait, probe failed on 'scheduled' with "check constraint". DB likely expects specific Spanish values or similar.
        // Inspect schema showed 'Finalizado'. I'll use 'Programado' as a safe guess or just a text field.
        // Actually, I'll add a selector for Estado.
        // Match specific
        rival_id: '',
        es_local: true,
        // competicion: 'Liga', // REMOVED - Not in DB
        // jornada: '', // REMOVED - Not in DB
        marcador_local: '', // ADDED
        marcador_visitante: '', // ADDED
        // Training specific
        calentamiento: '',
        trabajo_separado: '',
        trabajo_conjunto: '',
        objetivos: ''
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const calendarRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const teamId = await fetchTeamId();
            await fetchEvents();
            const rivalsData = await rivalService.getAll();
            if (rivalsData) setRivals(rivalsData);

            if (teamId) {
                fetchPlayers(teamId);
            }
        };
        init();

        // Responsive Calendar View
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (calendarRef.current) {
                const api = calendarRef.current.getApi();
                if (mobile) {
                    if (api.view.type !== 'listMonth') api.changeView('listMonth');
                } else {
                    if (api.view.type !== 'dayGridMonth') api.changeView('dayGridMonth');
                }
            }
        };

        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePrevMonth = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.prev();
            setCurrentDate(api.getDate());
        }
    };

    const handleNextMonth = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.next();
            setCurrentDate(api.getDate());
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.today();
            setCurrentDate(api.getDate());
        }
    };

    useEffect(() => {
        if (newEvent.Tipo === 'Entrenamiento') {
            setNewEvent(prev => ({ ...prev, location: TRAINING_LOCATION }));
        }
    }, [newEvent.Tipo]);

    const fetchTeamId = async () => {
        try {
            const data = await apiGet('/equipos/?is_club_team=true');
            if (data && data.length > 0) {
                const team = data[0];
                setHospitaletTeamId(team.id);
                setNewEvent(prev => ({ ...prev, equip_id: team.id }));
                return team.id;
            }
        } catch (e) {
            console.error("Error fetching team ID:", e);
        }
        return null;
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [eventData, matchData, rivalData, trainingData] = await Promise.all([
                eventService.getAll(),
                matchService.getAll(),
                rivalService.getAll(),
                trainingService.getAll()
            ]);

            if (eventData) {
                const mappedEvents = eventData.map(e => {
                    const tipoContent = getEventType(e);
                    const isMatch = tipoContent.toLowerCase().includes('partido') || tipoContent.toLowerCase().includes('match');

                    let matchDetails = {};

                    if (isMatch && matchData) {
                        // Check against both UUID and Legacy ID for robustness
                        // Match by UUID only (legacy id_eventos column is removed)
                        const matchRecord = matchData.find(m => m.Evento && String(m.Evento) === String(e.id));

                        if (matchRecord) {
                            const rival = rivalData?.find(r => r.id_equipo == matchRecord.Rival);
                            console.log(`[Event ${e.title}] Match Found:`, matchRecord.id, 'Rival ID:', matchRecord.Rival, 'Rival Found:', rival?.nombre_equipo, 'Shield:', rival?.escudo);

                            // Determine if Hospitalet is local (Home)
                            const isHospitaletLocal = matchRecord.es_local === true ||
                                (matchRecord.lugar && matchRecord.lugar.toLowerCase().includes('feixa llarga'));

                            const hospitaletName = 'RC HOSPITALET';
                            const rivalName = rival?.nombre_equipo || 'Rival';
                            const rivalShield = rival?.escudo;

                            // Set Home/Away details
                            const homeTeam = isHospitaletLocal ? hospitaletName : rivalName;
                            const homeShield = isHospitaletLocal ? HOSPITALET_SHIELD : rivalShield;
                            const awayTeam = isHospitaletLocal ? rivalName : hospitaletName;
                            const awayShield = isHospitaletLocal ? rivalShield : HOSPITALET_SHIELD;

                            // Scores
                            const status = e.estado ? e.estado.toLowerCase().trim() : '';
                            const isFinished = status === 'finalizado';

                            let homeScore = null;
                            let awayScore = null;
                            let scoreDisplay = null;

                            const hasScores =
                                matchRecord.marcador_local !== null && matchRecord.marcador_local !== undefined &&
                                matchRecord.marcador_visitante !== null && matchRecord.marcador_visitante !== undefined;

                            if (hasScores) {
                                homeScore = matchRecord.marcador_local;
                                awayScore = matchRecord.marcador_visitante;
                                scoreDisplay = `${homeScore} - ${awayScore}`;
                            }

                            matchDetails = {
                                isMatch: true,
                                isHospitaletLocal: isHospitaletLocal,
                                rivalName: rivalName,
                                rivalShield: rivalShield,

                                // Standardized Display Props
                                homeTeamName: homeTeam,
                                homeTeamShield: homeShield,
                                awayTeamName: awayTeam,
                                awayTeamShield: awayShield,
                                homeScore: homeScore,
                                awayScore: awayScore,
                                scoreDisplay: scoreDisplay,
                                isFinished: isFinished,

                                // Extra details for Modal (from matchRecord or fallback to event)
                                observaciones: matchRecord.observaciones,
                                location: matchRecord.lugar || e.location,
                                rival_id: matchRecord.Rival, // ADDED: Needed for editing
                                match_id: matchRecord.id // ADDED: Primary Key
                            };
                        }
                    }

                    let trainingDetails = {};
                    if ((tipoContent.toLowerCase().includes('entrenamiento') || tipoContent.toLowerCase().includes('training')) && trainingData) {
                        // Check against both UUID and Legacy ID for robustness
                        const trainingRecord = trainingData.find(t => t.evento == e.id || t.evento == e.id_eventos);
                        if (trainingRecord) {
                            trainingDetails = {
                                isTraining: true,
                                training_id: trainingRecord.id_entrenamiento || trainingRecord.id, // USE id_entrenamiento if available, else fallback to id
                                calentamiento: trainingRecord.calentamiento,
                                trabajo_separado: trainingRecord.trabajo_separado,
                                trabajo_conjunto: trainingRecord.trabajo_conjunto,
                                objetivos: trainingRecord.objetivos || e.observaciones
                            };
                        } else {
                            trainingDetails = {
                                isTraining: true,
                                calentamiento: 'No especificado',
                                trabajo_separado: 'No especificado',
                                trabajo_conjunto: 'No especificado',
                                objetivos: e.observaciones
                            };
                        }
                    }

                    return {
                        id: e.id, // Keep using UUID for the event ID itself (safe for updates/keys)
                        title: tipoContent,
                        start: e.fecha && e.hora ? `${e.fecha}T${e.hora}` : e.fecha,
                        color: isMatch ? '#9C27B0' : // Purple for matches
                            tipoContent.toLowerCase().includes('entrenamiento') || tipoContent.toLowerCase().includes('training') ? '#003366' : '#999', // Blue for training
                        extendedProps: {
                            ...e,
                            publicId: e.id, // Explicitly pass the main Event UUID
                            displayTipo: tipoContent,
                            hora: e.hora, // Ensure hora is explicitly passed
                            ...matchDetails,
                            ...trainingDetails,
                            // Ensure rival_id and training_id are available
                        }
                    };
                });
                setEvents(mappedEvents);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    // State for editing
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null); // UUID
    const [currentEventLegacyId, setCurrentEventLegacyId] = useState(null); // id_eventos (Integer)

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Prepare Observaciones based on Type
            let finalObservaciones = newEvent.observaciones;
            if (newEvent.Tipo === 'Entrenamiento' && newEvent.objetivos) {
                // If editing, we might be appending duplicates if we aren't careful.
                // But for now, let's assume valid formatted input or just overwrite.
                // Ideally, we should parse it back when loading, which we will do in handleEditClick.
                finalObservaciones = `[OBJETIVOS]: ${newEvent.objetivos}\n\n${newEvent.observaciones}`;
            }

            if (isEditing && currentEventId) {
                // UPDATE Logic
                await eventService.update(currentEventId, {
                    tipo: newEvent.Tipo, // FIXED: lower case
                    fecha: newEvent.fecha,
                    hora: newEvent.hora,
                    // location: newEvent.location, // REMOVED: Not in 'eventos' schema
                    observaciones: finalObservaciones,
                    // equip_id: newEvent.equip_id, // REMOVED: Not in schema
                    estado: newEvent.Estado // FIXED: lower case
                });

                // Use Legacy ID for Detail Tables if available, otherwise fallback (though should match)
                const detailId = currentEventLegacyId || currentEventId;

                if (newEvent.Tipo === 'Entrenamiento') {
                    // Check if training record exists? It should if event exists.
                    // But update method filters by event ID, so it's safe.
                    const existingEvent = events.find(ev => ev.id === currentEventId);
                    if (existingEvent && existingEvent.extendedProps.training_id) {
                        try {
                            await trainingService.update(detailId, {
                                calentamiento: newEvent.calentamiento,
                                trabajo_separado: newEvent.trabajo_separado,
                                trabajo_conjunto: newEvent.trabajo_conjunto
                            });
                        } catch (err) {
                            console.warn("Training update failed, trying create...", err);
                            // Fallback create if it didn't exist
                            await trainingService.create({
                                evento: detailId,
                                calentamiento: newEvent.calentamiento,
                                trabajo_separado: newEvent.trabajo_separado,
                                trabajo_conjunto: newEvent.trabajo_conjunto
                            });
                        }
                    } else {
                        // If for some reason training record doesn't exist, create it.
                        await trainingService.create({
                            evento: detailId,
                            calentamiento: newEvent.calentamiento,
                            trabajo_separado: newEvent.trabajo_separado,
                            trabajo_conjunto: newEvent.trabajo_conjunto
                        });
                    }
                } else if (newEvent.Tipo === 'Partido') {
                    const matchPayload = {
                        Rival: newEvent.rival_id, // Check casing? inspect-match showed 'Rival' capitalized in some outputs? Wait.
                        // inspect-match output: "Rival" was in keys? No, keys were truncated.
                        // But previous code used 'Rival'. 
                        // inspect-columns.js output for partidos showed: "Rival" capital R?
                        // "Columns for partidos: [ ... 'Rival' ... ]" -> Yes, earlier output showed 'Rival'.
                        es_local: newEvent.es_local,
                        lugar: newEvent.location,
                        marcador_local: newEvent.marcador_local !== '' ? parseInt(newEvent.marcador_local) : null,
                        marcador_visitante: newEvent.marcador_visitante !== '' ? parseInt(newEvent.marcador_visitante) : null
                    };

                    try {
                        await matchService.update(detailId, matchPayload);
                    } catch (err) {
                        console.warn("Match update failed, trying create...", err);
                        await matchService.create({
                            Evento: detailId,
                            ...matchPayload
                        });
                    }
                }
            } else {
                // CREATE Logic (Existing)
                const createdEvent = await eventService.create({
                    tipo: newEvent.Tipo, // FIXED: lower case
                    fecha: newEvent.fecha,
                    hora: newEvent.hora,
                    // location: newEvent.location, // REMOVED
                    observaciones: finalObservaciones,
                    // equip_id: newEvent.equip_id, // REMOVED: Not in schema
                    estado: newEvent.Estado // FIXED: lower case
                });

                if (!createdEvent || !createdEvent[0]?.id) { // FIXED: id_eventos -> id
                    throw new Error('No se pudo obtener el ID del evento creado.');
                }
                const eventId = createdEvent[0].id; // UUID
                // const eventLegacyId = createdEvent[0].id_eventos; // Integer/Legacy - NOT USED ANYMORE for linking

                if (newEvent.Tipo === 'Entrenamiento') {
                    await trainingService.create({
                        evento: eventId, // Use UUID
                        calentamiento: newEvent.calentamiento,
                        trabajo_separado: newEvent.trabajo_separado,
                        trabajo_conjunto: newEvent.trabajo_conjunto
                    });
                } else if (newEvent.Tipo === 'Partido') {
                    const matchPayload = {
                        evento: eventId, // Use UUID
                        Rival: newEvent.rival_id,
                        es_local: newEvent.es_local,
                        lugar: newEvent.location
                    };

                    if (newEvent.marcador_local !== '') matchPayload.marcador_local = parseInt(newEvent.marcador_local);
                    if (newEvent.marcador_visitante !== '') matchPayload.marcador_visitante = parseInt(newEvent.marcador_visitante);

                    await matchService.create({
                        Evento: eventId, // Use UUID
                        Rival: newEvent.rival_id,
                        es_local: newEvent.es_local,
                        lugar: newEvent.location,
                        marcador_local: newEvent.marcador_local !== '' ? parseInt(newEvent.marcador_local) : null,
                        marcador_visitante: newEvent.marcador_visitante !== '' ? parseInt(newEvent.marcador_visitante) : null
                    });
                }
            }

            setShowModal(false);
            resetForm();
            await fetchEvents();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el evento: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentEventId(null);
        setCurrentEventLegacyId(null);
        setNewEvent({
            Tipo: 'Entrenamiento',
            fecha: '',
            hora: '',
            location: '',
            observaciones: '',
            equip_id: hospitaletTeamId,
            Estado: 'Programado',
            rival_id: '',
            es_local: true,
            marcador_local: '',
            marcador_visitante: '',
            calentamiento: '',
            trabajo_separado: '',
            trabajo_conjunto: '',
            objetivos: ''
        });
    };

    const handleEditClick = (eventProps) => {
        // Parse objectives from observations if present
        let obs = eventProps.observaciones || '';
        let objs = '';
        if (eventProps.displayTipo?.toLowerCase().includes('entrenamiento') && obs.includes('[OBJETIVOS]:')) {
            const parts = obs.split('\n\n'); // Assuming double newline split
            const objPart = parts.find(p => p.startsWith('[OBJETIVOS]:'));
            if (objPart) {
                objs = objPart.replace('[OBJETIVOS]: ', '');
                // Remove objectives from observations for the form field to avoid duplication
                obs = obs.replace(objPart, '').trim();
            }
        } else if (eventProps.objetivos) {
            // Fallback if mapped
            objs = eventProps.objetivos;
        }

        setNewEvent({
            Tipo: eventProps.isMatch ? 'Partido' : 'Entrenamiento',
            fecha: eventProps.fecha,
            hora: eventProps.hora,
            location: eventProps.location || '',
            observaciones: obs,
            equip_id: eventProps.equip_id,
            Estado: eventProps.estado || 'Programado',

            // Match Props
            rival_id: eventProps.rival_id || '',
            es_local: eventProps.isHospitaletLocal, // logic might need review
            marcador_local: eventProps.homeScore !== null ? eventProps.homeScore : '',
            marcador_visitante: eventProps.awayScore !== null ? eventProps.awayScore : '',

            // Training Props
            calentamiento: eventProps.calentamiento || '',
            trabajo_separado: eventProps.trabajo_separado || '',
            trabajo_conjunto: eventProps.trabajo_conjunto || '',
            objetivos: objs
        });

        setIsEditing(true);
        setCurrentEventId(eventProps.id); // UUID
        setCurrentEventLegacyId(eventProps.id_eventos); // Legacy
        setActiveTab('details');



        setShowModal(true);
        setShowMatchModal(false);
        setShowTrainingModal(false);
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
        try {
            await eventService.delete(id);
            await fetchEvents();
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };



    const fetchPlayers = async (teamId) => {
        try {
            const data = await playerService.getAllByTeam(teamId);
            if (data) {
                if (user?.role === 'JUGADOR' && user.playerId) {
                    const myself = data.find(p => p.id === user.playerId);
                    setPlayers(myself ? [myself] : []);
                } else {
                    setPlayers(data);
                }
            }
        } catch (err) {
            console.error('Error fetching players:', err);
        }
    };

    const fetchExistingAttendance = async (eventId) => {
        console.log('[Attendance] Fetching for eventId:', eventId);
        try {
            const data = await attendanceService.getByEventId(eventId);
            console.log('[Attendance] Records from API:', data?.length, data);
            const attendanceMap = {};

            // Start with Pendiente for ALL currently loaded players
            setPlayers(prev => {
                prev.forEach(p => {
                    attendanceMap[p.id] = 'Pendiente';
                });
                return prev;
            });

            // Override with real values from the server
            (data || []).forEach(record => {
                attendanceMap[record.jugador] = record.asistencia;
            });

            setAttendance(attendanceMap);
        } catch (err) {
            console.error('[Attendance] Error fetching attendance:', err);
            setPlayers(prev => {
                const emptyMap = {};
                prev.forEach(p => { emptyMap[p.id] = 'Pendiente'; });
                setAttendance(emptyMap);
                return prev;
            });
        }
    };

    const handleAttendanceToggle = (playerId) => {
        const statusCycle = ['Presente', 'Retraso', 'Falta', 'Falta Justificada', 'Lesion', 'Catalana', 'Emfermo', 'Pendiente'];
        setAttendance(prev => {
            const currentStatus = prev[playerId] || 'Pendiente';
            const currentIndex = statusCycle.indexOf(currentStatus);
            const nextIndex = (currentIndex + 1) % statusCycle.length;
            return {
                ...prev,
                [playerId]: statusCycle[nextIndex]
            };
        });
    };

    const handleSaveAttendance = async () => {
        const currentEvent = selectedTraining || selectedMatch;
        if (!currentEvent) return;

        setSavingAttendance(true);
        try {
            // Need training record ID
            let trainingId = currentEvent.training_id;

            if (!trainingId) {
                // If it's a match or training without record, find/create training record
                const eventId = currentEvent.publicId || currentEvent.id;
                const eventData = await apiGet(`/eventos/${eventId}`);

                if (eventData) {
                    const allTrainings = await apiGet('/entrenamientos').catch(() => []);
                    const trainingData = allTrainings.find(t => t.evento === eventId);

                    if (trainingData) {
                        trainingId = trainingData.id_entrenamiento;
                    } else {
                        // Create training record if it doesn't exist
                        const newTraining = await trainingService.create({
                            evento: eventId,
                            calentamiento: '',
                            trabajo_separado: '',
                            trabajo_conjunto: ''
                        });
                        trainingId = newTraining[0].id_entrenamiento;
                    }
                }
            }

            if (!trainingId) throw new Error("No se pudo identificar el registro de entrenamiento.");

            const attendanceRecords = Object.entries(attendance).map(([playerId, status]) => ({
                entrenamiento: trainingId,
                jugador: playerId,
                asistencia: status
            }));

            await attendanceService.upsert(attendanceRecords);
            alert('Asistencia guardada con éxito');
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Error al guardar asistencia: ' + err.message);
        } finally {
            setSavingAttendance(false);
        }
    };

    const openEventDetails = (props, start, title) => {
        setActiveTab('details');
        setAttendance({}); // Clear previous attendance

        if (props.isMatch) {
            setSelectedMatch({
                ...props,
                start: start,
                title: title
            });
            setShowMatchModal(true);
            fetchExistingAttendance(props.publicId || props.id);
        } else if (props.isTraining) {
            setSelectedTraining({
                ...props,
                start: start
            });
            setShowTrainingModal(true);
            fetchExistingAttendance(props.publicId || props.id);
        }
    };

    const handleEventClick = (info) => {
        openEventDetails(info.event.extendedProps, info.event.start, info.event.title);
    };

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                {/* Header Section */}
                <div className="header-section">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="back-button"
                    >
                        <ChevronLeft size={20} /> Volver
                    </button>
                    <div className="title-container">
                        <h1 className="page-title">Calendario S16</h1>
                        <p className="page-subtitle">Gestión de Eventos</p>
                    </div>
                    <div className="header-actions">
                        <button
                            onClick={() => {
                                setAttendanceEventId(null);
                                setShowAttendanceModal(true);
                            }}
                            className="attendance-button"
                        >
                            <Users size={20} /> Pasar Lista
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="new-event-button"
                        >
                            <Plus size={20} /> Nuevo Evento
                        </button>
                    </div>
                </div>

                <div className="content-grid">
                    {/* Calendar Section */}
                    <div className="calendar-wrapper">
                        {/* Custom Header with Month Image (Perfect Fit) */}
                        <div className="custom-calendar-header banner-container">
                            <img
                                src={MONTH_IMAGES[currentDate.getMonth()]}
                                alt="Month Banner"
                                className="banner-image"
                            />
                            <div className="banner-overlay">
                                <div className="header-controls-left">
                                    <button onClick={handlePrevMonth} className="nav-icon-btn" title="Mes Anterior" style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
                                        <ChevronLeft size={28} />
                                    </button>
                                    <button onClick={handleToday} className="nav-text-btn" style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                        Hoy
                                    </button>
                                </div>

                                <div className="header-controls-right">
                                    <button onClick={handleNextMonth} className="nav-icon-btn" title="Mes Siguiente" style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
                                        <ChevronRight size={28} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
                            initialView={window.innerWidth < 768 ? "listMonth" : "dayGridMonth"}
                            locale={esLocale}
                            events={events}
                            eventClick={handleEventClick}
                            headerToolbar={false} // Disable default header
                            datesSet={(arg) => {
                                // Keep custom header in sync with internal calendar state (e.g. swipes)
                                const midDate = new Date(arg.view.currentStart);
                                midDate.setDate(midDate.getDate() + 15); // Add buffer to safely get the month
                                setCurrentDate(midDate);
                            }}
                            selectable={false} // Disable selection
                            navLinks={false} // Disable clicking day number to go to day view
                            themeSystem="standard"
                            height="auto"
                            eventDisplay="block"
                            eventClassNames={(arg) => {
                                const type = (arg.event.extendedProps.displayTipo || arg.event.title || '').toLowerCase();
                                if (type.includes('partido') || type.includes('match') || arg.event.extendedProps.isMatch) return ['evt-match'];
                                if (type.includes('entrenamiento') || type.includes('training')) return ['evt-training'];
                                return [];
                            }}
                            eventContent={(eventInfo) => {
                                const props = eventInfo.event.extendedProps;
                                const isList = eventInfo.view.type === 'listMonth';
                                const hora = props.hora;
                                const isMatch = props.isMatch;
                                const isTraining = props.displayTipo?.toLowerCase().includes('entrenamiento') || props.displayTipo?.toLowerCase().includes('training') || eventInfo.event.title.toLowerCase().includes('entrenamiento');

                                // LIST VIEW CUSTOMIZATION
                                if (isList) {
                                    return (
                                        <div className="fc-list-event-content-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', padding: '4px 0' }}>
                                            {/* Icon */}
                                            {isMatch ? (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Match" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            ) : (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/cono.png" alt="Training" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            )}

                                            {/* Title & Time Layout */}
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span style={{ fontWeight: 'bold' }}>{eventInfo.event.title}</span>
                                                {/* Optional: Show time here if we hide the default time column, or just let it exist side-by-side */}
                                            </div>
                                        </div>
                                    );
                                }

                                if (isMatch && props.homeTeamShield && props.awayTeamShield) {
                                    return (
                                        <div className="event-content-match">
                                            {hora && <div className="event-time centered">{hora.slice(0, 5)}</div>}
                                            <div className="event-type" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Match" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                                                PARTIDO
                                            </div>
                                            <div className="event-teams-container">
                                                {/* Home Team */}
                                                <img src={props.homeTeamShield} alt="H" className="event-team-shield" />

                                                <span className="event-vs">VS</span>

                                                {/* Away Team */}
                                                <img src={props.awayTeamShield} alt="A" className="event-team-shield" />
                                            </div>
                                            {props.scoreDisplay && (
                                                <div className="event-score">
                                                    {props.scoreDisplay}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="event-content-simple">
                                        {hora && <div className="event-time">{hora.slice(0, 5)}</div>}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {isTraining && (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/cono.png" alt="Training" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                                            )}
                                            {!isTraining && (props.displayTipo?.toLowerCase().includes('partido') || props.displayTipo?.toLowerCase().includes('match')) && (
                                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Match" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                                            )}
                                            {eventInfo.event.title}
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Upcoming Events List */}
                    <div className="upcoming-section">
                        <div className="upcoming-card">
                            <h3 className="upcoming-title">
                                <img
                                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/proximos%20eventos.png"
                                    alt="Próximos Eventos"
                                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                /> Próximos Eventos
                            </h3>
                            <div className="upcoming-list">
                                {events.length > 0 ? (
                                    events
                                        .filter(event => {
                                            const eventDate = new Date(event.extendedProps.fecha);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return eventDate >= today;
                                        })
                                        .sort((a, b) => new Date(a.start) - new Date(b.start))
                                        .slice(0, 5)
                                        .map(event => {
                                            const props = event.extendedProps;
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="upcoming-event-item"
                                                    onClick={() => openEventDetails(props, event.start, event.title)}
                                                    style={{
                                                        border: `1px solid ${event.color}33`,
                                                        borderLeft: `5px solid ${event.color}`
                                                    }}>
                                                    {/* Show team shields for matches */}
                                                    {props.isMatch && props.homeTeamShield && props.awayTeamShield ? (
                                                        <React.Fragment>
                                                            <div className="upcoming-event-teams">
                                                                {/* Home Team */}
                                                                <div className="team-info">
                                                                    <img src={props.homeTeamShield} alt={props.homeTeamName} className="team-logo" />
                                                                    <span className="team-name">{props.homeTeamName}</span>
                                                                </div>

                                                                <div className="vs-text" style={{ color: event.color }}>VS</div>

                                                                {/* Away Team */}
                                                                <div className="team-info">
                                                                    <img src={props.awayTeamShield} alt={props.awayTeamName} className="team-logo" />
                                                                    <span className="team-name">{props.awayTeamName}</span>
                                                                </div>
                                                            </div>
                                                            {props.scoreDisplay && (
                                                                <div className="score-display">
                                                                    {props.scoreDisplay}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    ) : (
                                                        <div className="event-title-simple" style={{ color: event.color }}>
                                                            {getEventTitle(event)}
                                                        </div>
                                                    )}
                                                    <div className="event-meta">
                                                        <Clock size={14} /> {new Date(event.start).toLocaleDateString()} a las {props.hora?.slice(0, 5)}
                                                    </div>
                                                    <div className="event-meta">
                                                        <MapPin size={14} />
                                                        {props.displayTipo?.toLowerCase().includes('training') ||
                                                            props.displayTipo?.toLowerCase().includes('entrenamiento') ? (
                                                            <a
                                                                href={TRAINING_MAP_LINK}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="location-link"
                                                            >
                                                                Feixa Llarga
                                                            </a>
                                                        ) : (
                                                            props.location || 'RC HOSPITALET'
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="delete-button"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )
                                        })
                                ) : (
                                    <p className="empty-message">No hay eventos próximos.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 className="modal-title">
                                {isEditing ? 'Editar Evento' : 'Nuevo Registro'}
                            </h2>

                            {/* Tabs for Training Editing */}
                            {isEditing && newEvent.Tipo === 'Entrenamiento' && (
                                <div className="tab-container">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`tab-button ${activeTab === 'details' ? 'active' : 'inactive'}`}
                                    >
                                        Detalles
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('attendance')}
                                        className={`tab-button ${activeTab === 'attendance' ? 'active' : 'inactive'}`}
                                    >
                                        Asistencia
                                    </button>
                                </div>
                            )}

                            {activeTab === 'details' ? (
                                <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Evento</label>
                                        <select
                                            value={newEvent.Tipo}
                                            onChange={e => setNewEvent({ ...newEvent, Tipo: e.target.value })}
                                            className="form-select"
                                            disabled={isEditing}
                                        >
                                            <option value="Entrenamiento">Entrenamiento</option>
                                            <option value="Partido">Partido</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Lugar</label>
                                        <input
                                            type="text"
                                            value={newEvent.location}
                                            onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                            placeholder="Estadi Municipal"
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            value={newEvent.fecha}
                                            onChange={e => setNewEvent({ ...newEvent, fecha: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Hora</label>
                                        <input
                                            type="time"
                                            required
                                            value={newEvent.hora}
                                            onChange={e => setNewEvent({ ...newEvent, hora: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Estado</label>
                                        <select
                                            value={newEvent.Estado}
                                            onChange={e => setNewEvent({ ...newEvent, Estado: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="Programado">Programado</option>
                                            <option value="Finalizado">Finalizado</option>
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>
                                    </div>

                                    {/* Match Specific Fields */}
                                    {newEvent.Tipo === 'Partido' && (
                                        <div className="match-details-container">
                                            <h4 className="match-details-title">Detalles del Partido</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <label className="form-label">Rival</label>
                                                    <select
                                                        required
                                                        value={newEvent.rival_id}
                                                        onChange={e => setNewEvent({ ...newEvent, rival_id: e.target.value })}
                                                        className="form-select"
                                                    >
                                                        <option value="">Seleccionar Rival</option>
                                                        {rivals.map(r => (
                                                            <option key={r.id_rivales} value={r.id_equipo}>{r.nombre_equipo}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <label className="form-label">Puntos Local</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={newEvent.marcador_local}
                                                        onChange={e => setNewEvent({ ...newEvent, marcador_local: e.target.value })}
                                                        placeholder="0"
                                                        className="form-input"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label">Puntos Visitante</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={newEvent.marcador_visitante}
                                                        onChange={e => setNewEvent({ ...newEvent, marcador_visitante: e.target.value })}
                                                        placeholder="0"
                                                        className="form-input"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newEvent.es_local}
                                                        onChange={e => setNewEvent({ ...newEvent, es_local: e.target.checked })}
                                                        style={{ width: '20px', height: '20px' }}
                                                    />
                                                    Es Local
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Training Specific Fields */}
                                    {newEvent.Tipo === 'Entrenamiento' && (
                                        <div className="training-details-container">
                                            <h4 className="training-details-title">Detalles del Entrenamiento</h4>
                                            <div className="form-group">
                                                <label className="form-label">Objetivos</label>
                                                <input
                                                    type="text"
                                                    value={newEvent.objetivos}
                                                    onChange={e => setNewEvent({ ...newEvent, objetivos: e.target.value })}
                                                    placeholder="Objetivo principal..."
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Calentamiento</label>
                                                <textarea
                                                    value={newEvent.calentamiento}
                                                    onChange={e => setNewEvent({ ...newEvent, calentamiento: e.target.value })}
                                                    placeholder="Detalles del calentamiento..."
                                                    rows="2"
                                                    className="form-textarea"
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label className="form-label">Trabajo Separado</label>
                                                    <textarea
                                                        value={newEvent.trabajo_separado}
                                                        onChange={e => setNewEvent({ ...newEvent, trabajo_separado: e.target.value })}
                                                        placeholder="Forwards / Backs..."
                                                        rows="3"
                                                        className="form-textarea"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label">Trabajo Conjunto</label>
                                                    <textarea
                                                        value={newEvent.trabajo_conjunto}
                                                        onChange={e => setNewEvent({ ...newEvent, trabajo_conjunto: e.target.value })}
                                                        placeholder="Ejercicios conjuntos..."
                                                        rows="3"
                                                        className="form-textarea"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label">Observaciones Generales</label>
                                        <textarea
                                            value={newEvent.observaciones}
                                            onChange={e => setNewEvent({ ...newEvent, observaciones: e.target.value })}
                                            className="form-textarea"
                                            style={{ minHeight: '80px' }}
                                            placeholder="Notas adicionales..."
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="btn-cancel"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn-submit"
                                        >
                                            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Evento' : 'Guardar Evento')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="attendance-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <AttendanceList
                                        players={players}
                                        attendance={attendance}
                                        onToggle={handleAttendanceToggle}
                                    />

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            style={{ flex: 1, padding: '1rem', border: 'none', background: '#e9ecef', color: '#495057', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            onClick={handleSaveAttendance}
                                            style={{
                                                flex: 2, padding: '1rem', border: 'none', background: '#003366', color: 'white',
                                                borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                                                boxShadow: '0 4px 15px rgba(0, 51, 102, 0.3)'
                                            }}
                                        >
                                            Guardar Asistencia
                                        </button>
                                    </div>
                                </div>
                            )
                            }
                        </div >
                    </div >
                )
            }
            {/* Match Details Modal */}
            {showMatchModal && selectedMatch && (
                <MatchDetailsModal
                    match={{ extendedProps: selectedMatch, start: selectedMatch.start, id: selectedMatch.id, }}
                    currentUser={user}
                    onClose={() => setShowMatchModal(false)}
                    onEditMatch={(props) => handleEditClick(props)}
                    isNextMatch={(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const nextMatch = events
                            .filter(e => e.extendedProps.isMatch && new Date(e.start) >= today)
                            .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

                        return nextMatch && String(nextMatch.id) === String(selectedMatch.id || selectedMatch.match_id);
                    })()}
                />
            )}



            {/* Training Details Modal */}
            {
                showTrainingModal && selectedTraining && (

                    <div className="modal-overlay" onClick={() => setShowTrainingModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>

                            <div className="modal-header-banner">
                                <button
                                    onClick={() => setShowTrainingModal(false)}
                                    className="modal-close-icon"
                                >
                                    <X size={20} />
                                </button>
                                <h2 className="modal-header-title" style={{ color: '#FF6600' }}>Entrenamiento</h2>
                                <p className="modal-header-subtitle">{new Date(selectedTraining.start).toLocaleDateString()}</p>

                                <div className="modal-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`tab-link ${activeTab === 'details' ? 'active' : ''}`}
                                        style={{ background: 'none', border: 'none', borderBottom: activeTab === 'details' ? '3px solid white' : 'none', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Detalles
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('attendance')}
                                        className={`tab-link ${activeTab === 'attendance' ? 'active' : ''}`}
                                        style={{ background: 'none', border: 'none', borderBottom: activeTab === 'attendance' ? '3px solid white' : 'none', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Asistencia
                                    </button>
                                </div>
                            </div>

                            <div className="modal-body">
                                {activeTab === 'details' ? (
                                    <div className="training-grid">
                                        <div className="training-card-gray">
                                            <h3 className="training-section-title">
                                                <Activity size={20} /> Calentamiento
                                            </h3>
                                            <p className="training-text">
                                                {selectedTraining.calentamiento || 'No especificado'}
                                            </p>
                                        </div>

                                        <div className="training-split-grid">
                                            <div className="training-card-blue">
                                                <h3 className="training-section-title" style={{ fontSize: '1.1rem' }}>Trabajo Separado</h3>
                                                <p className="training-text">
                                                    {selectedTraining.trabajo_separado || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="training-card-orange">
                                                <h3 className="training-section-title" style={{ color: '#e65100', fontSize: '1.1rem' }}>Trabajo Conjunto</h3>
                                                <p className="training-text">
                                                    {selectedTraining.trabajo_conjunto || 'No especificado'}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedTraining.objetivos && (
                                            <div className="objectives-container">
                                                <h4 className="detail-section-title objectives-title">Objetivos / Notas Adicionales</h4>
                                                <p className="objectives-content">{selectedTraining.objetivos}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="attendance-tab">
                                        <h3 className="detail-section-title">
                                            <Users size={20} /> Lista de Asistencia
                                        </h3>
                                        <AttendanceList
                                            players={players}
                                            attendance={attendance}
                                            onToggle={handleAttendanceToggle}
                                        />
                                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                            <button
                                                onClick={handleSaveAttendance}
                                                disabled={savingAttendance}
                                                style={{
                                                    background: '#003366',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.75rem 2rem',
                                                    borderRadius: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    boxShadow: '0 4px 15px rgba(0, 51, 102, 0.3)'
                                                }}
                                            >
                                                <Save size={18} />
                                                {savingAttendance ? 'Guardando...' : 'Guardar Asistencia'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                    <button
                                        onClick={() => setShowTrainingModal(false)}
                                        className="btn-close"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(selectedTraining)}
                                        className="btn-edit"
                                    >
                                        Editar Evento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showAttendanceModal && (
                    <AttendanceModal
                        initialEventId={attendanceEventId}
                        onClose={() => setShowAttendanceModal(false)}
                        user={user}
                    />
                )
            }
        </div>
    );
};

export default CalendarPage;
