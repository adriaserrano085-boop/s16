import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/apiClient';
import { ArrowLeft, Activity, Zap, Heart, Shield, Dumbbell, Plus, X, TrendingUp } from 'lucide-react';
import './PhysicalTestsPage.css'; // Add a CSS file if needed, or inline. Let's use standard classes

const InputField = ({ label, name, type = "number", step = "0.01", value, onChange, placeholder }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.25rem' }}>{label}</label>
        <input
            type={type}
            name={name}
            step={step}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
    </div>
);

const PhysicalTestsPage = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [results, setResults] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        jugador_id: '',
        fecha: new Date().toISOString().split('T')[0],
        velocidad_10m: '',
        velocidad_30m: '',
        velocidad_80m: '',
        broncotest: '',
        course_navette: '',
        salto_sj: '',
        salto_cmj: '',
        salto_rebote: '',
        salto_horizontal: '',
        flexiones: '',
        lanzamiento_pecho: '',
        lanzamiento_encima_cabeza: '',
        plancha: '',
        abdominales: ''
    });

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
                        playerName: player ? `${player.nombre} ${player.apellidos}` : 'Desconocido'
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.jugador_id || !formData.fecha) {
            alert('Por favor, selecciona un jugador y una fecha.');
            return;
        }

        // Clean up empty strings to null for numbers/floats
        const payload = { ...formData };
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') payload[key] = null;
            if (payload[key] !== null && !['jugador_id', 'fecha', 'broncotest', 'plancha'].includes(key)) {
                payload[key] = parseFloat(payload[key]);
            }
        });

        try {
            await apiPost('/pruebas_fisicas/', payload);
            setShowModal(false);
            setFormData({
                ...formData,
                jugador_id: '', // Reset player, keep date
                velocidad_10m: '', velocidad_30m: '', velocidad_80m: '',
                broncotest: '', course_navette: '',
                salto_sj: '', salto_cmj: '', salto_rebote: '', salto_horizontal: '',
                flexiones: '', lanzamiento_pecho: '', lanzamiento_encima_cabeza: '',
                plancha: '', abdominales: ''
            });
            fetchData();
        } catch (err) {
            console.error('Error saving test:', err);
            alert('Error al guardar los resultados.');
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
        if (!data || data.length === 0) return null;

        return (
            <div style={{ marginBottom: '2rem' }}>
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
                                    <th key={k.key} style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>{k.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{row.playerName}</td>
                                    {keys.map(k => (
                                        <td key={k.key} style={{ padding: '0.75rem' }}>{row[k.key] !== null && row[k.key] !== undefined ? row[k.key] : '-'}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderEvolutionCategory = (title, icon, keys, evolutionData) => {
        if (!evolutionData || evolutionData.length === 0) return null;

        return (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-primary-blue)', color: 'white' }}>
                        {icon}
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-orange)', fontSize: '1.2rem' }}>{title} (Evolución)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(0,51,102,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Jugador</th>
                                <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', fontSize: '0.8rem', color: '#666' }}>Fechas (1ª → Última)</th>
                                {keys.map(k => (
                                    <th key={k.key} style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'center' }}>{k.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {evolutionData.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{row.playerName}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                                        {formatDateStr(row.firstDate)} → {formatDateStr(row.lastDate)}
                                    </td>
                                    {keys.map(k => {
                                        const val1 = row.first[k.key];
                                        const val2 = row.last[k.key];
                                        const hasBoth = val1 !== null && val2 !== null && val1 !== undefined && val2 !== undefined;

                                        // For running (speed/resistance), lower is usually better, but let's just show absolute difference and color it
                                        // A simple display: Val1 -> Val2
                                        return (
                                            <td key={k.key} style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {hasBoth ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                        <span style={{ color: '#666' }}>{val1}</span>
                                                        <TrendingUp size={14} style={{ opacity: 0.5 }} />
                                                        <span style={{ fontWeight: 'bold' }}>{val2}</span>
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
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => setIsEvolutionMode(false)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: !isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                            color: !isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Resultados por Fecha
                    </button>
                    <button
                        onClick={() => setIsEvolutionMode(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: isEvolutionMode ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                            color: isEvolutionMode ? 'var(--color-primary-blue)' : '#666',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
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
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {getEvolutionData().length > 0 ? (
                            <>
                                {renderEvolutionCategory('Velocidad', <Zap size={20} />, speedKeys, getEvolutionData())}
                                {renderEvolutionCategory('Resistencia', <Activity size={20} />, resistKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Tren Superior', <Shield size={20} />, superiorKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Tren Inferior', <Dumbbell size={20} />, inferiorKeys, getEvolutionData())}
                                {renderEvolutionCategory('Fuerza Core', <Heart size={20} />, coreKeys, getEvolutionData())}
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

                        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            {getSessionData().length > 0 ? (
                                <>
                                    {renderTestCategory('Velocidad', <Zap size={20} />, speedKeys, getSessionData())}
                                    {renderTestCategory('Resistencia', <Activity size={20} />, resistKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Tren Superior', <Shield size={20} />, superiorKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Tren Inferior', <Dumbbell size={20} />, inferiorKeys, getSessionData())}
                                    {renderTestCategory('Fuerza Core', <Heart size={20} />, coreKeys, getSessionData())}
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

            {/* Modal for Inserting Data */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                            <h2 style={{ margin: 0, color: 'var(--color-primary-blue)' }}>Añadir Resultados Físicos</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#666" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-blue)', marginBottom: '0.25rem' }}>Jugador *</label>
                                    <select
                                        name="jugador_id"
                                        value={formData.jugador_id}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="">Selecciona un jugador...</option>
                                        {players.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputField label="Fecha de Evaluación *" name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} />
                            </div>

                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: 'var(--color-primary-orange)' }}>Velocidad</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InputField label="10m (s)" name="velocidad_10m" value={formData.velocidad_10m} onChange={handleInputChange} />
                                <InputField label="30m (s)" name="velocidad_30m" value={formData.velocidad_30m} onChange={handleInputChange} />
                                <InputField label="80m (s)" name="velocidad_80m" value={formData.velocidad_80m} onChange={handleInputChange} />
                            </div>

                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: 'var(--color-primary-orange)' }}>Resistencia</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InputField label="Broncotest (Ej: 5:30)" name="broncotest" type="text" value={formData.broncotest} onChange={handleInputChange} placeholder="MM:SS" />
                                <InputField label="Course Navette (Palier/Nivel)" name="course_navette" value={formData.course_navette} onChange={handleInputChange} />
                            </div>

                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: 'var(--color-primary-orange)' }}>Fuerza Tren Inferior</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InputField label="Salto SJ (cm)" name="salto_sj" value={formData.salto_sj} onChange={handleInputChange} />
                                <InputField label="Salto CMJ (cm)" name="salto_cmj" value={formData.salto_cmj} onChange={handleInputChange} />
                                <InputField label="Salto Rebote (cm)" name="salto_rebote" value={formData.salto_rebote} onChange={handleInputChange} />
                                <InputField label="Salto Horizontal (cm)" name="salto_horizontal" value={formData.salto_horizontal} onChange={handleInputChange} />
                            </div>

                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: 'var(--color-primary-orange)' }}>Fuerza Tren Superior</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InputField label="Flexiones (reps)" name="flexiones" type="number" step="1" value={formData.flexiones} onChange={handleInputChange} />
                                <InputField label="Lanzamiento Pecho (m)" name="lanzamiento_pecho" value={formData.lanzamiento_pecho} onChange={handleInputChange} />
                                <InputField label="Lanz. Encima Cabeza (m)" name="lanzamiento_encima_cabeza" value={formData.lanzamiento_encima_cabeza} onChange={handleInputChange} />
                            </div>

                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: 'var(--color-primary-orange)' }}>Fuerza Core</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <InputField label="Plancha (tiempo)" name="plancha" type="text" value={formData.plancha} onChange={handleInputChange} placeholder="e.g. 2m 15s" />
                                <InputField label="Abdominales (reps)" name="abdominales" type="number" step="1" value={formData.abdominales} onChange={handleInputChange} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: 0, backgroundColor: 'white', padding: '1rem 0', borderTop: '1px solid #eee' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-blue)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Guardar Resultados
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
