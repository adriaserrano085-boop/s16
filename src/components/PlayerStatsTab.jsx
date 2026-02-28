import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

const TeamLogo = ({ url, name, size = 30 }) => {
    if (!url) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999', overflow: 'hidden' }}>{name?.substring(0, 2)}</div>;
    return <img src={url} alt={name} style={{ width: size, height: size, objectFit: 'contain', display: 'block', margin: '0 auto' }} title={name} />;
};

export const PlayerStatsTab = ({ playerStats, allPlayers, leagueStats, onPlayerClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'puntos', direction: 'desc' });

    const filteredAndSortedStats = useMemo(() => {
        let stats = playerStats;
        if (searchTerm) {
            stats = stats.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.team?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Add calculated fields for sorting
        stats = stats.map(p => {
            const pj = p.jugados || 1; // avoid division by zero for calculation, though handled in display
            const piePts = (p.conversiones * 2) + (p.golpes * 3) + (p.drops * 3);
            return {
                ...p,
                min_por_partido: p.jugados > 0 ? (p.minutos / p.jugados) : 0,
                ens_por_partido: p.jugados > 0 ? (p.ensayos / p.jugados) : 0,
                pie_por_partido: p.jugados > 0 ? (piePts / p.jugados) : 0,
                amarillas_por_partido: p.jugados > 0 ? (p.amarillas / p.jugados) : 0,
                rojas_por_partido: p.jugados > 0 ? (p.rojas / p.jugados) : 0,
                pts_por_partido: p.jugados > 0 ? (p.puntos / p.jugados) : 0,
            }
        });

        return [...stats].sort((a, b) => {
            const valA = a[sortConfig.key] ?? 0;
            const valB = b[sortConfig.key] ?? 0;

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [playerStats, searchTerm, sortConfig]);

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span className="sort-icon">⇅</span>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sort-icon--active" /> : <ChevronDown size={14} className="sort-icon--active" />;
    };

    return (
        <div className="player-stats-tab-container">
            <div className="search-box-container mb-2">
                <Search size={16} className="search-icon" />
                <input
                    type="text"
                    placeholder="Buscar jugador o equipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input w-full"
                />
            </div>

            <div className="stats-table-card">
                <div className="table-wrapper">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} className="cursor-pointer">
                                    Jugador {renderSortIcon('name')}
                                </th>
                                <th onClick={() => handleSort('team')} className="cursor-pointer">
                                    Equipo {renderSortIcon('team')}
                                </th>
                                <th onClick={() => handleSort('jugados')} className="text-center cursor-pointer">
                                    PJ {renderSortIcon('jugados')}
                                </th>
                                <th onClick={() => handleSort('minutos')} className="text-center cursor-pointer">
                                    Min {renderSortIcon('minutos')}
                                </th>
                                <th onClick={() => handleSort('min_por_partido')} className="text-center cursor-pointer border-r border-gray-200" title="Minutos por Partido">
                                    Min/P {renderSortIcon('min_por_partido')}
                                </th>
                                <th onClick={() => handleSort('ensayos')} className="text-center cursor-pointer">
                                    Ens {renderSortIcon('ensayos')}
                                </th>
                                <th onClick={() => handleSort('ens_por_partido')} className="text-center cursor-pointer border-r border-gray-200" title="Ensayos por Partido">
                                    Ens/P {renderSortIcon('ens_por_partido')}
                                </th>
                                <th onClick={() => handleSort('conversiones')} className="text-center cursor-pointer">
                                    Conv {renderSortIcon('conversiones')}
                                </th>
                                <th onClick={() => handleSort('golpes')} className="text-center cursor-pointer">
                                    Pen {renderSortIcon('golpes')}
                                </th>
                                <th onClick={() => handleSort('drops')} className="text-center cursor-pointer">
                                    Drop {renderSortIcon('drops')}
                                </th>
                                <th onClick={() => handleSort('pie_por_partido')} className="text-center cursor-pointer border-r border-gray-200" title="Puntos al Pie (Conv+Pen+Drop) por Partido">
                                    Pie/P {renderSortIcon('pie_por_partido')}
                                </th>
                                <th onClick={() => handleSort('amarillas')} className="text-center cursor-pointer">
                                    Amar {renderSortIcon('amarillas')}
                                </th>
                                <th onClick={() => handleSort('amarillas_por_partido')} className="text-center cursor-pointer" title="Amarillas por Partido">
                                    Am/P {renderSortIcon('amarillas_por_partido')}
                                </th>
                                <th onClick={() => handleSort('rojas')} className="text-center cursor-pointer">
                                    Roj {renderSortIcon('rojas')}
                                </th>
                                <th onClick={() => handleSort('rojas_por_partido')} className="text-center cursor-pointer border-r border-gray-200" title="Rojas por Partido">
                                    Roj/P {renderSortIcon('rojas_por_partido')}
                                </th>
                                <th onClick={() => handleSort('puntos')} className="text-center cursor-pointer">
                                    Pts {renderSortIcon('puntos')}
                                </th>
                                <th onClick={() => handleSort('pts_por_partido')} className="text-center cursor-pointer" title="Puntos por Partido">
                                    Pts/P {renderSortIcon('pts_por_partido')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedStats.length > 0 ? (
                                filteredAndSortedStats.map((p, i) => (
                                    <tr
                                        key={i}
                                        className={`cursor-pointer ${p.team?.toUpperCase().includes('HOSPITALET') ? 'tr--hospi' : ''}`}
                                        onClick={() => onPlayerClick && onPlayerClick(p)}
                                    >
                                        <td className="text-bold">{p.name}</td>
                                        <td className="text-center" style={{ width: '40px' }}>
                                            <TeamLogo
                                                url={leagueStats?.find(t => t.team === p.team)?.escudo}
                                                name={p.team}
                                                size={28}
                                            />
                                        </td>
                                        <td className="text-center">{p.jugados}</td>
                                        <td className="text-center">{p.minutos}'</td>
                                        <td className="text-center border-r border-gray-200 font-medium text-gray-500">{p.jugados > 0 ? (p.minutos / p.jugados).toFixed(1) : '-'}</td>
                                        <td className="text-center">{p.ensayos}</td>
                                        <td className="text-center border-r border-gray-200 text-gray-400">{p.jugados > 0 ? (p.ensayos / p.jugados).toFixed(2) : '-'}</td>
                                        <td className="text-center">{p.conversiones}</td>
                                        <td className="text-center">{p.golpes}</td>
                                        <td className="text-center">{p.drops}</td>
                                        <td className="text-center border-r border-gray-200 text-gray-400">
                                            {p.jugados > 0 ? (((p.conversiones * 2) + (p.golpes * 3) + (p.drops * 3)) / p.jugados).toFixed(2) : '-'}
                                        </td>
                                        <td className="text-center">
                                            {p.amarillas > 0 ? <div className="card-mini bg-yellow">{p.amarillas}</div> : '-'}
                                        </td>
                                        <td className="text-center text-gray-400">{p.jugados > 0 ? (p.amarillas / p.jugados).toFixed(2) : '-'}</td>
                                        <td className="text-center">
                                            {p.rojas > 0 ? <div className="card-mini bg-red">{p.rojas}</div> : '-'}
                                        </td>
                                        <td className="text-center border-r border-gray-200 text-gray-400">{p.jugados > 0 ? (p.rojas / p.jugados).toFixed(2) : '-'}</td>
                                        <td className="text-center text-bold color-orange">{p.puntos}</td>
                                        <td className="text-center font-bold text-orange-400 bg-orange-50">{p.jugados > 0 ? (p.puntos / p.jugados).toFixed(1) : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="17" className="text-center py-4 italic text-light">
                                        No se encontraron jugadores que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsTab;
