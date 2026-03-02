import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/apiClient';
import './UserManagement.css';

const UserManagement = ({ user: currentUser }) => {
    const [users, setUsers] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [playerList, setPlayerList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const roles = ['ADMIN', 'STAFF', 'JUGADOR', 'FAMILIA'];

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users
            const usersData = await apiGet('/users/all');
            const sortedUsers = usersData.sort((a, b) => a.email.localeCompare(b.email));
            setUsers(sortedUsers);

            // Fetch profiles for linking
            const staffData = await apiGet('/Staff');
            // Assuming response is an array or { items: array } 
            setStaffList(Array.isArray(staffData) ? staffData : (staffData.items || []));

            const playersData = await apiGet('/jugadores_propios');
            setPlayerList(Array.isArray(playersData) ? playersData : (playersData.items || []));

            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'No se pudieron cargar los datos. Verifica tus permisos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        setUpdatingUserId(userId);
        try {
            await apiPost('/users/assign-role', {
                target_user_id: userId,
                new_role: newRole
            });
            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Error al actualizar el rol: ' + (err.message || 'Error desconocido'));
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleLinkProfile = async (userId, profileType, profileId) => {
        if (!profileId) return; // Ignore if unselected empty option

        setUpdatingUserId(userId);
        try {
            await apiPost('/users/link-profile', {
                user_id: userId,
                profile_type: profileType,
                profile_id: profileId
            });
            // Refresh data to reflect validated status and links
            await fetchData();
            alert(`Perfil ${profileType} vinculado correctamente.`);
        } catch (err) {
            console.error('Error linking profile:', err);
            alert('Error al vincular el perfil: ' + (err.message || 'Error desconocido'));
        } finally {
            setUpdatingUserId(null);
        }
    };

    if (loading) return <div className="admin-page-loading">Cargando usuarios...</div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Gestión de Usuarios</h1>
                <p>Administra los roles y permisos de acceso al sistema.</p>
            </header>

            {error && <div className="admin-error-banner">{error}</div>}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Rol Actual</th>
                            <th>Acciones</th>
                            <th>Vincular a Perfil</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td><strong>{user.email}</strong></td>
                                <td>
                                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        className="admin-role-select"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={
                                            updatingUserId === user.id ||
                                            (currentUser?.role === 'STAFF' && ['ADMIN', 'STAFF'].includes(user.role))
                                        }
                                    >
                                        {roles.map(role => {
                                            // Staff can only assign JUGADOR and FAMILIA
                                            if (currentUser?.role === 'STAFF' && ['ADMIN', 'STAFF'].includes(role)) {
                                                // Only show current role if it's already ADMIN/STAFF to not break UI, 
                                                // but they can't assign it to others.
                                                if (user.role !== role) return null;
                                            }
                                            return <option key={role} value={role}>{role}</option>;
                                        })}
                                    </select>
                                </td>
                                <td>
                                    {user.role === 'STAFF' && (() => {
                                        const linkedStaff = staffList.find(s =>
                                            s.auth_id === user.id ||
                                            (s.nombre && s.nombre.toLowerCase() === user.email.toLowerCase())
                                        );
                                        const linkedId = linkedStaff?.id || '';
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <select
                                                    className="admin-role-select"
                                                    value={linkedId}
                                                    onChange={(e) => handleLinkProfile(user.id, 'STAFF', e.target.value)}
                                                    disabled={updatingUserId === user.id || currentUser?.role === 'STAFF'}
                                                    title={currentUser?.role === 'STAFF' ? "No tienes permisos para vincular Staff" : ""}
                                                >
                                                    <option value="">-- Seleccionar Miembro Staff --</option>
                                                    {staffList.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nombre} {s.apellidos || ''}</option>
                                                    ))}
                                                </select>
                                                {linkedId && <span style={{ color: '#28a745', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ Vinculado al Staff</span>}
                                            </div>
                                        );
                                    })()}
                                    {user.role === 'JUGADOR' && (() => {
                                        const linkedPlayer = playerList.find(p => p.email?.toLowerCase() === user.email.toLowerCase());
                                        const linkedId = linkedPlayer?.id || '';
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <select
                                                    className="admin-role-select"
                                                    value={linkedId}
                                                    onChange={(e) => handleLinkProfile(user.id, 'JUGADOR', e.target.value)}
                                                    disabled={updatingUserId === user.id || (currentUser?.role === 'STAFF' && user.role !== 'JUGADOR')}
                                                >
                                                    <option value="">-- Seleccionar Jugador --</option>
                                                    {playerList.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre} {p.apellidos || ''}</option>
                                                    ))}
                                                </select>
                                                {linkedId && <span style={{ color: '#28a745', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ Vinculado al Jugador</span>}
                                            </div>
                                        );
                                    })()}
                                    {user.role === 'ADMIN' && <span style={{ color: '#aaa', fontSize: '0.85rem' }}>N/A</span>}
                                    {user.role === 'FAMILIA' && <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Usa el gestor de familias</span>}
                                </td>
                                <td>
                                    {user.is_pending_validation ? (
                                        <span className="status-pending">Pendiente</span>
                                    ) : (
                                        <span className="status-active">Validado</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-footer">
                Total de usuarios: {users.length}
            </div>
        </div>
    );
};

export default UserManagement;
