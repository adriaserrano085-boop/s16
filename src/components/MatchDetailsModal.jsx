import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, Activity, Info, Users, Save, ClipboardList, Video, FileJson, TrendingUp } from 'lucide-react';
import { convocatoriaService } from '../services/convocatoriaService';
import { analysisService } from '../services/analysisService';
import { analyzePdf } from '../utils/pdfAnalysis';
import playerService from '../services/playerService';
import './MatchDetailsModal.css';

const MAX_SQUAD = 23;

const MatchDetailsModal = ({ match, onClose, currentUser, isNextMatch }) => {
    if (!match) return null;

    const props = match.extendedProps || {};
    const navigate = useNavigate();
    const isFinished = props.isFinished;
    const isFutureMatch = (() => {
        if (isFinished) return false;
        if (!match.start) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(match.start) >= today;
    })();
    const matchId = props.match_id; // Keep for match-specific logic (e.g. stats)
    const externalId = props.partido_externo_id; // UUID for External Matches
    const eventId = props.evento_id || props.publicId || match.id; // UUID for Analysis (Calendar Events)

    const dateStr = match.start ? new Date(match.start).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    const timeStr = match.start ? new Date(match.start).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    // Tabs
    const [activeTab, setActiveTab] = useState('summary');

    // Squad State
    const [squad, setSquad] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [loadingSquad, setLoadingSquad] = useState(false);
    const [savingSquad, setSavingSquad] = useState(false);
    const [squadMessage, setSquadMessage] = useState('');
    const [showConvocatoria, setShowConvocatoria] = useState(false);

    // Video Analysis State
    const [analysis, setAnalysis] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoOffset, setVideoOffset] = useState(0);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [rawJson, setRawJson] = useState(null); // New state for raw JSON
    const [savingAnalysis, setSavingAnalysis] = useState(false);
    const [analysisMessage, setAnalysisMessage] = useState('');
    const [showJsonInput, setShowJsonInput] = useState(false);
    const [pastedJson, setPastedJson] = useState('');

    // Advanced Stats State
    const [possessionHome, setPossessionHome] = useState(50);
    const [possessionAway, setPossessionAway] = useState(50);
    const [tacklesHomeMade, setTacklesHomeMade] = useState(0);
    const [tacklesHomeMissed, setTacklesHomeMissed] = useState(0);
    const [tacklesAwayMade, setTacklesAwayMade] = useState(0);
    const [tacklesAwayMissed, setTacklesAwayMissed] = useState(0);
    const [scrumsHomeWon, setScrumsHomeWon] = useState(0);
    const [scrumsHomeLost, setScrumsHomeLost] = useState(0);
    const [scrumsAwayWon, setScrumsAwayWon] = useState(0);
    const [scrumsAwayLost, setScrumsAwayLost] = useState(0);
    const [lineoutsHomeWon, setLineoutsHomeWon] = useState(0);
    const [lineoutsHomeLost, setLineoutsHomeLost] = useState(0);
    const [lineoutsAwayWon, setLineoutsAwayWon] = useState(0);
    const [lineoutsAwayLost, setLineoutsAwayLost] = useState(0);
    const [analystReport, setAnalystReport] = useState('');

    // AI State
    const [generatingAI, setGeneratingAI] = useState(false);
    // Try env var, then local storage, then hardcoded fallback for immediate test
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('openai_api_key') || 'AIzaSyCYDhcrZNYqREagiR6Bgu4crm6c-Kc-9yU');
    const [showApiKey, setShowApiKey] = useState(false);

    // PDF State
    const [processingPdf, setProcessingPdf] = useState(false);
    const [timeline, setTimeline] = useState([]);

    useEffect(() => {
        if (externalId) {
            loadAnalysisExternal();
        } else if (eventId) {
            // Load Squad only if it's a real match (partido_id exists)
            if (matchId) {
                loadSquadData();
            }
            loadAnalysisData();
        }
    }, [eventId, matchId, externalId]);

    const loadAnalysisData = async () => {
        try {
            const data = await analysisService.getByEventId(eventId);
            if (data) {
                setAnalysisDataState(data);
            }
        } catch (err) {
            console.error('Error loading analysis:', err);
        }
    };

    const loadAnalysisExternal = async () => {
        try {
            const data = await analysisService.getByExternalMatchId(externalId);
            if (data) {
                setAnalysisDataState(data);
            }
        } catch (err) {
            console.error('Error loading external analysis:', err);
        }
    };

    const setAnalysisDataState = (data) => {
        setAnalysis(data);
        setVideoUrl(data.video_url || '');
        setVideoOffset(data.video_offset_sec || 0);

        // Load from raw_json (Primary Source)
        if (data.raw_json) {
            const json = data.raw_json;
            const stats = json.estadisticas || {};

            // Timeline & Report
            if (json.timeline) setTimeline(json.timeline);
            setAnalystReport(json.report || '');

            // Possession
            if (stats.posesion) {
                setPossessionHome(stats.posesion.local || 50);
                setPossessionAway(stats.posesion.visitante || 50);
            }
            // Tackles
            if (stats.placajes_hechos) {
                setTacklesHomeMade(stats.placajes_hechos.local || 0);
                setTacklesAwayMade(stats.placajes_hechos.visitante || 0);
            }
            if (stats.placajes_fallados) {
                setTacklesHomeMissed(stats.placajes_fallados.local || 0);
                setTacklesAwayMissed(stats.placajes_fallados.visitante || 0);
            }
            // Scrums
            if (stats.mele) {
                setScrumsHomeWon(stats.mele.local_ganada || 0);
                setScrumsHomeLost(stats.mele.local_perdida || 0);
                setScrumsAwayWon(stats.mele.visitante_ganada || 0);
                setScrumsAwayLost(stats.mele.visitante_perdida || 0);
            }
            // Lineouts
            if (stats.touch) {
                setLineoutsHomeWon(stats.touch.local_ganada || 0);
                setLineoutsHomeLost(stats.touch.local_perdida || 0);
                setLineoutsAwayWon(stats.touch.visitante_ganada || 0);
                setLineoutsAwayLost(stats.touch.visitante_perdida || 0);
            }
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessingPdf(true);
        setAnalysisMessage('');
        try {
            const result = await analyzePdf(file, parseInt(videoOffset) || 0);
            console.log("Analysis Result:", result);
            setTimeline(result.timeline);
            setAnalysisMessage('✅ PDF Procesado. Revisa y Guarda.');
        } catch (err) {
            console.error("PDF Error:", err);
            setAnalysisMessage('❌ Error al procesar PDF');
        } finally {
            setProcessingPdf(false);
        }
    };

    /* 
    const handleGenerateAIReport = async () => {
        // AI Report generation is currently disabled due to missing service
        setAnalysisMessage('Función de IA temporalmente desactivada.');
    };
    */

    const handleSaveAnalysis = async () => {
        setSavingAnalysis(true);
        setAnalysisMessage('');
        try {
            // Bundle all current state into the standardized JSON structure
            // If we have a rawJson from a previous import, we use it as base to preserve Master Schema
            const analysisData = rawJson ? { ...rawJson } : {
                updated_at: new Date().toISOString(),
                timeline: timeline || [],
                report: analystReport || '',
                estadisticas: {
                    posesion: {
                        local: parseInt(possessionHome) || 50,
                        visitante: parseInt(possessionAway) || 50
                    },
                    placajes_hechos: {
                        local: parseInt(tacklesHomeMade) || 0,
                        visitante: parseInt(tacklesAwayMade) || 0
                    },
                    placajes_fallados: {
                        local: parseInt(tacklesHomeMissed) || 0,
                        visitante: parseInt(tacklesAwayMissed) || 0
                    },
                    mele: {
                        local_ganada: parseInt(scrumsHomeWon) || 0,
                        local_perdida: parseInt(scrumsHomeLost) || 0,
                        visitante_ganada: parseInt(scrumsAwayWon) || 0,
                        visitante_perdida: parseInt(scrumsAwayLost) || 0
                    },
                    touch: {
                        local_ganada: parseInt(lineoutsHomeWon) || 0,
                        local_perdida: parseInt(lineoutsHomeLost) || 0,
                        visitante_ganada: parseInt(lineoutsAwayWon) || 0,
                        visitante_perdida: parseInt(lineoutsAwayLost) || 0
                    }
                }
            };

            // ALWAYS sync component states back into the JSON structure before saving
            // This ensures edits made in the UI tabs (Timeline, Estadisticas) are preserved
            if (analysisData.match_report) {
                // Sync Timeline back
                analysisData.match_report.actions_timeline = timeline.map(ev => ({
                    minute: ev.minuto,
                    team: ev.equipo?.toLowerCase() === 'visitante' ? 'visitor' : 'local',
                    event_type: ev.type,
                    player: ev.player,
                    dorsal: ev.dorsal,
                    // PRESERVE SUBSTITUTION FIELDS
                    player_in: ev.player_in,
                    player_out: ev.player_out,
                    dorsal_in: ev.dorsal_in,
                    dorsal_out: ev.dorsal_out,
                    points: ev.points,
                    reason: ev.reason
                }));
                analysisData.match_report.report_summary = analystReport;

                // Sync Key Stats back (if they exist)
                if (analysisData.match_report.key_stats) {
                    analysisData.match_report.key_stats.posesion = {
                        local: parseInt(possessionHome) || 50,
                        visitor: parseInt(possessionAway) || 50
                    };
                    analysisData.match_report.key_stats.placajes_exito = {
                        local: parseInt(tacklesHomeMade) || 0,
                        visitor: parseInt(tacklesAwayMade) || 0
                    };
                    analysisData.match_report.key_stats.placajes_fallados = {
                        local: parseInt(tacklesHomeMissed) || 0,
                        visitor: parseInt(tacklesAwayMissed) || 0
                    };
                    analysisData.match_report.key_stats.meles_ganadas = {
                        local: parseInt(scrumsHomeWon) || 0,
                        visitor: parseInt(scrumsAwayWon) || 0
                    };
                    analysisData.match_report.key_stats.meles_perdidas = {
                        local: parseInt(scrumsHomeLost) || 0,
                        visitor: parseInt(scrumsAwayLost) || 0
                    };
                    analysisData.match_report.key_stats.touches_ganadas = {
                        local: parseInt(lineoutsHomeWon) || 0,
                        visitor: parseInt(lineoutsAwayWon) || 0
                    };
                    analysisData.match_report.key_stats.touches_perdidas = {
                        local: parseInt(lineoutsHomeLost) || 0,
                        visitor: parseInt(lineoutsAwayLost) || 0
                    };
                }
            } else {
                // Legacy fallback
                analysisData.timeline = timeline;
                analysisData.report = analystReport;
                analysisData.estadisticas = {
                    posesion: { local: parseInt(possessionHome), visitante: parseInt(possessionAway) },
                    placajes_hechos: { local: parseInt(tacklesHomeMade), visitante: parseInt(tacklesAwayMade) },
                    placajes_fallados: { local: parseInt(tacklesHomeMissed), visitante: parseInt(tacklesAwayMissed) },
                    mele: {
                        local_ganada: parseInt(scrumsHomeWon), local_perdida: parseInt(scrumsHomeLost),
                        visitante_ganada: parseInt(scrumsAwayWon), visitante_perdida: parseInt(scrumsAwayLost)
                    },
                    touch: {
                        local_ganada: parseInt(lineoutsHomeWon), local_perdida: parseInt(lineoutsHomeLost),
                        visitante_ganada: parseInt(lineoutsAwayWon), visitante_perdida: parseInt(lineoutsAwayLost)
                    }
                };
            }

            const payload = {
                evento_id: externalId ? null : eventId,
                partido_externo_id: externalId || null,
                partido_id: matchId || null,
                video_url: videoUrl,
                video_offset_sec: parseInt(videoOffset) || 0,
                // ONLY save to raw_json to avoid schema errors with missing columns
                raw_json: analysisData
            };

            const saved = await analysisService.upsert(payload);
            setAnalysis(saved);
            setRawJson(saved.raw_json);
            setAnalysisMessage('✅ Guardado');
            setTimeout(() => setAnalysisMessage(''), 3000);
        } catch (err) {
            console.error('Error saving analysis:', err);
            setAnalysisMessage('❌ Error: ' + (err.message || 'Error al guardar'));
        } finally {
            setSavingAnalysis(false);
        }
    };

    const loadSquadData = async () => {
        setLoadingSquad(true);
        try {
            // Load players independently
            let players = [];
            try {
                players = await playerService.getAll();
                console.log('Players loaded:', players?.length);
            } catch (err) {
                console.error('Error loading players:', err);
            }
            setAllPlayers(players || []);

            // Load existing squad independently
            try {
                const existingSquad = await convocatoriaService.getByMatchId(matchId);
                console.log('Existing squad loaded:', existingSquad?.length);

                const newSquad = Array.from({ length: MAX_SQUAD }, (_, i) => {
                    const existing = existingSquad?.find(e => e.numero === i + 1);
                    return { numero: i + 1, jugador: existing?.jugador || '' };
                });

                setSquad(newSquad);
                if (existingSquad && existingSquad.length > 0) {
                    setShowConvocatoria(true);
                }
            } catch (err) {
                console.error('Error loading existing squad:', err);
                // Fallback: Initialize empty slots
                const emptySquad = Array.from({ length: MAX_SQUAD }, (_, i) => ({
                    numero: i + 1,
                    jugador: ''
                }));
                setSquad(emptySquad);
            }
        } finally {
            setLoadingSquad(false);
        }
    };

    const handlePlayerChange = (index, playerId) => {
        const newSquad = [...squad];
        newSquad[index] = { ...newSquad[index], jugador: playerId };
        setSquad(newSquad);
    };

    const handleSaveSquad = async () => {
        setSavingSquad(true);
        setSquadMessage('');
        try {
            await convocatoriaService.saveSquad(matchId, squad);
            setSquadMessage('✅ Convocatoria guardada');
            setTimeout(() => setSquadMessage(''), 3000);
        } catch (err) {
            console.error('Error saving squad:', err);
            setSquadMessage('❌ Error al guardar');
        } finally {
            setSavingSquad(false);
        }
    };

    const selectedPlayerIds = squad.map(s => s.jugador).filter(Boolean);
    const getAvailablePlayers = (currentSlotPlayerId) => {
        return allPlayers.filter(
            p => p.id === currentSlotPlayerId || !selectedPlayerIds.includes(p.id)
        );
    };

    const getPlayerName = (playerId) => {
        const player = allPlayers.find(p => p.id === playerId);
        return player ? `${player.nombre} ${player.apellidos}` : '';
    };

    const filledCount = squad.filter(s => s.jugador).length;

    return (
        <div className="match-details-overlay" onClick={onClose}>
            <div className="match-details-content" onClick={e => e.stopPropagation()}>
                <div className="match-details-header">
                    <div className="match-details-type">
                        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Partido" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <span>{props.league || 'Partido'}</span>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="match-details-body">
                    {/* Scoreboards Section */}
                    <div className="teams-comparison">
                        <div className="team-info">
                            <img src={props.homeTeamShield} alt={props.homeTeamName} className="team-large-shield" />
                            <h3 className="team-large-name">{props.homeTeamName}</h3>
                        </div>

                        <div className="score-center">
                            {isFinished || (props.homeScore !== null && props.awayScore !== null && props.homeScore !== undefined && props.awayScore !== undefined) ? (
                                <div className="large-score">
                                    <span>{props.homeScore}</span>
                                    <span className="score-separator">-</span>
                                    <span>{props.awayScore}</span>
                                </div>
                            ) : (
                                <div className="vs-label">VS</div>
                            )}
                            <div className={`match-status-tag ${isFinished ? 'status-finished' : 'status-upcoming'}`}>
                                {isFinished ? 'Finalizado' : 'Próximo Partido'}
                            </div>
                        </div>

                        <div className="team-info">
                            <img src={props.awayTeamShield} alt={props.awayTeamName} className="team-large-shield" />
                            <h3 className="team-large-name">{props.awayTeamName}</h3>
                        </div>
                    </div>

                    {/* Details Info Grid */}
                    <div className="details-info-grid">
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
                                <p>{props.lugar || 'Por confirmar'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <Activity size={20} />
                            <div>
                                <label>Estado</label>
                                <p>{props.estado || 'Programado'}</p>
                            </div>
                        </div>
                    </div>

                    {props.observaciones && (
                        <div className="match-observations">
                            <div className="obs-header">
                                <Info size={18} />
                                <span>Observaciones</span>
                            </div>
                            <p className="obs-text">{props.observaciones}</p>
                        </div>
                    )}

                    {/* Report Button for Past Matches */}
                    {isFinished && (
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={() => {
                                    onClose();
                                    const targetId = props.match_id || props.partido_externo_id;
                                    const targetType = props.match_id ? 'internal' : (props.partido_externo_id ? 'external' : 'any');

                                    // Use new dedicated page
                                    if (targetId) {
                                        navigate(`/analysis/match/${targetType}/${targetId}`);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.5)'
                                }}
                            >
                                <FileJson size={18} />
                                Ver Informe del Partido
                            </button>
                        </div>
                    )}

                    {/* Rival Analysis Button for Players - Only for NEXT match */}
                    {currentUser?.role === 'JUGADOR' && isNextMatch && (props.homeTeamName !== 'RC HOSPITALET' || props.awayTeamName !== 'RC HOSPITALET') && (
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={() => {
                                    const rival = props.homeTeamName === 'RC HOSPITALET' ? props.awayTeamName : props.homeTeamName;
                                    if (rival) {
                                        onClose();
                                        navigate(`/analysis/rival/${encodeURIComponent(rival)}`);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                                }}
                            >
                                <TrendingUp size={18} />
                                Ver Análisis del Rival
                            </button>
                        </div>
                    )}

                    {/* Convocatoria Section */}
                    {matchId && (
                        <div className="convocatoria-section">
                            <div
                                className="convocatoria-header"
                                onClick={() => setShowConvocatoria(!showConvocatoria)}
                            >
                                <div className="convocatoria-title">
                                    <ClipboardList size={20} />
                                    <span>CONVOCATORIA</span>
                                    <span className="convocatoria-count">{filledCount}/{MAX_SQUAD}</span>
                                </div>
                                <span className={`convocatoria-toggle ${showConvocatoria ? 'open' : ''}`}>▾</span>
                            </div>

                            {showConvocatoria && (
                                <div className="convocatoria-body">
                                    {/* Player Personal Status */}
                                    {currentUser?.role === 'JUGADOR' && !loadingSquad && (
                                        <div className="player-convocatoria-status" style={{ marginBottom: '1rem' }}>
                                            {(() => {
                                                const mySpot = squad.find(s => s.jugador === currentUser.playerId);
                                                return mySpot ? (
                                                    <div className="status-card-large badge-presente" style={{ padding: '0.5rem 1rem 0 1rem', borderRadius: '12px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                                        <span className="status-large-text" style={{ fontSize: '1.1rem', fontWeight: '800', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                            {isFinished || (props.homeScore !== null && props.awayScore !== null) ? '¡Estuviste Convocado!' : '¡Estás Convocado!'}
                                                        </span>

                                                        {/* Jersey Container */}
                                                        <div style={{ position: 'relative', width: '450px', height: '450px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '-60px', marginBottom: '-100px' }}>
                                                            <img
                                                                src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/camiseta.png"
                                                                alt="Camiseta"
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.25))' }}
                                                            />
                                                            <span style={{
                                                                position: 'absolute',
                                                                top: '42%',
                                                                left: '50%',
                                                                transform: 'translate(-50%, -50%)',
                                                                fontSize: '5rem',
                                                                fontWeight: '900',
                                                                color: 'var(--color-primary-blue)',
                                                                zIndex: 10,
                                                                fontFamily: 'var(--font-main)',
                                                                textAlign: 'center',
                                                                width: '100%'
                                                            }}>
                                                                {mySpot.numero}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="status-card-large badge-ausente" style={{ padding: '1rem', borderRadius: '8px', textAlign: 'center', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                                                        <span className="status-large-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block' }}>NO CONVOCADO</span>
                                                        <span style={{ fontSize: '0.9rem' }}>No estás en la lista para este partido.</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Full Squad List - Only for Staff/Non-Players */}
                                    {currentUser?.role !== 'JUGADOR' && (
                                        <>
                                            {loadingSquad ? (
                                                <p className="convocatoria-loading">Cargando plantilla...</p>
                                            ) : (
                                                <>
                                                    <div className="squad-list">
                                                        {squad.map((slot, idx) => (
                                                            <div key={idx} className={`squad-slot ${slot.jugador ? 'squad-slot--filled' : ''}`}>
                                                                <span className="squad-number">{slot.numero}</span>
                                                                {isFutureMatch ? (
                                                                    <select
                                                                        className="squad-select"
                                                                        value={slot.jugador || ''}
                                                                        onChange={(e) => handlePlayerChange(idx, e.target.value)}
                                                                    >
                                                                        <option value="">— Vacante —</option>
                                                                        {getAvailablePlayers(slot.jugador).map(p => (
                                                                            <option key={p.id} value={p.id}>
                                                                                {p.apellidos}, {p.nombre}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <span className="squad-player-name">
                                                                        {slot.jugador ? getPlayerName(slot.jugador) : '—'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {isFutureMatch && (
                                                        <div className="convocatoria-actions">
                                                            <button
                                                                className="btn-save-squad"
                                                                onClick={handleSaveSquad}
                                                                disabled={savingSquad}
                                                            >
                                                                <Save size={16} />
                                                                {savingSquad ? 'Guardando...' : 'Guardar Convocatoria'}
                                                            </button>
                                                            {squadMessage && (
                                                                <span className="squad-message">{squadMessage}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Match Analysis Section - Available for ALL events BUT ONLY STAFF sees it */}
                    {(eventId || externalId) && currentUser?.role !== 'JUGADOR' && (
                        <div className="convocatoria-section" style={{ marginTop: '12px' }}>
                            <div
                                className="convocatoria-header"
                                onClick={() => setShowAnalysis(!showAnalysis)}
                                style={{ background: 'linear-gradient(to right, #f8fafc, #eff6ff)', borderLeft: '4px solid #3b82f6' }}
                            >
                                <div className="convocatoria-title">
                                    <FileJson size={20} color="#3b82f6" />
                                    <span style={{ color: '#1e3a8a', fontWeight: '800' }}>ANÁLISIS E INFORMES</span>
                                    {analysis && <span className="status-dot-green" title="Configurado"></span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                                        {analysis?.raw_json?.match_report ? 'FORMATO AVANZADO' : (analysis ? 'FORMATO SIMPLE' : 'SIN DATOS')}
                                    </span>
                                    <span className={`convocatoria-toggle ${showAnalysis ? 'open' : ''}`}>▾</span>
                                </div>
                            </div>

                            {showAnalysis && (
                                <div className="convocatoria-body" style={{ padding: '1.5rem' }}>
                                    {/* Main Importer Action */}
                                    <div className="analysis-importer-box" style={{
                                        background: '#f0f9ff',
                                        border: '2px dashed #bae6fd',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem',
                                        textAlign: 'center'
                                    }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>Importador Masivo de Datos (JSON)</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '1rem' }}>
                                            Pega el JSON generado por la IA para cargar automáticamente alineaciones, estadísticas, flujo del partido y recomendaciones.
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setShowJsonInput(!showJsonInput)}
                                                style={{
                                                    backgroundColor: showJsonInput ? '#64748b' : '#0284c7',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '10px 20px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.4)'
                                                }}
                                            >
                                                <FileJson size={18} /> {showJsonInput ? 'Cerrar Importador' : 'Cargar JSON de Análisis'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    import('../services/reportService').then(({ reportService }) => {
                                                        const template = JSON.stringify(reportService.getTemplate(), null, 2);
                                                        navigator.clipboard.writeText(template);
                                                        alert("📋 Plantilla copiada.");
                                                    });
                                                }}
                                                style={{
                                                    backgroundColor: 'white',
                                                    color: '#475569',
                                                    border: '1px solid #e2e8f0',
                                                    padding: '10px 15px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Copiar Plantilla
                                            </button>
                                        </div>

                                        {showJsonInput && (
                                            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>
                                                    Pega el contenido JSON aquí:
                                                </label>
                                                <textarea
                                                    className="json-import-textarea"
                                                    value={pastedJson}
                                                    onChange={(e) => setPastedJson(e.target.value)}
                                                    placeholder='{ "match_report": { ... } }'
                                                    rows={8}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '2px solid #bae6fd',
                                                        fontSize: '0.85rem',
                                                        fontFamily: 'monospace',
                                                        marginBottom: '1rem',
                                                        resize: 'vertical'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const jsonString = pastedJson;
                                                        if (jsonString) {
                                                            const cleanJsonInput = (input) => {
                                                                if (!input) return "";
                                                                let cleaned = input.replace(/```json/g, "").replace(/```/g, "");
                                                                cleaned = cleaned.replace(/\[cite_start\]/g, "");
                                                                cleaned = cleaned.replace(/\[cite:[^\]]*\]/g, "");
                                                                return cleaned.trim();
                                                            };

                                                            try {
                                                                const cleanedString = cleanJsonInput(jsonString);
                                                                const jsonData = JSON.parse(cleanedString);
                                                                setRawJson(jsonData);

                                                                import('../services/reportService').then(({ reportService }) => {
                                                                    // 1. Update markdown report
                                                                    const markdown = reportService.jsonToMarkdown(jsonData);
                                                                    setAnalystReport(markdown);

                                                                    // 2. Sync specialized states (Timeline, Stats)
                                                                    const syncData = reportService.syncAnalysisToState(jsonData);
                                                                    if (syncData) {
                                                                        if (syncData.timeline) setTimeline(syncData.timeline);
                                                                        if (syncData.stats) {
                                                                            const { possession, tackles, mele } = syncData.stats;
                                                                            setPossessionHome(possession.local);
                                                                            setPossessionAway(possession.visitor);
                                                                            setTacklesHomeMade(tackles.homeMade);
                                                                            setTacklesAwayMade(tackles.awayMade);
                                                                            setTacklesHomeMissed(tackles.homeMissed);
                                                                            setTacklesAwayMissed(tackles.awayMissed);
                                                                            setScrumsHomeWon(mele.local_ganada);
                                                                            setScrumsHomeLost(mele.local_perdida);
                                                                            setScrumsAwayWon(mele.visitante_ganada);
                                                                            setScrumsAwayLost(mele.visitante_perdida);
                                                                        }
                                                                    }
                                                                });

                                                                alert("✅ Datos importados y sincronizados correctamente. ¡No olvides Guardar el Análisis!");
                                                                setShowJsonInput(false);
                                                                setPastedJson('');
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert("❌ Error: Formato JSON inválido.");
                                                            }
                                                        }
                                                    }}
                                                    disabled={!pastedJson.trim()}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: '#0ea5e9',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        cursor: pastedJson.trim() ? 'pointer' : 'not-allowed',
                                                        fontWeight: 'bold',
                                                        opacity: pastedJson.trim() ? 1 : 0.6
                                                    }}
                                                >
                                                    Procesar e Importar Datos
                                                </button>
                                            </div>
                                        )}

                                        {/* AI Roster Sync Section */}
                                        {rawJson?.match_report?.rosters_and_stats?.local && (
                                            <div style={{
                                                marginTop: '1.5rem',
                                                padding: '1rem',
                                                background: 'white',
                                                borderRadius: '8px',
                                                border: '1px solid #e0f2fe',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '12px'
                                            }}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0369a1', display: 'block' }}>
                                                        Alineación AI disponible ({rawJson.match_report.rosters_and_stats.local.length} jugadores)
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        Puedes sincronizar estos nombres con la convocatoria oficial del club.
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const aiRoster = rawJson.match_report.rosters_and_stats.local;
                                                        const newSquad = [...squad];
                                                        let matchedCount = 0;

                                                        aiRoster.forEach(aiPlayer => {
                                                            const dorsal = aiPlayer.dorsal;
                                                            if (dorsal >= 1 && dorsal <= MAX_SQUAD) {
                                                                // Try fuzzy match by name
                                                                const matchedPlayer = allPlayers.find(p => {
                                                                    const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
                                                                    const aiName = aiPlayer.name.toLowerCase();
                                                                    return fullName.includes(aiName) || aiName.includes(p.nombre.toLowerCase());
                                                                });

                                                                if (matchedPlayer) {
                                                                    newSquad[dorsal - 1] = { numero: dorsal, jugador: matchedPlayer.id };
                                                                    matchedCount++;
                                                                }
                                                            }
                                                        });

                                                        setSquad(newSquad);
                                                        alert(`✅ Sincronización completada: ${matchedCount} jugadores emparejados automáticamente.`);
                                                    }}
                                                    style={{
                                                        backgroundColor: '#f0f9ff',
                                                        color: '#0369a1',
                                                        border: '1px solid #bae6fd',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    Sincronizar Plantilla
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="details-info-grid">
                                        <div className="info-item full-width">
                                            <label>URL del Video de Referencia (YouTube)</label>
                                            <input
                                                type="text"
                                                className="squad-select"
                                                placeholder="https://youtube.com/..."
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                            />
                                        </div>
                                        <div className="info-item">
                                            <label>Sincronización (Offset seg.)</label>
                                            <input
                                                type="number"
                                                className="squad-select"
                                                placeholder="0"
                                                value={videoOffset}
                                                onChange={(e) => setVideoOffset(e.target.value)}
                                            />
                                        </div>
                                        <div className="info-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                className="btn-save-squad"
                                                onClick={handleSaveAnalysis}
                                                disabled={savingAnalysis}
                                                style={{ width: '100%', background: '#0ea5e9' }}
                                            >
                                                <Save size={16} />
                                                {savingAnalysis ? 'Guardando...' : 'Guardar Análisis'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Advanced Stats Inputs */}
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Activity size={16} /> Data Avanzada (Manual)
                                        </h4>

                                        {/* Possession */}
                                        <div className="details-info-grid" style={{ marginBottom: '1rem' }}>
                                            <div className="info-item">
                                                <label>Posesión Local (%)</label>
                                                <input type="number" className="squad-select" value={possessionHome} onChange={(e) => setPossessionHome(e.target.value)} />
                                            </div>
                                            <div className="info-item">
                                                <label>Posesión Visita (%)</label>
                                                <input type="number" className="squad-select" value={possessionAway} onChange={(e) => setPossessionAway(e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Tackles */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>Placajes Local</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem' }}>Hechos</label><input type="number" className="squad-select" value={tacklesHomeMade} onChange={(e) => setTacklesHomeMade(e.target.value)} /></div>
                                                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem' }}>Fallados</label><input type="number" className="squad-select" value={tacklesHomeMissed} onChange={(e) => setTacklesHomeMissed(e.target.value)} /></div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>Placajes Visita</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem' }}>Hechos</label><input type="number" className="squad-select" value={tacklesAwayMade} onChange={(e) => setTacklesAwayMade(e.target.value)} /></div>
                                                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem' }}>Fallados</label><input type="number" className="squad-select" value={tacklesAwayMissed} onChange={(e) => setTacklesAwayMissed(e.target.value)} /></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Set Pieces */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            {/* Scrums */}
                                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>Melés (Gan/Perd)</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Local G</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={scrumsHomeWon} onChange={(e) => setScrumsHomeWon(e.target.value)} /></div>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Local P</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={scrumsHomeLost} onChange={(e) => setScrumsHomeLost(e.target.value)} /></div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Visita G</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={scrumsAwayWon} onChange={(e) => setScrumsAwayWon(e.target.value)} /></div>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Visita P</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={scrumsAwayLost} onChange={(e) => setScrumsAwayLost(e.target.value)} /></div>
                                                </div>
                                            </div>
                                            {/* Lineouts */}
                                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>Touches (Gan/Perd)</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Local G</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={lineoutsHomeWon} onChange={(e) => setLineoutsHomeWon(e.target.value)} /></div>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Local P</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={lineoutsHomeLost} onChange={(e) => setLineoutsHomeLost(e.target.value)} /></div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Visita G</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={lineoutsAwayWon} onChange={(e) => setLineoutsAwayWon(e.target.value)} /></div>
                                                    <div><label style={{ fontSize: '0.7rem' }}>Visita P</label><input type="number" className="squad-select" style={{ padding: '0.25rem' }} value={lineoutsAwayLost} onChange={(e) => setLineoutsAwayLost(e.target.value)} /></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Analyst Report */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <ClipboardList size={14} /> Vista Previa del Informe (Markdown)
                                            </label>

                                            <textarea
                                                className="squad-select"
                                                rows="6"
                                                placeholder="Escribe aquí el análisis del partido..."
                                                value={analystReport}
                                                onChange={(e) => setAnalystReport(e.target.value)}
                                                style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                                            />
                                        </div>

                                        {analysisMessage && <p className="squad-message" style={{ textAlign: 'center' }}>{analysisMessage}</p>}

                                        {analysis && (
                                            <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                <p style={{ fontSize: '12px', margin: 0 }}>
                                                    <strong>Status:</strong> Conectado
                                                </p>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                                                Subir Acta (PDF) para Generar Timeline
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handlePdfUpload}
                                                disabled={processingPdf}
                                                style={{ fontSize: '12px', width: '100%' }}
                                            />
                                            {processingPdf && <p style={{ fontSize: '10px', color: 'blue' }}>Procesando...</p>}
                                        </div>

                                        {timeline && timeline.length > 0 && (
                                            <div className="analysis-timeline" style={{ marginTop: '15px' }}>
                                                <h4 style={{ fontSize: '12px', marginBottom: '5px' }}>Línea de Tiempo (Sincronizada)</h4>
                                                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: '#f8fafc' }}>
                                                    {timeline.map((item, idx) => {
                                                        const getIcon = (type) => {
                                                            const t = type?.toLowerCase();
                                                            if (t?.includes('try') || t?.includes('ensayo')) return '🏉';
                                                            if (t?.includes('conversion') || t?.includes('transform')) return '🎯';
                                                            if (t?.includes('penalty') || t?.includes('puntapi')) return '👟';
                                                            if (t?.includes('yellow') || t?.includes('amarilla')) return '🟨';
                                                            if (t?.includes('red') || t?.includes('roja')) return '🟥';
                                                            if (t?.includes('sub')) return '🔄';
                                                            return '•';
                                                        };

                                                        return (
                                                            <div key={idx} style={{
                                                                padding: '8px 12px',
                                                                borderBottom: '1px solid #edf2f7',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                backgroundColor: item.videoSeconds < 0 ? '#fff5f5' : 'white'
                                                            }}>
                                                                <span style={{ fontWeight: '800', color: '#64748b', minWidth: '30px' }}>{item.minuto || item.min}'</span>
                                                                <span style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    background: item.team_label === 'L' ? '#dcfce7' : '#fee2e2',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 'bold',
                                                                    color: item.team_label === 'L' ? '#166534' : '#991b1b'
                                                                }}>
                                                                    {item.team_label}
                                                                </span>
                                                                <span style={{ fontSize: '1rem' }}>{getIcon(item.type || item.description)}</span>
                                                                <span style={{ flex: 1, color: '#1e293b' }}>
                                                                    {item.player ? (
                                                                        <>
                                                                            <strong>{item.player}</strong>
                                                                            {item.dorsal && <span style={{ color: '#64748b', marginLeft: '4px' }}>(#{item.dorsal})</span>}
                                                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>{item.type || item.description}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>{item.description}</span>
                                                                    )}
                                                                </span>
                                                                {item.videoTime || item.videoSeconds ? (
                                                                    <a
                                                                        href={videoUrl && videoUrl.includes('youtube') ?
                                                                            `${videoUrl.split('&')[0]}&t=${Math.max(0, (item.videoSeconds || 0) - 10)}` : '#'}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600', fontSize: '0.7rem' }}
                                                                    >
                                                                        {item.videoTime || '🎬'}
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="match-details-footer">
                    <button className="btn-close-modal" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div >
    );
};

export default MatchDetailsModal;
