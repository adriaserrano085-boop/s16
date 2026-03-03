import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/apiClient';
import { ArrowLeft, Activity, Zap, Heart, Shield, Dumbbell, Plus, X, Save, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './PhysicalTestsPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const UI_CATEGORIES = [
    {
        id: 'velocidad', label: 'Velocidad', icon: <Zap size={20} />,
        tests: [
            { id: '10m', label: '10 Metros', keys: ['velocidad_10m', 'velocidad_10m_2'], lowerIsBetter: true },
            { id: '30m', label: '30 Metros', keys: ['velocidad_30m', 'velocidad_30m_2'], lowerIsBetter: true },
            { id: '80m', label: '80 Metros', keys: ['velocidad_80m', 'velocidad_80m_2'], lowerIsBetter: true }
        ]
    },
    {
        id: 'resistencia', label: 'Resistencia', icon: <Activity size={20} />,
        tests: [
            { id: 'broncotest', label: 'Broncotest 15/30/45', keys: ['broncotest'], lowerIsBetter: true },
            { id: 'broncotest_20m', label: 'Broncotest 10/20/30', keys: ['broncotest_20m'], lowerIsBetter: true },
            { id: 'course_navette', label: 'Course Navette', keys: ['course_navette'], lowerIsBetter: false }
        ]
    },
    {
        id: 'inferior', label: 'Fuerza Inferior', icon: <Dumbbell size={20} />,
        tests: [
            { id: 'salto_sj', label: 'Salto SJ', keys: ['salto_sj', 'salto_sj_2'], lowerIsBetter: false },
            { id: 'salto_cmj', label: 'Salto CMJ', keys: ['salto_cmj', 'salto_cmj_2'], lowerIsBetter: false },
            { id: 'salto_rebote', label: 'Salto Rebote', keys: ['salto_rebote', 'salto_rebote_2'], lowerIsBetter: false },
            { id: 'salto_horizontal', label: 'Salto Horizontal', keys: ['salto_horizontal', 'salto_horizontal_2'], lowerIsBetter: false },
            { id: 'sentadillas_1m', label: 'Sentadillas (1 Minuto)', keys: ['sentadillas_1m'], lowerIsBetter: false }
        ]
    },
    {
        id: 'superior', label: 'Fuerza Superior', icon: <Shield size={20} />,
        tests: [
            { id: 'flexiones', label: 'Flexiones', keys: ['flexiones'], lowerIsBetter: false },
            { id: 'lanzamiento_pecho', label: 'Lanz. Pecho', keys: ['lanzamiento_pecho', 'lanzamiento_pecho_2'], lowerIsBetter: false },
            { id: 'lanzamiento_encima_cabeza', label: 'Lanz. Cabeza', keys: ['lanzamiento_encima_cabeza', 'lanzamiento_encima_cabeza_2'], lowerIsBetter: false }
        ]
    },
    {
        id: 'core', label: 'Fuerza Core', icon: <Heart size={20} />,
        tests: [
            { id: 'plancha', label: 'Plancha', keys: ['plancha'], lowerIsBetter: false },
            { id: 'abdominales', label: 'Abdominales', keys: ['abdominales'], lowerIsBetter: false }
        ]
    }
];



