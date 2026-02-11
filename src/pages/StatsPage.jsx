import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { playerStats as mockPlayerStats, leagueStats as mockLeagueStats } from '../lib/mockData';
import { ArrowLeft, Users, Trophy, Activity } from 'lucide-react';

const StatsPage = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('equipos'); // 'equipos' or 'jugadores'
    const [subTab, setSubTab] = useState('todos'); // 'todos' or team name
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [loading, setLoading] = useState(true);
    const [leagueStats, setLeagueStats] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: lData } = await supabase.from('clasificacion_liga').select('*, equipos(name)');
            if (lData) setLeagueStats(lData.map(d => ({ ...d, team: d.equipos?.name })));
            else setLeagueStats(mockLeagueStats);

            const { data: pData } = await supabase.from('estadisticas_partido').select('*, jugadores(name, equip_id), equipos(name)');
            if (pData) setPlayerStats(pData.map(d => ({ ...d, player_id: d.player_id, name: d.jugadores?.name, team: d.equipos?.name })));
            else setPlayerStats(mockPlayerStats);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setLeagueStats(mockLeagueStats);
            setPlayerStats(mockPlayerStats);
        } finally {
            setLoading(false);
        }
    };

    const teams = leagueStats.map(t => t.team);
    const otherTeams = teams.filter(t => t !== "RC HOSPITALET");

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;
        const sorted = [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sorted;
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>⇅</span>;
        return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '5px' }}>↑</span> : <span style={{ marginLeft: '5px' }}>↓</span>;
    };

    const playersToDisplay = activeTab === 'jugadores'
        ? playerStats
        : (subTab === 'todos' ? [] : playerStats.filter(p => p.team === subTab));

    return (
        <div className="stats-page-container">


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
                    <h1 style={{ color: 'var(--color-primary-blue)', margin: 0 }}>Centro de Estadísticas</h1>
                </header>

                {/* Main Tabs Navigation */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { id: 'equipos', label: 'Equipos', icon: <Trophy size={18} /> },
                        { id: 'jugadores', label: 'Todos los Jugadores', icon: <Users size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'equipos' && subTab !== 'todos') setSubTab('todos');
                                setSortConfig({ key: null, direction: 'asc' });
                            }}
                            style={{
                                flex: 1,
                                padding: '0.85rem',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: activeTab === tab.id ? 'var(--color-primary-blue)' : 'rgba(255,255,255,0.7)',
                                color: activeTab === tab.id ? 'white' : 'var(--color-primary-blue)',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sub-tabs for Teams (only visible in Equipos tab) */}
                {activeTab === 'equipos' && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1.5rem',
                        overflowX: 'auto',
                        paddingBottom: '0.5rem',
                        scrollbarWidth: 'none'
                    }}>
                        <button
                            onClick={() => { setSubTab('todos'); setSortConfig({ key: null, direction: 'asc' }); }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: '1px solid var(--color-primary-blue)',
                                backgroundColor: subTab === 'todos' ? 'var(--color-primary-blue)' : 'white',
                                color: subTab === 'todos' ? 'white' : 'var(--color-primary-blue)',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}
                        >
                            Clasificación
                        </button>
                        {otherTeams.map(team => (
                            <button
                                key={team}
                                onClick={() => { setSubTab(team); setSortConfig({ key: null, direction: 'asc' }); }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    border: '1px solid var(--color-primary-blue)',
                                    backgroundColor: subTab === team ? 'var(--color-primary-blue)' : 'white',
                                    color: subTab === team ? 'white' : 'var(--color-primary-blue)',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer'
                                }}
                            >
                                {team}
                            </button>
                        ))}
                    </div>
                )}

                <div className="card" style={{ backdropFilter: 'blur(10px)', overflowX: 'auto', padding: '1.25rem' }}>
                    {activeTab === 'equipos' && subTab === 'todos' ? (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-blue)', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-primary-orange)', paddingBottom: '0.5rem' }}>
                                Clasificación de la Liga
                            </h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(0,51,102,0.05)', textAlign: 'left' }}>
                                        <th onClick={() => handleSort('ranking')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Pos {renderSortIcon('ranking')}</th>
                                        <th onClick={() => handleSort('team')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Equipo {renderSortIcon('team')}</th>
                                        <th onClick={() => handleSort('favor')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>PF {renderSortIcon('favor')}</th>
                                        <th onClick={() => handleSort('contra')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>PC {renderSortIcon('contra')}</th>
                                        <th onClick={() => handleSort('dif')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Dif {renderSortIcon('dif')}</th>
                                        <th onClick={() => handleSort('ensayos')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Ens. {renderSortIcon('ensayos')}</th>
                                        <th onClick={() => handleSort('amarillas')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>🟨 {renderSortIcon('amarillas')}</th>
                                        <th onClick={() => handleSort('rojas')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>🟥 {renderSortIcon('rojas')}</th>
                                        <th onClick={() => handleSort('victorias')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer', textAlign: 'right' }}>% Vic {renderSortIcon('victorias')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortData(leagueStats).map((team) => (
                                        <tr key={team.team} style={{ borderBottom: '1px solid #eee', backgroundColor: team.team.includes('HOSPITALET') ? 'rgba(255,102,0,0.05)' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>#{team.ranking}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{team.team}</td>
                                            <td style={{ padding: '0.75rem' }}>{team.favor}</td>
                                            <td style={{ padding: '0.75rem' }}>{team.contra}</td>
                                            <td style={{ padding: '0.75rem', color: team.dif >= 0 ? '#27AE60' : '#C0392B', fontWeight: 'bold' }}>{team.dif}</td>
                                            <td style={{ padding: '0.75rem' }}>{team.ensayos}</td>
                                            <td style={{ padding: '0.75rem', color: '#B7950B' }}>{team.amarillas}</td>
                                            <td style={{ padding: '0.75rem', color: '#922B21' }}>{team.rojas}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <div style={{ width: '40px', height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${team.victorias}%`, backgroundColor: 'var(--color-primary-orange)' }}></div>
                                                    </div>
                                                    <span style={{ fontWeight: 'bold' }}>{team.victorias}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-blue)', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-primary-orange)', paddingBottom: '0.5rem' }}>
                                {activeTab === 'jugadores' ? 'Plantilla RC HOSPITALET' : `Plantilla ${subTab}`}
                            </h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(0,51,102,0.05)', textAlign: 'left' }}>
                                        <th onClick={() => handleSort('name')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Jugador {renderSortIcon('name')}</th>
                                        <th onClick={() => handleSort('titular')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Titular {renderSortIcon('titular')}</th>
                                        <th onClick={() => handleSort('jugados')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Jug. {renderSortIcon('jugados')}</th>
                                        <th onClick={() => handleSort('minutos')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Min/P {renderSortIcon('minutos')}</th>
                                        <th onClick={() => handleSort('ensayos')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Ens. {renderSortIcon('ensayos')}</th>
                                        <th onClick={() => handleSort('amarillas')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>🟨 {renderSortIcon('amarillas')}</th>
                                        <th onClick={() => handleSort('rojas')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>🟥 {renderSortIcon('rojas')}</th>
                                        <th onClick={() => handleSort('golpes')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Gol. {renderSortIcon('golpes')}</th>
                                        <th onClick={() => handleSort('conversiones')} style={{ padding: '0.75rem', borderBottom: '2px solid #ddd', cursor: 'pointer' }}>Conv. {renderSortIcon('conversiones')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortData(playersToDisplay).map((p, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.name}</td>
                                            <td style={{ padding: '0.75rem' }}>{p.titular}</td>
                                            <td style={{ padding: '0.75rem' }}>{p.jugados}</td>
                                            <td style={{ padding: '0.75rem' }}>{p.minutos}'</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary-orange)' }}>{p.ensayos}</td>
                                            <td style={{ padding: '0.75rem', color: '#B7950B' }}>{p.amarillas}</td>
                                            <td style={{ padding: '0.75rem', color: '#922B21' }}>{p.rojas}</td>
                                            <td style={{ padding: '0.75rem' }}>{p.golpes}</td>
                                            <td style={{ padding: '0.75rem' }}>{p.conversiones}</td>
                                        </tr>
                                    ))}
                                    {playersToDisplay.length === 0 && (
                                        <tr>
                                            <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay estadísticas disponibles para este equipo.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
