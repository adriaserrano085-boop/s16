import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/apiClient';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const roles = ['ADMIN', 'STAFF', 'JUGADOR', 'FAMILIA'];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiGet('/users/all');
            // Sort by email
            const sortedData = data.sort((a, b) => a.email.localeCompare(b.email));
            setUsers(sortedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message || 'No se pudieron cargar los usuarios. Verifica tus permisos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
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
                                        disabled={updatingUserId === user.id}
                                    >
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
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
