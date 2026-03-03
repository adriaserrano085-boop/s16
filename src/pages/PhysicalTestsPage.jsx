import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/apiClient';
import { ArrowLeft, Activity, Zap, Heart, Shield, Dumbbell, Plus, X, Save, TrendingUp, TrendingDown, Eye, User, Calendar, Award } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import './PhysicalTestsPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
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
    const [viewMode, setViewMode] = useState('resultados'); // 'resultados', 'evolucion', 'informe'
    const [sortConfig, setSortConfig] = useState(null); // { key: 'name' | 'score', direction: 'asc' | 'desc', session: string, keyIndex: number }
    const [detailedReportPlayer, setDetailedReportPlayer] = useState(null); // selected player id for detailed report

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

    const hasEvolutionData = (test) => {
        if (!test) return false;
        return players.some(p => {
            let count = 0;
            for (const s of sessions) {
                const res = results.find(r => r.jugador_id === p.id && r.fecha === s);
                if (res && test.keys.some(k => res[k] !== null && res[k] !== undefined && res[k] !== '')) {
                    count++;
                    if (count >= 2) return true;
                }
            }
            return false;
        });
    };

    const visibleTests = activeCategoryData ? activeCategoryData.tests.filter(test => viewMode !== 'evolucion' || hasEvolutionData(test)) : [];

    // Auto-select first visible test if active one is hidden
    useEffect(() => {
        if (visibleTests.length > 0 && !visibleTests.some(t => t.id === activeSubcategoryId)) {
            setActiveSubcategoryId(visibleTests[0].id);
        }
    }, [viewMode, activeCategoryId, results, players]);

    const activeTest = visibleTests.find(t => t.id === activeSubcategoryId) || visibleTests[0];

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
        // In informe mode, we show all active players roughly (or we can just use the players who have at least one test recorded EVER)
        if (viewMode === 'informe') {
            return results.some(r => r.jugador_id === p.id);
        }
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

                // Calculate BEST attempt for FirstDate
                let firstBestNum = null;
                let firstBestRaw = null;
                if (firstRes) {
                    const validItems = activeTest.keys.map(k => ({ raw: firstRes[k], num: parseToNumber(firstRes[k]) })).filter(item => item.num !== null);
                    if (validItems.length > 0) {
                        firstBestNum = activeTest.lowerIsBetter ? Math.min(...validItems.map(i => i.num)) : Math.max(...validItems.map(i => i.num));
                        firstBestRaw = validItems.find(i => i.num === firstBestNum)?.raw || firstBestNum;
                    }
                }

                // Calculate BEST attempt for LastDate
                let lastBestNum = null;
                let lastBestRaw = null;
                if (lastRes) {
                    const validItems = activeTest.keys.map(k => ({ raw: lastRes[k], num: parseToNumber(lastRes[k]) })).filter(item => item.num !== null);
                    if (validItems.length > 0) {
                        lastBestNum = activeTest.lowerIsBetter ? Math.min(...validItems.map(i => i.num)) : Math.max(...validItems.map(i => i.num));
                        lastBestRaw = validItems.find(i => i.num === lastBestNum)?.raw || lastBestNum;
                    }
                }

                evData.push({
                    player: p,
                    firstDate,
                    lastDate,
                    firstBestNum,
                    firstBestRaw,
                    lastBestNum,
                    lastBestRaw
                });
            }
        });

        return evData;
    };

    // Benchmark definitions for U16 (1 = Poor, 10 = Excellent)
    const U16_BENCHMARKS = {
        'velocidad_10m': { min: 2.20, max: 1.60, lowerIsBetter: true },
        'velocidad_30m': { min: 5.30, max: 4.20, lowerIsBetter: true },
        'velocidad_80m': { min: 12.00, max: 9.80, lowerIsBetter: true },
        'broncotest': { min: 390, max: 270, lowerIsBetter: true }, // 6:30 to 4:30
        'broncotest_20m': { min: 270, max: 180, lowerIsBetter: true }, // 4:30 to 3:00
        'course_navette': { min: 5, max: 12, lowerIsBetter: false },
        'salto_sj': { min: 25, max: 45, lowerIsBetter: false },
        'salto_cmj': { min: 25, max: 45, lowerIsBetter: false },
        'salto_rebote': { min: 20, max: 40, lowerIsBetter: false },
        'salto_horizontal': { min: 1.40, max: 2.20, lowerIsBetter: false },
        'sentadillas_1m': { min: 20, max: 50, lowerIsBetter: false },
        'flexiones': { min: 10, max: 40, lowerIsBetter: false },
        'lanzamiento_pecho': { min: 3, max: 8, lowerIsBetter: false },
        'lanzamiento_encima_cabeza': { min: 4, max: 10, lowerIsBetter: false },
        'plancha': { min: 45, max: 150, lowerIsBetter: false }, // 0:45 to 2:30
        'abdominales': { min: 20, max: 60, lowerIsBetter: false }
    };

    const getScoreForTest = (key, rawValue) => {
        if (rawValue === null || rawValue === undefined || rawValue === '') return null;
        let numVal = null;

        // Handle time strings
        if (['broncotest', 'broncotest_20m', 'plancha'].includes(key)) {
            const parts = String(rawValue).split(/[:.,]/);
            if (parts.length === 2) {
                numVal = parseInt(parts[0]) * 60 + parseInt(parts[1]); // seconds
            } else {
                numVal = parseFloat(rawValue);
            }
        } else {
            numVal = parseToNumber(rawValue);
        }

        if (numVal === null || isNaN(numVal)) return null;

        const bench = U16_BENCHMARKS[key];
        if (!bench) return 5; // default fallback

        // Calculate 1 to 10 interpolation
        let score = 0;
        if (bench.lowerIsBetter) {
            if (numVal >= bench.min) return 1;
            if (numVal <= bench.max) return 10;
            const diff = bench.min - numVal;
            const range = bench.min - bench.max;
            score = 1 + (diff / range) * 9;
        } else {
            if (numVal <= bench.min) return 1;
            if (numVal >= bench.max) return 10;
            const diff = numVal - bench.min;
            const range = bench.max - bench.min;
            score = 1 + (diff / range) * 9;
        }

        return Math.max(1, Math.min(10, Math.round(score * 10) / 10)); // round to 1 decimal
    };

    const getPlayerReport = () => {
        const reports = [];

        players.forEach(p => {
            const playerResults = results.filter(r => r.jugador_id === p.id);
            if (playerResults.length === 0) return;

            const testRanks = [];
            let validTests = 0;

            // Four Pillars Tracking (Weighted)
            const pillarTotals = {
                velocidad: { scoreSum: 0, weightSum: 0 },
                resistencia: { scoreSum: 0, weightSum: 0 },
                fuerza: { scoreSum: 0, weightSum: 0 },
                core: { scoreSum: 0, weightSum: 0 }
            };

            UI_CATEGORIES.forEach(cat => {
                let catId = cat.id; // 'velocidad', 'resistencia', 'inferior', 'superior', 'core'

                cat.tests.forEach(test => {
                    // Skip course navette as requested by the user
                    if (test.id === 'course_navette') return;

                    let latestResVal = null;
                    let latestResNumForRanking = null;
                    let latestKey = null;
                    let latestSession = null;

                    const sortedSessionsDesc = [...sessions].reverse();

                    for (const s of sortedSessionsDesc) {
                        const rec = playerResults.find(r => r.fecha === s);
                        if (rec) {
                            const validItems = test.keys.map(k => ({ key: k, raw: rec[k], num: parseToNumber(rec[k]) })).filter(item => item.num !== null);
                            if (validItems.length > 0) {
                                const bestNum = test.lowerIsBetter ? Math.min(...validItems.map(i => i.num)) : Math.max(...validItems.map(i => i.num));
                                const bestItem = validItems.find(i => i.num === bestNum);
                                latestResVal = bestItem.raw;
                                latestResNumForRanking = bestNum;
                                latestKey = bestItem.key;
                                latestSession = s;
                                break;
                            }
                        }
                    }

                    // Check historical best for trend analysis
                    let historicalBestNum = null;
                    for (const s of sessions) {
                        const rec = playerResults.find(r => r.fecha === s && r.fecha !== latestSession); // previous sessions only
                        if (rec) {
                            const validItems = test.keys.map(k => ({ num: parseToNumber(rec[k]) })).filter(item => item.num !== null);
                            if (validItems.length > 0) {
                                const b = test.lowerIsBetter ? Math.min(...validItems.map(i => i.num)) : Math.max(...validItems.map(i => i.num));
                                if (historicalBestNum === null) historicalBestNum = b;
                                else historicalBestNum = test.lowerIsBetter ? Math.min(historicalBestNum, b) : Math.max(historicalBestNum, b);
                            }
                        }
                    }

                    if (latestResVal !== null) {
                        const score = getScoreForTest(latestKey, latestResVal);
                        if (score !== null) {
                            validTests++;

                            // Map category to Pillar
                            let pillarGroup = 'fuerza'; // fallback
                            if (catId === 'velocidad') pillarGroup = 'velocidad';
                            if (catId === 'resistencia') pillarGroup = 'resistencia';
                            if (catId === 'core') pillarGroup = 'core';
                            if (catId === 'inferior' || catId === 'superior') pillarGroup = 'fuerza';

                            // Dynamic weighting for specific tests
                            let weight = 1.0;
                            if (test.id === '30m') weight = 2.0; // 30m is more representative of max velocity
                            if (test.id === '80m') weight = 1.5;

                            pillarTotals[pillarGroup].scoreSum += (score * weight);
                            pillarTotals[pillarGroup].weightSum += weight;

                            // Trend
                            let trend = 'same'; // 'up', 'down', 'same'
                            if (historicalBestNum !== null) {
                                if (test.lowerIsBetter) {
                                    if (latestResNumForRanking > historicalBestNum) trend = 'down'; // Slower = worse
                                    else if (latestResNumForRanking < historicalBestNum) trend = 'up';
                                } else {
                                    if (latestResNumForRanking < historicalBestNum) trend = 'down'; // Less jumps = worse
                                    else if (latestResNumForRanking > historicalBestNum) trend = 'up';
                                }
                            }

                            // Calculate Rank vs Teammates for that SAME session
                            const allSessionResults = results.filter(r => r.fecha === latestSession);
                            const teammateNums = allSessionResults.map(r => {
                                const vItems = test.keys.map(k => ({ num: parseToNumber(r[k]) })).filter(item => item.num !== null);
                                if (vItems.length === 0) return null;
                                return test.lowerIsBetter ? Math.min(...vItems.map(i => i.num)) : Math.max(...vItems.map(i => i.num));
                            }).filter(n => n !== null);

                            let rank = 1;
                            teammateNums.forEach(n => {
                                if (test.lowerIsBetter) {
                                    if (n < latestResNumForRanking) rank++;
                                } else {
                                    if (n > latestResNumForRanking) rank++;
                                }
                            });

                            testRanks.push({
                                categoryId: catId,
                                pillarGroup,
                                label: test.label,
                                val: latestResVal,
                                score,
                                rank,
                                totalPeers: teammateNums.length,
                                trend
                            });
                        }
                    }
                });
            });

            if (validTests > 0) {
                // Calculate pillar weighted averages
                const speedScore = pillarTotals.velocidad.weightSum > 0 ? (pillarTotals.velocidad.scoreSum / pillarTotals.velocidad.weightSum) : 0;
                const resScore = pillarTotals.resistencia.weightSum > 0 ? (pillarTotals.resistencia.scoreSum / pillarTotals.resistencia.weightSum) : 0;
                const forceScore = pillarTotals.fuerza.weightSum > 0 ? (pillarTotals.fuerza.scoreSum / pillarTotals.fuerza.weightSum) : 0;
                const coreScore = pillarTotals.core.weightSum > 0 ? (pillarTotals.core.scoreSum / pillarTotals.core.weightSum) : 0;

                // Generate dual-position logic properly tracking primary and secondary roles
                let pos1 = '';
                let pos2 = '';

                let rawPos = '';
                if (p.posiciones) {
                    rawPos = p.posiciones.toLowerCase().trim();
                } else if (p.posicion) {
                    rawPos = p.posicion.toLowerCase().trim();
                }

                if (rawPos) {
                    const parts = rawPos.split(',').map(str => str.trim());
                    pos1 = parts[0] || '';
                    pos2 = parts[1] || '';
                }

                // Helper to check if a single parsed position string is a forward
                const isForwardFn = (posString) => {
                    if (!posString) return null;
                    const numMatch = posString.match(/\b([1-9]|1[0-5])\b/);
                    if (numMatch) {
                        const num = parseInt(numMatch[1], 10);
                        if (num >= 1 && num <= 8) return true;
                        return false;
                    }
                    if (posString.includes('delantero') || posString.includes('primera') || posString.includes('segunda') || posString.includes('tercera') || posString.includes('pilier') || posString.includes('talonador') || posString.includes('ocho')) {
                        return true;
                    }
                    if (posString.includes('medio') || posString.includes('apertura') || posString.includes('centro') || posString.includes('ala') || posString.includes('zaguero')) {
                        return false;
                    }
                    return null; // unknown
                };

                const isForwardPrimary = isForwardFn(pos1);
                const isForwardSecondary = isForwardFn(pos2);

                let globalScore = 0;
                let activePillarsWeightSum = 0;

                const addWeight = (pScore, weight) => {
                    if (pScore > 0) {
                        globalScore += (pScore * weight);
                        activePillarsWeightSum += weight;
                    }
                };

                // Helper to calculate score using a specific profile (isForward)
                const applyProfileWeights = (pScoreSpeed, pScoreRes, pScoreForce, pScoreCore, isFwd) => {
                    if (isFwd) {
                        addWeight(pScoreSpeed, 0.15); // Less speed
                        addWeight(pScoreRes, 0.25);   // High resistance
                        addWeight(pScoreForce, 0.40); // Max strength
                        addWeight(pScoreCore, 0.20);  // High core
                    } else {
                        addWeight(pScoreSpeed, 0.40); // Max speed
                        addWeight(pScoreRes, 0.30);   // High resistance
                        addWeight(pScoreForce, 0.15); // Less strength
                        addWeight(pScoreCore, 0.15);  // Less core
                    }
                };

                // Calculate weights based on primary and secondary positions
                if (isForwardPrimary !== null) {
                    if (isForwardSecondary !== null && isForwardPrimary !== isForwardSecondary) {
                        // Mixed role (e.g. Forward primary, Back secondary) => 66% / 33% 
                        // To keep math simple and maintain proportions relative to `activePillarsWeightSum`, 
                        // we add the raw weighted combinations directly.

                        const w1 = isForwardPrimary ? { s: 0.15, r: 0.25, f: 0.40, c: 0.20 } : { s: 0.40, r: 0.30, f: 0.15, c: 0.15 };
                        const w2 = isForwardSecondary ? { s: 0.15, r: 0.25, f: 0.40, c: 0.20 } : { s: 0.40, r: 0.30, f: 0.15, c: 0.15 };

                        addWeight(speedScore, (w1.s * 0.66) + (w2.s * 0.33));
                        addWeight(resScore, (w1.r * 0.66) + (w2.r * 0.33));
                        addWeight(forceScore, (w1.f * 0.66) + (w2.f * 0.33));
                        addWeight(coreScore, (w1.c * 0.66) + (w2.c * 0.33));
                    } else {
                        // Standard single role (or both roles are the same type)
                        applyProfileWeights(speedScore, resScore, forceScore, coreScore, isForwardPrimary);
                    }
                } else {
                    // Fallback to equally weighted if position is not identified
                    addWeight(speedScore, 0.25);
                    addWeight(resScore, 0.25);
                    addWeight(forceScore, 0.25);
                    addWeight(coreScore, 0.25);
                }

                if (activePillarsWeightSum === 0) {
                    const arr = [speedScore, resScore, forceScore, coreScore].filter(v => v > 0);
                    globalScore = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
                } else {
                    globalScore = globalScore / activePillarsWeightSum;
                }

                reports.push({
                    player: p,
                    isForward,
                    positionText: positionToCheck,
                    globalScore: parseFloat(globalScore.toFixed(1)),
                    pillars: {
                        velocidad: parseFloat(speedScore.toFixed(1)),
                        resistencia: parseFloat(resScore.toFixed(1)),
                        fuerza: parseFloat(forceScore.toFixed(1)),
                        core: parseFloat(coreScore.toFixed(1))
                    },
                    testsEvaluated: validTests,
                    ranks: testRanks
                });
            }
        });

        return reports.sort((a, b) => b.globalScore - a.globalScore); // sort by highest score
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

        const getPlayerBestScoreInSession = (p, session, keyIndex = -1) => {
            const res = results.find(r => r.jugador_id === p.id && r.fecha === session);
            if (!res) return null;

            // If checking a specific INTento
            if (keyIndex >= 0 && keyIndex < activeTest.keys.length) {
                return parseToNumber(res[activeTest.keys[keyIndex]]);
            }

            // Standard: Best of all intents
            const validItems = activeTest.keys.map(k => ({ key: k, num: parseToNumber(res[k]) })).filter(item => item.num !== null);
            if (validItems.length > 0) {
                if (activeTest.lowerIsBetter) {
                    return Math.min(...validItems.map(i => i.num));
                } else {
                    return Math.max(...validItems.map(i => i.num));
                }
            }
            return null;
        }

        const handleSort = (type, session = null, keyIndex = -1) => {
            let direction = 'asc';
            if (sortConfig && sortConfig.key === type && sortConfig.session === session && sortConfig.keyIndex === keyIndex && sortConfig.direction === 'asc') {
                direction = 'desc';
            }
            setSortConfig({ key: type, direction, session, keyIndex });
        };

        const sortedPlayers = [...activePlayers].sort((a, b) => {
            if (!sortConfig) return 0;

            if (sortConfig.key === 'name') {
                const nameA = `${a.nombre} ${a.apellidos}`.toLowerCase();
                const nameB = `${b.nombre} ${b.apellidos}`.toLowerCase();
                if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            if (sortConfig.key === 'score') {
                const scoreA = getPlayerBestScoreInSession(a, sortConfig.session, sortConfig.keyIndex);
                const scoreB = getPlayerBestScoreInSession(b, sortConfig.session, sortConfig.keyIndex);

                if (scoreA === null && scoreB !== null) return 1; // Nulls always at bottom
                if (scoreB === null && scoreA !== null) return -1;
                if (scoreA === null && scoreB === null) return 0;

                // For testing metrics, "Better" could mean lower. But for generic sorting by numbers, 
                // asc means 1..10, desc means 10..1. We'll stick to mathematical sorting and rely on the arrow.
                if (scoreA < scoreB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (scoreA > scoreB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
            return 0;
        });

        // Helper render sorting arrow
        const SortIcon = ({ sortKey, session = null, keyIndex = -1 }) => {
            if (!sortConfig) return null;
            if (sortConfig.key === sortKey && sortConfig.session === session && sortConfig.keyIndex === keyIndex) {
                return <span style={{ fontSize: '0.8rem', marginLeft: '0.3rem' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
            }
            return null;
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
                                    <th rowSpan={activeTest.keys.length > 1 ? 2 : 1} onClick={() => handleSort('name')} style={{ minWidth: '220px', verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none' }}>
                                        Jugador <SortIcon sortKey="name" />
                                    </th>
                                    {validSessionsForTest.map(s => {
                                        return (
                                            <th key={s} colSpan={activeTest.keys.length} onClick={() => handleSort('score', s, -1)} style={{ textAlign: 'center', backgroundColor: '#f4f7f6', borderLeft: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none' }}>
                                                {formatDateStr(s)} <SortIcon sortKey="score" session={s} />
                                            </th>
                                        );
                                    })}
                                </tr>
                                {activeTest.keys.length > 1 && (
                                    <tr>
                                        {validSessionsForTest.map(s => activeTest.keys.map((k, i) => (
                                            <th key={`${s}-${k}`} onClick={() => handleSort('score', s, i)} style={{ textAlign: 'center', fontSize: '0.8rem', backgroundColor: '#fdfdfd', borderLeft: i === 0 ? '2px solid #e2e8f0' : '1px solid #eef2f6', cursor: 'pointer', userSelect: 'none' }}>
                                                {`Int. ${i + 1}`} <SortIcon sortKey="score" session={s} keyIndex={i} />
                                            </th>
                                        )))}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {sortedPlayers.map(p => (
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
                                <th style={{ textAlign: 'center', borderLeft: '2px solid #e2e8f0' }}>Mejor Marca Inicial</th>
                                <th style={{ textAlign: 'center', borderLeft: '1px solid #eef2f6' }}>Mejor Marca Final</th>
                                <th style={{ textAlign: 'center', borderLeft: '1px solid #eef2f6' }}>Evolución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evData.map((data, idx) => {
                                const hasBoth = data.firstBestNum !== null && data.lastBestNum !== null && data.firstBestNum !== undefined && data.lastBestNum !== undefined;
                                let diffText = '-';
                                let evolutionColor = '#888';

                                if (hasBoth) {
                                    const diff = data.lastBestNum - data.firstBestNum;
                                    const isPositiveEvol = activeTest.lowerIsBetter ? (diff < 0) : (diff > 0);
                                    const isNeutral = diff === 0;

                                    diffText = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                                    // if format is a string time, let's keep it simple and just show the number diff
                                    if (['broncotest', 'broncotest_20m', 'plancha'].some(k => activeTest.keys.includes(k))) {
                                        // It's a string, we parsed it using : to .
                                        // Let's format the diff back to MM:SS if it was a time
                                        const totalSeconds = Math.round(Math.abs(diff) * 100);
                                        const m = Math.floor(Math.abs(diff));
                                        const s = totalSeconds % 100;
                                        diffText = `${diff > 0 ? '+' : '-'}${m}:${s.toString().padStart(2, '0')}`;
                                        if (isNeutral) diffText = '0:00';
                                    }

                                    if (isNeutral) {
                                        evolutionColor = '#666';
                                    } else if (isPositiveEvol) {
                                        evolutionColor = '#15803d'; // green
                                    } else {
                                        evolutionColor = '#dc2626'; // red
                                    }
                                }

                                return (
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

                                        <td style={{ textAlign: 'center', borderLeft: '2px solid #e2e8f0', color: '#888' }}>
                                            {data.firstBestRaw ?? '-'}
                                        </td>
                                        <td style={{ textAlign: 'center', borderLeft: '1px solid #f0f4f8', fontWeight: 'bold' }}>
                                            {data.lastBestRaw ?? '-'}
                                        </td>
                                        <td style={{ textAlign: 'center', borderLeft: '1px solid #f0f4f8', fontWeight: 'bold', color: evolutionColor }}>
                                            {hasBoth ? (
                                                <span style={{ backgroundColor: `${evolutionColor}15`, padding: '4px 8px', borderRadius: '8px' }}>
                                                    {diffText}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderReportView = () => {
        const reports = getPlayerReport();

        if (reports.length === 0) {
            return (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#666', backgroundColor: 'white', borderRadius: '12px' }}>
                    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                    <p style={{ fontSize: '1.1rem' }}>No hay suficientes datos para generar los informes. Registra resultados primero.</p>
                </div>
            );
        }

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', width: '100%' }}>
                {reports.map((r, idx) => {
                    let scoreColor = '#dc2626'; // Red (<5)
                    if (r.globalScore >= 5) scoreColor = '#ca8a04'; // Yellow (5-7)
                    if (r.globalScore >= 7) scoreColor = '#15803d'; // Green (>=7)

                    // Generate dynamic evaluation text based on best/worst rank
                    let stringEval = `Se recomiendan más pruebas (${r.testsEvaluated} reg.) para una valoración detallada.`;
                    if (r.ranks.length > 0) {
                        const sortedRanks = [...r.ranks].sort((a, b) => b.score - a.score); // Highest scores first
                        const best = sortedRanks[0];
                        const worst = sortedRanks[sortedRanks.length - 1];

                        const role = r.isForward ? 'Delantero' : 'Tres Cuartos';

                        if (sortedRanks.length >= 3 && r.globalScore >= 7) {
                            stringEval = `Estado físico excelente para su rol de ${role}. Destaca especialmente en ${best.label} (Score: ${best.score}). Listo para máxima exigencia.`;
                        } else if (sortedRanks.length >= 3 && r.globalScore < 5) {
                            stringEval = `Precisa plan específico adaptado a ${role}. Prioridad urgente en ${worst.label} (${worst.score} pts).`;
                        } else if (sortedRanks.length >= 2) {
                            stringEval = `Aspecto fuerte: ${best.label}. Requiere trabajo enfocado en: ${worst.label} para su rol de ${role}.`;
                        } else {
                            stringEval = `Último registro validado: ${best.label} con ${best.val}. Completar pilares físicos.`;
                        }

                        // Check if any trend is down
                        const recentDowns = r.ranks.filter(rk => rk.trend === 'down');
                        if (recentDowns.length > 0 && r.globalScore >= 5) { // Only append if it's not already catastrophic
                            stringEval += ` ¡Atención! Leve bajada de rendimiento detectado en ${recentDowns[0].label}.`;
                        }
                    }

                    return (
                        <div onClick={() => setDetailedReportPlayer(r)} key={r.player.id} className="report-card-hover" style={{ cursor: 'pointer', backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', border: '1px solid transparent' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: scoreColor }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {r.player.foto ? (
                                        <img src={r.player.foto} alt={r.player.nombre} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '1rem', color: '#999', fontWeight: 'bold' }}>{r.player.nombre.charAt(0)}{r.player.apellidos.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{r.player.nombre} {r.player.apellidos}</h4>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{r.testsEvaluated} Pruebas recientes evaluadas</span>
                                    </div>
                                </div>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    backgroundColor: `${scoreColor}15`,
                                    color: scoreColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    border: `2px solid ${scoreColor}`
                                }}>
                                    {r.globalScore}
                                </div>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>
                                {stringEval}
                            </p>

                            {r.ranks.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.5px' }}>Desglose de Puntos (últimas marcas)</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {r.ranks.map(rk => (
                                            <div key={rk.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0.6rem', backgroundColor: '#f9fafa', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: '500', color: '#444' }}>{rk.label}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {rk.trend === 'down' && <TrendingDown size={14} color="#dc2626" />}
                                                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{rk.score > 0 ? `Sc: ${rk.score}` : ''} ({rk.rank}º)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button style={{
                                marginTop: '0.5rem',
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                background: '#fdfdfd',
                                color: 'var(--color-primary-blue)',
                                fontWeight: 'bold',
                                width: '100%',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Eye size={16} /> Abrir Perfil Físico
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDetailedPlayerReport = () => {
        if (!detailedReportPlayer) return null;

        const r = detailedReportPlayer;
        let scoreColor = '#dc2626'; // Red (<5)
        if (r.globalScore >= 5) scoreColor = '#ca8a04'; // Yellow (5-7)
        if (r.globalScore >= 7) scoreColor = '#15803d'; // Green (>=7)

        const radarData = {
            labels: ['Velocidad', 'Fuerza', 'Resistencia', 'Core'],
            datasets: [
                {
                    label: 'Score del Jugador',
                    data: [r.pillars.velocidad, r.pillars.fuerza, r.pillars.resistencia, r.pillars.core],
                    backgroundColor: 'rgba(255, 102, 0, 0.2)',
                    borderColor: 'rgba(255, 102, 0, 1)',
                    pointBackgroundColor: 'rgba(255, 102, 0, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 102, 0, 1)',
                    borderWidth: 2,
                }
            ]
        };

        const radarOptions = {
            scales: {
                r: {
                    angleLines: { display: true, color: 'rgba(0,0,0,0.05)' },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 2,
                        backdropColor: 'transparent',
                        color: '#999'
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    pointLabels: {
                        font: { size: 13, weight: 'bold', family: 'Inter' },
                        color: 'var(--color-primary-blue)'
                    }
                }
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        };

        // Find Best/Worst Pillars
        const pillArr = [
            { name: 'Velocidad', val: r.pillars.velocidad },
            { name: 'Fuerza', val: r.pillars.fuerza },
            { name: 'Resistencia', val: r.pillars.resistencia },
            { name: 'Core', val: r.pillars.core }
        ].filter(p => p.val > 0).sort((a, b) => b.val - a.val);

        const bestPillar = pillArr.length > 0 ? pillArr[0] : null;
        const worstPillar = pillArr.length > 0 ? pillArr[pillArr.length - 1] : null;

        const roleText = r.isForward ? 'Delantero / Forward' : 'Tres Cuartos / Back';

        return (
            <div className="modal-overlay" style={{ zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setDetailedReportPlayer(null)}>
                <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ padding: '2rem', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: scoreColor }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            {r.player.foto ? (
                                <img src={r.player.foto} alt={r.player.nombre} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${scoreColor}` }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${scoreColor}` }}>
                                    <span style={{ fontSize: '1.5rem', color: '#999', fontWeight: 'bold' }}>{r.player.nombre.charAt(0)}{r.player.apellidos.charAt(0)}</span>
                                </div>
                            )}
                            <div>
                                <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-primary-blue)', fontSize: '1.8rem' }}>{r.player.nombre} {r.player.apellidos}</h2>
                                <div style={{ display: 'flex', gap: '1rem', color: '#666', fontSize: '0.95rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={16} /> {roleText}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={16} /> {r.testsEvaluated} Evaluaciones Registradas</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Nota Global Ponderada</p>
                                <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: scoreColor }}>{r.globalScore}</p>
                            </div>
                            <button onClick={() => setDetailedReportPlayer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', backgroundColor: '#f1f3f5' }}>
                                <X size={24} color="#666" />
                            </button>
                        </div>
                    </div>

                    {/* Content Scrollable Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

                        {/* Top Overview Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', marginBottom: '2rem' }}>

                            {/* Spider Chart */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#444', fontSize: '1.1rem', alignSelf: 'flex-start' }}>Balance Físico por Pilares</h3>
                                <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                                    <Radar data={radarData} options={radarOptions} />
                                </div>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fbfd', borderRadius: '12px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Vel</div>
                                        <div style={{ fontWeight: 'bold', color: r.pillars.velocidad >= 7 ? '#15803d' : r.pillars.velocidad < 5 ? '#dc2626' : '#ca8a04' }}>{r.pillars.velocidad || '-'}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Fuerza</div>
                                        <div style={{ fontWeight: 'bold', color: r.pillars.fuerza >= 7 ? '#15803d' : r.pillars.fuerza < 5 ? '#dc2626' : '#ca8a04' }}>{r.pillars.fuerza || '-'}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Resis</div>
                                        <div style={{ fontWeight: 'bold', color: r.pillars.resistencia >= 7 ? '#15803d' : r.pillars.resistencia < 5 ? '#dc2626' : '#ca8a04' }}>{r.pillars.resistencia || '-'}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Core</div>
                                        <div style={{ fontWeight: 'bold', color: r.pillars.core >= 7 ? '#15803d' : r.pillars.core < 5 ? '#dc2626' : '#ca8a04' }}>{r.pillars.core || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Panel */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', flex: 1 }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#444', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Award size={20} color="var(--color-primary-orange)" />
                                        Evaluación Cualitativa Algorítmica
                                    </h3>

                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        {bestPillar && (
                                            <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Principal Fortaleza</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#15803d' }}>{bestPillar.name} (Sc. {bestPillar.val})</div>
                                            </div>
                                        )}
                                        {worstPillar && (
                                            <div style={{ flex: 1, backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Debilidad Crítica</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#dc2626' }}>{worstPillar.name} (Sc. {worstPillar.val})</div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ backgroundColor: '#f9fafa', padding: '1.25rem', borderRadius: '12px', borderLeft: `4px solid ${scoreColor}` }}>
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#444', lineHeight: '1.6' }}>
                                            Este algoritmo pondera las variables en función de su rol como <strong>{roleText}</strong>.
                                            {r.isForward ? " En esta posición, la Fuerza y la Resistencia dominan el coeficiente multiplicador para empuje en cerrado y mantenimiento posicional." : " En esta posición, la Velocidad sprint y la Resistencia (Bronco) tienen dominancia en el multiplicador para coberturas y rupturas de línea."}
                                            {bestPillar && worstPillar ? ` Su balance actual demuestra excelencia en ${bestPillar.name}, pero precisa enfoque metodológico urgente en ${worstPillar.name} para equilibrar su Perfil Físico Completo.` : ''}
                                        </p>
                                    </div>

                                    {r.ranks.some(x => x.trend === 'down') && (
                                        <div style={{ marginTop: '1rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
                                            <TrendingDown color="#ea580c" size={24} />
                                            <div>
                                                <strong style={{ color: '#9a3412', display: 'block', marginBottom: '0.25rem' }}>Alerta de Tendencia Negativa Histórica</strong>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#c2410c' }}>Las últimas marcas registradas en <strong>{r.ranks.filter(x => x.trend === 'down').map(x => x.label).join(', ')}</strong> son estadísticamente peores que su Mejor Marca Histórica personal. Revisar posibles sobrecargas, estado de forma local o motivación.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Detailed Grid of Tests */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#444', fontSize: '1.1rem' }}>Desglose Detallado por Prueba Independiente</h3>
                            <div className="data-table-container">
                                <table className="data-table" style={{ margin: 0 }}>
                                    <thead style={{ backgroundColor: '#f8fafc' }}>
                                        <tr>
                                            <th>Grupo</th>
                                            <th>Prueba</th>
                                            <th style={{ textAlign: 'center' }}>Mejor Intento Registrado</th>
                                            <th style={{ textAlign: 'center' }}>Puesto en Equipo (Ranking)</th>
                                            <th style={{ textAlign: 'center' }}>Nota Interpolar</th>
                                            <th style={{ textAlign: 'center' }}>Evolución Int.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {r.ranks.sort((a, b) => b.score - a.score).map((rk, idx) => {
                                            let rkColor = '#dc2626';
                                            if (rk.score >= 5) rkColor = '#ca8a04';
                                            if (rk.score >= 7) rkColor = '#15803d';

                                            return (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: '500', color: '#666', textTransform: 'capitalize' }}>{rk.pillarGroup}</td>
                                                    <td style={{ fontWeight: '600', color: '#333' }}>{rk.label}</td>
                                                    <td style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>{rk.val}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            backgroundColor: rk.rank <= 3 && rk.totalPeers >= 10 ? '#f0fdf4' : '#f1f5f9',
                                                            color: rk.rank <= 3 && rk.totalPeers >= 10 ? '#166534' : '#475569',
                                                            border: rk.rank <= 3 && rk.totalPeers >= 10 ? '1px solid #bbf7d0' : 'none',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {rk.rank}º <span style={{ fontWeight: 'normal', fontSize: '0.8rem', opacity: 0.8 }}>de {rk.totalPeers}</span>
                                                        </span>
                                                        {rk.rank <= 3 && rk.totalPeers >= 10 && <span style={{ marginLeft: '0.5rem' }}>🏆</span>}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ backgroundColor: rkColor, color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>{rk.score}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {rk.trend === 'up' && <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}><TrendingUp size={16} /> Mejorando</span>}
                                                        {rk.trend === 'down' && <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}><TrendingDown size={16} /> Empeorando</span>}
                                                        {rk.trend === 'same' && <span style={{ color: '#94a3b8' }}>-</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

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
                            onClick={() => setViewMode('resultados')}
                            style={{
                                borderBottom: viewMode === 'resultados' ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                color: viewMode === 'resultados' ? 'var(--color-primary-blue)' : '#666',
                                padding: '0.5rem 1rem', background: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            Resultados y Pruebas
                        </button>
                        <button
                            className="tab-button"
                            onClick={() => setViewMode('evolucion')}
                            style={{
                                borderBottom: viewMode === 'evolucion' ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                color: viewMode === 'evolucion' ? 'var(--color-primary-blue)' : '#666',
                                padding: '0.5rem 1rem', background: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            Evolución Individual
                        </button>
                        <button
                            className="tab-button"
                            onClick={() => setViewMode('informe')}
                            style={{
                                borderBottom: viewMode === 'informe' ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
                                color: viewMode === 'informe' ? 'var(--color-primary-blue)' : '#666',
                                padding: '0.5rem 1rem', background: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            Informe General
                        </button>
                    </div>

                    {/* Category & Subcategory Tabs - Hidden in Informe View */}
                    {viewMode !== 'informe' && (
                        <>
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

                            {
                                activeCategoryData && visibleTests.length > 0 ? (
                                    <div className="subtabs-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {visibleTests.map(test => (
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
                                ) : (
                                    viewMode === 'evolucion' && (
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', color: '#666' }}>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} opacity={0.5} /> No hay pruebas en esta categoría con suficientes datos para medir evolución todavía.</p>
                                        </div>
                                    )
                                )
                            }
                        </>
                    )}
                </div>

                {
                    loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-primary-blue)' }}>
                            <Activity size={48} className="animate-pulse" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <p style={{ fontSize: '1.2rem' }}>Cargando datos...</p>
                        </div>
                    ) : viewMode === 'informe' ? (
                        renderReportView()
                    ) : (
                        <>
                            {!activeTest || validSessionsForTest.length === 0 || activePlayers.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#666', backgroundColor: 'white', borderRadius: '12px' }}>
                                    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
                                    <p style={{ fontSize: '1.1rem' }}>No hay resultados registrados para esta prueba.</p>
                                </div>
                            ) : (
                                viewMode === 'evolucion' ? renderEvolutionView() : renderResultsView()
                            )}
                        </>
                    )
                }

                {
                    /* Detailed Player Report Modal */
                    renderDetailedPlayerReport()
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
