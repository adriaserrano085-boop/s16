import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
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
    const HOSPITALET_NAME = "RC HOSPITALET";

    useEffect(() => {
        const fetchAllAnalyses = async () => {
            try {
                const data = await analysisService.getAll();
                if (data) setAllAnalyses(data);
            } catch (err) {
                console.error("Error fetching all analyses:", err);
            }
        };

        fetchData();
        fetchAllAnalyses();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: rivalsData, error: rError } = await supabase
                .from('rivales')
                .select('nombre_equipo, escudo');

            if (rError) console.error("Error fetching shields:", rError);

            const teamShields = {};
            teamShields[HOSPITALET_NAME] = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";
            if (rivalsData) {
                rivalsData.forEach(r => {
                    if (r.escudo) teamShields[r.nombre_equipo] = r.escudo;
                });
            }

            const standings = await leagueService.getStandings();
            setLeagueStats(standings);

            const { data: statsData, error: sError } = await supabase
                .from('estadisticas_partido')
                .select(`
                    id, 
                    partido, 
                    partido_externo,
                    marcador_local, 
                    marcador_visitante, 
                    ensayos_local,
                    ensayos_visitante,
                    jornada, 
                    fecha,
                    partidos ( id, Rival, es_local, Evento, rivales(nombre_equipo) ),
                    partidos_externos ( id, equipo_local, equipo_visitante, competicion )
                `)
                .order('fecha', { ascending: true });

            if (sError) throw sError;

            const results = [];
            const rivalsSet = new Set();

            if (statsData) {
                statsData.forEach(stat => {
                    let homeName = "Desconocido Local";
                    let awayName = "Desconocido Visitante";
                    let date = stat.fecha;
                    let jornada = stat.jornada;

                    if (stat.partidos) {
                        const p = stat.partidos;
                        const rival = p.rivales?.nombre_equipo || p.Rival || "Rival";
                        if (p.es_local) {
                            homeName = HOSPITALET_NAME;
                            awayName = rival;
                        } else {
                            homeName = rival;
                            awayName = HOSPITALET_NAME;
                        }
                        rivalsSet.add(rival);
                    } else if (stat.partidos_externos) {
                        const pe = stat.partidos_externos;
                        homeName = pe.equipo_local;
                        awayName = pe.equipo_visitante;
                        rivalsSet.add(homeName);
                        rivalsSet.add(awayName);
                    }

                    const pId = stat.partido;
                    const peId = stat.partido_externo;

                    results.push({
                        id: stat.id,
                        partido_id: pId,
                        partido_externo_id: peId,
                        evento_id: stat.partidos?.Evento,
                        home: homeName,
                        away: awayName,
                        scoreHome: stat.marcador_local,
                        scoreAway: stat.marcador_visitante,
                        date: date,
                        jornadaOriginal: jornada,
                        homeShield: teamShields[homeName],
                        awayShield: teamShields[awayName]
                    });
                });
            }

            const parseDate = (dateStr) => {
                if (!dateStr) return null;
                let d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d;
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    d = new Date(parts[2], parts[1] - 1, parts[0]);
                    if (!isNaN(d.getTime())) return d;
                }
                return null;
            };

            const validDateResults = results.filter(r => parseDate(r.date) !== null);
            const noDateResults = results.filter(r => parseDate(r.date) === null);

            validDateResults.sort((a, b) => parseDate(a.date) - parseDate(b.date));

            let currentJornada = 0;
            let lastDate = null;
            const groupWindowDays = 5;
            const groupedResults = [];

            validDateResults.forEach(match => {
                const matchDate = parseDate(match.date);
                if (!lastDate || Math.abs(matchDate - parseDate(lastDate)) > groupWindowDays * 24 * 60 * 60 * 1000) {
                    currentJornada++;
                    lastDate = match.date;
                }
                let group = groupedResults.find(g => g.jornada === currentJornada);
                if (!group) {
                    group = { jornada: currentJornada, matches: [] };
                    groupedResults.push(group);
                }
                group.matches.push(match);
            });

            if (noDateResults.length > 0) {
                groupedResults.push({ jornada: 'Pendiente', matches: noDateResults });
            }

            setMatchResults(groupedResults);
            if (groupedResults.length > 0) {
                const lastNum = groupedResults.filter(g => typeof g.jornada === 'number').pop();
                setSelectedJornada(lastNum ? lastNum.jornada : groupedResults[0].jornada);
            }

            setRivalsList(Array.from(rivalsSet).filter(r => r !== HOSPITALET_NAME).sort());

            const { data: rawStats } = await supabase
                .from('estadisticas_jugador')
                .select('jugador, licencia, nombre, equipo, minutos_jugados, es_titular, ensayos, transformaciones, penales, tarjetas_amarillas, tarjetas_rojas');

            if (rawStats) {
                const aggregated = {};
                rawStats.forEach(stat => {
                    const key = stat.licencia || stat.jugador || (stat.nombre + '-' + stat.equipo);
                    if (!aggregated[key]) {
                        aggregated[key] = {
                            player_id: stat.jugador,
                            licencia: stat.licencia,
                            name: stat.nombre,
                            team: stat.equipo,
                            titular: 0, jugados: 0, minutos: 0,
                            ensayos: 0, conversiones: 0, golpes: 0, amarillas: 0, rojas: 0
                        };
                    }
                    const p = aggregated[key];
                    p.jugados += ((stat.minutos_jugados || 0) > 0 || stat.es_titular ? 1 : 0);
                    if (stat.es_titular) p.titular += 1;
                    p.ensayos += (stat.ensayos || 0);
                    p.conversiones += (stat.transformaciones || 0);
                    p.golpes += (stat.penales || 0);
                    p.amarillas += (stat.tarjetas_amarillas || 0);
                    p.rojas += (stat.tarjetas_rojas || 0);
                    p.minutos += (stat.minutos_jugados || (stat.es_titular ? 70 : 0));
                    p.puntos = (p.ensayos * 5) + (p.conversiones * 2) + (p.golpes * 3);
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
        if (!match.id) return alert("ID no encontrado.");
        if (!window.confirm("¿Borrar partido y todas sus estadísticas?")) return;

        try {
            setLoading(true);
            const playerQuery = supabase.from('estadisticas_jugador').delete();
            if (match.partido_externo_id) playerQuery.eq('partido_externo', match.partido_externo_id);
            else playerQuery.eq('partido', match.partido_id);
            await playerQuery;

            await supabase.from('estadisticas_partido').delete().eq('id', match.id);

            if (match.partido_externo_id) {
                await supabase.from('partidos_externos').delete().eq('id', match.partido_externo_id);
            } else if (match.partido_id) {
                await supabase.from('partidos').update({ marcador_local: null, marcador_visitante: null }).eq('id', match.partido_id);
            }
            await fetchData();
        } catch (err) {
            console.error(err);
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
            const hospiMatches = matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME).sort((a, b) => new Date(b.date) - new Date(a.date));
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
                    <div className="uploader-box">
                        <h3 className="uploader-title">Subir Acta de Partido</h3>
                        <ActaUploader onUploadComplete={() => { setShowUploader(false); fetchData(); }} />
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
                                                <span className="match-score">{m.scoreHome} - {m.scoreAway}</span>
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
                                                <div className="stats-table-card">
                                                    <div className="table-wrapper">
                                                        <table className="stats-table">
                                                            <thead>
                                                                <tr><th>Jugador</th><th className="text-center">PJ</th><th className="text-center">Ens</th><th className="text-center">Pts</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {playerStats.filter(p => p.team === selectedRival).map((p, i) => (
                                                                    <tr key={i}><td className="text-bold color-blue">{p.name}</td><td className="text-center">{p.jugados}</td><td className="text-center">{p.ensayos}</td><td className="text-center text-bold color-orange">{p.puntos}</td></tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
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
                                    {['partidos', 'estadisticas', 'analisis', 'jugadores'].map(t => (
                                        <button key={t} onClick={() => setHospitaletDetailTab(t)} className={`rival-subtab-btn ${hospitaletDetailTab === t ? 'rival-subtab-btn--active' : ''}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="rival-detail-container">
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
                                    {hospitaletDetailTab === 'estadisticas' && <TeamEvolutionAnalysis matches={matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME)} analyses={allAnalyses} teamName={HOSPITALET_NAME} />}
                                    {hospitaletDetailTab === 'analisis' && <HospitaletAnalysis matches={matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME)} analyses={allAnalyses} playerStats={playerStats} leagueStats={leagueStats} />}
                                    {hospitaletDetailTab === 'jugadores' && (
                                        <div className="stats-table-card">
                                            <div className="table-wrapper">
                                                <table className="stats-table">
                                                    <thead>
                                                        <tr>
                                                            <th onClick={() => handleSort('name')}>Jugador {renderSortIcon('name')}</th>
                                                            <th onClick={() => handleSort('jugados')}>PJ {renderSortIcon('jugados')}</th>
                                                            <th>Ens</th>
                                                            <th>Pts</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortData(playerStats.filter(p => p.team?.toUpperCase().includes('HOSPITALET'))).map((p, i) => (
                                                            <tr key={i} className="tr--hospi">
                                                                <td className="text-bold">{p.name}</td>
                                                                <td className="text-center">{p.jugados}</td>
                                                                <td className="text-center">{p.ensayos}</td>
                                                                <td className="text-center text-bold color-orange">{p.puntos}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'jugadores' && (
                            <div className="stats-table-card">
                                <div className="table-wrapper">
                                    <table className="stats-table">
                                        <thead>
                                            <tr>
                                                <th onClick={() => handleSort('name')}>Nombre {renderSortIcon('name')}</th>
                                                <th>Equipo</th>
                                                <th onClick={() => handleSort('jugados')}>PJ {renderSortIcon('jugados')}</th>
                                                <th>Ens</th>
                                                <th>Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortData(playerStats).map((p, i) => (
                                                <tr key={i} className={p.team?.toUpperCase().includes('HOSPITALET') ? 'tr--hospi' : ''}>
                                                    <td className="text-bold">{p.name}</td>
                                                    <td className="text-light">{p.team}</td>
                                                    <td className="text-center">{p.jugados}</td>
                                                    <td className="text-center">{p.ensayos}</td>
                                                    <td className="text-center text-bold color-orange">{p.puntos}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
            </div>
        </div>
    );
};

export default StatsPage;
