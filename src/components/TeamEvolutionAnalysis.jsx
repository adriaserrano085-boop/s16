import React, { useMemo } from 'react';

export const TeamEvolutionAnalysis = ({ matches, analyses, teamName = "RC HOSPITALET" }) => {

    // Process data to calculate stats
    const stats = useMemo(() => {
        if (!matches || matches.length === 0 || !analyses) return null;

        // 1. Link matches with their analysis
        const analyzedMatches = matches.map(match => {
            let analysis = null;
            if (match.partido_externo_id) {
                analysis = analyses.find(a => a.partido_externo_id === match.partido_externo_id);
            } else if (match.evento_id) {
                analysis = analyses.find(a => a.evento_id === match.evento_id);
            }
            return { ...match, analysis };
        }).filter(m => m.analysis && m.analysis.raw_json && m.analysis.raw_json.estadisticas);

        if (analyzedMatches.length === 0) return null;

        // Sort by date (oldest to newest for trend calculation, but we usually want newest first for display)
        // Let's sort Newest -> Oldest for "Last 3" slicing
        const sortedMatches = [...analyzedMatches].sort((a, b) => new Date(b.date) - new Date(a.date));

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
                const teamKey = isHome ? 'local' : 'visitante';
                const statsObj = m.analysis.raw_json.estadisticas;

                // Possession
                total.possession += (statsObj.posesion?.[teamKey] || 0);

                // Tackles
                total.tacklesMade += (statsObj.placajes_hechos?.[teamKey] || 0);
                total.tacklesMissed += (statsObj.placajes_fallados?.[teamKey] || 0);

                // Scrum
                total.scrumWon += (statsObj.mele?.[`${teamKey}_ganada`] || 0);
                total.scrumLost += (statsObj.mele?.[`${teamKey}_perdida`] || 0);

                // Lineout
                total.lineoutWon += (statsObj.touch?.[`${teamKey}_ganada`] || 0);
                total.lineoutLost += (statsObj.touch?.[`${teamKey}_perdida`] || 0);

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

        const seasonStats = aggregateStats(sortedMatches);
        const last3Stats = aggregateStats(sortedMatches.slice(0, 3));

        return { season: seasonStats, last3: last3Stats };
    }, [matches, analyses, teamName]);

    if (!stats) return null;

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

    return (
        <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChartIcon path={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
                Evolución del Rendimiento
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <ComparisonCard
                    title="Posesión"
                    valueAvg={stats.season.possession}
                    valueRecent={stats.last3.possession}
                    icon={<ChartIcon path={<circle cx="12" cy="12" r="10" />} />}
                />
                <ComparisonCard
                    title="Efectividad Placaje"
                    valueAvg={stats.season.tacklesEff}
                    valueRecent={stats.last3.tacklesEff}
                    icon={<ChartIcon path={<path d="M5 12h14" />} />} // Placeholder icon
                />
                <ComparisonCard
                    title="Éxito Melé"
                    valueAvg={stats.season.scrumSuccess}
                    valueRecent={stats.last3.scrumSuccess}
                    icon={<ChartIcon path={<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />} />}
                />
                <ComparisonCard
                    title="Éxito Touch"
                    valueAvg={stats.season.lineoutSuccess}
                    valueRecent={stats.last3.lineoutSuccess}
                    icon={<ChartIcon path={<path d="M12 2v20" />} />}
                />
            </div>
            <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                * Basado en {stats.season.matchesCount} partidos analizados
            </div>
        </div>
    );
};
