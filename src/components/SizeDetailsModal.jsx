
import React from 'react';
import { X, User } from 'lucide-react';

const SizeDetailsModal = ({ size, players, onClose }) => {
    if (!size) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    width: '100%',
                    maxWidth: '400px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Talla <span style={{ backgroundColor: '#003366', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontSize: '1rem' }}>{size}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div style={{
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    {players.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>No hay jugadores con esta talla.</p>
                    ) : (
                        players.map(player => (
                            <div key={player.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem',
                                backgroundColor: '#fff',
                                borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                            }}>
                                {player.foto ? (
                                    <img
                                        src={player.foto}
                                        alt={player.nombre}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1px solid #e2e8f0'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <User size={20} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                                        {player.nombre}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {player.apellidos ? player.apellidos.split(' ')[0] : ''}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SizeDetailsModal;
