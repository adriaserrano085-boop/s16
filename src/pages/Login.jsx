import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

import './LoginPage.css';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('La recuperación de contraseña debe ser gestionada por el administrador del sistema.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Login: Attempting sign in to FastAPI for:', email);

            // 1. Prepare form data for OAuth2PasswordRequestForm
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const loginResponse = await fetch('/api/v1/token', {
                method: 'POST',
                body: formData
            });

            if (!loginResponse.ok) {
                const errorData = await loginResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Credenciales incorrectas o error en el servidor');
            }

            const tokenData = await loginResponse.json();
            console.log('Login: Success. Token received.');

            // Store token
            localStorage.setItem('s16_auth_token', tokenData.access_token);

            // 2. Fetch profile from /users/me to ensure we have full context
            const profileResponse = await fetch(`/api/v1/users/me`, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('Login: Profile fetched successfully:', profileData);

                localStorage.setItem('s16_cached_role', JSON.stringify(profileData));
                setUser(profileData);
                navigate('/dashboard');
            } else {
                throw new Error('Error al obtener el perfil de usuario tras el login');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Ocurrió un error inesperado al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Image - Full Screen with 35% Transparency */}
            <div className="login-background" />

            <div className="login-card">
                {/* Team Shield/Logo */}
                <img
                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                    alt="Escudo RCLH"
                    className="login-logo"
                />

                <h1 className="login-title">S16 RCLH</h1>
                <h2 className="login-subtitle">Bienvenido al equipo</h2>

                {resetMode ? (
                    /* Password Recovery Form */
                    resetSent ? (
                        <div className="login-reset-success">
                            <div className="login-reset-icon">✉️</div>
                            <p>Se ha enviado un enlace de recuperación a:</p>
                            <p className="login-reset-email">{email}</p>
                            <p>Revisa tu bandeja de entrada y sigue las instrucciones.</p>
                            <button
                                className="login-button"
                                onClick={() => { setResetMode(false); setResetSent(false); setError(''); }}
                            >
                                Volver al Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="login-form">
                            <p className="login-reset-hint">Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="login-input"
                            />
                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                            <button
                                type="button"
                                className="login-link-btn"
                                onClick={() => { setResetMode(false); setError(''); }}
                            >
                                ← Volver al Login
                            </button>
                        </form>
                    )
                ) : (
                    /* Normal Login Form */
                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input"
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="login-input"
                        />

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>

                        <button
                            type="button"
                            className="login-link-btn"
                            onClick={() => { setResetMode(true); setError(''); }}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                )}

                {error && (
                    <p className="login-error">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
