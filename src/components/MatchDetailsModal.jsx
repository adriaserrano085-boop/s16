import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Activity, Info, Users, Save, ClipboardList, Video, FileJson } from 'lucide-react';
import { convocatoriaService } from '../services/convocatoriaService';
import { analysisService } from '../services/analysisService';
import { analyzePdf } from '../utils/pdfAnalysis';
import playerService from '../services/playerService';
import './MatchDetailsModal.css';

const MAX_SQUAD = 23;

const MatchDetailsModal = ({ match, onClose }) => {
    if (!match) return null;

    const props = match.extendedProps || {};
    const isFinished = props.isFinished;
    const isFutureMatch = !isFinished && match.start && new Date(match.start) >= new Date();
    const matchId = props.match_id; // Keep for match-specific logic (e.g. stats)
    const externalId = props.partido_externo_id; // UUID for External Matches
    const eventId = props.evento_id || props.publicId || match.id; // UUID for Analysis (Calendar Events)
    console.log("MatchDetailsModal Debug:", { eventId, "props.evento_id": props.evento_id, "props.publicId": props.publicId, "match.id": match.id, externalId });

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

    const handleGenerateAIReport = async () => {
        if (!apiKey) {
            alert("Por favor, introduce tu Google Gemini API Key para usar esta función.");
            setShowApiKey(true);
            return;
        }

        setGeneratingAI(true);
        setAnalysisMessage('🤖 La IA está analizando el partido...');

        try {
            // Prepare match data
            const matchData = {
                home: props.homeTeamName || 'Local',
                away: props.awayTeamName || 'Visitante',
                scoreHome: props.homeScore || 0,
                scoreAway: props.awayScore || 0,
                date: dateStr,
                videoUrl: videoUrl,
                videoOffset: videoOffset
            };

            const report = await aiService.generateMatchReport(matchData, timeline, apiKey);
            setAnalystReport(report);
            setAnalysisMessage('✅ Informe generado por IA.');
            // Save key for future use
            localStorage.setItem('openai_api_key', apiKey);
        } catch (err) {
            console.error("AI Generation Error:", err);
            setAnalysisMessage('❌ Error IA: ' + err.message);
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSaveAnalysis = async () => {
        setSavingAnalysis(true);
        setAnalysisMessage('');
        try {
            // Bundle all current state into the standardized JSON structure
            const analysisData = {
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
                if (existingSquad && existingSquad.length > 0) {
                    const newSquad = Array.from({ length: MAX_SQUAD }, (_, i) => {
                        const existing = existingSquad.find(e => e.numero === i + 1);
                        return { numero: i + 1, jugador: existing?.jugador || '' };
                    });
                    setSquad(newSquad);
                    setShowConvocatoria(true);
                }
            } catch (err) {
                console.error('Error loading existing squad:', err);
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
                            {isFinished ? (
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
                                </div>
                            )}
                        </div>
                    )}

                    {/* Video Analysis Section - Available for ALL events */}
                    {(eventId || externalId) && (
                        <div className="convocatoria-section" style={{ marginTop: '12px' }}>
                            <div
                                className="convocatoria-header"
                                onClick={() => setShowAnalysis(!showAnalysis)}
                            >
                                <div className="convocatoria-title">
                                    <Video size={20} />
                                    <span>VIDEO ANÁLISIS</span>
                                    {analysis && <span className="status-dot-green" title="Configurado"></span>}
                                </div>
                                <span className={`convocatoria-toggle ${showAnalysis ? 'open' : ''}`}>▾</span>
                            </div>

                            {showAnalysis && (
                                <div className="convocatoria-body">
                                    <div className="details-info-grid">
                                        <div className="info-item full-width">
                                            <label>URL del Video (YouTube)</label>
                                            <input
                                                type="text"
                                                className="squad-select"
                                                placeholder="https://youtube.com/..."
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                            />
                                        </div>
                                        <div className="info-item">
                                            <label>Offset (segundos)</label>
                                            <input
                                                type="number"
                                                className="squad-select"
                                                placeholder="0"
                                                value={videoOffset}
                                                onChange={(e) => setVideoOffset(e.target.value)}
                                            />
                                            <small style={{ color: '#666', fontSize: '10px' }}>
                                                Segundos desde el inicio del video hasta el pitido inicial (00:00).
                                            </small>
                                        </div>
                                        <div className="info-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                className="btn-save-squad"
                                                onClick={handleSaveAnalysis}
                                                disabled={savingAnalysis}
                                                style={{ width: '100%' }}
                                            >
                                                <Save size={16} />
                                                {savingAnalysis ? '...' : 'Guardar Config'}
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={14} /> Resumen del Partido e Informe</label>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => {
                                                            const jsonString = prompt("Pega aquí el JSON de análisis:");
                                                            if (jsonString) {
                                                                const cleanJsonInput = (input) => {
                                                                    if (!input) return "";
                                                                    // 1. Remove Markdown code blocks
                                                                    let cleaned = input.replace(/```json/g, "").replace(/```/g, "");
                                                                    // 2. Remove Citation tags [cite_start], [cite: constants]
                                                                    cleaned = cleaned.replace(/\[cite_start\]/g, "");
                                                                    cleaned = cleaned.replace(/\[cite:[^\]]*\]/g, "");
                                                                    return cleaned.trim();
                                                                };

                                                                try {
                                                                    const cleanedString = cleanJsonInput(jsonString);
                                                                    const jsonData = JSON.parse(cleanedString);
                                                                    setRawJson(jsonData); // Store raw JSON for saving

                                                                    // 1. Generate Text Report
                                                                    import('../services/reportService').then(({ reportService }) => {
                                                                        const markdown = reportService.jsonToMarkdown(jsonData);
                                                                        setAnalystReport(markdown);
                                                                    });

                                                                    // 2. Populate Advanced Stats State (Legacy/Display support)
                                                                    // We still populate these so the UI inputs update immediately
                                                                    if (jsonData.estadisticas) {
                                                                        const stats = jsonData.estadisticas;
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
                                                                        // Set Pieces
                                                                        if (stats.mele) {
                                                                            setScrumsHomeWon(stats.mele.local_ganada || 0);
                                                                            setScrumsHomeLost(stats.mele.local_perdida || 0);
                                                                            setScrumsAwayWon(stats.mele.visitante_ganada || 0);
                                                                            setScrumsAwayLost(stats.mele.visitante_perdida || 0);
                                                                        }
                                                                        if (stats.touch) {
                                                                            setLineoutsHomeWon(stats.touch.local_ganada || 0);
                                                                            setLineoutsHomeLost(stats.touch.local_perdida || 0);
                                                                            setLineoutsAwayWon(stats.touch.visitante_ganada || 0);
                                                                            setLineoutsAwayLost(stats.touch.visitante_perdida || 0);
                                                                        }
                                                                    }

                                                                    alert("✅ Datos importados correctamente al formulario.");
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert("Error: JSON inválido o formato incorrecto.");
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            backgroundColor: '#10B981',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <FileJson size={12} /> Importar JSON
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            import('../services/reportService').then(({ reportService }) => {
                                                                const template = JSON.stringify(reportService.getTemplate(), null, 2);
                                                                navigator.clipboard.writeText(template);
                                                                alert("📋 Plantilla JSON copiada al portapapeles.");
                                                            });
                                                        }}
                                                        style={{
                                                            backgroundColor: '#6B7280',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        📋 Copiar Plantilla
                                                    </button>
                                                </div>
                                            </div>

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
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', fontSize: '11px' }}>
                                                    {timeline.map((item, idx) => (
                                                        <div key={idx} style={{
                                                            padding: '4px 8px',
                                                            borderBottom: '1px solid #f5f5f5',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            backgroundColor: item.videoSeconds < 0 ? '#ffebee' : 'transparent'
                                                        }}>
                                                            <span style={{ fontWeight: 'bold', width: '40px' }}>{item.min}'</span>
                                                            <span style={{ flex: 1, margin: '0 5px' }}>
                                                                <span style={{
                                                                    fontWeight: 'bold',
                                                                    color: item.team_label === 'L' ? '#2e7d32' : '#c62828',
                                                                    marginRight: '4px'
                                                                }}>{item.team_label}</span>
                                                                {item.description} #{item.dorsal}
                                                            </span>
                                                            <a
                                                                href={videoUrl && videoUrl.includes('youtube') ?
                                                                    `${videoUrl.split('&')[0]}&t=${Math.max(0, item.videoSeconds - 10)}` : '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#1976d2', textDecoration: 'none' }}
                                                            >
                                                                {item.videoTime}
                                                            </a>
                                                        </div>
                                                    ))}
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
        </div>
    );
};

export default MatchDetailsModal;
