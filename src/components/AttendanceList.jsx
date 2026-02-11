
import React from 'react';
import { CheckCircle, Clock, XCircle, Info, Activity, Users, HelpCircle } from 'lucide-react';

const AttendanceList = ({ players, attendance, onToggle }) => {

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Presente': return { color: '#28a745', Icon: CheckCircle };
            case 'Retraso': return { color: '#f39c12', Icon: Clock };
            case 'Falta': return { color: '#dc3545', Icon: XCircle };
            case 'Falta Justificada': return { color: '#3498db', Icon: Info };
            case 'Lesionado': return { color: '#e67e22', Icon: Activity };
            case 'Lesion': return { color: '#e67e22', Icon: Activity }; // Legacy support
            case 'Catalana': return { color: '#9b59b6', Icon: Users };
            case 'Enfermo': return { color: '#bdc3c7', Icon: HelpCircle };
            case 'Emfermo': return { color: '#bdc3c7', Icon: HelpCircle }; // Legacy support
            default: return { color: '#6c757d', Icon: HelpCircle };
        }
    };

    return (
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {players.map(player => {
                const status = attendance[player.id] || 'Pendiente';
                const { color, Icon } = getStatusConfig(status);

                return (
                    <div
                        key={player.id}
                        onClick={() => onToggle(player.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            borderBottom: '1px solid #f1f3f5',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {player.foto ? (
                                <img src={player.foto} alt={player.nombre} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#495057' }}>
                                    {player.nombre.charAt(0)}{player.apellidos.charAt(0)}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#333' }}>{player.nombre} {player.apellidos}</div>
                                <div style={{ fontSize: '0.8rem', color: '#868e96' }}>{player.posicion || 'Jugador'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                color: color,
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}>
                                <Icon size={16} />
                                {status}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AttendanceList;
