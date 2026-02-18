import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { playerStats as mockPlayerStats, leagueStats as mockLeagueStats } from '../lib/mockData';
import { ArrowLeft, Users, Trophy, Activity, Calendar, Shield, Trash2, Clock, ClipboardList, Swords, ArrowRightLeft, Target } from 'lucide-react';
import { leagueService } from '../services/leagueService';
import { analysisService } from '../services/analysisService';

import ActaUploader from '../components/ActaUploader';
import MatchDetailsModal from '../components/MatchDetailsModal';
import { MatchAnalysisView } from '../components/MatchAnalysisView';
import { TeamEvolutionAnalysis } from '../components/TeamEvolutionAnalysis';

const TeamLogo = ({ url, name, size = 30 }) => {
    if (!url) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999', overflow: 'hidden' }}>{name?.substring(0, 2)}</div>;
    return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
};

const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    // Simple parser for basic markdown used in reports
    // Handles: ## Headers, **Bold**, - Lists, | Tables |
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    return (
        <div>
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('## ')) {
                    return <h3 key={i} style={{ color: 'var(--color-primary-blue)', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary-orange)', paddingBottom: '0.25rem' }}>{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                    return <h4 key={i} style={{ color: '#4b5563', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem' }}>{line.replace('### ', '')}</h4>;
                }

                // Bold text replacement helper
                const renderText = (text) => {
                    const parts = text.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={index} style={{ color: '#111827' }}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });
                };

                // List items
                if (line.trim().startsWith('- ')) {
                    return <li key={i} style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{renderText(line.replace('- ', ''))}</li>;
                }

                // Tables (Simple rendering)
                if (line.trim().startsWith('|')) {
                    // Start or continue table
                    // Ideally check next line for separator |---| but simplistic approach for now
                    if (lines[i + 1] && lines[i + 1].includes('---')) return null; // Skip separator line
                    if (line.includes('---')) return null; // Skip separator line explicitly

                    const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                    return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '10px', padding: '8px', borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                            {cells.map((cell, cIdx) => <span key={cIdx}>{renderText(cell)}</span>)}
                        </div>
                    );
                }

                // Paragraphs
                if (line.trim() === '') return <br key={i} />;

                return <p key={i} style={{ marginBottom: '0.5rem' }}>{renderText(line)}</p>;
            })}
        </div>
    );
};

