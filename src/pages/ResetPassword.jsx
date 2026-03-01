import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginPage.css'; // Reusing existing styles for consistency

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (!token) {
            setError('Enlace de recuperación no válido o inexistente.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                throw new Error(data.detail || 'Error al restablecer la contraseña');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <img
                        src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                        alt="Escudo RCLH"
                        className="login-logo"
                    />
                    <h1 className="login-title">¡Éxito!</h1>
                    <div className="login-reset-success">
                        <div className="login-reset-icon">✅</div>
                        <p>Tu contraseña ha sido actualizada correctamente.</p>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                        >
                            Ir al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <img
                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                    alt="Escudo RCLH"
                    className="login-logo"
                />
                <h1 className="login-title">Nueva Contraseña</h1>
                <p className="login-reset-hint">Elige una contraseña segura para tu cuenta.</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="password"
                        placeholder="Nueva Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="login-input"
                        autoFocus
                    />
                    <input
                        type="password"
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="login-input"
                    />

                    {error && <p className="login-error">{error}</p>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>

                    <button
                        type="button"
                        className="login-link-btn"
                        onClick={() => navigate('/login')}
                    >
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
