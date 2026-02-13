import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Activity, Info, Users, Save, ClipboardList } from 'lucide-react';
import { convocatoriaService } from '../services/convocatoriaService';
import playerService from '../services/playerService';
import './MatchDetailsModal.css';

const MAX_SQUAD = 23;

const MatchDetailsModal = ({ match, onClose }) => {
    if (!match) return null;

    const props = match.extendedProps || {};
    const isFinished = props.isFinished;
    const isFutureMatch = !isFinished && match.start && new Date(match.start) >= new Date();
    const matchId = props.match_id;

    const dateStr = match.start ? new Date(match.start).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    const timeStr = props.hora ? props.hora.slice(0, 5) : '';

    // Convocatoria state
    const [squad, setSquad] = useState(Array.from({ length: MAX_SQUAD }, (_, i) => ({ numero: i + 1, jugador: '' })));
    const [allPlayers, setAllPlayers] = useState([]);
    const [loadingSquad, setLoadingSquad] = useState(false);
    const [savingSquad, setSavingSquad] = useState(false);
    const [squadMessage, setSquadMessage] = useState('');
    const [showConvocatoria, setShowConvocatoria] = useState(false);

    useEffect(() => {
        if (matchId) {
            loadSquadData();
        }
    }, [matchId]);

    const loadSquadData = async () => {
        setLoadingSquad(true);
        try {
            // Load players independently
            let players = [];
            try {
                players = await playerService.getAll();
                console.log('Players loaded:', players?.length);
            } catch (err) {
                console.error('Error loading players:', err);
            }
            setAllPlayers(players || []);

            // Load existing squad independently
            try {
                const existingSquad = await convocatoriaService.getByMatchId(matchId);
                console.log('Existing squad loaded:', existingSquad?.length);
                if (existingSquad && existingSquad.length > 0) {
                    const newSquad = Array.from({ length: MAX_SQUAD }, (_, i) => {
                        const existing = existingSquad.find(e => e.numero === i + 1);
                        return { numero: i + 1, jugador: existing?.jugador || '' };
                    });
                    setSquad(newSquad);
                    setShowConvocatoria(true);
                }
            } catch (err) {
                console.error('Error loading existing squad:', err);
            }
        } finally {
            setLoadingSquad(false);
        }
    };

    const handlePlayerChange = (index, playerId) => {
        const newSquad = [...squad];
        newSquad[index] = { ...newSquad[index], jugador: playerId };
        setSquad(newSquad);
    };

    const handleSaveSquad = async () => {
        setSavingSquad(true);
        setSquadMessage('');
        try {
            await convocatoriaService.saveSquad(matchId, squad);
            setSquadMessage('✅ Convocatoria guardada');
            setTimeout(() => setSquadMessage(''), 3000);
        } catch (err) {
            console.error('Error saving squad:', err);
            setSquadMessage('❌ Error al guardar');
        } finally {
            setSavingSquad(false);
        }
    };

    const selectedPlayerIds = squad.map(s => s.jugador).filter(Boolean);
    const getAvailablePlayers = (currentSlotPlayerId) => {
        return allPlayers.filter(
            p => p.id === currentSlotPlayerId || !selectedPlayerIds.includes(p.id)
        );
    };

    const getPlayerName = (playerId) => {
        const player = allPlayers.find(p => p.id === playerId);
        return player ? `${player.nombre} ${player.apellidos}` : '';
    };

    const filledCount = squad.filter(s => s.jugador).length;

    return (
        <div className="match-details-overlay" onClick={onClose}>
            <div className="match-details-content" onClick={e => e.stopPropagation()}>
                <div className="match-details-header">
                    <div className="match-details-type">
                        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Pelota_rugby.png" alt="Partido" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <span>{props.league || 'Partido'}</span>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="match-details-body">
                    {/* Scoreboards Section */}
                    <div className="teams-comparison">
                        <div className="team-info">
                            <img src={props.homeTeamShield} alt={props.homeTeamName} className="team-large-shield" />
                            <h3 className="team-large-name">{props.homeTeamName}</h3>
                        </div>

                        <div className="score-center">
                            {isFinished ? (
                                <div className="large-score">
                                    <span>{props.homeScore}</span>
                                    <span className="score-separator">-</span>
                                    <span>{props.awayScore}</span>
                                </div>
                            ) : (
                                <div className="vs-label">VS</div>
                            )}
                            <div className={`match-status-tag ${isFinished ? 'status-finished' : 'status-upcoming'}`}>
                                {isFinished ? 'Finalizado' : 'Próximo Partido'}
                            </div>
                        </div>

                        <div className="team-info">
                            <img src={props.awayTeamShield} alt={props.awayTeamName} className="team-large-shield" />
                            <h3 className="team-large-name">{props.awayTeamName}</h3>
                        </div>
                    </div>

                    {/* Details Info Grid */}
                    <div className="details-info-grid">
                        <div className="info-item">
                            <Calendar size={20} />
                            <div>
                                <label>Fecha</label>
                                <p>{dateStr}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <Clock size={20} />
                            <div>
                                <label>Hora</label>
                                <p>{timeStr} hs</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <MapPin size={20} />
                            <div>
                                <label>Lugar</label>
                                <p>{props.lugar || 'Por confirmar'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <Activity size={20} />
                            <div>
                                <label>Estado</label>
                                <p>{props.estado || 'Programado'}</p>
                            </div>
                        </div>
                    </div>

                    {props.observaciones && (
                        <div className="match-observations">
                            <div className="obs-header">
                                <Info size={18} />
                                <span>Observaciones</span>
                            </div>
                            <p className="obs-text">{props.observaciones}</p>
                        </div>
                    )}

                    {/* Convocatoria Section */}
                    {matchId && (
                        <div className="convocatoria-section">
                            <div
                                className="convocatoria-header"
                                onClick={() => setShowConvocatoria(!showConvocatoria)}
                            >
                                <div className="convocatoria-title">
                                    <ClipboardList size={20} />
                                    <span>CONVOCATORIA</span>
                                    <span className="convocatoria-count">{filledCount}/{MAX_SQUAD}</span>
                                </div>
                                <span className={`convocatoria-toggle ${showConvocatoria ? 'open' : ''}`}>▾</span>
                            </div>

                            {showConvocatoria && (
                                <div className="convocatoria-body">
                                    {loadingSquad ? (
                                        <p className="convocatoria-loading">Cargando plantilla...</p>
                                    ) : (
                                        <>
                                            <div className="squad-list">
                                                {squad.map((slot, idx) => (
                                                    <div key={idx} className={`squad-slot ${slot.jugador ? 'squad-slot--filled' : ''}`}>
                                                        <span className="squad-number">{slot.numero}</span>
                                                        {isFutureMatch ? (
                                                            <select
                                                                className="squad-select"
                                                                value={slot.jugador || ''}
                                                                onChange={(e) => handlePlayerChange(idx, e.target.value)}
                                                            >
                                                                <option value="">— Vacante —</option>
                                                                {getAvailablePlayers(slot.jugador).map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.apellidos}, {p.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className="squad-player-name">
                                                                {slot.jugador ? getPlayerName(slot.jugador) : '—'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {isFutureMatch && (
                                                <div className="convocatoria-actions">
                                                    <button
                                                        className="btn-save-squad"
                                                        onClick={handleSaveSquad}
                                                        disabled={savingSquad}
                                                    >
                                                        <Save size={16} />
                                                        {savingSquad ? 'Guardando...' : 'Guardar Convocatoria'}
                                                    </button>
                                                    {squadMessage && (
                                                        <span className="squad-message">{squadMessage}</span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="match-details-footer">
                    <button className="btn-close-modal" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default MatchDetailsModal;
