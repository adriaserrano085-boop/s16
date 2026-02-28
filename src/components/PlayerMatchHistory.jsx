import React from 'react';
import { X, Calendar, Trophy, Zap, Shield } from 'lucide-react';
import './PlayerMatchHistory.css';

const PlayerMatchHistory = ({ player, onClose }) => {
    if (!player) return null;

    // Sort history by date if possible
    const sortedHistory = [...(player.matchHistory || [])].sort((a, b) => {
        const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
        return dateB - dateA; // Most recent first
    });

    return (
        <div className="history-modal-overlay">
            <div className="history-modal-content">
                <div className="history-modal-header">
                    <div className="player-info-brief">
                        <h2>{player.name}</h2>
                        <span className="player-team-tag">{player.team}</span>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="history-modal-body">
                    <div className="player-season-summary">
                        <div className="summary-card">
                            <span className="label">PJ</span>
                            <span className="value">{player.jugados}</span>
                        </div>
                        <div className="summary-card">
                            <span className="label">Minutos</span>
                            <span className="value">{player.minutos}'</span>
                        </div>
                        <div className="summary-card">
                            <span className="label">Ensayos</span>
                            <span className="value">{player.ensayos}</span>
                        </div>
                        <div className="summary-card">
                            <span className="label">Puntos</span>
                            <span className="value color-orange">{player.puntos}</span>
                        </div>
                        {player.nota_media && (
                            <div className="summary-card highlight">
                                <span className="label">Nota Media</span>
                                <span className="value color-blue">{player.nota_media}</span>
                            </div>
                        )}
                        {player.eficacia_placaje !== null && (
                            <div className="summary-card highlight">
                                <span className="label">% Eficacia</span>
                                <span className="value" style={{ color: player.eficacia_placaje > 80 ? '#10B981' : player.eficacia_placaje > 50 ? '#F59E0B' : '#EF4444' }}>
                                    {player.eficacia_placaje}%
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Rival</th>
                                    <th className="text-center">Min</th>
                                    <th className="text-center">Ens</th>
                                    <th className="text-center">Pts</th>
                                    <th className="text-center">Nota</th>
                                    <th className="text-center">Plac</th>
                                    <th className="text-center">Fall</th>
                                    <th className="text-center">Tarj</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((m, idx) => (
                                    <tr key={idx}>
                                        <td className="text-light">{m.date || 'S/D'}</td>
                                        <td className="text-bold">
                                            {m.is_home ? 'vs ' : '@ '}{m.opponent}
                                            <div className="match-score-mini">{m.score}</div>
                                        </td>
                                        <td className="text-center">{m.minutos}'</td>
                                        <td className="text-center">{m.ensayos > 0 ? m.ensayos : '-'}</td>
                                        <td className="text-center font-bold">{m.puntos > 0 ? m.puntos : '-'}</td>
                                        <td className="text-center">
                                            {m.nota ? <span className="nota-tag">{m.nota}</span> : '-'}
                                        </td>
                                        <td className="text-center color-green">{m.tackles_made || '-'}</td>
                                        <td className="text-center color-red">{m.tackles_missed || '-'}</td>
                                        <td className="text-center">
                                            <div className="cards-flex">
                                                {m.amarillas > 0 && <div className="card-mini bg-yellow">{m.amarillas}</div>}
                                                {m.rojas > 0 && <div className="card-mini bg-red">{m.rojas}</div>}
                                                {m.amarillas === 0 && m.rojas === 0 && '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerMatchHistory;
