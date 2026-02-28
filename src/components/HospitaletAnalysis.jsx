import React, { useMemo } from 'react';
import { Trophy, Swords, Shield, Target, ArrowRightLeft, Users, Activity } from 'lucide-react';

export const HospitaletAnalysis = ({ matches, analyses, playerStats, leagueStats }) => {

    // Helper: Get analysis for a match
    const getAnalysis = (match) => {
        if (!match || !analyses) return null;
        if (match.partido_externo_id) return analyses.find(a => a.partido_externo_id === match.partido_externo_id);
        if (match.evento_id) return analyses.find(a => a.evento_id === match.evento_id);
        return null;
    };

    // 0. DATA PREPARATION
    const teamStats = useMemo(() => {
        if (!leagueStats) return {};
        return leagueStats.find(t => t.team === "RC L'HOSPITALET") || {};
    }, [leagueStats]);

    // 1. RIVAL COMPARISON LOGIC (Double Headers)
    const rivalComparisons = useMemo(() => {
        const byRival = {};
        matches.forEach(m => {
            const rival = m.home === "RC L'HOSPITALET" ? m.away : m.home;
            if (!byRival[rival]) byRival[rival] = [];
            byRival[rival].push(m);
        });

        const comparisons = [];
        Object.entries(byRival).forEach(([rival, rivalMatches]) => {
            rivalMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

            if (rivalMatches.length >= 2) {
                const m1 = rivalMatches[0];
                const m2 = rivalMatches[rivalMatches.length - 1]; // Compare first and last if more than 2

                const getScore = (m) => m.home === "RC L'HOSPITALET" ? m.scoreHome : m.scoreAway;
                const getConceded = (m) => m.home === "RC L'HOSPITALET" ? m.scoreAway : m.scoreHome;

                comparisons.push({
                    rival,
                    m1,
                    m2,
                    scoreDiff: getScore(m2) - getScore(m1),
                    concededDiff: getConceded(m2) - getConceded(m1),
                    improved: (getScore(m2) - getScore(m1)) > 0
                });
            }
        });

        return comparisons;
    }, [matches]);

    // 2. STRATEGIC PROPOSALS (1-3-3-1 System) & REPORT GENERATION
    const reportData = useMemo(() => {
        // Aggregate Stats
        let totalPossession = 0;
        let possessionCount = 0;
        let totalTacklesMissed = 0;
        let totalTacklesMade = 0;
        let totalScrumWon = 0;
        let totalScrumTotal = 0;
        let totalLineoutWon = 0;
        let totalLineoutTotal = 0;
        let analyzedGames = 0;

        matches.forEach(m => {
            const analysis = getAnalysis(m);
            if (analysis?.raw_json) {
                const raw = analysis.raw_json;
                const isHome = m.home === 'RC HOSPITALET';
                const teamKey = isHome ? 'local' : 'visitante';
                const teamKeyAlt = isHome ? 'local' : 'visitor';

                const report = raw.match_report?.key_stats;
                const legacy = raw.estadisticas;

                // Possession
                const pVal = report?.posesion?.[teamKeyAlt] ?? legacy?.posesion?.[teamKey];
                if (pVal !== undefined) {
                    totalPossession += pVal;
                    possessionCount++;
                }

                // Tackles
                totalTacklesMade += (report?.placajes_exito?.[teamKeyAlt] ?? legacy?.placajes_hechos?.[teamKey] ?? 0);
                totalTacklesMissed += (report?.placajes_fallados?.[teamKeyAlt] ?? legacy?.placajes_fallados?.[teamKey] ?? 0);

                // Scrum
                const scWon = report?.meles_ganadas?.[teamKeyAlt] ?? legacy?.mele?.[isHome ? 'local_ganada' : 'visitante_ganada'] ?? 0;
                const scLost = report?.meles_perdidas?.[teamKeyAlt] ?? legacy?.mele?.[isHome ? 'local_perdida' : 'visitante_perdida'] ?? 0;
                totalScrumWon += scWon;
                totalScrumTotal += (scWon + scLost);

                // Lineout
                const lWon = report?.touches_ganadas?.[teamKeyAlt] ?? legacy?.touch?.[isHome ? 'local_ganada' : 'visitante_ganada'] ?? 0;
                const lLost = report?.touches_perdidas?.[teamKeyAlt] ?? legacy?.touch?.[isHome ? 'local_perdida' : 'visitante_perdida'] ?? 0;
                totalLineoutWon += lWon;
                totalLineoutTotal += (lWon + lLost);

                analyzedGames++;
            }
        });

        const avgPossession = possessionCount > 0 ? Math.round(totalPossession / possessionCount) : 0;
        const tackleSuccess = (totalTacklesMade + totalTacklesMissed) > 0
            ? Math.round((totalTacklesMade / (totalTacklesMade + totalTacklesMissed)) * 100)
            : 0;
        const scrumSuccess = totalScrumTotal > 0 ? Math.round((totalScrumWon / totalScrumTotal) * 100) : 0;
        const lineoutSuccess = totalLineoutTotal > 0 ? Math.round((totalLineoutWon / totalLineoutTotal) * 100) : 0;

        // Core Metrics from League Stats
        const winRate = teamStats.jugados > 0 ? Math.round((teamStats.ganados / teamStats.jugados) * 100) : 0;
        const pointsPerGame = teamStats.jugados > 0 ? (teamStats.favor / teamStats.jugados).toFixed(0) : 0;
        const triesPerGame = teamStats.jugados > 0 ? (teamStats.ensayos / teamStats.jugados).toFixed(1) : 0;
        const pointsConceded = teamStats.jugados > 0 ? (teamStats.contra / teamStats.jugados).toFixed(0) : 0;

        // --- GENERATE SECTIONS ---
        const sections = [];

        // 1. Contexto Competitivo
        let contextText = `Actualmente en la posición #${teamStats.ranking || '-'} de la liga. `;
        if (winRate > 60) contextText += "El equipo mantiene una dinámica positiva, consolidándose en la parte alta. ";
        else if (winRate < 40) contextText += "Temporada de construcción, donde la regularidad está siendo el principal desafío. ";
        else contextText += "Rendimiento equilibrado, capaz de competir contra cualquier rival. ";

        sections.push({
            title: "Contexto Competitivo",
            icon: <Trophy size={18} />,
            content: contextText,
            color: "#3b82f6"
        });

        // 2. Perfil Ofensivo (1-3-3-1 Context)
        let attackText = `Promedio de ${pointsPerGame} puntos y ${triesPerGame} ensayos por partido. `;
        if (analyzedGames > 0) {
            if (avgPossession > 50) {
                attackText += `Con un ${avgPossession}% de posesión, el sistema 1-3-3-1 está logrando conservar el balón. `;
                attackText += "Es vital mantener la velocidad de los rucks para aprovechar las superioridades en los canales anchos (carrileros).";
            } else {
                attackText += `La posesión es baja (${avgPossession}%), lo que dificulta establecer la estructura de pods. `;
                attackText += "Los delanteros están gastando energía en defensa en lugar de impuso ofensivo.";
            }
        }
        sections.push({
            title: "Fase Ofensiva (Sistema 1-3-3-1)",
            icon: <Swords size={18} />,
            content: attackText,
            color: "#ef4444"
        });

        // 3. Perfil Defensivo
        const hospitaletPlayers = playerStats.filter(p => p.team && (p.team.includes('HOSPITALET') || p.team.includes("L'H")));
        const totalYellows = hospitaletPlayers.reduce((sum, p) => sum + (p.amarillas || 0), 0);
        const totalReds = hospitaletPlayers.reduce((sum, p) => sum + (p.rojas || 0), 0);

        let defenseText = `Encajando ${pointsConceded} puntos por partido. `;
        defenseText += `Acumulan ${totalYellows} tarjetas amarillas y ${totalReds} rojas en la temporada. `;

        if (analyzedGames > 0) {
            defenseText += `La efectividad en el placaje es del ${tackleSuccess}%. `;
            if (tackleSuccess < 85) {
                defenseText += "Este porcentaje es crítico. En nuestro sistema, fallar el primer placaje obliga a cerrar la defensa, dejando expuestos los extremos. ";
                defenseText += "Necesitamos mejorar la comunicación en el 'post-placaje' para reposicionar la línea rápidamente.";
            } else {
                defenseText += "Sólida base defensiva. El desafío ahora es la recuperación rápida (jackal) para lanzar contraataques con los backs.";
            }
        }

        // Discipline Check
        if (totalYellows > 5) defenseText += " La disciplina está siendo un problema reiterado que nos deja en inferioridad numérica con demasiada frecuencia.";

        sections.push({
            title: "Fase Defensiva",
            icon: <Shield size={18} />,
            content: defenseText,
            color: "#10b981"
        });

        // 4. Fases Estáticas
        if (analyzedGames > 0) {
            let setPieceText = `Melé: ${scrumSuccess}% | Touch: ${lineoutSuccess}%. `;
            if (scrumSuccess < 85) setPieceText += "La melé necesita mayor estabilidad para ser una plataforma de lanzamiento fiable para los pods de medios. ";
            if (lineoutSuccess < 80) setPieceText += "La obtención en touch debe mejorar para asegurar balones limpios en campo rival. ";
            if (scrumSuccess >= 85 && lineoutSuccess >= 80) setPieceText += "Excelentes plataformas de obtención. Podemos permitirnos jugadas de primera fase más ambiciosas.";

            sections.push({
                title: "Fases Estáticas",
                icon: <ArrowRightLeft size={18} />,
                content: setPieceText,
                color: "#f59e0b"
            });
        }

        // 5. Recomendaciones Estratégicas (Advanced)
        let tacticsText = "Disciplina Territorial: ";
        if (avgPossession < 45) tacticsText += "Priorizar el juego al pie para jugar en campo contrario y presionar su obtención. No arriesgar en zona propia. ";
        else tacticsText += "Utilizar el pie ofensivo para girar a su defensa y desgastarlos físicamente. ";

        tacticsText += " | Sistema 1-3-3-1: ";
        if (avgPossession > 50) tacticsText += "Variar el punto de contacto. Alternar pod cerrado con pase a la espalda para los 'playmakers' en los carriles. ";
        else tacticsText += "Simplificar el plan de juego. Pods de penetración directa para generar inercia antes de abrir. ";

        sections.push({
            title: "Recomendaciones Estratégicas",
            icon: <Target size={18} />,
            content: tacticsText,
            color: "#8b5cf6"
        });

        return {
            stats: { avgPossession, tackleSuccess, scrumSuccess, analyzedGames },
            sections
        };
    }, [matches, analyses, teamStats]);

    const IconArrowUp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
    const IconArrowDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;

    // Top players calculation
    const topScorer = useMemo(() => [...playerStats].filter(p => p.team?.includes('HOSPITALET')).sort((a, b) => b.puntos - a.puntos)[0], [playerStats]);
    const topTryScorer = useMemo(() => [...playerStats].filter(p => p.team?.includes('HOSPITALET')).sort((a, b) => b.ensayos - a.ensayos)[0], [playerStats]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 1. HEADER / SUMMARY CARD */}
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary-blue) 0%, #1e40af 100%)', padding: '2rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0, 51, 102, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <img
                                src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Informe%20de%20analista.png"
                                alt="Analyst Icon"
                                style={{ width: '64px', height: '64px', objectFit: 'contain', marginRight: '0.5rem' }}
                            />
                            <h3 style={{ margin: 0, fontSize: '2rem', color: 'white', fontWeight: '900', letterSpacing: '-0.5px' }}>Informe Técnico RC L'H</h3>
                        </div>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                            Análisis de rendimiento integral basado en {teamStats.jugados || 0} partidos de liga{reportData.stats.analyzedGames > 0 ? ` y ${reportData.stats.analyzedGames} partidos videoanalizados.` : '.'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ranking</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>#{teamStats.ranking || '-'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Victorias</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{teamStats.ganados || 0}</div>
                    </div>
                    {reportData.stats.analyzedGames > 0 && (
                        <>
                            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posesión Media</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.stats.avgPossession}%</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Placaje</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.stats.tackleSuccess}%</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 2. REPORT SECTIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {reportData.sections.map((section, idx) => (
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

            {/* 3. KEY PLAYERS */}
            <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} /> Líderes Estadísticos
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
                    {topTryScorer && (
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

            {/* 4. RIVAL EVOLUTION (Double Headers) */}
            {rivalComparisons.length > 0 && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginTop: '2rem' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--color-primary-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={20} /> Evolución vs Rivales (Ida y Vuelta)
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#888', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    <th style={{ padding: '1rem' }}>Rival</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Ida</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Vuelta</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Dif. Puntos</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Dif. Defensa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rivalComparisons.map((comp, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{comp.rival}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{comp.m1.result || `${comp.m1.home === 'RC HOSPITALET' ? comp.m1.scoreHome : comp.m1.scoreAway} - ${comp.m1.home === 'RC HOSPITALET' ? comp.m1.scoreAway : comp.m1.scoreHome}`}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#999' }}>{comp.m1.date}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{comp.m2.result || `${comp.m2.home === 'RC HOSPITALET' ? comp.m2.scoreHome : comp.m2.scoreAway} - ${comp.m2.home === 'RC HOSPITALET' ? comp.m2.scoreAway : comp.m2.scoreHome}`}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#999' }}>{comp.m2.date}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', color: comp.scoreDiff >= 0 ? '#28a745' : '#dc3545' }}>
                                                {comp.scoreDiff > 0 ? '+' : ''}{comp.scoreDiff}
                                                {comp.scoreDiff >= 0 ? <IconArrowUp /> : <IconArrowDown />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', color: comp.concededDiff <= 0 ? '#28a745' : '#dc3545' }}>
                                                {comp.concededDiff > 0 ? '+' : ''}{comp.concededDiff}
                                                {comp.concededDiff <= 0 ? <IconArrowUp /> : <IconArrowDown />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
