import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { physicalTests as mockPhysicalTests } from '../lib/mockData';
import { ArrowLeft, Activity, Zap, Heart, Shield, Dumbbell } from 'lucide-react';

const PhysicalTestsPage = ({ user }) => {
    const navigate = useNavigate();
    const [activeSession, setActiveSession] = useState('FEB');
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const sessions = ['SEP', 'DIC', 'FEB', 'MAY'];

    useEffect(() => {
        fetchTests();
    }, [user, activeSession]);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('pruebas_fisicas')
                .select('*, jugadores(name, equip_id)');

            if (data && data.length > 0) {
                // Unified Staff view: All physical data is visible
                setResults(data);
            } else {
                // Fallback to all mock data for the club team
                const filtered = mockPhysicalTests.filter(test => test.team === "RC HOSPITALET");
                setResults(filtered);
            }
        } catch (err) {
            console.error('Error fetching physical tests:', err);
            setResults(mockPhysicalTests.filter(test => test.team === "RC HOSPITALET"));
        } finally {
            setLoading(false);
        }
    };

    const getSessionLabel = (s) => {
        const labels = { SEP: 'Septiembre', DIC: 'Diciembre', FEB: 'Febrero', MAY: 'Mayo' };
        return labels[s];
    };

    const renderTestCategory = (title, icon, dataKey, categoryData) => {
        if (!categoryData) return null;

        const keys = Object.keys(categoryData);
        return (
            <div key={dataKey} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-primary-orange)', color: 'white' }}>
                        {icon}
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-blue)', fontSize: '1.2rem' }}>{title}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(0,51,102,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Jugador</th>
                                {keys.map(k => (
                                    <th key={k} style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>{k}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((player, idx) => {
                                // Handle both mock and real Supabase structure fallback
                                const sessionData = player.results ? player.results[activeSession] : null;
                                if (!sessionData) return null;
                                const testData = sessionData[dataKey];
                                if (!testData) return null;

                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{player.playerName || player.players?.name}</td>
                                        {keys.map(k => (
                                            <td key={k} style={{ padding: '0.75rem' }}>{testData[k] || '-'}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="physical-tests-page-container">


            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ArrowLeft size={20} color="var(--color-primary-blue)" />
                    </button>
                    <img
                        src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                        alt="Logo RCLH"
                        style={{ height: '50px' }}
                    />
                    <h1 style={{ color: 'var(--color-primary-blue)', margin: 0 }}>Preparación Física</h1>
                </header>

                {/* Session Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {sessions.map(s => (
                        <button
                            key={s}
                            onClick={() => setActiveSession(s)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: activeSession === s ? 'var(--color-primary-blue)' : 'rgba(255,255,255,0.7)',
                                color: activeSession === s ? 'white' : 'var(--color-primary-blue)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {s}: {getSessionLabel(s)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-primary-blue)' }}>
                        <Activity size={48} className="animate-pulse" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.2rem' }}>Consultando base de datos...</p>
                    </div>
                ) : (
                    <div className="card" style={{ backdropFilter: 'blur(10px)', padding: '1.5rem' }}>
                        {results.find(r => r.results ? r.results[activeSession] : r.session_name === activeSession) ? (
                            <>
                                {renderTestCategory('Velocidad', <Zap size={20} />, 'velocidad', (results[0]?.results?.[activeSession]?.velocidad || mockPhysicalTests[0].results.FEB.velocidad))}
                                {renderTestCategory('Resistencia', <Activity size={20} />, 'resistencia', (results[0]?.results?.[activeSession]?.resistencia || mockPhysicalTests[0].results.FEB.resistencia))}
                                {renderTestCategory('Fuerza Tren Superior', <Shield size={20} />, 'superior', (results[0]?.results?.[activeSession]?.superior || mockPhysicalTests[0].results.FEB.superior))}
                                {renderTestCategory('Fuerza Tren Inferior', <Dumbbell size={20} />, 'inferior', (results[0]?.results?.[activeSession]?.inferior || mockPhysicalTests[0].results.FEB.inferior))}
                                {renderTestCategory('Fuerza Core', <Heart size={20} />, 'core', (results[0]?.results?.[activeSession]?.core || mockPhysicalTests[0].results.FEB.core))}
                            </>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '1.1rem' }}>No se han registrado pruebas físicas para la sesión de {getSessionLabel(activeSession)}.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhysicalTestsPage;
