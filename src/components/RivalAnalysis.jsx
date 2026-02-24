import React from 'react';
import { Trophy, Swords, Shield, ArrowRightLeft, Target, Users } from 'lucide-react';

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

            if (analysis?.raw_json) {
                const raw = analysis.raw_json;
                const isHome = m.home === rivalName;
                const teamKey = isHome ? 'local' : 'visitante';
                const teamKeyAlt = isHome ? 'local' : 'visitor';

                const report = raw.match_report?.key_stats;
                const legacy = raw.estadisticas;

                totalPossession += (report?.posesion?.[teamKeyAlt] ?? legacy?.posesion?.[teamKey] ?? 50);
                totalTacklesMade += (report?.placajes_exito?.[teamKeyAlt] ?? legacy?.placajes_hechos?.[teamKey] ?? 0);
                totalTacklesMissed += (report?.placajes_fallados?.[teamKeyAlt] ?? legacy?.placajes_fallados?.[teamKey] ?? 0);

                totalScrumWon += (report?.meles_ganadas?.[teamKeyAlt] ?? legacy?.mele?.[`${teamKey}_ganada`] ?? 0);
                totalScrumLost += (report?.meles_perdidas?.[teamKeyAlt] ?? legacy?.mele?.[`${teamKey}_perdida`] ?? 0);

                totalLineoutWon += (report?.touches_ganadas?.[teamKeyAlt] ?? legacy?.touch?.[`${teamKey}_ganada`] ?? 0);
                totalLineoutLost += (report?.touches_perdidas?.[teamKeyAlt] ?? legacy?.touch?.[`${teamKey}_perdida`] ?? 0);

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
        let formText = "Datos de clasificación no disponibles. ";
        if (team && team.ranking) {
            formText = `El equipo marcha ${team.ranking}º en la clasificación con ${team.puntos} puntos. `;
            if (winRate > 70) formText += "Llegan con una dinámica ganadora muy fuerte, siendo uno de los rivales a batir. ";
            else if (winRate < 30) formText += "Han tenido dificultades para cerrar partidos esta temporada. ";
            else formText += "Es un equipo competitivo que alterna buenos resultados con irregularidad. ";
        }

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
                                src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Informe%20de%20analista.png"
                                alt="Analyst Icon"
                                style={{ width: '64px', height: '64px', objectFit: 'contain', marginRight: '0.5rem' }}
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
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posesión</div>
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
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Máximo Anotador ({topScorer.puntos} pts)</div>
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

export default RivalAnalysis;
