import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/apiClient';
import { ArrowLeft, Activity, Zap, Heart, Shield, Dumbbell, Plus, X, TrendingUp, Save } from 'lucide-react';
import './PhysicalTestsPage.css';

const speedKeys = [
    { key: 'velocidad_10m', label: '10m (s)' },
    { key: 'velocidad_30m', label: '30m (s)' },
    { key: 'velocidad_80m', label: '80m (s)' }
];

const resistKeys = [
    { key: 'broncotest', label: 'Broncotest' },
    { key: 'course_navette', label: 'Course Navette' }
];

const inferiorKeys = [
    { key: 'salto_sj', label: 'Salto SJ' },
    { key: 'salto_cmj', label: 'Salto CMJ' },
    { key: 'salto_rebote', label: 'Salto Rebote' },
    { key: 'salto_horizontal', label: 'Salto Horizontal' }
];

const superiorKeys = [
    { key: 'flexiones', label: 'Flexiones' },
    { key: 'lanzamiento_pecho', label: 'Lanz. Pecho' },
    { key: 'lanzamiento_encima_cabeza', label: 'Lanz. Encima Cabeza' }
];

const coreKeys = [
    { key: 'plancha', label: 'Plancha (t)' },
    { key: 'abdominales', label: 'Abdominales' }
];

const CATEGORIES = [
    { id: 'velocidad', label: 'Velocidad', fields: speedKeys },
    { id: 'resistencia', label: 'Resistencia', fields: resistKeys },
    { id: 'inferior', label: 'Fuerza Inferior', fields: inferiorKeys },
    { id: 'superior', label: 'Fuerza Superior', fields: superiorKeys },
    { id: 'core', label: 'Fuerza Core', fields: coreKeys }
];

