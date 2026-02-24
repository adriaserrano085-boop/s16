import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const SHIELD_URL = 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png';

const NAV_ITEMS = [
    {
        path: '/dashboard',
        label: 'DASHBOARD',
        icon: SHIELD_URL,
    },
    {
        path: '/calendario',
        label: 'CALENDARIO',
        icon: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Calendario.png',
    },
    {
        path: '/jugadores',
        label: 'PLANTILLA',
        icon: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Plantilla.png',
    },
    {
        path: '/asistencia',
        label: 'ASISTENCIA',
        icon: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Asistencia.png',
    },
    {
        path: '/statistics',
        label: 'ESTADÍSTICAS',
        icon: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Iconos/Centro%20de%20estadisticas%20ICON.png',
        // Ideally should use a Lucide icon if image fails, but for now assuming user will upload one or it exists.
        // Or I can use a placeholder URL from a public icon set if I'm unsure. 
        // Let's stick to the pattern.
    },
];

export default function Sidebar({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const handleNav = (path) => {
        navigate(path);
        setOpen(false);
    };

    const filteredNavItems = NAV_ITEMS.filter(item => {
        // If user is a Player, ONLY show Dashboard
        if (user?.role === 'JUGADOR') {
            return item.path === '/dashboard';
        }
        return true;
    });

    return (
        <>
            {/* Mobile hamburger */}
            <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
                {open ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${open ? 'sidebar-overlay--visible' : ''}`}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
                <div className="sidebar-logo">
                    <img src={SHIELD_URL} alt="RCLH" />
                    <span>RCLH S16</span>
                </div>

                <div className="sidebar-user-info" style={{ padding: '0 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#ccc' }}>
                    {user?.nombre && <div style={{ fontWeight: 'bold', color: 'white' }}>{user.nombre}</div>}
                    <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.7 }}>{user?.role || 'STAFF'}</div>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavItems.map((item) => (
                        <button
                            key={item.path}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNav(item.path)}
                        >
                            <img src={item.icon} alt={item.label} className="sidebar-link-icon" />
                            <span className="sidebar-link-text">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {onLogout && (
                    <div className="sidebar-footer">
                        <button className="sidebar-logout" onClick={onLogout}>
                            <span>⏻</span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
