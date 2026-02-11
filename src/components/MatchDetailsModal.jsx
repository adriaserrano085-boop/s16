import React from 'react';
import { X, Calendar, Clock, MapPin, Trophy, Info, Activity } from 'lucide-react';
import './MatchDetailsModal.css';

const MatchDetailsModal = ({ match, onClose }) => {
    if (!match) return null;

    const props = match.extendedProps || {};
    const isFinished = props.isFinished;
    const dateStr = match.start ? new Date(match.start).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';

    const timeStr = props.hora ? props.hora.slice(0, 5) : '';

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
                </div>

                <div className="match-details-footer">
                    <button className="btn-close-modal" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default MatchDetailsModal;
