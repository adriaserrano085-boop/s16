import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiGet, apiDelete, apiPut } from '../lib/apiClient';
import { playerStats as mockPlayerStats, leagueStats as mockLeagueStats } from '../lib/mockData';
import { ArrowLeft, Users, Trophy, Activity, Calendar, Shield, Trash2, Clock, ClipboardList, Swords, ArrowRightLeft, Target } from 'lucide-react';
import { leagueService } from '../services/leagueService';
import { analysisService } from '../services/analysisService';
import playerService from '../services/playerService';

import ActaUploader from '../components/ActaUploader';
import MatchDetailsModal from '../components/MatchDetailsModal';
import { MatchAnalysisView } from '../components/MatchAnalysisView';
import { TeamEvolutionAnalysis } from '../components/TeamEvolutionAnalysis';
import { HospitaletAnalysis } from '../components/HospitaletAnalysis';
import RivalAnalysis from '../components/RivalAnalysis';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { SeasonStatsPanel } from '../components/SeasonStatsPanel';
import { PlayerStatsTab } from '../components/PlayerStatsTab';
import TeamPlayerStatsTable from '../components/TeamPlayerStatsTable';
import PlayerMatchHistory from '../components/PlayerMatchHistory';
import './StatsPage.css';

const TeamLogo = ({ url, name, size = 30 }) => {
    if (!url) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999', overflow: 'hidden' }}>{name?.substring(0, 2)}</div>;
    return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
};

