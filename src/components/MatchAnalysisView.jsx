import React, { useMemo, useState } from 'react';
import VideoAnalysisDashboard from './VideoAnalysisDashboard';
import VideoAnalysisManager from './VideoAnalysisManager';
import PlayerAnalysisManager from './PlayerAnalysisManager';
import './MatchAnalysisView.css';
import {
    TrendingUp,
    Calendar,
    Clock,
    MapPin,
    Trophy,
    AlertTriangle,
    ClipboardList,
    Users as UsersIcon,
    ArrowRightLeft,
    Activity,
    ChevronRight,
    ExternalLink,
    BarChart3,
    Video
} from 'lucide-react';

export const MatchAnalysisView = ({ match, analysis, onMatchClick, MarkdownRenderer, personalStats, user, allPlayers = [] }) => {
    const [activeTab, setActiveTab] = useState('technical'); // 'technical' or 'video'
    const [currentAnalysis, setCurrentAnalysis] = useState(analysis);

    if (!match) return null;

    // Refresh data helper
    const handleSaveSuccess = (newData) => {
        setCurrentAnalysis(newData);
    };

    // Use currentAnalysis instead of analysis prop for internal reactivity
    const activeAnalysis = currentAnalysis || analysis;

    // HELPER: Extract stats with fallback
    const root = activeAnalysis?.raw_json || {};
    const report = root.match_report || (root.match_statistics || root.actions_timeline ? root : null);
    const hasData = !!root && Object.keys(root).length > 0;
    const isNewFormat = !!report;

    // Possession extraction helper
    const parsePossession = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseInt(val.replace('%', ''), 10) || 50;
        return 50;
    };

    // AI Data Priority: If JSON exists, we use it as ONLY source for stats
    const hasAIReport = isNewFormat;
    const reportObj = root.match_report || root;
    const reportStats = reportObj.key_stats || {};
    const statsObj = reportObj.match_statistics || {};
    const legacyStats = root.estadisticas || {};

    // 1. Possession (Paranoid extraction)
    let pHome = 50, pAway = 50;
    const pHomeRaw = statsObj.possession?.local ?? statsObj.possesion?.local ??
        reportStats.possession?.local ?? reportStats.posesion?.local ??
        reportObj.possession?.local ?? reportObj.posesion?.local;
    const pAwayRaw = statsObj.possession?.visitor ?? statsObj.possesion?.visitor ??
        reportStats.possession?.visitor ?? reportStats.posesion?.visitor ??
        reportObj.possession?.visitor ?? reportObj.posesion?.visitor;

    if (pHomeRaw !== undefined || pAwayRaw !== undefined) {
        pHome = parsePossession(pHomeRaw);
        pAway = parsePossession(pAwayRaw);
    } else if (!hasAIReport) {
        pHome = parsePossession(legacyStats.posesion?.local ?? 50);
        pAway = parsePossession(legacyStats.posesion?.visitante ?? 50);
    }

    // 2. Tackles
    let tHomeMade = 0, tAwayMade = 0, tHomeMissed = 0, tAwayMissed = 0;
    const aiTacklesLocal = statsObj.tackles?.total_made?.local ?? reportStats.placajes_exito?.local;
    const aiTacklesVisitor = statsObj.tackles?.total_made?.visitor ?? reportStats.placajes_exito?.visitor;

    if (aiTacklesLocal !== undefined || aiTacklesVisitor !== undefined) {
        tHomeMade = aiTacklesLocal ?? 0;
        tAwayMade = aiTacklesVisitor ?? 0;
        tHomeMissed = statsObj.tackles?.total_missed?.local ?? reportStats.placajes_fallados?.local ?? 0;
        tAwayMissed = statsObj.tackles?.total_missed?.visitor ?? reportStats.placajes_fallados?.visitor ?? 0;
    } else if (!hasAIReport) {
        tHomeMade = legacyStats.placajes_hechos?.local ?? 0;
        tAwayMade = legacyStats.placajes_hechos?.visitante ?? 0;
        tHomeMissed = legacyStats.placajes_fallados?.local ?? 0;
        tAwayMissed = legacyStats.placajes_fallados?.visitante ?? 0;
    }

    const tHomeEff = Math.round((tHomeMade / ((tHomeMade + tHomeMissed) || 1)) * 100);
    const tAwayEff = Math.round((tAwayMade / ((tAwayMade + tAwayMissed) || 1)) * 100);

    // 3. Scrums
    let scHomeW = 0, scHomeL = 0, scAwayW = 0, scAwayL = 0;
    if (reportStats.meles_ganadas || reportStats.meles_perdidas) {
        scHomeW = reportStats.meles_ganadas?.local ?? 0;
        scHomeL = reportStats.meles_perdidas?.local ?? 0;
        scAwayW = reportStats.meles_ganadas?.visitor ?? 0;
        scAwayL = reportStats.meles_perdidas?.visitor ?? 0;
    } else if (!hasAIReport) {
        scHomeW = legacyStats.mele?.local_ganada ?? 0;
        scHomeL = legacyStats.mele?.local_perdida ?? 0;
        scAwayW = legacyStats.mele?.visitante_ganada ?? 0;
        scAwayL = legacyStats.mele?.visitante_perdida ?? 0;
    }

    // 4. Lineouts
    let liHomeW = 0, liHomeL = 0, liAwayW = 0, liAwayL = 0;
    if (reportStats.touches_ganadas || reportStats.touches_perdidas) {
        liHomeW = reportStats.touches_ganadas?.local ?? 0;
        liHomeL = reportStats.touches_perdidas?.local ?? 0;
        liAwayW = reportStats.touches_ganadas?.visitor ?? 0;
        liAwayL = reportStats.touches_perdidas?.visitor ?? 0;
    } else if (!hasAIReport) {
        liHomeW = legacyStats.touch?.local_ganada ?? 0;
        liHomeL = legacyStats.touch?.local_perdida ?? 0;
        liAwayW = legacyStats.touch?.visitante_ganada ?? 0;
        liAwayL = legacyStats.touch?.visitante_perdida ?? 0;
    }

    const TeamLogo = ({ url, name, size = 30 }) => {
        if (!url) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999', overflow: 'hidden' }}>{name?.substring(0, 2)}</div>;
        return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
    };

    // PROCESS TIMELINE: Merge substitutions at the same minute/team
    const processedTimeline = useMemo(() => {
        if (!report?.actions_timeline || !Array.isArray(report.actions_timeline)) return [];

        const merged = [];
        const seenSubs = new Map(); // key: "minute-team" -> existing sub object in merged

        report.actions_timeline.forEach(event => {
            const evType = (event.event_type || '').toLowerCase();
            const evDesc = (event.description || '').toLowerCase();
            const isSub = evType.includes('sub') || evType.includes('sus') || evDesc.includes('sustitu');

            if (!isSub) {
                merged.push({ ...event });
                return;
            }

            // For substitutions, we want to pair them if they are separate entries for the same minute/team
            const key = `${event.minute}-${event.team}`;

            // Extract potentially available names
            const pIn = event.player_in || event.name_in;
            const pOut = event.player_out || event.name_out;
            const pGen = event.player || event.name;

            if (seenSubs.has(key)) {
                const existing = seenSubs.get(key);

                // If the new event has data the existing one lacks, fill it
                if (!existing.player_in && (pIn || (pGen && !evDesc.includes('sale') && !evDesc.includes('por')))) {
                    existing.player_in = pIn || pGen;
                    existing.dorsal_in = event.dorsal_in || event.dorsal || existing.dorsal_in;
                } else if (!existing.player_out && (pOut || (pGen && (evDesc.includes('sale') || evDesc.includes('por'))))) {
                    existing.player_out = pOut || pGen;
                    existing.dorsal_out = event.dorsal_out || event.dorsal || existing.dorsal_out;
                } else if (pIn && pOut) {
                    // It's a second complete substitution in the same minute, don't merge, push as new
                    merged.push({ ...event });
                }
            } else {
                const newEv = { ...event };
                // Ensure player_in/out are initialized if it's a generic 'player' event
                if (!pIn && !pOut && pGen) {
                    if (evDesc.includes('sale') || evDesc.includes('por')) {
                        newEv.player_out = pGen;
                        newEv.dorsal_out = event.dorsal;
                    } else {
                        newEv.player_in = pGen;
                        newEv.dorsal_in = event.dorsal;
                    }
                }
                merged.push(newEv);
                // Only track for merging if it's NOT already complete
                if (!(pIn && pOut)) {
                    seenSubs.set(key, newEv);
                }
            }
        });

        // Final cleanup of names (remove "Entra", "Sale" noise)
        return merged.map(ev => {
            const clean = name => (name || '').replace(/^(entra|sale|in|out|subs|cambio)\s+/i, '').replace(/\s+(entra|sale|in|out|subs|cambio)$/i, '').trim();
            if (ev.player_in) ev.player_in = clean(ev.player_in);
            if (ev.player_out) ev.player_out = clean(ev.player_out);
            return ev;
        });
    }, [report?.actions_timeline]);

    const getPlayerMedia = (playerName, teamType) => {
        const isHospi = (teamType === 'local' && (match.home || "").toUpperCase().includes('HOSPITALET')) ||
            (teamType === 'visitor' && (match.away || "").toUpperCase().includes('HOSPITALET'));

        if (isHospi) {
            const pName = (playerName || "").toLowerCase();
            const found = allPlayers.find(p => {
                const full = `${p.nombre} ${p.apellidos}`.toLowerCase();
                return full.includes(pName) || pName.includes(p.nombre.toLowerCase());
            });
            if (found && found.foto) return found.foto;
            return "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";
        }

        return teamType === 'local' ? match.homeShield : match.awayShield;
    };

    const translateEventType = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('try') || t.includes('ensayo')) return 'ENSAYO';
        if (t.includes('conversion') || t.includes('transform')) return 'TRANSFORMACIÓN';
        if (t.includes('penalty') || t.includes('puntapi')) return 'GOLPE DE CASTIGO';
        if (t.includes('yellow') || t.includes('amarilla')) return 'TARJETA AMARILLA';
        if (t.includes('red') || t.includes('roja')) return 'TARJETA ROJA';
        if (t.includes('substitution') || t.includes('sustituc') || t.includes('cambio') || t.includes('sub')) return 'SUSTITUCIÓN';
        return type?.toUpperCase() || '';
    };

    return (
        <div className="match-analysis-container">
            {/* 1. Scoreboard */}
            <div className="scoreboard-container">
                <div className="scoreboard-team home">
                    <div className="scoreboard-logo-wrapper">
                        <TeamLogo url={match.homeShield} name={match.home} size={64} />
                    </div>
                    <div className="scoreboard-team-name">{match.home}</div>
                </div>

                <div className="scoreboard-center">
                    <div className="scoreboard-box">
                        <div className="score-digit">{match.scoreHome}</div>
                        <div className="score-divider">:</div>
                        <div className="score-digit">{match.scoreAway}</div>
                    </div>
                    <div className="scoreboard-status-badge">FINALIZADO</div>
                    {onMatchClick && (
                        <button
                            onClick={() => onMatchClick(match)}
                            className="scoreboard-view-btn"
                        >
                            FICHA TÉCNICA <ExternalLink size={14} />
                        </button>
                    )}
                </div>

                <div className="scoreboard-team visitor">
                    <div className="scoreboard-logo-wrapper">
                        <TeamLogo url={match.awayShield} name={match.away} size={64} />
                    </div>
                    <div className="scoreboard-team-name">{match.away}</div>
                </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="analysis-tabs">
                <button
                    className={`analysis-tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('technical')}
                >
                    <ClipboardList size={18} /> INFORME TÉCNICO
                </button>
                <button
                    className={`analysis-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveTab('video')}
                >
                    <Video size={18} /> VIDEOANÁLISIS (NAC SPORT)
                    {root.analisis_video_nac_sport && <span className="tab-status-dot" />}
                </button>
                <button
                    className={`analysis-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
                    onClick={() => setActiveTab('players')}
                >
                    <UsersIcon size={18} /> INFORME JUGADORES
                    {(root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla) && <span className="tab-status-dot" style={{ backgroundColor: '#10B981' }} />}
                </button>
            </div>

            {activeTab === 'players' ? (
                <div className="players-report-container" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                    {(() => {
                        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
                        if (!informe || !informe.jugadores) {
                            return (
                                <div className="mt-12 flex flex-col items-center gap-6 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
                                    <div className="text-5xl opacity-20 mb-2">👥</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-700 uppercase tracking-wide mb-2">Sin Informe Individualizado</h3>
                                        <p className="text-slate-500 mb-6">El archivo JSON actual no contiene valoraciones individuales de la plantilla. Sube un archivo JSON de Nac Sport actualizado que contenga el nodo <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">analisis_individual_plantilla</code>.</p>
                                    </div>

                                    <div className="w-full border-t border-slate-100 pt-6">
                                        <PlayerAnalysisManager
                                            matchId={match.partido_id || match.id}
                                            eventId={match.evento_id || match.Evento}
                                            externalId={match.partido_externo_id}
                                            existingData={analysis ? analysis.raw_json : null}
                                            onSaveSuccess={handleSaveSuccess}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div>
                                {/* Contexto del Partido */}
                                {informe.contexto_partido && (
                                    <div className="premium-card p-6 mb-8 text-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem' }}>
                                        <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-2">Contexto de Valoración</p>
                                        <p className="text-slate-700 font-serif italic max-w-3xl mx-auto">"{informe.contexto_partido.merito} {informe.contexto_partido.algoritmo_valoracion}"</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                    {informe.jugadores.map((jugador, idx) => {
                                        const pName = jugador.perfil?.nombre || jugador.nombre;
                                        const pDorsal = jugador.perfil?.dorsal || jugador.dorsal;
                                        const pPos = jugador.perfil?.posicion || jugador.posicion;

                                        // Robust Data Extraction
                                        const nota = jugador.valoracion?.nota ||
                                            jugador.nota_media ||
                                            jugador.perfil?.nota_media ||
                                            jugador.nota;

                                        const rol = jugador.valoracion?.rol || jugador.rol;

                                        const comentario = jugador.comentario ||
                                            jugador.comentarios ||
                                            jugador.analisis ||
                                            jugador.evaluacion ||
                                            jugador.perfil?.comentario ||
                                            jugador.perfil?.analisis ||
                                            jugador.valoracion?.comentario ||
                                            jugador.valoracion?.analisis;

                                        // Find photo with improved matching
                                        let photoUrl = null;
                                        if (allPlayers && allPlayers.length > 0 && pName) {
                                            const normalize = (s) => s?.toLowerCase()
                                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                                                .replace(/[^a-z0-9 ]/g, " ") // replace non-alphanumeric with spaces
                                                .replace(/\s+/g, " ") // collapse multiple spaces
                                                .trim() || "";

                                            const targetName = normalize(pName);
                                            const targetParts = targetName.split(" ").filter(p => p.length > 2); // significative parts (3+ chars)

                                            // Handle "Surname, Name" -> "Name Surname"
                                            let alternativeName = "";
                                            if (pName.includes(",")) {
                                                const parts = pName.split(",").map(p => p.trim());
                                                if (parts.length === 2) {
                                                    alternativeName = normalize(`${parts[1]} ${parts[0]}`);
                                                }
                                            }

                                            // disambiguation strategy
                                            // 1. Try by exact dorsal first (highest priority)
                                            const byDorsal = pDorsal ? allPlayers.find(p => String(p.dorsal) === String(pDorsal) || String(p.numero) === String(pDorsal)) : null;

                                            if (byDorsal && byDorsal.foto) {
                                                photoUrl = byDorsal.foto;
                                            } else {
                                                // 2. Try by name matching with scoring to handle duplicates
                                                const candidates = allPlayers
                                                    .map(p => {
                                                        const dbFirstName = normalize(p.nombre);
                                                        const dbLastName = normalize(p.apellidos);
                                                        const dbFullName = normalize(`${p.nombre} ${p.apellidos}`);

                                                        let score = 0;
                                                        if (dbFullName === targetName || (alternativeName && dbFullName === alternativeName)) {
                                                            score = 100;
                                                        } else if (targetParts.length > 0) {
                                                            const matchCount = targetParts.filter(part =>
                                                                dbFullName.includes(part) || dbFirstName.includes(part) || dbLastName.includes(part)
                                                            ).length;

                                                            if (matchCount >= Math.max(1, Math.floor(targetParts.length * 0.7))) {
                                                                score = (matchCount / targetParts.length) * 80;
                                                            }
                                                        }
                                                        return { ...p, _score: score };
                                                    })
                                                    .filter(p => p._score > 0)
                                                    .sort((a, b) => b._score - a._score);

                                                if (candidates.length > 0 && candidates[0].foto) {
                                                    photoUrl = candidates[0].foto;
                                                }
                                            }
                                        }

                                        return (
                                            <div key={idx} className="insight-premium-card p-6 overflow-hidden flex flex-col h-full relative" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>

                                                {/* Meta Nota Badge */}
                                                {nota && (
                                                    <div className="absolute top-4 right-4 bg-blue-900 text-white font-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white text-lg z-10" style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#1e3a8a', color: 'white', fontWeight: '900', borderRadius: '9999px', width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontSize: '1.125rem' }}>
                                                        {nota}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                    {photoUrl ? (
                                                        <img src={photoUrl} alt={pName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f1f5f9' }} />
                                                    ) : (
                                                        <div className="icon-box-premium" style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {pDorsal ? (
                                                                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#94a3b8' }}>{pDorsal}</span>
                                                            ) : (
                                                                <UsersIcon className="text-slate-400" size={24} color="#94a3b8" />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h4 className="font-black text-slate-800 m-0" style={{ fontSize: '1.1rem', lineHeight: '1.2', margin: 0, fontWeight: '900', color: '#1e293b' }}>{pName}</h4>
                                                        {pPos && <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em', marginTop: '0.25rem' }}>{pPos}</p>}
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    {rol && (
                                                        <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100" style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1" style={{ fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.25rem' }}>Misión / Rol</span>
                                                            <p className="text-[13px] text-slate-700 leading-snug" style={{ fontSize: '13px', color: '#334155', lineHeight: 1.375 }}>{rol}</p>
                                                        </div>
                                                    )}
                                                    {jugador.stats && Object.keys(jugador.stats).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                                            {Object.entries(jugador.stats).map(([k, v], i) => (
                                                                <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 shadow-sm flex items-center gap-1" style={{ padding: '0.25rem 0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '11px', fontWeight: '700', color: '#475569', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                    <span className="text-slate-400 uppercase" style={{ color: '#94a3b8', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}:</span>
                                                                    <span className="text-blue-900" style={{ color: '#1e3a8a' }}>{v}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {comentario && (
                                                        <p className="text-[14px] text-slate-600 font-serif italic mt-auto pt-2 border-t border-slate-100" style={{ fontSize: '14px', color: '#475569', fontFamily: 'serif', fontStyle: 'italic', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', lineHeight: '1.6' }}>"{comentario}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                    }
                                </div>

                                {/* Update Button */}
                                {user?.role !== 'JUGADOR' && (
                                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("¿Deseas actualizar los datos del informe de jugadores?")) {
                                                    // Merge root and internal to ensure we wipe both spots gracefully if they exist
                                                    const cleanRoot = { ...root };
                                                    delete cleanRoot.analisis_individual_plantilla;
                                                    if (cleanRoot.analisis_video_nac_sport) {
                                                        delete cleanRoot.analisis_video_nac_sport.analisis_individual_plantilla;
                                                    }
                                                    setCurrentAnalysis({ ...activeAnalysis, raw_json: cleanRoot });
                                                }
                                            }}
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#64748b',
                                                textDecoration: 'underline',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            Actualizar informe de jugadores
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            ) : activeTab === 'technical' ? (
                <>

                    {/* 2. Alineaciones y Rendimiento Individual */}
                    {isNewFormat && report.rosters_and_stats && (
                        <div className="analysis-section-box full-width-report" style={{ marginBottom: '1.5rem' }}>
                            <h4 className="section-title-flex">
                                <UsersIcon size={18} /> Alineaciones y Rendimiento Individual
                            </h4>
                            <div className="rosters-container" style={{ marginTop: '1rem' }}>
                                {['local', 'visitor'].map(team => (
                                    <div key={team} className="roster-team-section">
                                        <h6 className={`roster-team-name ${team === 'local' ? 'text-blue' : 'text-orange'}`}>
                                            {team === 'local' ? match.home : match.away}
                                        </h6>
                                        <div className="roster-table-wrapper">
                                            <table className="roster-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Jugador</th>
                                                        <th>Pos</th>
                                                        <th>Min</th>
                                                        <th>Pts</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.isArray(report.rosters_and_stats[team]) && report.rosters_and_stats[team]
                                                        .filter(player => (
                                                            (player.minutes_played !== null && player.minutes_played > 0) ||
                                                            player.points > 0 ||
                                                            (player.events && player.events.length > 0)
                                                        ))
                                                        .map((player, idx) => (
                                                            <tr key={idx} className="roster-row-animated">
                                                                <td className="col-dorsal">
                                                                    <span className="dorsal-circle">{player.dorsal}</span>
                                                                </td>
                                                                <td className="col-name">
                                                                    <div className="player-row-main">
                                                                        <img
                                                                            src={getPlayerMedia(player.name, team)}
                                                                            alt=""
                                                                            className="roster-avatar"
                                                                        />
                                                                        <div className="player-name-main">{player.name}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="col-pos">
                                                                    <span className="pos-badge">{player.position}</span>
                                                                </td>
                                                                <td className="col-min">
                                                                    <div className="min-stat">
                                                                        <Clock size={12} /> {player.minutes_played || 0}'
                                                                    </div>
                                                                </td>
                                                                <td className="col-pts">
                                                                    {player.points > 0 ? (
                                                                        <div className="pts-pill">
                                                                            <Trophy size={12} /> <span>{player.points}</span>
                                                                        </div>
                                                                    ) : <span className="text-muted">-</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Personal Stats Card for Players */}
                    {user?.role === 'JUGADOR' && personalStats && (
                        <div className="personal-stats-card" style={{ marginBottom: '1.5rem' }}>
                            <h4 className="personal-stats-title">
                                <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png" alt="Hospi" className="personal-stats-shield" />
                                MIS ESTADÍSTICAS EN EL PARTIDO
                            </h4>

                            <div className="stats-grid-auto">
                                <div className="mini-stat-card">
                                    <span className="mini-stat-label">Minutos</span>
                                    <div className="mini-stat-value stat-value--blue">{personalStats.minutos_jugados || 0}'</div>
                                </div>
                                <div className="mini-stat-card">
                                    <span className="mini-stat-label">Rol</span>
                                    <div className={`mini-stat-value ${personalStats.es_titular ? 'stat-value--green' : ''}`} style={{ fontSize: '1rem' }}>
                                        {personalStats.es_titular ? 'TITULAR' : 'SUPLENTE'}
                                    </div>
                                </div>
                                <div className="mini-stat-card">
                                    <span className="mini-stat-label">Ensayos</span>
                                    <div className="mini-stat-value stat-value--green" style={{ color: '#10B981' }}>{personalStats.ensayos || 0}</div>
                                </div>
                                {(personalStats.transformaciones > 0 || personalStats.penales > 0) && (
                                    <div className="mini-stat-card">
                                        <span className="mini-stat-label">Puntos Pie</span>
                                        <div className="mini-stat-value stat-value--blue">{(personalStats.transformaciones * 2) + (personalStats.penales * 3)}</div>
                                    </div>
                                )}
                                {(personalStats.tarjetas_amarillas > 0 || personalStats.tarjetas_rojas > 0) && (
                                    <div className="mini-stat-card">
                                        <span className="mini-stat-label">Tarjetas</span>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '4px' }}>
                                            {personalStats.tarjetas_amarillas > 0 && Array.from({ length: personalStats.tarjetas_amarillas }).map((_, i) => (
                                                <div key={i} style={{ width: '12px', height: '18px', backgroundColor: '#fbbf24', borderRadius: '2px', border: '1px solid #f59e0b' }} />
                                            ))}
                                            {personalStats.tarjetas_rojas > 0 && Array.from({ length: personalStats.tarjetas_rojas }).map((_, i) => (
                                                <div key={i} style={{ width: '12px', height: '18px', backgroundColor: '#dc3545', borderRadius: '2px', border: '1px solid #991b1b' }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. Estadísticas de Juego (Visual Bars) */}
                    {hasData && (
                        <div className="analysis-section-box full-width-report" style={{ marginBottom: '1.5rem' }}>
                            <h4 className="section-title-flex">
                                <BarChart3 size={18} /> Estadísticas de Juego
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                                {/* Possession Row */}
                                <div className="possession-container">
                                    <h5 className="stats-sub-title">Posesión</h5>
                                    <div className="possession-bar-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{ color: '#003366', fontWeight: '800', fontSize: '1.2rem', minWidth: '45px', textAlign: 'right' }}>{pHome}%</span>
                                        <div style={{ flex: 1, height: '16px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
                                            <div style={{ width: `${pHome}%`, backgroundColor: '#003366', transition: 'width 1s ease' }} />
                                            <div style={{ width: `${pAway}%`, backgroundColor: '#FF6600', transition: 'width 1s ease' }} />
                                        </div>
                                        <span style={{ color: '#FF6600', fontWeight: '800', fontSize: '1.2rem', minWidth: '45px' }}>{pAway}%</span>
                                    </div>
                                </div>

                                {/* Tackles Efficiency */}
                                {(tHomeMade > 0 || tAwayMade > 0) && (
                                    <div className="tackles-comparison">
                                        <h5 className="stats-sub-title">Eficacia Placajes</h5>
                                        <div className="tackle-stats-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                                            <div className="tackle-team-box" style={{ textAlign: 'center' }}>
                                                <div style={{ color: '#003366', fontSize: '1.5rem', fontWeight: '800' }}>{tHomeEff}%</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{tHomeMade}/{tHomeMade + tHomeMissed}</div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>VS</div>
                                            <div className="tackle-team-box" style={{ textAlign: 'center' }}>
                                                <div style={{ color: '#FF6600', fontSize: '1.5rem', fontWeight: '800' }}>{tAwayEff}%</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{tAwayMade}/{tAwayMade + tAwayMissed}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Set Pieces Row (Compact) */}
                            {(scHomeW > 0 || scAwayW > 0 || liHomeW > 0 || liAwayW > 0) && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                                    {(scHomeW > 0 || scAwayW > 0) && (
                                        <div className="set-piece-box">
                                            <h5 className="stats-sub-title">Melés (Ganadas/Total)</h5>
                                            <div className="set-piece-row">
                                                <div className="sp-team">
                                                    <span className="sp-label">{match.home}</span>
                                                    <div className="sp-bar-container"><div className="sp-bar-fill" style={{ width: `${(scHomeW / Math.max(1, scHomeW + scHomeL)) * 100}%`, backgroundColor: '#003366' }} /></div>
                                                    <span className="sp-value">{scHomeW}/{scHomeW + scHomeL}</span>
                                                </div>
                                                <div className="sp-team">
                                                    <span className="sp-label">{match.away}</span>
                                                    <div className="sp-bar-container"><div className="sp-bar-fill" style={{ width: `${(scAwayW / Math.max(1, scAwayW + scAwayL)) * 100}%`, backgroundColor: '#FF6600' }} /></div>
                                                    <span className="sp-value">{scAwayW}/{scAwayW + scAwayL}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {(liHomeW > 0 || liAwayW > 0) && (
                                        <div className="set-piece-box">
                                            <h5 className="stats-sub-title">Touches (Ganadas/Total)</h5>
                                            <div className="set-piece-row">
                                                <div className="sp-team">
                                                    <span className="sp-label">{match.home}</span>
                                                    <div className="sp-bar-container"><div className="sp-bar-fill" style={{ width: `${(liHomeW / Math.max(1, liHomeW + liHomeL)) * 100}%`, backgroundColor: '#003366' }} /></div>
                                                    <span className="sp-value">{liHomeW}/{liHomeW + liHomeL}</span>
                                                </div>
                                                <div className="sp-team">
                                                    <span className="sp-label">{match.away}</span>
                                                    <div className="sp-bar-container"><div className="sp-bar-fill" style={{ width: `${(liAwayW / Math.max(1, liAwayW + liAwayL)) * 100}%`, backgroundColor: '#FF6600' }} /></div>
                                                    <span className="sp-value">{liAwayW}/{liAwayW + liAwayL}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. Detailed Report Section */}
                    <div className="analysis-section-box full-width-report">
                        <h4 className="section-title-flex">
                            <ClipboardList size={18} /> Informe Detallado del Analista
                        </h4>

                        {isNewFormat ? (
                            <div className="new-report-layout">
                                {/* 1. Executive Summary & Quick Highlights */}
                                {((Array.isArray(report.executive_summary) && report.executive_summary.length > 0) || (root.report)) && (
                                    <div className="summary-cards-container">
                                        {Array.isArray(report.executive_summary) && report.executive_summary.map((text, idx) => (
                                            <div key={idx} className="executive-bullet-card">
                                                <div className="bullet-v-line" />
                                                <p>{text}</p>
                                            </div>
                                        ))}
                                        {root.report && (
                                            <div className="full-markdown-narrative" style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #eee' }}>
                                                <h5 className="subsection-title" style={{ marginBottom: '1rem' }}><ClipboardList size={16} /> Crónica Detallada</h5>
                                                <MarkdownRenderer content={root.report} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 2. Match Flow Narrative */}
                                {Array.isArray(report.match_flow) && report.match_flow.length > 0 && (
                                    <div className="detail-subsection">
                                        <h5 className="subsection-title"><TrendingUp size={16} /> Flujo del Partido</h5>
                                        <div className="timeline-vertical">
                                            {report.match_flow.map((item, idx) => (
                                                <div key={idx} className="timeline-item">
                                                    <div className="timeline-marker">
                                                        <span className="time-badge">{item.time_range}'</span>
                                                    </div>
                                                    <div className="timeline-content">
                                                        {item.description}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Two-Column Mid Section (Subs & Cards) */}
                                <div className="report-grid-two-cols">
                                    {report.substitutes_impact && (
                                        <div className="detail-subsection">
                                            <h5 className="subsection-title"><UsersIcon size={16} /> Impacto del Banquillo</h5>
                                            <div className="subs-impact-container">
                                                {['local', 'visitor'].map(tKey => {
                                                    const impact = report.substitutes_impact[tKey];
                                                    if (!impact) return null;
                                                    return (
                                                        <div key={tKey} className="subs-team-impact">
                                                            <div className={`subs-team-header ${tKey}-header`}>
                                                                {tKey === 'local' ? match.home : match.away}
                                                            </div>
                                                            <div className="subs-impact-body">
                                                                <p>{impact.impact_summary}</p>
                                                                {impact.key_player && (
                                                                    <div className="key-sub-player">
                                                                        <span className="key-sub-label">Clave:</span> {impact.key_player.name} (#{impact.key_player.dorsal})
                                                                        {impact.key_player.notes && <div className="key-sub-notes">{impact.key_player.notes}</div>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {report.cards_and_superiority && (
                                        <div className="detail-subsection">
                                            <h5 className="subsection-title"><AlertTriangle size={16} /> Disciplina</h5>
                                            <div className="cards-impact-container">
                                                {Array.isArray(report.cards_and_superiority.events) && report.cards_and_superiority.events.map((event, idx) => (
                                                    <div key={idx} className="card-event-box">
                                                        <div className="card-event-header">
                                                            <div className={`card-v-marker ${event.card_type?.toLowerCase().includes('amarilla') ? 'bg-yellow' : 'bg-red'}`} />
                                                            <span className="card-min">Min {event.minute}</span>
                                                            <span className="card-team">{event.team === 'local' ? match.home : match.away}</span>
                                                        </div>
                                                        <div className="card-event-body">
                                                            <div className="card-reason">"{event.reason}"</div>
                                                            {event.conclusion && <div className="card-conclusion">{event.conclusion}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {report.cards_and_superiority.technical_interpretation && (
                                                    <div className="technical-note">
                                                        <strong>Análisis:</strong> {report.cards_and_superiority.technical_interpretation}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Set Pieces Analysis */}
                                {report.set_pieces && (
                                    <div className="detail-subsection">
                                        <h5 className="subsection-title"><ArrowRightLeft size={16} /> Análisis de Fases Estáticas</h5>
                                        <div className="set-pieces-grid">
                                            {report.set_pieces.mele && (
                                                <div className="set-piece-text-card">
                                                    <h6>Melés</h6>
                                                    <p>{report.set_pieces.mele}</p>
                                                </div>
                                            )}
                                            {report.set_pieces.touch && (
                                                <div className="set-piece-text-card">
                                                    <h6>Touches</h6>
                                                    <p>{report.set_pieces.touch}</p>
                                                </div>
                                            )}
                                            {report.set_pieces.rucks && (
                                                <div className="set-piece-text-card">
                                                    <h6>Rucks / Puntos de Encuentro</h6>
                                                    <p>{report.set_pieces.rucks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 5. Key Metrics Table */}
                                {Object.keys(reportStats).length > 0 && (
                                    <div className="detail-subsection">
                                        <h5 className="subsection-title"><TrendingUp size={16} /> Otras Métricas de Rendimiento</h5>
                                        <div className="other-stats-grid">
                                            {Object.keys(reportStats).map(key => {
                                                if (['posesion', 'possession', 'placajes_exito', 'placajes_fallados', 'meles_ganadas', 'meles_perdidas', 'touches_ganadas', 'touches_perdidas'].includes(key)) return null;
                                                const stat = reportStats[key];
                                                if (!stat || (stat.local === undefined && stat.visitor === undefined)) return null;
                                                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                return (
                                                    <div key={key} className="other-stat-item">
                                                        <span className="other-stat-label">{label}</span>
                                                        <div className="other-stat-values">
                                                            <span className="other-stat-val home">{stat.local ?? 0}</span>
                                                            <span className="other-stat-div">-</span>
                                                            <span className="other-stat-val visitor">{stat.visitor ?? 0}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 6. Recommendations */}
                                {Array.isArray(report.recommendations_for_staff) && report.recommendations_for_staff.length > 0 && (
                                    <div className="detail-subsection">
                                        <h5 className="subsection-title"><ClipboardList size={16} /> Recomendaciones Staff</h5>
                                        <div className="recommendations-list">
                                            {report.recommendations_for_staff.map((rec, idx) => (
                                                <div key={idx} className="rec-item">
                                                    <div className="rec-icon">🎯</div>
                                                    <div className="rec-text">{rec}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 7. Detailed Actions Timeline */}
                                {processedTimeline.length > 0 && (
                                    <div className="detail-subsection">
                                        <h5 className="subsection-title" style={{ fontSize: '0.9rem' }}><Activity size={14} /> Cronología de Acciones</h5>
                                        <div className="actions-timeline-grid">
                                            {processedTimeline.map((event, idx) => {
                                                const isLocal = event.team === 'local';

                                                const getEmoji = (type) => {
                                                    const t = type?.toLowerCase() || '';
                                                    if (t.includes('try') || t.includes('ensayo')) return '🏉';
                                                    if (t.includes('conversion') || t.includes('transform')) return '🎯';
                                                    if (t.includes('penalty') || t.includes('puntapi')) return '👟';
                                                    if (t.includes('yellow') || t.includes('amarilla')) return '🟨';
                                                    if (t.includes('red') || t.includes('roja')) return '🟥';
                                                    if (t.includes('sub')) return '🔄';
                                                    return '•';
                                                };

                                                const evType = (event.event_type || '').toLowerCase();
                                                const evDesc = (event.description || '').toLowerCase();
                                                const isSubstitution = evType.includes('sub') || evType.includes('sus') || evDesc.includes('sustitu');

                                                return (
                                                    <div key={idx} className={`action-event-row ${isLocal ? 'action-local' : 'action-visitor'}`}>
                                                        <div className="action-time">{event.minute}'</div>
                                                        <div className="action-type-icon" style={{ fontSize: '1rem', width: '24px', height: '24px' }}>
                                                            {getEmoji(event.event_type || (isSubstitution ? 'sub' : ''))}
                                                        </div>
                                                        <div className="action-details" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span className="action-player">
                                                                {isSubstitution ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <div className="timeline-multi-avatars">
                                                                            <img
                                                                                src={getPlayerMedia(event.player_in || event.name_in || event.player || event.name, event.team)}
                                                                                alt=""
                                                                                className="roster-avatar roster-avatar--tiny"
                                                                            />
                                                                            <img
                                                                                src={getPlayerMedia(event.player_out || event.name_out, event.team)}
                                                                                alt=""
                                                                                className="roster-avatar roster-avatar--tiny"
                                                                            />
                                                                        </div>
                                                                        <span className="text-green" style={{ fontSize: '0.8rem' }}>⬆️</span>
                                                                        <strong>{event.player_in || event.name_in || event.player || event.name || 'Jugador'}</strong>
                                                                        {(event.dorsal_in || event.dorsal) && <span className="text-muted" style={{ fontSize: '0.7rem' }}>(#{event.dorsal_in || event.dorsal})</span>}
                                                                        <span className="text-muted" style={{ margin: '0 2px', fontSize: '0.75rem' }}>por</span>
                                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>⬇️</span>
                                                                        <span style={{ color: '#64748b' }}>{event.player_out || event.name_out || 'Jugador'}</span>
                                                                        {(event.dorsal_out) && <span className="text-muted" style={{ fontSize: '0.7rem' }}>(#{event.dorsal_out})</span>}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <img
                                                                            src={getPlayerMedia(event.player || event.name, event.team)}
                                                                            alt=""
                                                                            className="roster-avatar roster-avatar--tiny"
                                                                        />
                                                                        <strong>{event.player || event.name || 'Equipo'}</strong>
                                                                        {event.dorsal && <span className="text-muted" style={{ marginLeft: '4px', fontSize: '0.75rem' }}>(#{event.dorsal})</span>}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="action-desc" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ color: '#94a3b8' }}>•</span>
                                                                <span style={{ textTransform: 'uppercase', color: '#64748b' }}>{translateEventType(event.event_type || (isSubstitution ? 'sub' : ''))}</span>
                                                                {event.points > 0 && <span className="text-green" style={{ fontWeight: '800' }}>+{event.points}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="report-content-body">
                                {root.report ? (
                                    <MarkdownRenderer content={root.report} />
                                ) : (
                                    <div className="empty-state-container">
                                        <p style={{ color: '#999', fontStyle: 'italic' }}>No hay informe detallado disponible.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="video-analysis-tab-content">
                    {root.analisis_video_nac_sport ? (
                        <VideoAnalysisDashboard data={root} match={match} allPlayers={allPlayers} />
                    ) : (
                        user?.role !== 'JUGADOR' ? (
                            <VideoAnalysisManager
                                matchId={match.partido_id || match.id}
                                eventId={match.evento_id || match.Evento}
                                externalId={match.partido_externo_id}
                                existingData={root}
                                onSaveSuccess={handleSaveSuccess}
                            />
                        ) : (
                            <div className="empty-state-container">
                                <Video size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>El análisis de vídeo de Nac Sport aún no está disponible para este partido.</p>
                            </div>
                        )
                    )}

                    {/* Add switch back button for convenience if data present */}
                    {root.analisis_video_nac_sport && user?.role !== 'JUGADOR' && (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Deseas actualizar los datos del videoanálisis?")) {
                                        // We temporarily clear the specific key to show the manager
                                        const cleanRoot = { ...root };
                                        delete cleanRoot.analisis_video_nac_sport;
                                        setCurrentAnalysis({ ...activeAnalysis, raw_json: cleanRoot });
                                    }
                                }}
                                style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Actualizar datos de videoanálisis
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
