import React, { useMemo } from 'react';

export const TeamEvolutionAnalysis = ({ matches, analyses, teamName = "RC L'HOSPITALET" }) => {

    // Process data to calculate stats
    const stats = useMemo(() => {
        if (!matches || matches.length === 0) return null;

        // 1. Link matches with their analysis
        const analyzedMatches = matches.map(match => {
            let analysis = null;
            if (match.partido_externo_id) {
                analysis = analyses.find(a => a.partido_externo_id === match.partido_externo_id);
            } else if (match.evento_id) {
                analysis = analyses.find(a => a.evento_id === match.evento_id);
            }
            return { ...match, analysis };
        }).filter(m => {
            if (!m.analysis?.raw_json) return false;
            const r = m.analysis.raw_json;
            return r.estadisticas || r.match_report?.key_stats;
        });

        // Filter and sort for technical analysis
        const sortedAnalyzedMatches = analyzedMatches.length > 0
            ? [...analyzedMatches].sort((a, b) => new Date(b.date) - new Date(a.date))
            : [];

        const getStatValue = (analysis, category, subcategory, team) => {
            const cat = analysis?.raw_json?.estadisticas?.[category];
            if (!cat) return 0;
            // Handle nested objects like placajes_hechos.local
            if (subcategory) {
                return cat[subcategory]?.[team] ?? 0;
            }
            return cat[team] ?? 0;
        };

        // Helper to aggregate stats for a set of matches
        const aggregateStats = (matchSet) => {
            if (matchSet.length === 0) return null;

            const total = {
                possession: 0,
                tacklesMade: 0,
                tacklesMissed: 0,
                scrumWon: 0,
                scrumLost: 0,
                lineoutWon: 0,
                lineoutLost: 0,
                count: 0
            };

            matchSet.forEach(m => {
                const isHome = m.home === teamName;
                const teamSfx = isHome ? 'local' : 'visitante';
                const teamKeyAlt = isHome ? 'local' : 'visitor';

                // NEW: Use structured columns first, fallback to JSON
                const raw = m.analysis?.raw_json;
                const report = raw?.match_report?.key_stats;
                const legacy = raw?.estadisticas;

                // Possession
                total.possession += (m[`posesion_${teamSfx}`] ?? report?.posesion?.[teamKeyAlt] ?? legacy?.posesion?.[teamSfx] ?? 0);

                // Tackles
                total.tacklesMade += (m[`placajes_hechos_${teamSfx}`] ?? report?.placajes_exito?.[teamKeyAlt] ?? legacy?.placajes_hechos?.[teamSfx] ?? 0);
                total.tacklesMissed += (m[`placajes_fallados_${teamSfx}`] ?? report?.placajes_fallados?.[teamKeyAlt] ?? legacy?.placajes_fallados?.[teamSfx] ?? 0);

                // Scrum
                const sw = m[`mele_ganada_${teamSfx}`];
                const sl = m[`mele_perdida_${teamSfx}`];
                if (sw !== undefined && sw !== null) {
                    total.scrumWon += sw;
                    total.scrumLost += (sl ?? 0);
                } else {
                    total.scrumWon += (report?.meles_ganadas?.[teamKeyAlt] ?? legacy?.mele?.[`${teamSfx}_ganada`] ?? 0);
                    total.scrumLost += (report?.meles_perdidas?.[teamKeyAlt] ?? legacy?.mele?.[`${teamSfx}_perdida`] ?? 0);
                }

                // Lineout
                const tw = m[`touch_ganada_${teamSfx}`];
                const tl = m[`touch_perdida_${teamSfx}`];
                if (tw !== undefined && tw !== null) {
                    total.lineoutWon += tw;
                    total.lineoutLost += (tl ?? 0);
                } else {
                    total.lineoutWon += (report?.touches_ganadas?.[teamKeyAlt] ?? legacy?.touch?.[`${teamSfx}_ganada`] ?? 0);
                    total.lineoutLost += (report?.touches_perdidas?.[teamKeyAlt] ?? legacy?.touch?.[`${teamSfx}_perdida`] ?? 0);
                }

                total.count++;
            });

            return {
                possession: Math.round(total.possession / total.count),
                tacklesEff: Math.round((total.tacklesMade / ((total.tacklesMade + total.tacklesMissed) || 1)) * 100),
                scrumSuccess: Math.round((total.scrumWon / ((total.scrumWon + total.scrumLost) || 1)) * 100),
                lineoutSuccess: Math.round((total.lineoutWon / ((total.lineoutWon + total.lineoutLost) || 1)) * 100),
                matchesCount: total.count
            };
        };

        const seasonStats = sortedAnalyzedMatches.length > 0 ? aggregateStats(sortedAnalyzedMatches) : null;
        const last3Stats = sortedAnalyzedMatches.length > 0 ? aggregateStats(sortedAnalyzedMatches.slice(0, 3)) : null;

        // 2. Global Wins/Losses/Points (from ALL matches passed)
        const global = {
            wins: 0, draws: 0, losses: 0,
            pj: matches.length,
            pointsFor: 0, pointsAgainst: 0,
            tries: 0
        };

        matches.forEach(m => {
            const isHome = m.home === teamName;
            const pf = isHome ? m.scoreHome : m.scoreAway;
            const pa = isHome ? m.scoreAway : m.scoreHome;
            const tr = isHome ? m.ensayosHome : m.ensayosAway;

            global.pointsFor += (pf || 0);
            global.pointsAgainst += (pa || 0);
            global.tries += (tr || 0);

            if (pf > pa) global.wins++;
            else if (pf < pa) global.losses++;
            else if (pf !== null && pa !== null) global.draws++;
        });

        return { season: seasonStats, last3: last3Stats, global };
    }, [matches, analyses, teamName]);

    if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No hay datos suficientes para generar un análisis detallado.</div>;

    const ComparisonCard = ({ title, valueAvg, valueRecent, unit = "%", icon }) => {
        const diff = valueRecent - valueAvg;
        let trendColor = '#666';
        let TrendIcon = null;

        if (diff > 0) {
            trendColor = '#10B981'; // Green
            TrendIcon = <span style={{ color: trendColor }}>↑</span>;
        } else if (diff < 0) {
            trendColor = '#EF4444'; // Red
            TrendIcon = <span style={{ color: trendColor }}>↓</span>;
        } else {
            TrendIcon = <span style={{ color: trendColor }}>=</span>;
        }

        return (
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {icon} {title}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-primary-blue)' }}>{valueRecent}{unit}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>últimos 3</div>
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{valueAvg}{unit}</span> media temp.
                    {TrendIcon}
                    <span style={{ color: trendColor, fontWeight: 'bold' }}>{diff > 0 ? '+' : ''}{diff}{unit}</span>
                </div>
            </div>
        );
    };

    const ChartIcon = ({ path }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>;

    const KpiCard = ({ label, value, color, subValue }) => (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', flex: 1, minWidth: '120px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: color, lineHeight: 1 }}>{value}</div>
            {subValue && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem', fontWeight: '600' }}>{subValue}</div>}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease' }}>

            {/* 1. Global Summary Section */}
            <div className="summary-section">
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-blue)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                    <ChartIcon path={<path d="M12 20V10M18 20V4M6 20v-4" />} />
                    Balance de Temporada
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <KpiCard label="Partidos" value={stats.global.pj} color="var(--color-primary-blue)" />
                    <KpiCard
                        label="W - D - L"
                        value={`${stats.global.wins}-${stats.global.draws}-${stats.global.losses}`}
                        color="#10b981"
                        subValue={`${Math.round((stats.global.wins / (stats.global.pj || 1)) * 100)}% victorias`}
                    />
                    <KpiCard label="Puntos Favor" value={stats.global.pointsFor} color="var(--color-primary-orange)" subValue={`${(stats.global.pointsFor / (stats.global.pj || 1)).toFixed(1)} / part.`} />
                    <KpiCard label="Puntos Contra" value={stats.global.pointsAgainst} color="#ef4444" subValue={`${(stats.global.pointsAgainst / (stats.global.pj || 1)).toFixed(1)} / part.`} />
                    <KpiCard label="Ensayos" value={stats.global.tries} color="#8b5cf6" subValue={`${(stats.global.tries / (stats.global.pj || 1)).toFixed(1)} / part.`} />
                </div>
            </div>

            {/* 2. Evolution Section (Only if we have analysis data) */}
            {stats.season && stats.last3 && (
                <div className="evolution-section">
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-blue)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                        <ChartIcon path={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
                        Rendimiento Técnico (Últimos 3 vs Temp.)
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <ComparisonCard
                            title="Posesión"
                            valueAvg={stats.season.possession}
                            valueRecent={stats.last3.possession}
                            icon={<ChartIcon path={<circle cx="12" cy="12" r="10" />} />}
                        />
                        <ComparisonCard
                            title="Placaje"
                            valueAvg={stats.season.tacklesEff}
                            valueRecent={stats.last3.tacklesEff}
                            icon={<ChartIcon path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />}
                        />
                        <ComparisonCard
                            title="Melé"
                            valueAvg={stats.season.scrumSuccess}
                            valueRecent={stats.last3.scrumSuccess}
                            icon={<ChartIcon path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} />}
                        />
                        <ComparisonCard
                            title="Touch"
                            valueAvg={stats.season.lineoutSuccess}
                            valueRecent={stats.last3.lineoutSuccess}
                            icon={<ChartIcon path={<><path d="M12 2v20" /><path d="M17 5H7" /><path d="M17 10H7" /><path d="M17 15H7" /></>} />}
                        />
                    </div>
                    <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        * Métricas técnicas basadas en {stats.season.matchesCount} partidos con video-análisis
                    </div>
                </div>
            )}
        </div>
    );
};
