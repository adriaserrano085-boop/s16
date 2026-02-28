import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/apiClient';
import { leagueService } from '../services/leagueService';
import { analysisService } from '../services/analysisService';
import RivalAnalysis from '../components/RivalAnalysis';
import { ArrowLeft } from 'lucide-react';

const RivalAnalysisPage = ({ user }) => {
    const { rivalId } = useParams(); // rivalId will be the Name in this case, or ID if we change route
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [leagueStats, setLeagueStats] = useState([]);
    const [matchResults, setMatchResults] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [allAnalyses, setAllAnalyses] = useState([]);
    const HOSPITALET_NAME = "RC L'HOSPITALET";

    // Decoded rival name from URL (e.g., "RC Sitges")
    const rivalName = decodeURIComponent(rivalId);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Standings
                const standings = await leagueService.getStandings();
                setLeagueStats(standings);

                // 2. Fetch Match Stats
                const statsData = await apiGet('/estadisticas_partido').catch(() => []);
                const allPartidos = await apiGet('/partidos').catch(() => []);
                const allPartidosExternos = await apiGet('/partidos_externos').catch(() => []);
                const allRivales = await apiGet('/rivales').catch(() => []);

                const results = [];
                // Process matches similarly to StatsPage but simpler
                if (statsData) {
                    statsData.forEach(stat => {
                        let homeName = "Desconocido Local";
                        let awayName = "Desconocido Visitante";
                        let date = stat.fecha;

                        // Determine names based on source
                        const p = allPartidos.find(part => part.id === stat.partido);
                        const pe = allPartidosExternos.find(pext => pext.id === stat.partido_externo);

                        if (p) {
                            // Internal Match
                            const rival = allRivales.find(r => r.id === p.rival_id || r.nombre_equipo === p.Rival);
                            const rivalNameStr = rival?.nombre_equipo || p.Rival || "Rival";
                            if (p.es_local) {
                                homeName = HOSPITALET_NAME;
                                awayName = rivalNameStr;
                            } else {
                                homeName = rivalNameStr;
                                awayName = HOSPITALET_NAME;
                            }
                        } else if (pe) {
                            // External Match
                            homeName = pe.equipo_local;
                            awayName = pe.equipo_visitante;
                        }

                        if (p || pe) {
                            results.push({
                                partido_id: stat.partido,
                                partido_externo_id: stat.partido_externo,
                                evento_id: p?.Evento,
                                home: homeName,
                                away: awayName,
                                scoreHome: stat.marcador_local,
                                scoreAway: stat.marcador_visitante,
                                date: date
                            });
                        }
                    });
                }

                // Wrap in structure expected by RivalAnalysis ( { matches: [] } )
                setMatchResults([{ matches: results }]);


                // 3. Fetch Player Stats (Needed for top scorers etc.)
                const rawStats = await apiGet('/estadisticas_jugador').catch(() => []);
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
                        p.puntos = (p.ensayos * 5) + (p.conversiones * 2) + (p.golpes * 3);
                    });
                    setPlayerStats(Object.values(aggregated));
                }

                // 4. Fetch All Analyses (for video stats)
                const analyses = await analysisService.getAll();
                if (analyses) setAllAnalyses(analyses);

            } catch (err) {
                console.error("Error fetching data for rival analysis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rivalName]);


    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-background)',
            paddingBottom: '2rem'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        fontSize: '1rem',
                        padding: '0.5rem 0'
                    }}
                >
                    <ArrowLeft size={20} />
                    Volver al Dashboard
                </button>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
                        Cargando análisis de {rivalName}...
                    </div>
                ) : (
                    <RivalAnalysis
                        rivalName={rivalName}
                        leagueStats={leagueStats}
                        playerStats={playerStats}
                        matchResults={matchResults}
                        allAnalyses={allAnalyses}
                    />
                )}
            </div>
        </div>
    );
};

export default RivalAnalysisPage;