const StatsPage = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('clasificacion');
    const [selectedRival, setSelectedRival] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [loading, setLoading] = useState(true);
    const [leagueStats, setLeagueStats] = useState([]);
    const [matchResults, setMatchResults] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [rivalsList, setRivalsList] = useState([]);
    const [showUploader, setShowUploader] = useState(false);
    const [selectedJornada, setSelectedJornada] = useState(null);
    const [rivalDetailTab, setRivalDetailTab] = useState('partidos');
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedRivalMatch, setSelectedRivalMatch] = useState(null);
    const [rivalMatchAnalysis, setRivalMatchAnalysis] = useState(null);
    const [hospitaletDetailTab, setHospitaletDetailTab] = useState('partidos');
    const [selectedHospitaletMatch, setSelectedHospitaletMatch] = useState(null);
    const [hospitaletMatchAnalysis, setHospitaletMatchAnalysis] = useState(null);
    const [allAnalyses, setAllAnalyses] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedPlayerForHistory, setSelectedPlayerForHistory] = useState(null);
    const HOSPITALET_NAME = "RC L'HOSPITALET";
    const normalizeTeamName = (name) => {
        if (!name) return "";
        const n = name.toUpperCase().trim();
        if (n.includes("HOSPITALET") || n.includes("HOSPI")) return HOSPITALET_NAME;
        return name.trim();
    };

    const normalizePlayerName = (s) => s?.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9 ]/g, " ") // replace non-alphanumeric with spaces
        .replace(/\s+/g, " ") // collapse multiple spaces
        .trim() || "";

    const findAggregatedPlayer = (aggregated, searchName, dorsal) => {
        if (!searchName) return null;
        const sName = normalizePlayerName(searchName);
        const sParts = sName.split(" ").filter(p => p.length > 2);

        // Try exact match or reverse name match ("Surname, Name")
        for (const key in aggregated) {
            const p = aggregated[key];
            const pName = normalizePlayerName(p.name);
            if (pName === sName) return p;

            if (searchName.includes(",")) {
                const parts = searchName.split(",").map(p => p.trim());
                if (parts.length === 2) {
                    const alt = normalizePlayerName(`${parts[1]} ${parts[0]}`);
                    if (pName === alt) return p;
                }
            }
        }

        // Try fuzzy match
        for (const key in aggregated) {
            const p = aggregated[key];
            const pName = normalizePlayerName(p.name);
            const matchCount = sParts.filter(part => pName.includes(part)).length;
            if (matchCount >= Math.max(1, Math.floor(sParts.length * 0.7))) {
                return p;
            }
        }
        return null;
    };



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const resultsData = await Promise.all([
                apiGet('/rivales').catch(() => []),
                apiGet('/estadisticas_partido').catch(() => []),
                apiGet('/partidos').catch(() => []),
                apiGet('/partidos_externos').catch(() => []),
                apiGet('/estadisticas_jugador?limit=5000').catch(() => []),
                analysisService.getAll().catch(() => [])
            ]);

            const [rivalsData, statsData, matchesData, matchesExternosData, rawStats, analysesData] = resultsData;

            if (analysesData) setAllAnalyses(analysesData);

            const teamShields = {};
            teamShields[HOSPITALET_NAME] = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";

            const rivalsMap = {};
            rivalsData.forEach(r => {
                rivalsMap[r.id_equipo || r.id] = r;
                if (r.escudo) teamShields[r.nombre_equipo] = r.escudo;
            });

            const matchesMap = {};
            matchesData.forEach(m => {
                matchesMap[m.id] = m;
            });

            const matchesExternosMap = {};
            matchesExternosData.forEach(m => {
                matchesExternosMap[m.id] = m;
            });

            const standings = await leagueService.getStandings();
            setLeagueStats(standings);

            const results = [];
            const rivalsSet = new Set();

            if (statsData) {
                statsData.forEach(stat => {
                    let homeName = "Desconocido Local";
                    let awayName = "Desconocido Visitante";
                    let date = stat.fecha;
                    let jornada = stat.jornada;

                    // Manual Join for stat.partido
                    if (stat.partido) {
                        const p = matchesMap[stat.partido];
                        if (p) {
                            const rival = rivalsMap[p.Rival]?.nombre_equipo || p.Rival || "Rival";
                            if (p.es_local) {
                                homeName = HOSPITALET_NAME;
                                awayName = rival;
                            } else {
                                homeName = rival;
                                awayName = HOSPITALET_NAME;
                            }
                            rivalsSet.add(rival);
                        }
                    } else if (stat.partido_externo) {
                        const pe = matchesExternosMap[stat.partido_externo];
                        if (pe) {
                            homeName = normalizeTeamName(pe.equipo_local);
                            awayName = normalizeTeamName(pe.equipo_visitante);
                            rivalsSet.add(homeName);
                            rivalsSet.add(awayName);
                        }
                    }

                    results.push({
                        id: stat.id,
                        partido_id: stat.partido,
                        partido_externo_id: stat.partido_externo,
                        evento_id: matchesMap[stat.partido]?.Evento,
                        home: homeName,
                        away: awayName,
                        scoreHome: stat.marcador_local,
                        scoreAway: stat.marcador_visitante,
                        ensayosHome: stat.ensayos_local || 0,
                        ensayosAway: stat.ensayos_visitante || 0,
                        date: date,
                        jornadaOriginal: jornada,
                        homeShield: teamShields[homeName],
                        awayShield: teamShields[awayName],
                        // Advanced metrics for charts/evolution
                        posesion_local: stat.posesion_local,
                        posesion_visitante: stat.posesion_visitante,
                        placajes_hechos_local: stat.placajes_hechos_local,
                        placajes_hechos_visitante: stat.placajes_hechos_visitante,
                        placajes_fallados_local: stat.placajes_fallados_local,
                        placajes_fallados_visitante: stat.placajes_fallados_visitante,
                        mele_ganada_local: stat.mele_ganada_local,
                        mele_ganada_visitante: stat.mele_ganada_visitante,
                        mele_perdida_local: stat.mele_perdida_local,
                        mele_perdida_visitante: stat.mele_perdida_visitante,
                        touch_ganada_local: stat.touch_ganada_local,
                        touch_ganada_visitante: stat.touch_ganada_visitante,
                        touch_perdida_local: stat.touch_perdida_local,
                        touch_perdida_visitante: stat.touch_perdida_visitante
                    });
                });

                // Helper to get Sunday of the week for grouping matches
                const getSundayForDate = (dateString) => {
                    if (!dateString) return null;
                    const d = new Date(dateString);
                    if (isNaN(d.getTime())) return null;
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
                    return new Date(d.getFullYear(), d.getMonth(), diff);
                };

                // Assign a Sunday Date to each match
                results.forEach(res => {
                    res.sundayDate = getSundayForDate(res.date);
                });

                // Extract all valid, unique Sunday times to sort them chronologically
                const validSundays = results.map(r => r.sundayDate?.getTime()).filter(t => t);
                const uniqueSundayTimes = [...new Set(validSundays)].sort((a, b) => a - b);

                // Re-assign a computed Jornada based on the chronological order of weekends
                results.forEach(res => {
                    if (res.sundayDate) {
                        const index = uniqueSundayTimes.indexOf(res.sundayDate.getTime());
                        res.jornadaCalculated = `Jornada ${index + 1}`;
                    } else {
                        res.jornadaCalculated = res.jornadaOriginal || "S/J";
                    }
                });

                // Group by the computed Jornada
                const grouped = {};
                results.forEach(res => {
                    const j = res.jornadaCalculated;
                    if (!grouped[j]) grouped[j] = { jornada: j, matches: [] };
                    grouped[j].matches.push(res);
                });

                // Sort the groups. Since keys are "Jornada 1", "Jornada 2", extract number for sorting
                const sortedResults = Object.values(grouped).sort((a, b) => {
                    const numA = parseInt(a.jornada.replace(/\D/g, '')) || 999;
                    const numB = parseInt(b.jornada.replace(/\D/g, '')) || 999;
                    return numA - numB;
                });

                setMatchResults(sortedResults);
                if (!selectedJornada && sortedResults.length > 0) {
                    setSelectedJornada(sortedResults[sortedResults.length - 1].jornada);
                }

                setRivalsList(Array.from(rivalsSet).filter(r => normalizeTeamName(r) !== HOSPITALET_NAME).sort());

                // Aggregated stats for players
                const aggregated = {};
                rawStats.forEach(stat => {
                    const key = stat.licencia || stat.jugador || (stat.nombre + '-' + stat.equipo);
                    if (!aggregated[key]) {
                        aggregated[key] = {
                            player_id: stat.jugador,
                            licencia: stat.licencia,
                            name: stat.nombre,
                            team: normalizeTeamName(stat.equipo),
                            titular: 0, jugados: 0, minutos: 0,
                            ensayos: 0, conversiones: 0, golpes: 0, drops: 0, amarillas: 0, rojas: 0,
                            tackles_made: 0, tackles_missed: 0,
                            total_nota: 0, count_nota: 0,
                            matchHistory: []
                        };
                    }
                    const p = aggregated[key];
                    p.jugados += ((stat.minutos_jugados || 0) > 0 || stat.es_titular ? 1 : 0);
                    if (stat.es_titular) p.titular += 1;
                    p.ensayos += (stat.ensayos || 0);
                    p.conversiones += (stat.transformaciones || 0);
                    p.golpes += (stat.penales || 0);
                    p.drops += (stat.drops || 0);
                    p.amarillas += (stat.tarjetas_amarillas || 0);
                    p.rojas += (stat.tarjetas_rojas || 0);
                    p.minutos += (stat.minutos_jugados || 0);
                    p.puntos = (p.ensayos * 5) + (p.conversiones * 2) + (p.golpes * 3) + (p.drops * 3);

                    // Add to match history
                    const matchInfo = results.find(r => r.partido_id === stat.partido || r.partido_externo_id === stat.partido_externo);
                    p.matchHistory.push({
                        id: stat.id,
                        partido: stat.partido || stat.partido_externo,
                        opponent: p.team === HOSPITALET_NAME ? (matchInfo?.home === HOSPITALET_NAME ? matchInfo?.away : matchInfo?.home) : HOSPITALET_NAME,
                        is_home: matchInfo?.home === p.team,
                        score: `${matchInfo?.scoreHome || 0} - ${matchInfo?.scoreAway || 0}`,
                        date: stat.fecha,
                        minutos: stat.minutos_jugados || 0,
                        ensayos: stat.ensayos || 0,
                        conversiones: stat.transformaciones || 0,
                        golpes: stat.penales || 0,
                        drops: stat.drops || 0,
                        amarillas: stat.tarjetas_amarillas || 0,
                        rojas: stat.tarjetas_rojas || 0,
                        puntos: (stat.ensayos || 0) * 5 + (stat.transformaciones || 0) * 2 + (stat.penales || 0) * 3 + (stat.drops || 0) * 3,
                        nota: null,
                        tackles_made: 0,
                        tackles_missed: 0
                    });
                });

                // Merge advanced stats from all analyses
                if (Array.isArray(analysesData)) {
                    analysesData.forEach(analysis => {
                        const root = analysis.raw_json || {};

                        // A. Extract Ratings (Notas)
                        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
                        if (informe && Array.isArray(informe.jugadores)) {
                            informe.jugadores.forEach(j => {
                                const pName = j.nombre || j.perfil?.nombre;
                                if (!pName) return;
                                const match = findAggregatedPlayer(aggregated, pName, j.dorsal);
                                if (match) {
                                    const nota = j.nota || j.valoracion?.nota || j.nota_media;
                                    if (typeof nota === 'number' && nota > 0) {
                                        match.total_nota += nota;
                                        match.count_nota += 1;

                                        // Apply to match history
                                        const matchRecord = match.matchHistory?.find(mh => mh.partido === (analysis.partido_id || analysis.partido || analysis.evento_id || analysis.partido_externo_id));
                                        if (matchRecord) matchRecord.nota = nota;
                                    }
                                }
                            });
                        }

                        // B. Extract Defensive Stats (Tackles)
                        const nac = root.analisis_video_nac_sport || {};
                        const def = nac.rendimiento_individual_defensivo;
                        if (def) {
                            const processTacklers = (list) => {
                                if (!Array.isArray(list)) return;
                                list.forEach(t => {
                                    const match = findAggregatedPlayer(aggregated, t.nombre, t.dorsal);
                                    if (match) {
                                        const made = (t.placajes_ganados || 0);
                                        const missed = (t.placajes_perdidos || 0);
                                        match.tackles_made += made;
                                        match.tackles_missed += missed;

                                        // Apply to match history
                                        const matchRecord = match.matchHistory?.find(mh => mh.partido === (analysis.partido_id || analysis.partido || analysis.evento_id || analysis.partido_externo_id));
                                        if (matchRecord) {
                                            matchRecord.tackles_made += made;
                                            matchRecord.tackles_missed += missed;
                                        }
                                    }
                                });
                            };
                            processTacklers(def.top_tacklers_los_muros);
                            processTacklers(def.alertas_rendimiento_focos_de_rotura);
                        }
                    });
                }

                // Final calculation of averages
                Object.values(aggregated).forEach(p => {
                    p.nota_media = p.count_nota > 0 ? (p.total_nota / p.count_nota).toFixed(1) : null;
                    const totalTackles = p.tackles_made + p.tackles_missed;
                    p.eficacia_placaje = totalTackles > 0 ? Math.round((p.tackles_made / totalTackles) * 100) : null;
                });

                setPlayerStats(Object.values(aggregated));
            }

            // Fetch all own players for photos
            try {
                const playersData = await playerService.getAll();
                if (playersData) setAllPlayers(playersData);
            } catch (err) {
                console.error("Error fetching all players for roster photos:", err);
            }

        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (match) => {
        if (!match.partido_id && !match.partido_externo_id) return alert("ID no encontrado.");
        if (!window.confirm("¿Borrar partido y todas sus estadísticas?")) return;

        try {
            setLoading(true);
            const match_id = match.partido_externo_id || match.partido_id;
            const match_type = match.partido_externo_id ? 'external' : 'standard';

            await apiPost('/borrar_datos_partido', {
                match_id: match_id,
                type: match_type
            });

            await fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al borrar los datos del partido");
        } finally {
            setLoading(false);
        }
    };

    const sortedLeagueStats = useMemo(() => {
        if (!Array.isArray(leagueStats)) return [];
        if (!sortConfig.key) return leagueStats;
        return [...leagueStats].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [leagueStats, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>⇅</span>;
        return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '5px' }}>↑</span> : <span style={{ marginLeft: '5px' }}>↓</span>;
    };

    useEffect(() => {
        if (selectedRival && rivalDetailTab === 'partidos') {
            const rivalMatches = matchResults.flatMap(g => g.matches)
                .filter(m => m.home === selectedRival || m.away === selectedRival)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            if (rivalMatches.length > 0 && !selectedRivalMatch) setSelectedRivalMatch(rivalMatches[0]);
        }
    }, [selectedRival, rivalDetailTab, matchResults]);

    useEffect(() => {
        const loadRivalAnalysis = async () => {
            if (!selectedRivalMatch) { setRivalMatchAnalysis(null); return; }
            try {
                let data = null;
                if (selectedRivalMatch.partido_externo_id) data = await analysisService.getByExternalMatchId(selectedRivalMatch.partido_externo_id);
                else if (selectedRivalMatch.evento_id) data = await analysisService.getByEventId(selectedRivalMatch.evento_id);
                setRivalMatchAnalysis(data);
            } catch (err) { setRivalMatchAnalysis(null); }
        };
        loadRivalAnalysis();
    }, [selectedRivalMatch]);

    useEffect(() => {
        if (location.state?.targetMatchId && matchResults.length > 0) {
            const m = matchResults.flatMap(g => g.matches).find(m => m.partido_id === location.state.targetMatchId || m.partido_externo_id === location.state.targetMatchId);
            if (m) { setActiveTab('hospitalet'); setHospitaletDetailTab('partidos'); setSelectedHospitaletMatch(m); }
        } else if (activeTab === 'hospitalet' && hospitaletDetailTab === 'partidos') {
            const hospiMatches = matchResults.flatMap(g => g.matches).filter(m => normalizeTeamName(m.home) === HOSPITALET_NAME || normalizeTeamName(m.away) === HOSPITALET_NAME).sort((a, b) => new Date(b.date) - new Date(a.date));
            if (hospiMatches.length > 0 && !selectedHospitaletMatch) setSelectedHospitaletMatch(hospiMatches[0]);
        }
    }, [activeTab, hospitaletDetailTab, matchResults, location.state]);

    useEffect(() => {
        const loadHospiAnalysis = async () => {
            if (!selectedHospitaletMatch) { setHospitaletMatchAnalysis(null); return; }
            try {
                let data = null;
                if (selectedHospitaletMatch.partido_externo_id) data = await analysisService.getByExternalMatchId(selectedHospitaletMatch.partido_externo_id);
                else if (selectedHospitaletMatch.evento_id) data = await analysisService.getByEventId(selectedHospitaletMatch.evento_id);
                setHospitaletMatchAnalysis(data);
            } catch (err) { setHospitaletMatchAnalysis(null); }
        };
        loadHospiAnalysis();
    }, [selectedHospitaletMatch]);

    const handleMatchClick = (match) => {
        setSelectedMatch({
            id: match.id,
            start: match.date,
            extendedProps: {
                match_id: match.partido_id,
                partido_externo_id: match.partido_externo_id,
                evento_id: match.evento_id,
                homeTeamName: match.home,
                awayTeamName: match.away,
                homeTeamShield: match.homeShield,
                awayTeamShield: match.awayShield,
                homeScore: match.scoreHome,
                awayScore: match.scoreAway,
                isFinished: true,
                league: 'Liga'
            }
        });
    };

    return (
        <div className="stats-page-wrapper">
            <div className="stats-page-container">
                <header className="stats-header">
                    <div className="header-title-box">
                        <button onClick={() => navigate('/dashboard')} className="back-btn"><ArrowLeft size={24} /></button>
                        <div className="flex-items-center gap-1">
                            <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png" alt="" className="header-logo" />
                            <h1 className="header-text">ESTADISTICAS</h1>
                        </div>
                    </div>
                    {user?.role !== 'JUGADOR' && (
                        <button onClick={() => setShowUploader(!showUploader)} className="btn-uploader-toggle"><Activity size={18} /> Subir Acta</button>
                    )}
                </header>

                {showUploader && (
                    <div className="uploader-overlay">
                        <div className="uploader-modal">
                            <ActaUploader onClose={() => { setShowUploader(false); fetchData(); }} />
                        </div>
                    </div>
                )}



                <div className="stats-tabs">
                    {[
                        { id: 'clasificacion', label: 'Clasificación', url: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Clasificacion.png' },
                        { id: 'rivales', label: 'Rivales', url: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Rivales.png' },
                        { id: 'hospitalet', label: 'RC HOSPITALET', url: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png' },
                        { id: 'jugadores', label: 'Jugadores', url: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Plantilla.png' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'tab-btn--active' : ''}`}>
                            <img src={t.url} alt="" className="tab-icon-small" /> {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-container">Cargando estadísticas...</div>
                ) : (
                    <div className="stats-content-area">
                        {activeTab === 'clasificacion' && (
                            <div className="flex-column gap-2">
                                <div className="stats-table-card">
                                    <div className="table-card-header">
                                        <h2 className="table-header-title">
                                            <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Clasificacion.png" alt="" className="tab-icon-small" /> Tabla de Clasificación
                                        </h2>
                                    </div>
                                    <div className="table-wrapper">
                                        <table className="stats-table">
                                            <thead>
                                                <tr>
                                                    <th>Pos</th>
                                                    <th>Equipo</th>
                                                    <th onClick={() => handleSort('puntos')} className="text-center cursor-pointer">Pts {renderSortIcon('puntos')}</th>
                                                    <th onClick={() => handleSort('jugados')} className="text-center cursor-pointer">PJ {renderSortIcon('jugados')}</th>
                                                    <th onClick={() => handleSort('ganados')} className="text-center cursor-pointer">G {renderSortIcon('ganados')}</th>
                                                    <th onClick={() => handleSort('favor')} className="text-center cursor-pointer">PF {renderSortIcon('favor')}</th>
                                                    <th onClick={() => handleSort('contra')} className="text-center cursor-pointer">PC {renderSortIcon('contra')}</th>
                                                    <th onClick={() => handleSort('dif')} className="text-center cursor-pointer">Dif {renderSortIcon('dif')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedLeagueStats.map((team, idx) => (
                                                    <tr key={idx} className={team.team === HOSPITALET_NAME ? 'tr--hospi' : ''}>
                                                        <td className="text-center">{team.ranking}</td>
                                                        <td className="text-bold color-blue flex-items-center gap-05">
                                                            <TeamLogo url={team.escudo} name={team.team} size={32} /> {team.team}
                                                        </td>
                                                        <td className="text-center text-bold color-orange">{team.puntos}</td>
                                                        <td className="text-center">{team.jugados}</td>
                                                        <td className="text-center">{team.ganados}</td>
                                                        <td className="text-center">{team.favor}</td>
                                                        <td className="text-center">{team.contra}</td>
                                                        <td className={`text-center text-bold ${team.dif > 0 ? 'color-green' : (team.dif < 0 ? 'color-red' : '')}`}>{team.dif}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="stats-table-card">
                                    <div className="table-card-header">
                                        <h2 className="table-header-title"><img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/resultados.png" alt="" className="tab-icon-small" /> RESULTADOS</h2>
                                    </div>
                                    <div className="jornada-tabs">
                                        {matchResults.map(g => (
                                            <button key={g.jornada} onClick={() => setSelectedJornada(g.jornada)} className={`jornada-btn ${selectedJornada === g.jornada ? 'jornada-btn--active' : ''}`}>
                                                {typeof g.jornada === 'number' ? `J${g.jornada}` : g.jornada}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="results-list">
                                        {matchResults.find(g => g.jornada === selectedJornada)?.matches?.map((m, i) => (
                                            <div key={i} onClick={() => handleMatchClick(m)} className="match-result-row">
                                                <div className="match-date">{m.date}</div>
                                                <div className={`match-team match-team--home ${m.home === HOSPITALET_NAME ? 'match-team--hospi' : ''}`}>{m.home} <TeamLogo url={m.homeShield} name={m.home} size={32} /></div>
                                                <div className="match-score-container">
                                                    <span className="match-score">{m.scoreHome} - {m.scoreAway}</span>
                                                    <span className="match-tries">Ens: {m.ensayosHome} - {m.ensayosAway}</span>
                                                </div>
                                                <div className={`match-team match-team--away ${m.away === HOSPITALET_NAME ? 'match-team--hospi' : ''}`}><TeamLogo url={m.awayShield} name={m.away} size={32} /> {m.away}</div>
                                                {user?.role !== 'JUGADOR' && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteMatch(m); }} className="btn-delete-match"><Trash2 size={18} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'rivales' && (
                            <div className="flex-column gap-2">
                                {!selectedRival ? (
                                    <div className="rivals-grid">
                                        {rivalsList.map((r, i) => (
                                            <div key={i} onClick={() => setSelectedRival(r)} className="rival-card">
                                                <TeamLogo url={leagueStats.find(t => t.team === r)?.escudo} name={r} size={60} />
                                                <div className="rival-card-name">{r}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rival-detail-view">
                                        <div className="rival-detail-header">
                                            <button onClick={() => setSelectedRival(null)} className="btn-back"><ArrowLeft size={20} /> Volver</button>
                                            <div className="rival-title-box">
                                                <TeamLogo url={leagueStats.find(t => t.team === selectedRival)?.escudo} name={selectedRival} size={48} />
                                                <h2 className="rival-title">{selectedRival}</h2>
                                            </div>
                                        </div>
                                        <div className="rival-subtabs">
                                            {['partidos', 'estadisticas', 'jugadores', 'analisis'].map(t => (
                                                <button key={t} onClick={() => setRivalDetailTab(t)} className={`rival-subtab-btn ${rivalDetailTab === t ? 'rival-subtab-btn--active' : ''}`}>{t}</button>
                                            ))}
                                        </div>
                                        <div className="rival-detail-container">
                                            {rivalDetailTab === 'partidos' && (
                                                <div className="flex-column gap-1">
                                                    <div className="rival-match-subtabs">
                                                        {matchResults.flatMap(g => g.matches).filter(m => m.home === selectedRival || m.away === selectedRival).map((m, i) => (
                                                            <button key={i} onClick={() => setSelectedRivalMatch(m)} className={`rival-match-btn ${selectedRivalMatch?.id === m.id ? 'rival-match-btn--active' : ''}`}>{m.date}</button>
                                                        ))}
                                                    </div>
                                                    {selectedRivalMatch && <MatchAnalysisView match={selectedRivalMatch} analysis={rivalMatchAnalysis} onMatchClick={handleMatchClick} MarkdownRenderer={MarkdownRenderer} allPlayers={allPlayers} />}
                                                </div>
                                            )}
                                            {rivalDetailTab === 'estadisticas' && <TeamEvolutionAnalysis matches={matchResults.flatMap(g => g.matches).filter(m => m.home === selectedRival || m.away === selectedRival)} analyses={allAnalyses} teamName={selectedRival} />}
                                            {rivalDetailTab === 'jugadores' && (
                                                <TeamPlayerStatsTable
                                                    players={playerStats.filter(p => p.team === selectedRival)}
                                                    teamName={selectedRival}
                                                    onPlayerClick={setSelectedPlayerForHistory}
                                                />
                                            )}
                                            {rivalDetailTab === 'analisis' && <RivalAnalysis rivalName={selectedRival} leagueStats={leagueStats} playerStats={playerStats} matchResults={matchResults} allAnalyses={allAnalyses} />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'hospitalet' && (
                            <div className="flex-column gap-1">
                                <div className="rival-subtabs">
                                    {['temporada', 'partidos', 'estadisticas', 'analisis', 'jugadores'].map(t => (
                                        <button key={t} onClick={() => setHospitaletDetailTab(t)} className={`rival-subtab-btn ${hospitaletDetailTab === t ? 'rival-subtab-btn--active' : ''}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="rival-detail-container">
                                    {hospitaletDetailTab === 'temporada' && <SeasonStatsPanel isStaff={user?.role !== 'JUGADOR'} />}
                                    {hospitaletDetailTab === 'partidos' && (
                                        <div className="flex-column gap-1">
                                            <div className="rival-match-subtabs">
                                                {matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME).map((m, i) => (
                                                    <button key={i} onClick={() => setSelectedHospitaletMatch(m)} className={`rival-match-btn ${selectedHospitaletMatch?.id === m.id ? 'rival-match-btn--active' : ''}`}>{m.date}</button>
                                                ))}
                                            </div>
                                            {selectedHospitaletMatch && <MatchAnalysisView match={selectedHospitaletMatch} analysis={hospitaletMatchAnalysis} onMatchClick={handleMatchClick} MarkdownRenderer={MarkdownRenderer} allPlayers={allPlayers} />}
                                        </div>
                                    )}
                                    {hospitaletDetailTab === 'estadisticas' && <TeamEvolutionAnalysis matches={matchResults.flatMap(g => g.matches).filter(m => normalizeTeamName(m.home) === HOSPITALET_NAME || normalizeTeamName(m.away) === HOSPITALET_NAME)} analyses={allAnalyses} teamName={HOSPITALET_NAME} />}
                                    {hospitaletDetailTab === 'analisis' && <HospitaletAnalysis matches={matchResults.flatMap(g => g.matches).filter(m => normalizeTeamName(m.home) === HOSPITALET_NAME || normalizeTeamName(m.away) === HOSPITALET_NAME)} analyses={allAnalyses} playerStats={playerStats} leagueStats={leagueStats} />}
                                    {hospitaletDetailTab === 'jugadores' && (
                                        <TeamPlayerStatsTable
                                            players={playerStats.filter(p => p.team === HOSPITALET_NAME)}
                                            teamName={HOSPITALET_NAME}
                                            highlightHospi={true}
                                            onPlayerClick={setSelectedPlayerForHistory}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'jugadores' && (
                            <PlayerStatsTab
                                playerStats={playerStats}
                                allPlayers={allPlayers}
                                leagueStats={leagueStats}
                                onPlayerClick={setSelectedPlayerForHistory}
                            />
                        )}
                    </div>
                )}
                {selectedMatch && (
                    <MatchDetailsModal
                        match={selectedMatch}
                        onClose={async () => {
                            setSelectedMatch(null);
                            // FORCE RE-FETCH of all data to ensure analysis updates are reflected
                            await fetchData();
                            await fetchAllAnalyses();
                        }}
                    />
                )}
                {selectedPlayerForHistory && (
                    <PlayerMatchHistory
                        player={selectedPlayerForHistory}
                        onClose={() => setSelectedPlayerForHistory(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default StatsPage;
