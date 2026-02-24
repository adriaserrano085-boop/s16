import React from 'react';
import { CheckCircle, Clock, XCircle, Info, Activity, Users, HelpCircle } from 'lucide-react';

const AttendanceTable = ({ players, attendance, onStatusChange }) => {

    const statusOptions = ['Presente', 'Retraso', 'Falta', 'Falta Justificada', 'Lesion', 'Catalana', 'Emfermo'];

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Presente': return { color: '#28a745', bg: '#d4edda', Icon: CheckCircle };
            case 'Retraso': return { color: '#856404', bg: '#fff3cd', Icon: Clock };
            case 'Falta': return { color: '#721c24', bg: '#f8d7da', Icon: XCircle };
            case 'Falta Justificada': return { color: '#0c5460', bg: '#d1ecf1', Icon: Info };
            case 'Lesionado': return { color: '#e67e22', bg: '#ffe8cc', Icon: Activity }; // Orange
            case 'Lesion': return { color: '#e67e22', bg: '#ffe8cc', Icon: Activity };
            case 'Catalana': return { color: '#9b59b6', bg: '#e8daef', Icon: Users }; // Purple
            case 'Enfermo': return { color: '#6c757d', bg: '#e2e3e5', Icon: HelpCircle };
            case 'Emfermo': return { color: '#6c757d', bg: '#e2e3e5', Icon: HelpCircle };
            default: return { color: '#666', bg: '#f8f9fa', Icon: HelpCircle };
        }
    };

    // Calculate summary stats
    const stats = {
        Presente: 0,
        Retraso: 0,
        Falta: 0,
        'Falta Justificada': 0,
        Lesion: 0,
        Otros: 0
    };

    players.forEach(p => {
        const status = attendance[p.id] || 'Pendiente';
        if (stats[status] !== undefined) {
            stats[status]++;
        } else if (status === 'Lesionado') {
            stats['Lesion']++;
        } else {
            stats['Otros']++;
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                <div style={{ background: '#d4edda', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', color: '#155724' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.Presente}</div>
                    <div style={{ fontSize: '0.8rem' }}>Presentes</div>
                </div>
                <div style={{ background: '#fff3cd', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', color: '#856404' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.Retraso}</div>
                    <div style={{ fontSize: '0.8rem' }}>Retrasos</div>
                </div>
                <div style={{ background: '#f8d7da', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', color: '#721c24' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.Falta}</div>
                    <div style={{ fontSize: '0.8rem' }}>Faltas</div>
                </div>
                <div style={{ background: '#ffe8cc', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', color: '#e67e22' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.Lesion}</div>
                    <div style={{ fontSize: '0.8rem' }}>Lesión</div>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', color: '#495057', fontWeight: '600' }}>Jugador</th>
                            <th style={{ textAlign: 'center', padding: '1rem', color: '#495057', fontWeight: '600' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.length === 0 ? (
                            <tr>
                                <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                    No hay jugadores registrados.
                                </td>
                            </tr>
                        ) : (
                            players.map((player, idx) => {
                                const status = attendance[player.id] || 'Pendiente';
                                const { color, bg, Icon } = getStatusConfig(status);

                                return (
                                    <tr key={player.id} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {player.foto ? (
                                                    <img src={player.foto} alt={player.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: '#e9ecef', color: '#495057',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem'
                                                    }}>
                                                        {player.nombre?.charAt(0)}{player.apellidos?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '0.95rem' }}>{player.nombre} {player.apellidos}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#868e96' }}>{player.posiciones || 'Jugador'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {onStatusChange ? (
                                                <select
                                                    value={status}
                                                    onChange={(e) => onStatusChange(player.id, e.target.value)}
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '20px',
                                                        backgroundColor: bg,
                                                        color: color,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.85rem',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        appearance: 'none', // Remove default arrow for cleaner look, or keep it
                                                        textAlign: 'center',
                                                        width: '100%'
                                                    }}
                                                >
                                                    {statusOptions.map(opt => (
                                                        <option key={opt} value={opt} style={{ backgroundColor: 'white', color: 'black' }}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                    <option value="Pendiente" style={{ backgroundColor: 'white', color: 'black' }}>Pendiente</option>
                                                </select>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '20px',
                                                    backgroundColor: bg,
                                                    color: color,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <Icon size={14} />
                                                    {status}
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTable;