const RivalAnalysis = ({ rivalName, leagueStats, playerStats, matchResults, allAnalyses }) => {
    const team = leagueStats.find(t => t.team === rivalName) || {};
    const rivalPlayers = playerStats.filter(p => p.team === rivalName);
    const matches = matchResults.flatMap(g => g.matches).filter(m => m.home === rivalName || m.away === rivalName);

    // Calculate Video Analysis Stats - ENHANCED
    const analysisStats = React.useMemo(() => {
        if (!matches.length || !allAnalyses.length) return null;

        let totalPossession = 0;
        let totalTacklesMade = 0;
        let totalTacklesMissed = 0;
        let totalScrumWon = 0;
        let totalScrumLost = 0;
        let totalLineoutWon = 0;
        let totalLineoutLost = 0;
        let matchesCount = 0;

        matches.forEach(m => {
            const analysis = m.partido_externo_id
                ? allAnalyses.find(a => a.partido_externo_id === m.partido_externo_id)
                : allAnalyses.find(a => a.evento_id === m.evento_id);

            if (analysis?.raw_json?.estadisticas) {
                const stats = analysis.raw_json.estadisticas;
                const isHome = m.home === rivalName;
                const teamKey = isHome ? 'local' : 'visitante';

                totalPossession += (stats.posesion?.[teamKey] || 50);
                totalTacklesMade += (stats.placajes_hechos?.[teamKey] || 0);
                totalTacklesMissed += (stats.placajes_fallados?.[teamKey] || 0);
                totalScrumWon += (stats.mele?.[`${teamKey}_ganada`] || 0);
                totalScrumLost += (stats.mele?.[`${teamKey}_perdida`] || 0);
                totalLineoutWon += (stats.touch?.[`${teamKey}_ganada`] || 0);
                totalLineoutLost += (stats.touch?.[`${teamKey}_perdida`] || 0);
                matchesCount++;
            }
        });

        if (matchesCount === 0) return null;

        return {
            avgPossession: Math.round(totalPossession / matchesCount),
            tackleSuccess: Math.round((totalTacklesMade / ((totalTacklesMade + totalTacklesMissed) || 1)) * 100),
            scrumSuccess: Math.round((totalScrumWon / ((totalScrumWon + totalScrumLost) || 1)) * 100),
            lineoutSuccess: Math.round((totalLineoutWon / ((totalLineoutWon + totalLineoutLost) || 1)) * 100),
            analyzedGames: matchesCount
        };
    }, [matches, allAnalyses, rivalName]);

    const topScorer = [...rivalPlayers].sort((a, b) => b.puntos - a.puntos)[0];
    const topTryScorer = [...rivalPlayers].sort((a, b) => b.ensayos - a.ensayos)[0];

    // Core Metrics
    const winRate = team.jugados > 0 ? Math.round((team.ganados / team.jugados) * 100) : 0;
    const triesPerGame = team.jugados > 0 ? (team.ensayos / team.jugados).toFixed(1) : 0;
    const pointsPerGame = team.jugados > 0 ? (team.favor / team.jugados).toFixed(0) : 0;
    const pointsConcededPerGame = team.jugados > 0 ? (team.contra / team.jugados).toFixed(0) : 0;
    const totalYellows = rivalPlayers.reduce((sum, p) => sum + (p.amarillas || 0), 0);
    const totalReds = rivalPlayers.reduce((sum, p) => sum + (p.rojas || 0), 0);
    const cardsPerGame = team.jugados > 0 ? ((totalYellows + totalReds) / team.jugados).toFixed(2) : 0;


    // Dynamic Report Generation
    const generateReport = () => {
        const sections = [];

        // 1. Current Form & Context
        let formText = `El equipo marcha ${team.ranking}º en la clasificación con ${team.puntos} puntos. `;
        if (winRate > 70) formText += "Llegan con una dinámica ganadora muy fuerte, siendo uno de los rivales a batir. ";
        else if (winRate < 30) formText += "Han tenido dificultades para cerrar partidos esta temporada. ";
        else formText += "Es un equipo competitivo que alterna buenos resultados con irregularidad. ";

        sections.push({
            title: "Contexto Competitivo",
            icon: <Trophy size={18} />,
            content: formText,
            color: "#3b82f6"
        });

        // 2. Offensive Profile
        let attackText = `Promedian ${pointsPerGame} puntos y ${triesPerGame} ensayos por partido. `;
        if (analysisStats) {
            if (analysisStats.avgPossession > 55) attackText += "Su juego se basa en el control de la posesión, construyendo fases largas. ";
            else if (analysisStats.avgPossession < 45) attackText += "Son peligrosos al contraataque, no necesitan mucha posesión para anotar. ";
        }
        if (topTryScorer) attackText += `Su mayor amenaza individual es ${topTryScorer.name}, quien ha anotado ${topTryScorer.ensayos} ensayos. `;

        sections.push({
            title: "Fase Ofensiva",
            icon: <Swords size={18} />,
            content: attackText,
            color: "#ef4444"
        });

        // 3. Defensive Profile
        let defenseText = `Encajan una media de ${pointsConcededPerGame} puntos por encuentro. `;
        if (analysisStats) {
            defenseText += `Su efectividad en el placaje es del ${analysisStats.tackleSuccess}%. `;
            if (analysisStats.tackleSuccess < 80) defenseText += "Muestran vulnerabilidad en el uno contra uno, lo que puede ser explotado con corredores fuertes. ";
            else defenseText += "Son una defensa muy organizada y difícil de romper en el contacto. ";
        }

        sections.push({
            title: "Fase Defensiva",
            icon: <Shield size={18} />,
            content: defenseText,
            color: "#10b981"
        });

        // 4. Set Pieces (if video stats available)
        if (analysisStats) {
            let setPieceText = "";
            setPieceText += `Melé: ${analysisStats.scrumSuccess}% de éxito. `;
            setPieceText += `Touch: ${analysisStats.lineoutSuccess}% de retención. `;

            if (analysisStats.scrumSuccess < 80) setPieceText += "La melé parece ser un punto débil que podemos atacar para generar golpes de castigo. ";
            if (analysisStats.lineoutSuccess < 75) setPieceText += "Tienen problemas en la obtención de touch, lo que sugiere oportunidades para disputar sus lanzamientos. ";

            sections.push({
                title: "Fases Estáticas",
                icon: <ArrowRightLeft size={18} />,
                content: setPieceText,
                color: "#f59e0b"
            });
        }

        // 5. Tactical Recommendations
        let tacticsText = "Jugar con disciplina territorial es clave. ";
        if (analysisStats && analysisStats.tackleSuccess < 85) tacticsText += "Buscar el contacto directo y mantener el balón vivo en el placaje. ";
        if (analysisStats && analysisStats.avgPossession > 60) tacticsText += "Presionar su salida de balón y disputar el breakdown para negarles ritmo. ";
        if (pointsConcededPerGame > 25) tacticsText += "Ser agresivos en ataque desde el inicio, ya que tienden a encajar puntos. ";

        sections.push({
            title: "Claves Tácticas",
            icon: <Target size={18} />,
            content: tacticsText,
            color: "#8b5cf6" // Violet
        });

        return sections;
    };

    const reportSections = generateReport();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header / Summary Card */}
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary-blue) 0%, #1e40af 100%)', padding: '2rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0, 51, 102, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <img
                                src={leagueStats.find(t => t.team === rivalName)?.escudo}
                                alt={rivalName}
                                style={{ width: '48px', height: '48px', filter: 'brightness(0) invert(1)' }}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <h3 style={{ margin: 0, fontSize: '2rem', color: 'white', fontWeight: '900', letterSpacing: '-0.5px' }}>Informe de Analista</h3>
                        </div>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                            Análisis técnico basado en {team.jugados} partidos de liga{analysisStats ? ' y ' + analysisStats.analyzedGames + ' partidos videoanalizados' : ''}.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ranking</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>#{team.ranking}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Forma (Win%)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{winRate}%</div>
                    </div>
                    {analysisStats && (
                        <>
                            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PosesiÃ³n</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analysisStats.avgPossession}%</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Placaje</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analysisStats.tackleSuccess}%</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Detailed Analysis Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {reportSections.map((section, idx) => (
                    <div key={idx} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        borderTop: '4px solid ' + section.color,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: section.color }}>
                            {section.icon}
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{section.title}</h4>
                        </div>
                        <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            {section.content}
                        </p>
                    </div>
                ))}
            </div>

            {/* Key Players Spotlight */}
            <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} /> Jugadores Clave
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {topScorer && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {topScorer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{topScorer.name}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>MÃ¡ximo Anotador ({topScorer.puntos} pts)</div>
                            </div>
                        </div>
                    )}
                    {topTryScorer && topTryScorer.name !== topScorer?.name && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {topTryScorer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{topTryScorer.name}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Amenaza de Ensayo ({topTryScorer.ensayos} tries)</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
const StatsPage = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clasificacion'); // 'clasificacion', 'rivales', 'jugadores'
    const [subTab, setSubTab] = useState('todos'); // for players filter
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
            // 0. Fetch Team Shields (Rivales)
            const { data: rivalsData, error: rError } = await supabase
                .from('rivales')
                .select('nombre_equipo, escudo');

            if (rError) console.error("Error fetching shields:", rError);

            const teamShields = {};
            // Add Hospitalet Shield
            teamShields[HOSPITALET_NAME] = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";
            // For now, I'll populate from rivalsData.
            if (rivalsData) {
                rivalsData.forEach(r => {
                    if (r.escudo) teamShields[r.nombre_equipo] = r.escudo;
                });
            }

            // 1. Fetch Centralized Match Stats & Standings
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
                .order('fecha', { ascending: true }); // Oldest first for chronological order

            if (sError) throw sError;

            const results = [];
            const rivalsSet = new Set();

            if (statsData) {
                statsData.forEach(stat => {
                    let homeName = "Desconocido Local";
                    let awayName = "Desconocido Visitante";
                    let date = stat.fecha;
                    let jornada = stat.jornada;

                    // Determine names based on source
                    if (stat.partidos) {
                        // Internal Match
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
                        // External Match
                        const pe = stat.partidos_externos;
                        homeName = pe.equipo_local;
                        awayName = pe.equipo_visitante;
                        rivalsSet.add(homeName);
                        rivalsSet.add(awayName);
                    }

                    // Determine actual match IDs more robustly
                    const pObj = Array.isArray(stat.partidos) ? stat.partidos[0] : stat.partidos;
                    const peObj = Array.isArray(stat.partidos_externos) ? stat.partidos_externos[0] : stat.partidos_externos;

                    const pId = stat.partido || pObj?.id;
                    const peId = stat.partido_externo || peObj?.id;

                    // Add to Results List
                    results.push({
                        partido_id: pId,
                        partido_externo_id: peId,
                        evento_id: pObj?.Evento, // Capital 'Evento' is correct
                        home: homeName,
                        away: awayName,
                        scoreHome: stat.marcador_local,
                        scoreAway: stat.marcador_visitante,
                        date: date,
                        jornadaOriginal: jornada,
                        jornadaCalculated: null,
                        homeShield: teamShields[homeName],
                        awayShield: teamShields[awayName]
                    });
                });
            }


            // Group Results by Date Clustering (Jornada Inference)
            // Helper: Robust Date Parsing (ISO or DD/MM/YYYY)
            const parseDate = (dateStr) => {
                if (!dateStr) return null;
                // Try ISO YYYY-MM-DD
                let d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d;

                // Try DD/MM/YYYY
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    // Month is 0-indexed in JS Date
                    d = new Date(parts[2], parts[1] - 1, parts[0]);
                    if (!isNaN(d.getTime())) return d;
                }
                return null;
            };

            // Filter out invalid dates or handle them
            const validDateResults = results.filter(r => parseDate(r.date) !== null);
            const noDateResults = results.filter(r => parseDate(r.date) === null);

            validDateResults.sort((a, b) => {
                const dateA = parseDate(a.date).getTime();
                const dateB = parseDate(b.date).getTime();
                return dateA - dateB;
            });

            let currentJornada = 0;
            let lastDate = null;
            const groupWindowDays = 5;

            // Helper to parsing truncated dates or verify diff
            const getDiffDays = (d1, d2) => {
                const date1 = parseDate(d1);
                const date2 = parseDate(d2);
                if (!date1 || !date2) return 999;
                const diffTime = Math.abs(date2 - date1);
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };

            const groupedResults = [];

            // Function to add match to group
            const addToGroup = (jornadaNum, match) => {
                let group = groupedResults.find(g => g.jornada === jornadaNum);
                if (!group) {
                    group = { jornada: jornadaNum, matches: [] };
                    groupedResults.push(group);
                }
                group.matches.push(match);
            };

            validDateResults.forEach(match => {
                // If we have an explicit jornada from DB, use it? 
                // User wants "Resultados calendario, lo ordenes al revés y separe por jornadas teniendo en cuenta las fechas"
                // So date is primary.

                if (!lastDate) {
                    currentJornada = 1;
                    lastDate = match.date;
                } else {
                    const diff = getDiffDays(lastDate, match.date);
                    if (diff > groupWindowDays) {
                        currentJornada++;
                        lastDate = match.date;
                    }
                }
                match.jornadaCalculated = currentJornada; // For debug/display if needed
                addToGroup(currentJornada, match);
            });

            // Handle matches with no date - put them at the end or in a "Pendiente" group?
            if (noDateResults.length > 0) {
                const pendingGroup = { jornada: 'Pendiente / Sin Fecha', matches: noDateResults };
                groupedResults.push(pendingGroup);
            }

            // Sort ascending: J1 first (left), J14 last (right)
            const displayGroups = [...groupedResults].sort((a, b) => {
                if (typeof a.jornada === 'number' && typeof b.jornada === 'number') return a.jornada - b.jornada;
                if (typeof a.jornada === 'number') return -1;
                if (typeof b.jornada === 'number') return 1;
                return 0;
            });
            setMatchResults(displayGroups);

            // Set default selected jornada (highest number/latest available)
            const numericGroups = displayGroups.filter(g => typeof g.jornada === 'number');
            if (numericGroups.length > 0) {
                setSelectedJornada(numericGroups[numericGroups.length - 1].jornada);
            } else if (displayGroups.length > 0) {
                setSelectedJornada(displayGroups[0].jornada);
            }

            // Rivals List
            setRivalsList(Array.from(rivalsSet).filter(r => r !== HOSPITALET_NAME).sort());

            // Player Stats
            const { data: rawStats } = await supabase.from('estadisticas_jugador').select('*');
            if (rawStats) {
                const aggregated = {};
                rawStats.forEach(stat => {
                    const pid = stat.jugador;
                    const key = stat.licencia || pid || (stat.nombre + '-' + stat.equipo);
                    if (!aggregated[key]) {
                        aggregated[key] = {
                            player_id: pid,
                            licencia: stat.licencia,
                            name: stat.nombre,
                            team: stat.equipo,
                            titular: 0, jugados: 0, convocados: 0, minutos: 0,
                            ensayos: 0, conversiones: 0, golpes: 0, amarillas: 0, rojas: 0
                        };
                    }
                    const p = aggregated[key];
                    p.convocados += 1;
                    if ((stat.minutos_jugados || 0) > 0 || stat.es_titular) p.jugados += 1;
                    if (stat.es_titular) p.titular += 1;
                    p.ensayos += (stat.ensayos || 0);
                    p.conversiones += (stat.transformaciones || 0);
                    p.golpes += (stat.penales || 0);
                    p.amarillas += (stat.tarjetas_amarillas || 0);
                    p.rojas += (stat.tarjetas_rojas || 0);
                    p.minutos += (stat.minutos_jugados || (stat.es_titular ? 70 : 20));
                    // Pre-calculate points and averages for sorting
                    p.puntos = (p.ensayos * 5) + (p.conversiones * 2) + (p.golpes * 3);
                    p.minutos_pj = p.jugados > 0 ? p.minutos / p.jugados : 0;
                    p.ensayos_pj = p.jugados > 0 ? p.ensayos / p.jugados : 0;
                    p.puntos_pj = p.jugados > 0 ? p.puntos / p.jugados : 0;
                    p.amarillas_pj = p.jugados > 0 ? p.amarillas / p.jugados : 0;
                    p.rojas_pj = p.jugados > 0 ? p.rojas / p.jugados : 0;
                });
                setPlayerStats(Object.values(aggregated));
            } else {
                setPlayerStats(mockPlayerStats);
            }

        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (match) => {
        if (!match.id) {
            alert("No se puede borrar: ID de estadísticas no encontrado.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres borrar el partido ${match.home} vs ${match.away}? Se borrarán todas las estadísticas asociadas.`)) {
            return;
        }

        try {
            setLoading(true);

            // 1. Delete player stats
            if (match.partido_externo_id || match.partido_id) {
                let playerQuery = supabase.from('estadisticas_jugador').delete();
                if (match.partido_externo_id) {
                    playerQuery = playerQuery.eq('partido_externo', match.partido_externo_id);
                } else {
                    playerQuery = playerQuery.eq('partido', match.partido_id);
                }
                const { error: pError } = await playerQuery;
                if (pError) throw pError;
            }

            // 2. Delete from estadisticas_partido
            const { error: sError } = await supabase
                .from('estadisticas_partido')
                .delete()
                .eq('id', match.id);
            if (sError) throw sError;

            // 3. Handle original match record
            if (match.partido_externo_id) {
                // Delete external match completely
                const { error: exError } = await supabase
                    .from('partidos_externos')
                    .delete()
                    .eq('id', match.partido_externo_id);
                if (exError) throw exError;
            } else if (match.partido_id) {
                // Clean internal match scores
                const { error: inError } = await supabase
                    .from('partidos')
                    .update({
                        marcador_local: null,
                        marcador_visitante: null,
                        ensayos_local: null,
                        ensayos_visitante: null
                    })
                    .eq('id', match.partido_id);
                if (inError) throw inError;
            }

            alert('Partido y estadísticas borrados correctamente.');
            await fetchData();
        } catch (err) {
            console.error('Error deleting match:', err);
            alert('Error al borrar el partido: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Effect to select first match when rival/tab changes
    useEffect(() => {
        if (selectedRival && rivalDetailTab === 'partidos') {
            const rivalMatches = matchResults.flatMap(g => g.matches)
                .filter(m => m.home === selectedRival || m.away === selectedRival)
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

            if (rivalMatches.length > 0 && !selectedRivalMatch) {
                setSelectedRivalMatch(rivalMatches[0]);
            }
        }
    }, [selectedRival, rivalDetailTab, matchResults]);

    // Effect to load analysis for selected rival match
    useEffect(() => {
        const loadRivalAnalysis = async () => {
            if (!selectedRivalMatch) {
                setRivalMatchAnalysis(null);
                return;
            }

            try {
                let data = null;
                // Try fetching by different IDs
                if (selectedRivalMatch.partido_externo_id) {
                    data = await analysisService.getByExternalMatchId(selectedRivalMatch.partido_externo_id);
                } else if (selectedRivalMatch.evento_id) { // Use evento_id if available
                    data = await analysisService.getByEventId(selectedRivalMatch.evento_id);
                } else if (selectedRivalMatch.partido_id) {
                    if (selectedRivalMatch.evento_id) {
                        data = await analysisService.getByEventId(selectedRivalMatch.evento_id);
                    }
                }
                setRivalMatchAnalysis(data);
            } catch (err) {
                console.error("Error loading rival match analysis:", err);
                setRivalMatchAnalysis(null);
            }
        };

        loadRivalAnalysis();
    }, [selectedRivalMatch]);

    // Effect for Hospitalet Match Selection
    useEffect(() => {
        if (activeTab === 'hospitalet' && hospitaletDetailTab === 'partidos') {
            const hospiMatches = matchResults.flatMap(g => g.matches)
                .filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME)
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

            if (hospiMatches.length > 0 && !selectedHospitaletMatch) {
                setSelectedHospitaletMatch(hospiMatches[0]);
            }
        }
    }, [activeTab, hospitaletDetailTab, matchResults]);

    // Effect for Hospitalet Analysis Loading
    useEffect(() => {
        const loadHospiAnalysis = async () => {
            if (!selectedHospitaletMatch) {
                setHospitaletMatchAnalysis(null);
                return;
            }
            try {
                let data = null;
                if (selectedHospitaletMatch.partido_externo_id) {
                    data = await analysisService.getByExternalMatchId(selectedHospitaletMatch.partido_externo_id);
                } else if (selectedHospitaletMatch.evento_id) {
                    data = await analysisService.getByEventId(selectedHospitaletMatch.evento_id);
                }
                setHospitaletMatchAnalysis(data);
            } catch (err) {
                console.error("Error loading hospi match analysis:", err);
                setHospitaletMatchAnalysis(null);
            }
        };
        loadHospiAnalysis();
    }, [selectedHospitaletMatch]);

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>⇅</span>;
        return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '5px' }}>↑</span> : <span style={{ marginLeft: '5px' }}>↓</span>;
    };

    const handleMatchClick = (match) => {
        // Construct match object compatible with MatchDetailsModal
        const modalMatch = {
            id: match.id, // This is stats ID, but extendedProps has real ones
            start: match.date,
            extendedProps: {
                match_id: match.partido_id,
                partido_externo_id: match.partido_externo_id,
                evento_id: match.evento_id, // Pass real Event ID for analysis
                homeTeamName: match.home,
                awayTeamName: match.away,
                homeTeamShield: match.homeShield,
                awayTeamShield: match.awayShield,
                homeScore: match.scoreHome,
                awayScore: match.scoreAway,
                isFinished: true, // Stats page shows finished
                lugar: 'Ver detalles de liga', // Placeholder
                league: match.partido_externo_id ? 'Liga (Externo)' : 'Liga'
            }
        };
        setSelectedMatch(modalMatch);
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative', zIndex: 1 }}>
                {/* ... Header and other content ... */}

                {/* Header - Glassmorphism style matching Dashboard */}
                <header style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)',
                    padding: '1rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
                }}>
                    {/* ... (Existing Header content) ... */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary-blue)' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png"
                            alt="Logo Estadísticas"
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                        />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--color-primary-blue)', letterSpacing: '0.05em' }}>
                            ESTADISTICAS
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowUploader(!showUploader)}
                            style={{
                                padding: '0.6rem 1.2rem',
                                backgroundColor: '#90EE90',
                                color: 'var(--color-primary-blue)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#77DD77'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#90EE90'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <Activity size={18} /> Subir Acta
                        </button>
                    </div>
                </header>

                {showUploader && (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 102, 0, 0.1)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-primary-blue)' }}>Subir Acta de Partido</h3>
                        <ActaUploader onUploadComplete={() => { setShowUploader(false); fetchData(); }} />
                    </div>
                )}



                {/* Tabs - Themed */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid rgba(0, 51, 102, 0.1)', paddingBottom: '1px' }}>
                    <button
                        onClick={() => setActiveTab('clasificacion')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'clasificacion' ? '3px solid var(--color-primary-orange)' : '3px solid transparent',
                            color: activeTab === 'clasificacion' ? 'var(--color-primary-orange)' : 'var(--color-text-light)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}>
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Clasificacion.png"
                            alt="Logo Clasificación"
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        /> Clasificación
                    </button>
                    <button
                        onClick={() => setActiveTab('rivales')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'rivales' ? '3px solid var(--color-primary-orange)' : '3px solid transparent',
                            color: activeTab === 'rivales' ? 'var(--color-primary-orange)' : 'var(--color-text-light)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}>
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Rivales.png"
                            alt="Logo Rivales"
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        /> Rivales
                    </button>
                    <button
                        onClick={() => setActiveTab('hospitalet')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'hospitalet' ? '3px solid var(--color-primary-orange)' : '3px solid transparent',
                            color: activeTab === 'hospitalet' ? 'var(--color-primary-orange)' : 'var(--color-text-light)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}>
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                            alt="Logo Hospi"
                            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                        /> RC HOSPITALET
                    </button>
                    <button
                        onClick={() => setActiveTab('jugadores')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'jugadores' ? '3px solid var(--color-primary-orange)' : '3px solid transparent',
                            color: activeTab === 'jugadores' ? 'var(--color-primary-orange)' : 'var(--color-text-light)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}>
                        <Users size={18} /> GLOBAL
                    </button>
                </div>

                {
                    loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Cargando estadísticas...</div>
                    ) : (
                        <>
                            {/* TAB: Clasificación */}
                            {activeTab === 'clasificacion' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {/* League Table - Card Style */}
                                    <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid rgba(0, 51, 102, 0.05)' }}>
                                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0, 51, 102, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-blue)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img
                                                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Clasificacion.png"
                                                    alt="Logo Tabla"
                                                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                                /> Tabla de Clasificación
                                            </h2>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'rgba(0, 51, 102, 0.03)', color: 'var(--color-primary-blue)', textAlign: 'left' }}>
                                                        <th style={{ padding: '1rem', fontWeight: 'bold', width: '60px' }}>Pos</th>
                                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>Equipo</th>
                                                        <th onClick={() => handleSort('puntos')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>Pts {renderSortIcon('puntos')}</th>
                                                        <th onClick={() => handleSort('jugados')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>PJ {renderSortIcon('jugados')}</th>
                                                        <th onClick={() => handleSort('ganados')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>G {renderSortIcon('ganados')}</th>
                                                        <th onClick={() => handleSort('empatados')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>E {renderSortIcon('empatados')}</th>
                                                        <th onClick={() => handleSort('perdidos')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>P {renderSortIcon('perdidos')}</th>
                                                        <th onClick={() => handleSort('favor')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>PF {renderSortIcon('favor')}</th>
                                                        <th onClick={() => handleSort('contra')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>PC {renderSortIcon('contra')}</th>
                                                        <th onClick={() => handleSort('dif')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>Dif {renderSortIcon('dif')}</th>
                                                        <th onClick={() => handleSort('ensayos')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>Ens. {renderSortIcon('ensayos')}</th>
                                                        <th onClick={() => handleSort('bo')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>BO {renderSortIcon('bo')}</th>
                                                        <th onClick={() => handleSort('bd')} style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>BD {renderSortIcon('bd')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortData(leagueStats).map((team, index) => (
                                                        <tr key={index} style={{ borderBottom: '1px solid rgba(0, 51, 102, 0.05)', backgroundColor: team.team === 'RC HOSPITALET' ? 'rgba(255, 102, 0, 0.05)' : 'transparent' }}>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: index < 4 ? 'var(--color-primary-orange)' : 'var(--color-text-light)' }}>
                                                                {team.ranking}
                                                            </td>
                                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <TeamLogo url={team.escudo} name={team.team} size={32} />
                                                                {team.team}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{team.puntos}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.jugados}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.ganados}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.empatados}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.perdidos}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.favor}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.contra}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: team.dif > 0 ? '#28a745' : (team.dif < 0 ? '#dc3545' : 'inherit') }}>{team.dif}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.ensayos}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.bo}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{team.bd}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Results Section - Tabbed Navigation */}
                                    <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid rgba(0, 51, 102, 0.05)' }}>
                                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0, 51, 102, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-blue)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img
                                                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/resultados.png"
                                                    alt="Logo Resultados"
                                                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                                /> RESULTADOS
                                            </h2>
                                        </div>

                                        {/* Jornada Sub-Tabs - Single Row Grid (up to 14 columns) */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(14, 1fr)',
                                            gap: '0.4rem',
                                            padding: '1rem',
                                            borderBottom: '1px solid rgba(255, 102, 0, 0.1)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                        }}>
                                            {/* Ensure we have at least 14 slots or handle dynamically */}
                                            {matchResults.map((group) => (
                                                <button
                                                    key={group.jornada}
                                                    onClick={() => setSelectedJornada(group.jornada)}
                                                    style={{
                                                        padding: '0.5rem 0',
                                                        borderRadius: '8px',
                                                        border: '1px solid',
                                                        borderColor: selectedJornada === group.jornada ? 'var(--color-primary-orange)' : 'rgba(0, 51, 102, 0.1)',
                                                        backgroundColor: selectedJornada === group.jornada ? 'var(--color-primary-orange)' : 'white',
                                                        color: selectedJornada === group.jornada ? 'white' : 'var(--color-primary-blue)',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        transition: 'all 0.2s',
                                                        fontSize: '0.75rem',
                                                        boxShadow: selectedJornada === group.jornada ? '0 3px 8px rgba(255, 102, 0, 0.25)' : 'none'
                                                    }}
                                                    title={typeof group.jornada === 'number' ? `Jornada ${group.jornada}` : group.jornada}
                                                >
                                                    {typeof group.jornada === 'number' ? `J${group.jornada}` : group.jornada}
                                                </button>
                                            ))}
                                        </div>

                                        <div style={{ padding: '0.5rem' }}>
                                            {matchResults.find(g => g.jornada === selectedJornada)?.matches?.map((match, mIndex) => (
                                                <div key={mIndex}
                                                    onClick={() => handleMatchClick(match)}
                                                    style={{ padding: '0.85rem 1rem', borderBottom: mIndex < (matchResults.find(g => g.jornada === selectedJornada)?.matches?.length - 1) ? '1px dashed rgba(255, 102, 0, 0.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0.25rem 0', borderRadius: '8px', cursor: 'pointer' }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', width: '15%', fontWeight: '500' }}>
                                                        {match.date || 'Fecha desconocida'}
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', fontSize: '1rem', color: match.home === 'RC HOSPITALET' ? 'var(--color-primary-orange)' : 'var(--color-primary-blue)' }}>
                                                        {match.home} <TeamLogo url={match.homeShield} name={match.home} size={32} />
                                                    </div>
                                                    <span style={{ backgroundColor: '#fff', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '2px solid rgba(255, 102, 0, 0.3)', minWidth: '70px', textAlign: 'center', fontWeight: '900', color: 'var(--color-primary-orange)', fontSize: '1.1rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        {match.scoreHome} - {match.scoreAway}
                                                    </span>
                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', fontSize: '1rem', color: match.away === 'RC HOSPITALET' ? 'var(--color-primary-orange)' : 'var(--color-primary-blue)' }}>
                                                        <TeamLogo url={match.awayShield} name={match.away} size={32} /> {match.away}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match); }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#dc3545',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '0.5rem',
                                                            borderRadius: '6px',
                                                            transition: 'background-color 0.2s',
                                                            opacity: 0.6
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'; e.currentTarget.style.opacity = 1; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = 0.6; }}
                                                        title="Borrar partido y estadísticas"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {matchResults.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No hay resultados disponibles.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Rivales */}
                            {activeTab === 'rivales' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {!selectedRival ? (
                                        <>
                                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-primary-blue)', fontWeight: 'bold' }}>Equipos Rivales</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                {rivalsList.map((rival, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            setSelectedRival(rival);
                                                            setRivalDetailTab('partidos'); // Reset to first tab
                                                            setSortConfig({ key: 'name', direction: 'asc' });
                                                        }}
                                                        style={{
                                                            padding: '1.5rem',
                                                            border: '1px solid rgba(255, 102, 0, 0.15)',
                                                            borderRadius: '16px',
                                                            textAlign: 'center',
                                                            fontWeight: 'bold',
                                                            color: 'var(--color-primary-blue)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            backgroundColor: 'var(--color-bg-orange)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '1rem',
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--color-primary-orange)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255, 102, 0, 0.15)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; }}
                                                    >
                                                        <TeamLogo url={leagueStats.find(t => t.team === rival)?.escudo} name={rival} size={60} />
                                                        <div style={{ fontSize: '1.1rem' }}>{rival}</div>
                                                    </div>
                                                ))}
                                                {rivalsList.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No se han encontrado equipos rivales.</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <button onClick={() => setSelectedRival(null)} style={{ background: 'var(--color-bg-orange)', border: '1px solid rgba(255, 102, 0, 0.2)', cursor: 'pointer', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                                                    <ArrowLeft size={20} /> Volver
                                                </button>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <TeamLogo url={leagueStats.find(t => t.team === selectedRival)?.escudo} name={selectedRival} size={48} />
                                                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-primary-blue)', fontWeight: 'bold' }}>{selectedRival}</h2>
                                                </div>
                                            </div>

                                            {/* RIVAL DETAIL TABS */}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                                {['partidos', 'estadisticas', 'jugadores', 'analisis'].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setRivalDetailTab(tab)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid',
                                                            borderColor: rivalDetailTab === tab ? 'var(--color-primary-orange)' : 'rgba(0, 51, 102, 0.1)',
                                                            backgroundColor: rivalDetailTab === tab ? 'var(--color-primary-orange)' : 'white',
                                                            color: rivalDetailTab === tab ? 'white' : 'var(--color-primary-blue)',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            textTransform: 'uppercase',
                                                            transition: 'all 0.2s',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>

                                            <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid rgba(0, 51, 102, 0.05)', padding: '1.25rem' }}>
                                                {/* PARTIDOS TAB */}
                                                {rivalDetailTab === 'partidos' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                                        {/* Match Sub-tabs */}
                                                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                            {matchResults.flatMap(g => g.matches)
                                                                .filter(m => m.home === selectedRival || m.away === selectedRival)
                                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                                .map((match, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => setSelectedRivalMatch(match)}
                                                                        style={{
                                                                            padding: '0.5rem 1rem',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid',
                                                                            borderColor: selectedRivalMatch?.id === match.id ? 'var(--color-primary-blue)' : 'rgba(0,0,0,0.1)',
                                                                            backgroundColor: selectedRivalMatch?.id === match.id ? 'var(--color-primary-blue)' : 'white',
                                                                            color: selectedRivalMatch?.id === match.id ? 'white' : 'var(--color-text-light)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.85rem',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {match.date} ({match.scoreHome}-{match.scoreAway})
                                                                    </button>
                                                                ))}
                                                        </div>

                                                        {/* Selected Match Details */}
                                                        {selectedRivalMatch && (
                                                            <MatchAnalysisView
                                                                match={selectedRivalMatch}
                                                                analysis={rivalMatchAnalysis}
                                                                onMatchClick={handleMatchClick}
                                                                MarkdownRenderer={MarkdownRenderer}
                                                            />
                                                        )}
                                                    </div>
                                                )
                                                }

                                                {/* ESTADISTICAS TAB */}
                                                {
                                                    rivalDetailTab === 'estadisticas' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                                            {/* Evolution Analysis */}
                                                            <TeamEvolutionAnalysis
                                                                matches={matchResults.flatMap(g => g.matches).filter(m => m.home === selectedRival || m.away === selectedRival)}
                                                                analyses={allAnalyses}
                                                                teamName={selectedRival}
                                                            />

                                                            {/* League Stats Cards */}
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                                                {(() => {
                                                                    const team = leagueStats.find(t => t.team === selectedRival) || {};
                                                                    return (
                                                                        <>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>PUNTOS LIGA</div>
                                                                                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary-orange)' }}>{team.puntos || 0}</div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>RÉCORD (G-E-P)</div>
                                                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{team.ganados}-{team.empatados}-{team.perdidos}</div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>PROM. FAVOR</div>
                                                                                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#28a745' }}>{team.jugados > 0 ? (team.favor / team.jugados).toFixed(1) : 0}</div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>PROM. CONTRA</div>
                                                                                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#dc3545' }}>{team.jugados > 0 ? (team.contra / team.jugados).toFixed(1) : 0}</div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>ENSAYOS / PARTIDO</div>
                                                                                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary-blue)' }}>{team.jugados > 0 ? (team.ensayos / team.jugados).toFixed(1) : 0}</div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(255, 102, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>DISCIPLINA (A/R)</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffc107' }}>
                                                                                        {playerStats.filter(p => p.team === selectedRival).reduce((acc, p) => acc + (p.amarillas || 0), 0)}
                                                                                    </span>
                                                                                    <span style={{ fontSize: '1.2rem', color: '#ccc' }}>/</span>
                                                                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc3545' }}>
                                                                                        {playerStats.filter(p => p.team === selectedRival).reduce((acc, p) => acc + (p.rojas || 0), 0)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* Detailed Game Stats */}
                                                            {(() => {
                                                                // Filter matches for this rival
                                                                const rivalMatches = matchResults
                                                                    .flatMap(g => g.matches)
                                                                    .filter(m => m.home === selectedRival || m.away === selectedRival);

                                                                // Find analysis for these matches
                                                                const analyzedMatches = rivalMatches.map(match => {
                                                                    let analysis = null;
                                                                    if (match.partido_externo_id) {
                                                                        analysis = allAnalyses.find(a => a.partido_externo_id === match.partido_externo_id);
                                                                    } else if (match.evento_id) {
                                                                        analysis = allAnalyses.find(a => a.evento_id === match.evento_id);
                                                                    }
                                                                    return { ...match, analysis };
                                                                }).filter(m => m.analysis && m.analysis.raw_json && m.analysis.raw_json.estadisticas);

                                                                const matchCount = analyzedMatches.length;

                                                                if (matchCount === 0) return null;

                                                                const stats = analyzedMatches.reduce((acc, m) => {
                                                                    const isHome = m.home === selectedRival;
                                                                    const teamKey = isHome ? 'local' : 'visitante';
                                                                    const s = m.analysis.raw_json.estadisticas;

                                                                    acc.scrumWon += (s.mele?.[`${teamKey}_ganada`] || 0);
                                                                    acc.scrumLost += (s.mele?.[`${teamKey}_perdida`] || 0);
                                                                    acc.lineoutWon += (s.touch?.[`${teamKey}_ganada`] || 0);
                                                                    acc.lineoutLost += (s.touch?.[`${teamKey}_perdida`] || 0);
                                                                    acc.tacklesMade += (s.placajes_hechos?.[teamKey] || 0);
                                                                    acc.tacklesMissed += (s.placajes_fallados?.[teamKey] || 0);
                                                                    return acc;
                                                                }, { scrumWon: 0, scrumLost: 0, lineoutWon: 0, lineoutLost: 0, tacklesMade: 0, tacklesMissed: 0 });

                                                                const StatCard = ({ title, value1, label1, value2, label2, value3, label3, color }) => (
                                                                    <div style={{ padding: '1.5rem', border: `1px solid ${color}40`, borderRadius: '12px', background: `linear-gradient(to bottom right, white, ${color}05)`, flex: 1, minWidth: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                                                        <div style={{ fontSize: '0.9rem', color: color, fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></span>
                                                                            {title}
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2c3e50' }}>{value1}</div>
                                                                                <div style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>{label1}</div>
                                                                            </div>
                                                                            <div style={{ width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2c3e50' }}>{value2}</div>
                                                                                <div style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>{label2}</div>
                                                                            </div>
                                                                            <div style={{ width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2c3e50' }}>{value3}</div>
                                                                                <div style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>{label3}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );

                                                                return (
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                                                                        <StatCard
                                                                            title="Melé"
                                                                            value1={`${stats.scrumWon}/${stats.scrumWon + stats.scrumLost}`}
                                                                            label1={`Ganadas (${matchCount > 0 ? Math.round((stats.scrumWon / ((stats.scrumWon + stats.scrumLost) || 1)) * 100) : 0}%)`}
                                                                            value2={(stats.scrumWon / matchCount).toFixed(1)}
                                                                            label2="Ganadas / Partido"
                                                                            value3={((stats.scrumWon + stats.scrumLost) / matchCount).toFixed(1)}
                                                                            label3="Intentos / Partido"
                                                                            color="#e67e22"
                                                                        />
                                                                        <StatCard
                                                                            title="Touch"
                                                                            value1={`${stats.lineoutWon}/${stats.lineoutWon + stats.lineoutLost}`}
                                                                            label1={`Ganadas (${matchCount > 0 ? Math.round((stats.lineoutWon / ((stats.lineoutWon + stats.lineoutLost) || 1)) * 100) : 0}%)`}
                                                                            value2={(stats.lineoutWon / matchCount).toFixed(1)}
                                                                            label2="Ganadas / Partido"
                                                                            value3={((stats.lineoutWon + stats.lineoutLost) / matchCount).toFixed(1)}
                                                                            label3="Intentos / Partido"
                                                                            color="#27ae60"
                                                                        />
                                                                        <StatCard
                                                                            title="Placajes"
                                                                            value1={`${stats.tacklesMade}/${stats.tacklesMade + stats.tacklesMissed}`}
                                                                            label1={`Efx (${matchCount > 0 ? Math.round((stats.tacklesMade / ((stats.tacklesMade + stats.tacklesMissed) || 1)) * 100) : 0}%)`}
                                                                            value2={(stats.tacklesMade / matchCount).toFixed(1)}
                                                                            label2="Realizados / Partido"
                                                                            value3={((stats.tacklesMade + stats.tacklesMissed) / matchCount).toFixed(1)}
                                                                            label3="Intentos / Partido"
                                                                            color="#2980b9"
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )
                                                }

                                                {/* JUGADORES TAB */}
                                                {
                                                    rivalDetailTab === 'jugadores' && (
                                                        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid rgba(255, 102, 0, 0.1)' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: 'rgba(0, 51, 102, 0.03)', color: 'var(--color-primary-blue)', textAlign: 'left' }}>
                                                                        <th onClick={() => handleSort('name')} style={{ padding: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>Jugador {renderSortIcon('name')}</th>
                                                                        <th onClick={() => handleSort('jugados')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>PJ {renderSortIcon('jugados')}</th>
                                                                        <th onClick={() => handleSort('titular')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Tit {renderSortIcon('titular')}</th>
                                                                        <th onClick={() => handleSort('minutos')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Min {renderSortIcon('minutos')}</th>
                                                                        <th onClick={() => handleSort('ensayos')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Ens {renderSortIcon('ensayos')}</th>
                                                                        <th onClick={() => handleSort('conversiones')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Tra {renderSortIcon('conversiones')}</th>
                                                                        <th onClick={() => handleSort('golpes')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Pen {renderSortIcon('golpes')}</th>
                                                                        <th onClick={() => handleSort('amarillas')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', color: '#ffc107' }}>Am {renderSortIcon('amarillas')}</th>
                                                                        <th onClick={() => handleSort('rojas')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', color: '#dc3545' }}>Ro {renderSortIcon('rojas')}</th>
                                                                        <th onClick={() => handleSort('puntos')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>Pts {renderSortIcon('puntos')}</th>
                                                                        <th onClick={() => handleSort('minutos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid #ddd', color: 'var(--color-text-light)', cursor: 'pointer' }}>M/P {renderSortIcon('minutos_pj')}</th>
                                                                        <th onClick={() => handleSort('ensayos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-light)', cursor: 'pointer' }}>E/P {renderSortIcon('ensayos_pj')}</th>
                                                                        <th onClick={() => handleSort('puntos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-light)', cursor: 'pointer' }}>P/P {renderSortIcon('puntos_pj')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sortData(playerStats.filter(p => p.team === selectedRival)).map((p, i) => (
                                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(169, 114, 114, 0.05)' }}>
                                                                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{p.name}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.jugados}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.titular}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{Math.round(p.minutos)}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.ensayos}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.conversiones}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.golpes}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: p.amarillas > 0 ? '#ffc107' : '#ccc' }}>{p.amarillas}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: p.rojas > 0 ? '#dc3545' : '#ccc' }}>{p.rojas}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{p.puntos}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #eee', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.minutos / p.jugados).toFixed(0) : 0}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.ensayos / p.jugados).toFixed(1) : 0}</td>
                                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.puntos / p.jugados).toFixed(1) : 0}</td>
                                                                        </tr>
                                                                    ))}
                                                                    {playerStats.filter(p => p.team === selectedRival).length === 0 && (
                                                                        <tr>
                                                                            <td colSpan="13" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Sin estadísticas individuales.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )
                                                }

                                                {/* ANALISIS TAB */}
                                                {
                                                    rivalDetailTab === 'analisis' && (
                                                        <RivalAnalysis
                                                            rivalName={selectedRival}
                                                            leagueStats={leagueStats}
                                                            playerStats={playerStats}
                                                            matchResults={matchResults}
                                                            allAnalyses={allAnalyses}
                                                        />
                                                    )
                                                }
                                            </div >
                                        </div >
                                    )}
                                </div >
                            )}

                            {/* TAB: RC HOSPITALET (Club specific) */}
                            {
                                activeTab === 'hospitalet' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {/* HOSPI TABS */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                            {['partidos', 'jugadores'].map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setHospitaletDetailTab(tab)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '10px',
                                                        border: '1px solid',
                                                        borderColor: hospitaletDetailTab === tab ? 'var(--color-primary-orange)' : 'rgba(0, 51, 102, 0.1)',
                                                        backgroundColor: hospitaletDetailTab === tab ? 'var(--color-primary-orange)' : 'white',
                                                        color: hospitaletDetailTab === tab ? 'white' : 'var(--color-primary-blue)',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        textTransform: 'uppercase',
                                                        transition: 'all 0.2s',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        {/* TAB: JUGADORES (Existing Logic) */}
                                        {hospitaletDetailTab === 'jugadores' && (
                                            <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', padding: '1rem', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 51, 102, 0.05)' }}>
                                                <div style={{ padding: '0 0.5rem 1rem 0.5rem', borderBottom: '1px solid rgba(0, 51, 102, 0.05)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png" alt="Hospi" style={{ width: '32px', height: '32px' }} />
                                                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-blue)', fontWeight: 'bold' }}>S16 - Estadísticas Individuales</h2>
                                                </div>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: 'rgba(0, 51, 102, 0.03)', color: 'var(--color-primary-blue)', textAlign: 'left' }}>
                                                            <th onClick={() => handleSort('name')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Nombre {renderSortIcon('name')}</th>
                                                            <th onClick={() => handleSort('jugados')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>PJ {renderSortIcon('jugados')}</th>
                                                            <th onClick={() => handleSort('titular')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Tit. {renderSortIcon('titular')}</th>
                                                            <th onClick={() => handleSort('minutos')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Min {renderSortIcon('minutos')}</th>
                                                            <th onClick={() => handleSort('ensayos')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Ens {renderSortIcon('ensayos')}</th>
                                                            <th onClick={() => handleSort('conversiones')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Tra {renderSortIcon('conversiones')}</th>
                                                            <th onClick={() => handleSort('golpes')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Pen {renderSortIcon('golpes')}</th>
                                                            <th onClick={() => handleSort('amarillas')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: '#ffc107' }}>Am {renderSortIcon('amarillas')}</th>
                                                            <th onClick={() => handleSort('rojas')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: '#dc3545' }}>Ro {renderSortIcon('rojas')}</th>
                                                            <th onClick={() => handleSort('puntos')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Pts {renderSortIcon('puntos')}</th>
                                                            <th onClick={() => handleSort('minutos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid #ddd', color: 'var(--color-text-light)', cursor: 'pointer' }}>M/P {renderSortIcon('minutos_pj')}</th>
                                                            <th onClick={() => handleSort('ensayos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-light)', cursor: 'pointer' }}>E/P {renderSortIcon('ensayos_pj')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortData(playerStats.filter(p => p.team?.toUpperCase().includes('HOSPITALET'))).map((p, i) => (
                                                            <tr key={i} style={{ borderBottom: '1px solid rgba(0, 51, 102, 0.05)', backgroundColor: 'rgba(255, 102, 0, 0.02)' }}>
                                                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{p.name}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.jugados}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.titular}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{Math.round(p.minutos)}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.ensayos}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.conversiones}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.golpes}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: p.amarillas > 0 ? '#ffc107' : '#ccc' }}>{p.amarillas}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: p.rojas > 0 ? '#dc3545' : '#ccc' }}>{p.rojas}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{p.puntos}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #eee', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.minutos / p.jugados).toFixed(0) : 0}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.ensayos / p.jugados).toFixed(1) : 0}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* TAB: PARTIDOS (New) */}
                                        {hospitaletDetailTab === 'partidos' && (
                                            <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 51, 102, 0.05)', padding: '1.25rem' }}>

                                                {/* Global Evolution Analysis */}
                                                <TeamEvolutionAnalysis
                                                    matches={matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME)}
                                                    analyses={allAnalyses}
                                                    teamName={HOSPITALET_NAME}
                                                />

                                                {/* Match List Selector */}
                                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    {matchResults.flatMap(g => g.matches)
                                                        .filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME)
                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                        .map((match, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setSelectedHospitaletMatch(match)}
                                                                style={{
                                                                    padding: '0.5rem 1rem',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid',
                                                                    borderColor: selectedHospitaletMatch?.id === match.id ? 'var(--color-primary-blue)' : 'rgba(0,0,0,0.1)',
                                                                    backgroundColor: selectedHospitaletMatch?.id === match.id ? 'var(--color-primary-blue)' : 'white',
                                                                    color: selectedHospitaletMatch?.id === match.id ? 'white' : 'var(--color-text-light)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {match.date} ({match.scoreHome}-{match.scoreAway})
                                                            </button>
                                                        ))}

                                                    {matchResults.flatMap(g => g.matches).filter(m => m.home === HOSPITALET_NAME || m.away === HOSPITALET_NAME).length === 0 && (
                                                        <p style={{ color: '#888' }}>No hay partidos registrados para Hospitalet.</p>
                                                    )}
                                                </div>

                                                {/* Match View - Reusing Component */}
                                                {selectedHospitaletMatch && (
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <MatchAnalysisView
                                                            match={selectedHospitaletMatch}
                                                            analysis={hospitaletMatchAnalysis}
                                                            onMatchClick={handleMatchClick}
                                                            MarkdownRenderer={MarkdownRenderer}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            {/* TAB: GLOBAL (All players) */}
                            {
                                activeTab === 'jugadores' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ backgroundColor: 'var(--color-bg-pastel-orange)', borderRadius: '16px', padding: '1rem', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 51, 102, 0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'rgba(0, 51, 102, 0.03)', color: 'var(--color-primary-blue)', textAlign: 'left' }}>
                                                        <th onClick={() => handleSort('name')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Nombre {renderSortIcon('name')}</th>
                                                        <th onClick={() => handleSort('team')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Equipo {renderSortIcon('team')}</th>
                                                        <th onClick={() => handleSort('jugados')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>PJ {renderSortIcon('jugados')}</th>
                                                        <th onClick={() => handleSort('ensayos')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Ens {renderSortIcon('ensayos')}</th>
                                                        <th onClick={() => handleSort('amarillas')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: '#ffc107' }}>Am {renderSortIcon('amarillas')}</th>
                                                        <th onClick={() => handleSort('rojas')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: '#dc3545' }}>Ro {renderSortIcon('rojas')}</th>
                                                        <th onClick={() => handleSort('puntos')} style={{ padding: '0.5rem', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>Pts {renderSortIcon('puntos')}</th>
                                                        <th onClick={() => handleSort('minutos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid #ddd', color: 'var(--color-text-light)', cursor: 'pointer' }}>M/P {renderSortIcon('minutos_pj')}</th>
                                                        <th onClick={() => handleSort('ensayos_pj')} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-light)', cursor: 'pointer' }}>E/P {renderSortIcon('ensayos_pj')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortData(playerStats).map((p, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0, 51, 102, 0.05)', backgroundColor: p.team?.toUpperCase().includes('HOSPITALET') ? 'rgba(255, 102, 0, 0.05)' : 'transparent' }}>
                                                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{p.name}</td>
                                                            <td style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>{p.team}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.jugados}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.ensayos}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: p.amarillas > 0 ? '#ffc107' : '#ccc' }}>{p.amarillas}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: p.rojas > 0 ? '#dc3545' : '#ccc' }}>{p.rojas}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{p.puntos}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', borderLeft: '1px solid #eee', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.minutos / p.jugados).toFixed(0) : 0}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>{p.jugados > 0 ? (p.ensayos / p.jugados).toFixed(1) : 0}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            }
                        </>
                    )
                }
                {/* Modal Render */}
                {
                    selectedMatch && (
                        <MatchDetailsModal
                            match={selectedMatch}
                            onClose={() => setSelectedMatch(null)}
                        />
                    )
                }
            </div >
        </div >
    );
};

export default StatsPage;
