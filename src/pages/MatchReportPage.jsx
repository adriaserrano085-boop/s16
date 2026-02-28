
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/apiClient';
import { analysisService } from '../services/analysisService';
import { ArrowLeft } from 'lucide-react';
import { MatchAnalysisView } from '../components/MatchAnalysisView';
import MarkdownRenderer from '../components/MarkdownRenderer';

const MatchReportPage = ({ user }) => {
    const { type, id } = useParams(); // type: 'internal' or 'external'
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [match, setMatch] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [personalStats, setPersonalStats] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatchData = async () => {
            setLoading(true);
            try {
                let matchData = null;
                let analysisData = null;

                // Fetch All Players for mapping (photos, etc.)
                const playersData = await apiGet('/jugadores_propios/').catch(() => []);
                setAllPlayers(playersData || []);

                // 1. Fetch Match Details
                if (type === 'internal') {
                    const data = await apiGet(`/partidos/${id}`).catch(() => null);

                    if (data) {
                        // Fetch rival for name and shield
                        const rivalId = data.rival_id || data.Rival;
                        let rivalName = "Rival";
                        let rivalShield = null;

                        if (rivalId) {
                            const rivals = await apiGet('/rivales').catch(() => []);
                            const rival = rivals.find(r => r.id === rivalId || r.nombre_equipo === rivalId);
                            if (rival) {
                                rivalName = rival.nombre_equipo;
                                rivalShield = rival.escudo;
                            }
                        }

                        matchData = {
                            id: data.id,
                            date: data.fecha,
                            home: data.es_local ? "RC HOSPITALET" : rivalName,
                            away: data.es_local ? rivalName : "RC HOSPITALET",
                            homeShield: data.es_local ? "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png" : rivalShield,
                            awayShield: data.es_local ? rivalShield : "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png",
                            scoreHome: data.marcador_local,
                            scoreAway: data.marcador_visitante,
                            partido_id: data.id,
                            evento_id: data.Evento
                        };

                        // Fetch Analysis by Event ID (preferred) or Match ID
                        if (data.Evento) {
                            analysisData = await analysisService.getByEventId(data.Evento);
                        }
                    }
                } else if (type === 'external') {
                    const data = await apiGet(`/partidos_externos/${id}`).catch(() => null);

                    if (data) {
                        // Simple shield fetch helper
                        const getShield = async (name) => {
                            if (name === "RC HOSPITALET") return "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";
                            const rivals = await apiGet('/rivales').catch(() => []);
                            const r = rivals.find(riv => riv.nombre_equipo === name);
                            return r?.escudo || null;
                        };

                        const homeShield = await getShield(data.equipo_local);
                        const awayShield = await getShield(data.equipo_visitante);

                        matchData = {
                            id: data.id,
                            date: data.fecha,
                            home: data.equipo_local,
                            away: data.equipo_visitante,
                            homeShield: homeShield,
                            awayShield: awayShield,
                            scoreHome: data.marcador_local,
                            scoreAway: data.marcador_visitante,
                            partido_externo_id: data.id
                        };

                        analysisData = await analysisService.getByExternalMatchId(data.id);
                    }
                }

                setMatch(matchData);
                setAnalysis(analysisData);

                // 2. Fetch Personal Stats if User is a Player
                if (user?.role === 'JUGADOR' && user.playerId) {
                    const allStats = await apiGet('/estadisticas_jugador').catch(() => []);
                    const pStats = allStats.find(s =>
                        s.jugador === user.playerId &&
                        (type === 'internal' ? s.partido === id : s.partido_externo === id)
                    );

                    if (pStats) {
                        setPersonalStats(pStats);
                    }
                }

            } catch (err) {
                console.error("Error fetching match report:", err);
                setError("No se pudo cargar el informe del partido.");
            } finally {
                setLoading(false);
            }
        };

        if (id && type) {
            fetchMatchData();
        }
    }, [type, id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h3>Error</h3>
                <p>{error || "Partido no encontrado."}</p>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}>
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>

                {/* Header */}
                <header style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--color-primary-blue)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--color-primary-blue)' }}>
                        Informe del Partido
                    </h1>
                </header>

                <div className="rival-detail-container flex-column gap-1">
                    <MatchAnalysisView
                        match={match}
                        analysis={analysis}
                        MarkdownRenderer={MarkdownRenderer}
                        personalStats={personalStats}
                        user={user}
                        allPlayers={allPlayers}
                    />
                </div>
            </div>
        </div>
    );
};

export default MatchReportPage;