const PhysicalTestsPage = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);

    // Bulk Modal state
    const [showModal, setShowModal] = useState(false);
    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [testCategory, setTestCategory] = useState('velocidad');
    const [bulkData, setBulkData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [testsData, playersData] = await Promise.all([
                apiGet('/pruebas_fisicas/').catch(() => []),
                apiGet('/jugadores_propios/').catch(() => [])
            ]);

            setPlayers(playersData || []);

            if (testsData && testsData.length > 0) {
                // Enrich test data with player names
                const formatted = testsData.map(test => {
                    const player = playersData.find(p => p.id === test.jugador_id);
                    return {
                        ...test,
                        playerName: player ? `${player.nombre} ${player.apellidos} ` : 'Desconocido'
                    };
                });

                setResults(formatted);

                // Extract unique dates for sessions
                const uniqueDates = [...new Set(formatted.map(t => t.fecha))].sort((a, b) => new Date(b) - new Date(a));
                setSessions(uniqueDates);
                if (!activeSession && uniqueDates.length > 0) {
                    setActiveSession(uniqueDates[0]);
                }
            } else {
                setResults([]);
                setSessions([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Pre-fill existing data into bulkData when modal opens or configurations change
    useEffect(() => {
        if (!showModal) return;

        const existingDataForDate = results.filter(r => r.fecha === testDate);
        const newBulkData = {};

        players.forEach(p => {
            const existing = existingDataForDate.find(r => r.jugador_id === p.id);
            if (existing) {
                newBulkData[p.id] = { ...existing };
            } else {
                newBulkData[p.id] = {};
            }
        });

        setBulkData(newBulkData);
    }, [showModal, testDate, results, players]);

    const handleBulkInputChange = (playerId, field, value) => {
        setBulkData(prev => ({
            ...prev,
            [playerId]: {
                ...(prev[playerId] || {}),
                [field]: value
            }
        }));
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();

        if (!testDate) {
            alert('Por favor, selecciona una fecha.');
            return;
        }

        const promises = [];

        Object.keys(bulkData).forEach(playerId => {
            const data = bulkData[playerId];
            let hasData = false;

            const payload = { jugador_id: playerId, fecha: testDate };

            // Only examine fields for the currently selected category to know if we should update
            const categoryFields = CATEGORIES.find(c => c.id === testCategory).fields.map(f => f.key);

            categoryFields.forEach(key => {
                let val = data[key];
                if (val !== '' && val !== null && val !== undefined) {
                    hasData = true;
                    if (!['broncotest', 'plancha'].includes(key)) {
                        payload[key] = parseFloat(val);
                    } else {
                        payload[key] = val;
                    }
                }
            });

            if (hasData) {
                promises.push(apiPost('/pruebas_fisicas/', payload));
            }
        });

        if (promises.length === 0) {
            alert('No has introducido ningún dato nuevo o modificado en esta categoría.');
            return;
        }

        try {
            await Promise.all(promises);
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Error saving tests:', err);
            alert('Error al guardar algunos resultados. Puede que algún campo contenga formatos inválidos.');
        }
    };

    const getSessionData = () => {
        return results.filter(r => r.fecha === activeSession);
    };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Calculate evolution for players with >1 test
    const getEvolutionData = () => {
        const groupedByPlayer = {};
        results.forEach(test => {
            if (!groupedByPlayer[test.jugador_id]) {
                groupedByPlayer[test.jugador_id] = {
                    playerName: test.playerName,
                    tests: []
                };
            }
            groupedByPlayer[test.jugador_id].tests.push(test);
        });

        const evolution = [];
        Object.values(groupedByPlayer).forEach(playerData => {
            if (playerData.tests.length > 1) {
                // Sort tests by date ascending
                const sortedTests = [...playerData.tests].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                const first = sortedTests[0];
                const last = sortedTests[sortedTests.length - 1];

                evolution.push({
                    playerName: playerData.playerName,
                    firstDate: first.fecha,
                    lastDate: last.fecha,
                    first,
                    last
                });
            }
        });

        return evolution.sort((a, b) => a.playerName.localeCompare(b.playerName));
    };

    const renderTestCategory = (title, icon, keys, data) => {
        const hasAnyData = data.some(row => keys.some(k => row[k.key] !== null && row[k.key] !== undefined));
        if (!hasAnyData) return null;

        return (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-primary-orange)', color: 'white' }}>
                        {icon}
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-blue)', fontSize: '1.2rem' }}>{title}</h3>
                </div>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Jugador</th>
                                {keys.map(k => (
                                    <th key={k.key}>{k.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => {
                                const rowHasData = keys.some(k => row[k.key] !== null && row[k.key] !== undefined);
                                if (!rowHasData) return null;

                                return (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 'bold' }}>{row.playerName}</td>
                                        {keys.map(k => (
                                            <td key={k.key}>{row[k.key] !== null && row[k.key] !== undefined ? row[k.key] : '-'}</td>
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

    const renderEvolutionCategory = (title, icon, keys, evolutionData) => {
        const hasAnyData = evolutionData.some(row => keys.some(k => row.first[k.key] !== null && row.last[k.key] !== null && row.first[k.key] !== undefined && row.last[k.key] !== undefined));
        if (!hasAnyData) return null;

        return (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-primary-blue)', color: 'white' }}>
                        {icon}
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-orange)', fontSize: '1.2rem' }}>{title} (Evolución)</h3>
                </div>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Jugador</th>
                                <th style={{ fontSize: '0.85rem' }}>Fechas (1ª → Última)</th>
                                {keys.map(k => (
                                    <th key={k.key} style={{ textAlign: 'center' }}>{k.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {evolutionData.map((row, idx) => {
                                const rowHasData = keys.some(k => row.first[k.key] !== null && row.last[k.key] !== null && row.first[k.key] !== undefined && row.last[k.key] !== undefined);
                                if (!rowHasData) return null;

                                return (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 'bold' }}>{row.playerName}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {formatDateStr(row.firstDate)} → {formatDateStr(row.lastDate)}
                                        </td>
                                        {keys.map(k => {
                                            const val1 = row.first[k.key];
                                            const val2 = row.last[k.key];
                                            const hasBoth = val1 !== null && val2 !== null && val1 !== undefined && val2 !== undefined;

                                            // For running (speed/resistance), lower is usually better, but let's just show absolute difference and color it
                                            // A simple display: Val1 -> Val2
                                            return (
                                                <td key={k.key} style={{ textAlign: 'center' }}>
                                                    {hasBoth ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                            <span style={{ color: '#888' }}>{val1}</span>
                                                            <TrendingUp size={14} style={{ color: 'var(--color-primary-orange)' }} />
                                                            <span style={{ fontWeight: 'bold' }}>{val2}</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                            );
                                        })}
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
        <div className="physical-tests-page-container" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                        <h1 style={{ color: 'var(--color-primary-blue)', margin: 0, fontSize: '1.8rem' }}>Preparación Física</h1>
                    </div>
                    {user?.role !== 'JUGADOR' && (
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.5rem', borderRadius: '8px',
                                backgroundColor: 'var(--color-primary-orange)', color: 'white',
                                border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(255,102,0,0.3)'
                            }}
                        >
                            <Plus size={18} />
                            Añadir Resultados
                        </button>
                    )}
                </header>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className="tab-button"
                        onClick={() => setIsEvolutionMode(false)}
                        style={{
                            borderBottom: !isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                            color: !isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                        }}
                    >
                        Resultados por Fecha
                    </button>
                    <button
                        className="tab-button"
                        onClick={() => setIsEvolutionMode(true)}
                        style={{
                            borderBottom: isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                            color: isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                        }}
                    >
                        Evolución Individual
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-primary-blue)' }}>
                        <Activity size={48} className="animate-pulse" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                        <p style={{ fontSize: '1.2rem' }}>Cargando datos...</p>
                    </div>
                ) : isEvolutionMode ? (
                    <div className="card">
                        {getEvolutionData().length > 0 ? (
                            <>
                                {renderEvolutionCategory('Velocidad', <Zap size={20} />, speedKeys, getEvolutionData())}
                                {renderEvolutionCategory('Resistencia', <Activity size={20} />, resistKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Tren Superior', <Shield size={20} />, superiorKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Tren Inferior', <Dumbbell size={20} />, inferiorKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Core', <Heart size={20} />, coreKeys, getEvolutionData())}

                                {!CATEGORIES.some(cat => renderEvolutionCategory(cat.label, React.createElement(Activity), cat.fields, getEvolutionData()) !== null) && (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                        <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                        <p style={{ fontSize: '1.1rem' }}>Hay sesiones registradas, pero ningún jugador cuenta con suficientes datos pareados para mostrar su evolución completa.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                <p style={{ fontSize: '1.1rem' }}>No hay suficientes datos para mostrar la evolución. Se requieren al menos dos pruebas para un mismo jugador.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Session Tabs */}
                        {sessions.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {sessions.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setActiveSession(s)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: activeSession === s ? 'var(--color-primary-blue)' : 'rgba(0,51,102,0.1)',
                                            color: activeSession === s ? 'white' : 'var(--color-primary-blue)',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {formatDateStr(s)}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        <div className="card">
                            {getSessionData().length > 0 ? (
                                <>
                                    {renderTestCategory('Velocidad', <Zap size={20} />, speedKeys, getSessionData())}
                                    {renderTestCategory('Resistencia', <Activity size={20} />, resistKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Tren Superior', <Shield size={20} />, superiorKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Tren Inferior', <Dumbbell size={20} />, inferiorKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Core', <Heart size={20} />, coreKeys, getSessionData())}

                                    {!CATEGORIES.some(cat => renderTestCategory(cat.label, React.createElement(Activity), cat.fields, getSessionData()) !== null) && (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                            <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                            <p style={{ fontSize: '1.1rem' }}>Hay jugadores registrados en esta fecha, pero sus datos físicos están vacíos.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                    <p style={{ fontSize: '1.1rem' }}>No hay pruebas físicas registradas.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal for Inserting Data in Bulk */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                            <h2 style={{ margin: 0, color: 'var(--color-primary-blue)' }}>Añadir Resultados por Prueba</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#666" />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid #eee', backgroundColor: '#f9fbfd' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.25rem' }}>Fecha de Evaluación *</label>
                                <input
                                    type="date"
                                    value={testDate}
                                    onChange={(e) => setTestDate(e.target.value)}
                                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.25rem' }}>Tipo de Prueba *</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setTestCategory(cat.id)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: testCategory === cat.id ? 'var(--color-primary-blue)' : '#ddd',
                                                backgroundColor: testCategory === cat.id ? 'var(--color-primary-blue)' : 'white',
                                                color: testCategory === cat.id ? 'white' : '#666',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleBulkSubmit} style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="data-table-container" style={{ flex: 1, maxHeight: '50vh' }}>
                                <table className="data-table" style={{ margin: 0 }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <tr>
                                            <th style={{ width: '250px' }}>Jugador</th>
                                            {CATEGORIES.find(c => c.id === testCategory).fields.map(f => (
                                                <th key={f.key} style={{ textAlign: 'center' }}>
                                                    {f.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.map(player => {
                                            const categoryFields = CATEGORIES.find(c => c.id === testCategory).fields;
                                            return (
                                                <tr key={player.id}>
                                                    <td style={{ fontWeight: '500', backgroundColor: '#fdfdfd' }}>
                                                        {player.nombre} {player.apellidos}
                                                    </td>
                                                    {categoryFields.map(f => {
                                                        const isTextType = ['broncotest', 'plancha'].includes(f.key);
                                                        return (
                                                            <td key={f.key} style={{ padding: '0.5rem' }}>
                                                                <input
                                                                    type={isTextType ? "text" : "number"}
                                                                    step="0.01"
                                                                    placeholder={isTextType ? "Ej: 5:30" : "0.00"}
                                                                    value={bulkData[player.id]?.[f.key] || ''}
                                                                    onChange={(e) => handleBulkInputChange(player.id, f.key, e.target.value)}
                                                                    className="input-field"
                                                                    style={{ textAlign: 'center' }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-blue)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    <Save size={18} />
                                    Guardar Resultados de {CATEGORIES.find(c => c.id === testCategory).label}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhysicalTestsPage;