const PhysicalTestsPage = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [sessions, setSessions] = useState([]);

    // Page tabs
    const [activeCategoryId, setActiveCategoryId] = useState(UI_CATEGORIES[0].id);
    const [activeSubcategoryId, setActiveSubcategoryId] = useState(UI_CATEGORIES[0].tests[0].id);
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);

    // Bulk Modal state
    const [showModal, setShowModal] = useState(false);
    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalCategoryId, setModalCategoryId] = useState(UI_CATEGORIES[0].id);
    const [bulkData, setBulkData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [testsData, playersDataUnsorted] = await Promise.all([
                apiGet('/pruebas_fisicas').catch(() => []),
                apiGet('/jugadores_propios').catch(() => [])
            ]);

            const playersData = (playersDataUnsorted || []).sort((a, b) => {
                const nameA = `${a.nombre} ${a.apellidos}`.toLowerCase();
                const nameB = `${b.nombre} ${b.apellidos}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            setPlayers(playersData);

            if (testsData && testsData.length > 0) {
                setResults(testsData);
                const uniqueDates = [...new Set(testsData.map(t => t.fecha))].sort((a, b) => new Date(a) - new Date(b));
                setSessions(uniqueDates);
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

    const handleCategoryChange = (catId) => {
        setActiveCategoryId(catId);
        const cat = UI_CATEGORIES.find(c => c.id === catId);
        if (cat && cat.tests.length > 0) {
            setActiveSubcategoryId(cat.tests[0].id);
        }
    };

    const getActiveModalFields = () => {
        const cat = UI_CATEGORIES.find(c => c.id === modalCategoryId);
        if (!cat) return [];
        const fields = [];
        cat.tests.forEach(test => {
            test.keys.forEach((k, idx) => {
                fields.push({
                    key: k,
                    label: `${test.label}${test.keys.length > 1 ? ` (${idx + 1})` : ''}`
                });
            });
        });
        return fields;
    };

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
        const fields = getActiveModalFields();

        Object.keys(bulkData).forEach(playerId => {
            const data = bulkData[playerId];
            let hasData = false;

            const payload = { jugador_id: playerId, fecha: testDate };

            fields.forEach(f => {
                let val = data[f.key];
                if (val !== '' && val !== null && val !== undefined) {
                    hasData = true;
                    if (!['broncotest', 'broncotest_20m', 'plancha'].includes(f.key)) {
                        payload[f.key] = parseFloat(val);
                    } else {
                        payload[f.key] = String(val);
                    }
                }
            });

            if (hasData) {
                promises.push(apiPost('/pruebas_fisicas', payload));
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

    const formatDateStr = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const parseToNumber = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(':', '.').replace(',', '.'));
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    };

    const activeCategoryData = UI_CATEGORIES.find(c => c.id === activeCategoryId);
    const activeTest = activeCategoryData?.tests.find(t => t.id === activeSubcategoryId);

    // Filter valid sessions
    const validSessionsForTest = sessions.filter(s => {
        if (!activeTest) return false;
        return players.some(p => {
            const res = results.find(r => r.jugador_id === p.id && r.fecha === s);
            if (!res) return false;
            return activeTest.keys.some(k => res[k] !== null && res[k] !== undefined && res[k] !== '');
        });
    });

    // Find valid players
    const activePlayers = players.filter(p => {
        if (!activeTest) return false;
        return validSessionsForTest.some(s => {
            const res = results.find(r => r.jugador_id === p.id && r.fecha === s);
            if (!res) return false;
            return activeTest.keys.some(k => res[k] !== null && res[k] !== undefined && res[k] !== '');
        });
    });

    // Compute Evolution Data (first vs last for each player per active test)
    const computeEvolutionData = () => {
        if (!activeTest) return [];
        const evData = [];

        activePlayers.forEach(p => {
            const playerSessions = validSessionsForTest.filter(s => {
                const res = results.find(r => r.jugador_id === p.id && r.fecha === s);
                return res && activeTest.keys.some(k => res[k] !== null && res[k] !== undefined && res[k] !== '');
            });

            if (playerSessions.length > 1) {
                const sortedSessions = playerSessions.sort((a, b) => new Date(a) - new Date(b));
                const firstDate = sortedSessions[0];
                const lastDate = sortedSessions[sortedSessions.length - 1];

                const firstRes = results.find(r => r.jugador_id === p.id && r.fecha === firstDate);
                const lastRes = results.find(r => r.jugador_id === p.id && r.fecha === lastDate);

                evData.push({
                    player: p,
                    firstDate,
                    lastDate,
                    firstRes,
                    lastRes
                });
            }
        });

        return evData;
    };

    const renderResultsView = () => {
        const dataColors = ['#ff6600', '#003366', '#00cc66', '#ffcc00', '#cc0066', '#6600cc'];

        const charts = validSessionsForTest.map((s, idx) => {
            // Only include players who actually have data for this session
            const playersWithData = activePlayers.map(p => {
                const res = results.find(r => r.jugador_id === p.id && r.fecha === s);
                let bestNumVal = null;
                if (res) {
                    const validItems = activeTest.keys.map(k => ({ key: k, num: parseToNumber(res[k]) })).filter(item => item.num !== null);
                    if (validItems.length > 0) {
                        if (activeTest.lowerIsBetter) {
                            bestNumVal = Math.min(...validItems.map(i => i.num));
                        } else {
                            bestNumVal = Math.max(...validItems.map(i => i.num));
                        }
                    }
                }
                return { player: p, val: bestNumVal };
            }).filter(item => item.val !== null);

            const thisChartLabels = playersWithData.map(item => `${item.player.nombre} ${item.player.apellidos.charAt(0)}.`);

            const chartData = {
                labels: thisChartLabels,
                datasets: [{
                    label: formatDateStr(s),
                    data: playersWithData.map(item => item.val),
                    backgroundColor: dataColors[idx % dataColors.length],
                    borderRadius: 4
                }]
            };

            // Calculate dynamic height for this specific chart based on players that took the test
            const thisChartHeight = Math.max(250, playersWithData.length * 35);

            return { session: s, chartData, height: thisChartHeight };
        });

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    grid: {
                        display: false // Cleaner look for names
                    }
                }
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                {/* Tabla de Resultados */}
                <div style={{ width: '100%', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-primary-blue)', fontSize: '1.4rem', borderBottom: '2px solid #eee', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={24} color="var(--color-primary-orange)" />
                        Tabla de Resultados - {activeTest.label}
                    </h3>
                    <div className="data-table-container" style={{ boxShadow: 'none' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th rowSpan={activeTest.keys.length > 1 ? 2 : 1} style={{ minWidth: '220px', verticalAlign: 'middle' }}>
                                        Jugador
                                    </th>
                                    {validSessionsForTest.map(s => {
                                        return (
                                            <th key={s} colSpan={activeTest.keys.length} style={{ textAlign: 'center', backgroundColor: '#f4f7f6', borderLeft: '2px solid #e2e8f0' }}>
                                                {formatDateStr(s)}
                                            </th>
                                        );
                                    })}
                                </tr>
                                {activeTest.keys.length > 1 && (
                                    <tr>
                                        {validSessionsForTest.map(s => activeTest.keys.map((k, i) => (
                                            <th key={`${s}-${k}`} style={{ textAlign: 'center', fontSize: '0.8rem', backgroundColor: '#fdfdfd', borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #eef2f6' }}>
                                                {`Int. ${i + 1}`}
                                            </th>
                                        )))}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activePlayers.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: '600' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {p.foto ? (
                                                    <img src={p.foto} alt={p.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: 'bold' }}>{p.nombre.charAt(0)}{p.apellidos.charAt(0)}</span>
                                                    </div>
                                                )}
                                                {p.nombre} {p.apellidos}
                                            </div>
                                        </td>
                                        {validSessionsForTest.map(s => {
                                            const res = results.find(r => r.jugador_id === p.id && r.fecha === s);

                                            let bestNumVal = null;
                                            if (res && activeTest.keys.length > 1) {
                                                const validItems = activeTest.keys.map(k => ({ key: k, num: parseToNumber(res[k]) }))
                                                    .filter(item => item.num !== null);

                                                if (validItems.length > 1) {
                                                    if (activeTest.lowerIsBetter) {
                                                        bestNumVal = Math.min(...validItems.map(i => i.num));
                                                    } else {
                                                        bestNumVal = Math.max(...validItems.map(i => i.num));
                                                    }
                                                }
                                            }

                                            return activeTest.keys.map((k, i) => {
                                                const rawVal = res ? res[k] : null;
                                                const isEmpty = rawVal === null || rawVal === undefined || rawVal === '';
                                                const displayVal = !isEmpty ? rawVal : '-';

                                                const numVal = parseToNumber(rawVal);
                                                const isBest = bestNumVal !== null && numVal !== null && numVal === bestNumVal;

                                                return (
                                                    <td
                                                        key={`${s}-${k}`}
                                                        style={{
                                                            textAlign: 'center',
                                                            color: isEmpty ? '#ccc' : (isBest ? '#15803d' : '#333'),
                                                            backgroundColor: isBest ? '#dcfce7' : 'transparent',
                                                            fontWeight: isBest ? 'bold' : 'normal',
                                                            borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #f0f4f8'
                                                        }}
                                                    >
                                                        {displayVal}
                                                    </td>
                                                );
                                            });
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gráficos Comparativos (uno por sesión) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', width: '100%' }}>
                    {charts.map((c, i) => (
                        <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-primary-blue)', fontSize: '1.2rem', borderBottom: '2px solid #eee', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={20} color="var(--color-primary-orange)" />
                                {formatDateStr(c.session)}
                            </h3>
                            <div style={{ width: '100%', height: `${c.height}px` }}>
                                <Bar data={c.chartData} options={chartOptions} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderEvolutionView = () => {
        const evData = computeEvolutionData();

        if (evData.length === 0) {
            return (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#666', backgroundColor: 'white', borderRadius: '12px' }}>
                    <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                    <p style={{ fontSize: '1.1rem' }}>No hay suficientes datos comparables para medir la evolución en esta prueba.</p>
                </div>
            );
        }

        return (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div className="data-table-container">
                    <table className="data-table" style={{ margin: 0 }}>
                        <thead style={{ backgroundColor: '#f0f4f8' }}>
                            <tr>
                                <th style={{ minWidth: '220px' }}>Jugador</th>
                                <th style={{ textAlign: 'center' }}>Progreso de Fechas</th>
                                {activeTest.keys.map((k, i) => (
                                    <th key={k} style={{ textAlign: 'center', borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #eef2f6' }}>
                                        {activeTest.keys.length > 1 ? `Int. ${i + 1}` : activeTest.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {evData.map((data, idx) => (
                                <tr key={data.player.id}>
                                    <td style={{ fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {data.player.foto ? (
                                                <img src={data.player.foto} alt={data.player.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: 'bold' }}>{data.player.nombre.charAt(0)}{data.player.apellidos.charAt(0)}</span>
                                                </div>
                                            )}
                                            {data.player.nombre} {data.player.apellidos}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                                        {formatDateStr(data.firstDate)} → {formatDateStr(data.lastDate)}
                                    </td>
                                    {activeTest.keys.map((k, i) => {
                                        const rawFirst = data.firstRes[k];
                                        const rawLast = data.lastRes[k];
                                        const hasBoth = rawFirst !== null && rawFirst !== undefined && rawFirst !== '' &&
                                            rawLast !== null && rawLast !== undefined && rawLast !== '';

                                        return (
                                            <td key={k} style={{ textAlign: 'center', borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #f0f4f8' }}>
                                                {hasBoth ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                        <span style={{ color: '#888' }}>{rawFirst}</span>
                                                        <TrendingUp size={14} style={{ color: 'var(--color-primary-orange)' }} />
                                                        <span style={{ fontWeight: 'bold' }}>{rawLast}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="physical-tests-page">
            <div className="physical-tests-wrapper">

                {/* Header Section styled like CalendarPage */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    backgroundColor: 'var(--color-bg-orange, #FFF9F5)',
                    padding: '1.5rem 2rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 102, 0, 0.1)'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            background: '#f1f3f5',
                            borderRadius: '12px',
                            color: '#495057',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowLeft size={18} /> Volver
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{
                            margin: 0,
                            color: '#003366',
                            fontSize: '1.75rem',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            <Activity size={24} color="var(--color-primary-orange, #FF6600)" />
                            Preparación Física
                        </h1>
                        <p style={{
                            margin: '0.25rem 0 0 0',
                            color: '#FF6600',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '0.9rem'
                        }}>
                            Registro y control de rendimiento
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {user?.role !== 'JUGADOR' && (
                            <button
                                onClick={() => setShowModal(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                                    backgroundColor: 'var(--color-primary-orange, #FF6600)', color: 'white',
                                    border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(255,102,0,0.3)'
                                }}
                            >
                                <Plus size={18} />
                                Añadir Resultados
                            </button>
                        )}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--color-bg-orange, #FFF9F5)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 102, 0, 0.1)',
                    marginBottom: '2rem'
                }}>
                    <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid rgba(255, 102, 0, 0.2)', paddingBottom: '0.5rem' }}>
                        <button
                            className="tab-button"
                            onClick={() => setIsEvolutionMode(false)}
                            style={{
                                borderBottom: !isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                color: !isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                                padding: '0.5rem 1rem', background: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            Resultados y Pruebas
                        </button>
                        <button
                            className="tab-button"
                            onClick={() => setIsEvolutionMode(true)}
                            style={{
                                borderBottom: isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                color: isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                                padding: '0.5rem 1rem', background: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            Evolución Individual
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: 'none' }}>
                        {UI_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className="tab-button"
                                onClick={() => handleCategoryChange(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderBottom: activeCategoryId === cat.id ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                    color: activeCategoryId === cat.id ? 'var(--color-primary-blue)' : '#777',
                                    backgroundColor: activeCategoryId === cat.id ? 'rgba(0,51,102,0.05)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    padding: '0.75rem 1.2rem',
                                    fontWeight: activeCategoryId === cat.id ? 'bold' : 'normal'
                                }}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Subcategory Tabs */}
                    {
                        activeCategoryData && (
                            <div className="subtabs-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {activeCategoryData.tests.map(test => (
                                    <button
                                        key={test.id}
                                        onClick={() => setActiveSubcategoryId(test.id)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            borderColor: activeSubcategoryId === test.id ? 'var(--color-primary-orange)' : '#ddd',
                                            backgroundColor: activeSubcategoryId === test.id ? 'var(--color-primary-orange)' : 'white',
                                            color: activeSubcategoryId === test.id ? 'white' : '#666',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {test.label}
                                    </button>
                                ))}
                            </div>
                        )
                    }
                </div>

                {
                    loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-primary-blue)' }}>
                            <Activity size={48} className="animate-pulse" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <p style={{ fontSize: '1.2rem' }}>Cargando datos...</p>
                        </div>
                    ) : (
                        <>
                            {!activeTest || validSessionsForTest.length === 0 || activePlayers.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#666', backgroundColor: 'white', borderRadius: '12px' }}>
                                    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                    <p style={{ fontSize: '1.1rem' }}>No hay resultados registrados para esta prueba.</p>
                                </div>
                            ) : (
                                isEvolutionMode ? renderEvolutionView() : renderResultsView()
                            )}
                        </>
                    )
                }
            </div >

            {/* Modal for Inserting Data in Bulk */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '900px' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                                <h2 style={{ margin: 0, color: 'var(--color-primary-blue)' }}>Añadir Resultados por Prueba</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} color="#666" />
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid #eee', backgroundColor: '#f9fbfd' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.4rem' }}>Fecha de Evaluación *</label>
                                    <input
                                        type="date"
                                        value={testDate}
                                        onChange={(e) => setTestDate(e.target.value)}
                                        style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.4rem' }}>Categoría *</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {UI_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setModalCategoryId(cat.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: modalCategoryId === cat.id ? 'var(--color-primary-blue)' : '#ddd',
                                                    backgroundColor: modalCategoryId === cat.id ? 'var(--color-primary-blue)' : 'white',
                                                    color: modalCategoryId === cat.id ? 'white' : '#666',
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
                                <div className="data-table-container" style={{ flex: 1, maxHeight: '45vh', border: '1px solid #eee', borderRadius: '8px' }}>
                                    <table className="data-table" style={{ margin: 0 }}>
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <tr>
                                                <th style={{ width: '250px' }}>Jugador</th>
                                                {getActiveModalFields().map(f => (
                                                    <th key={f.key} style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                        {f.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {players.map(player => (
                                                <tr key={player.id}>
                                                    <td style={{ fontWeight: '500', backgroundColor: '#fdfdfd' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            {player.foto ? (
                                                                <img src={player.foto} alt={`${player.nombre}`} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 'bold' }}>{player.nombre.charAt(0)}{player.apellidos.charAt(0)}</span>
                                                                </div>
                                                            )}
                                                            {player.nombre} {player.apellidos}
                                                        </div>
                                                    </td>
                                                    {getActiveModalFields().map(f => {
                                                        const isTextType = ['broncotest', 'broncotest_20m', 'plancha'].includes(f.key);
                                                        return (
                                                            <td key={f.key} style={{ padding: '0.4rem' }}>
                                                                <input
                                                                    type={isTextType ? "text" : "number"}
                                                                    step="0.01"
                                                                    placeholder={isTextType ? "Ej: 5.30" : "0.00"}
                                                                    value={bulkData[player.id]?.[f.key] || ''}
                                                                    onChange={(e) => handleBulkInputChange(player.id, f.key, e.target.value)}
                                                                    className="input-field"
                                                                    style={{ textAlign: 'center', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', margin: 0, width: '100%' }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
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
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PhysicalTestsPage;
