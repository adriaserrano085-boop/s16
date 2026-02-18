export const MatchAnalysisView = ({ match, analysis, onMatchClick, MarkdownRenderer }) => {
    if (!match) return null;

    // HELPER: Extract stats with fallback
    const stats = analysis?.raw_json?.estadisticas || {};
    const hasData = analysis && analysis.raw_json;

    // DATA EXTRACTION (Primarily from raw_json)
    const possession = stats.posesion || {};
    const tacklesMade = stats.placajes_hechos || {};
    const tacklesMissed = stats.placajes_fallados || {};
    const scrums = stats.mele || {};
    const lineouts = stats.touch || {};

    // Possession
    const pHome = possession.local ?? 50;
    const pAway = possession.visitante ?? 50;

    // Tackles
    const tHomeMade = tacklesMade.local ?? 0;
    const tAwayMade = tacklesMade.visitante ?? 0;
    const tHomeMissed = tacklesMissed.local ?? 0;
    const tAwayMissed = tacklesMissed.visitante ?? 0;

    // Scrums
    const sHomeWon = scrums.local_ganada ?? 0;
    const sHomeLost = scrums.local_perdida ?? 0;
    const sAwayWon = scrums.visitante_ganada ?? 0;
    const sAwayLost = scrums.visitante_perdida ?? 0;

    // Lineouts
    const lHomeWon = lineouts.local_ganada ?? 0;
    const lHomeLost = lineouts.local_perdida ?? 0;
    const lAwayWon = lineouts.visitante_ganada ?? 0;
    const lAwayLost = lineouts.visitante_perdida ?? 0;

    const TeamLogo = ({ url, name, size = 30 }) => {
        if (!url) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999', overflow: 'hidden' }}>{name?.substring(0, 2)}</div>;
        return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
    };

    const Activity = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
    const ClipboardList = ({ size, style }) => <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>{match.home}</div>
                    </div>
                    <TeamLogo url={match.homeShield} name={match.home} size={40} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary-blue)' }}>
                    {match.scoreHome} - {match.scoreAway}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <TeamLogo url={match.awayShield} name={match.away} size={40} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{match.away}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* Stats */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-blue)', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        <Activity size={18} /> Estadísticas de Juego
                    </h4>

                    {!hasData ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#999', margin: 0 }}>No hay estadísticas avanzadas registradas para este partido.</p>
                            <button
                                onClick={onMatchClick ? () => onMatchClick(match) : undefined}
                                style={{ marginTop: '1rem', background: 'var(--color-primary-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            >
                                <ClipboardList size={14} style={{ marginRight: '5px' }} />
                                Importar Datos Analista
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
                            {/* Row 1: Possession & Tackles */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                {/* Possession */}
                                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                    <h5 style={{ textAlign: 'center', color: '#666', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Posesión</h5>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>{pHome}%</span>
                                        <div style={{ flex: 1, display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
                                            <div style={{ width: `${pHome}%`, background: 'var(--color-primary-blue)' }} />
                                            <div style={{ width: `${pAway}%`, background: 'var(--color-primary-orange)' }} />
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{pAway}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: '#888' }}>
                                        <span>{match.home}</span>
                                        <span>{match.away}</span>
                                    </div>
                                </div>

                                {/* Tackles */}
                                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                    <h5 style={{ textAlign: 'center', color: '#666', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Placajes</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ textAlign: 'center', borderRight: '1px dashed #ddd' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '4px' }}>{match.home}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>
                                                {tHomeMade}
                                                <span style={{ fontSize: '0.8rem', color: '#dc3545', marginLeft: '4px' }}>({tHomeMissed} fallados)</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>Efectividad: {Math.round((tHomeMade / ((tHomeMade + tHomeMissed) || 1)) * 100)}%</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary-orange)', marginBottom: '4px' }}>{match.away}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>
                                                {tAwayMade}
                                                <span style={{ fontSize: '0.8rem', color: '#dc3545', marginLeft: '4px' }}>({tAwayMissed} fallados)</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>Efectividad: {Math.round((tAwayMade / ((tAwayMade + tAwayMissed) || 1)) * 100)}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Set Pieces */}
                            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                <h5 style={{ textAlign: 'center', color: '#666', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Fases Estáticas</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                    {/* Scrums */}
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textAlign: 'center', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Melé</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-blue)' }}>{match.home}</span>
                                            <span style={{ fontWeight: 'bold' }}>{sHomeWon}/{sHomeWon + sHomeLost}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(sHomeWon / ((sHomeWon + sHomeLost) || 1)) * 100}%`, height: '100%', background: 'var(--color-primary-blue)' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-orange)' }}>{match.away}</span>
                                            <span style={{ fontWeight: 'bold' }}>{sAwayWon}/{sAwayWon + sAwayLost}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(sAwayWon / ((sAwayWon + sAwayLost) || 1)) * 100}%`, height: '100%', background: 'var(--color-primary-orange)' }}></div>
                                        </div>
                                    </div>
                                    {/* Lineouts */}
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textAlign: 'center', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Touch</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-blue)' }}>{match.home}</span>
                                            <span style={{ fontWeight: 'bold' }}>{lHomeWon}/{lHomeWon + lHomeLost}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(lHomeWon / ((lHomeWon + lHomeLost) || 1)) * 100}%`, height: '100%', background: 'var(--color-primary-blue)' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-orange)' }}>{match.away}</span>
                                            <span style={{ fontWeight: 'bold' }}>{lAwayWon}/{lAwayWon + lAwayLost}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(lAwayWon / ((lAwayWon + lAwayLost) || 1)) * 100}%`, height: '100%', background: 'var(--color-primary-orange)' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-blue)', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        <ClipboardList size={18} /> Resumen del Partido e Informe
                    </h4>
                    {(analysis?.raw_json?.report) ? (
                        <div style={{ lineHeight: '1.8', color: '#374151', fontSize: '0.95rem' }}>
                            <MarkdownRenderer content={analysis?.raw_json?.report} />
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#999', fontStyle: 'italic' }}>No hay informe disponible.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
