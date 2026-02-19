
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, User } from 'lucide-react';
import playerService from '../services/playerService';
import PlayerDetailsModal from '../components/PlayerDetailsModal';
import './PlayersPage.css';

const PlayersPage = ({ user }) => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        if (user?.role === 'JUGADOR') {
            navigate('/dashboard');
            return;
        }
        fetchPlayers();
    }, [user, navigate]);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const data = await playerService.getAll();

            // Sort by first position
            const sortedData = (data || []).sort((a, b) => {
                const getFirstPos = (p) => {
                    if (!p.posiciones) return 999;
                    // Extract first number found
                    const match = p.posiciones.match(/\d+/);
                    return match ? parseInt(match[0], 10) : 999;
                };

                return getFirstPos(a) - getFirstPos(b);
            });

            setPlayers(sortedData);
        } catch (error) {
            console.error("Error fetching players:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="players-page-container">
            <div className="players-content-wrapper">
                <header className="players-header-section">
                    <h1 className="players-title">
                        <img
                            src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                            alt="Logo RCLH"
                            className="players-logo"
                        />
                        Plantilla S16
                    </h1>
                    <button onClick={() => navigate('/dashboard')} className="btn-back-dashboard">
                        &larr; Volver al Dashboard
                    </button>
                </header>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Cargando jugadores...</p>
                    </div>
                ) : (
                    <div className="players-grid">
                        {players.map(player => (
                            <div
                                key={player.id}
                                className="player-card"
                                onClick={() => setSelectedPlayer(player)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="player-photo-container">
                                    {player.foto ? (
                                        <img
                                            src={player.foto}
                                            alt={`${player.nombre} ${player.apellidos}`}
                                            className="player-photo"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentElement.classList.add('image-error');
                                            }}
                                        />
                                    ) : (
                                        <div className="player-placeholder">
                                            <User size={64} opacity={0.5} />
                                        </div>
                                    )}
                                    {/* Fallback icon if image fails or is missing (handled by CSS/JS logic above mostly, but consistent placeholder helps) */}
                                    {!player.foto && (
                                        <div className="player-placeholder">
                                            <User size={64} opacity={0.5} />
                                        </div>
                                    )}
                                </div>

                                <div className="player-info">
                                    <h2 className="player-name">
                                        {player.nombre} {player.apellidos}
                                    </h2>

                                    <div className="player-meta">
                                        <span className="player-position">
                                            {player.posiciones ? player.posiciones.replace(/\r\n/g, ', ') : 'Sin posición'}
                                        </span>
                                    </div>

                                    <div className="player-details-row">
                                        <div className="detail-item">
                                            <span className="detail-label">Talla</span>
                                            <span className="detail-value">{player.talla || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Licencia</span>
                                            <span className="detail-value">{player.licencia || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {players.length === 0 && !loading && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                                No se encontraron jugadores en la base de datos.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Player Details Modal */}
            {selectedPlayer && (
                <PlayerDetailsModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
};

export default PlayersPage;
