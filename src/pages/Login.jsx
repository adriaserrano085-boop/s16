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
    const [registerMode, setRegisterMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/auth/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setResetSent(true);
            } else {
                throw new Error(data.detail || 'Error al solicitar el restablecimiento');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setRegisterSuccess(true);
                // Clear sensitive fields
                setPassword('');
                setConfirmPassword('');
            } else {
                throw new Error(data.detail || 'Error al crear la cuenta. Verifica tus datos o intenta más tarde.');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
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
                <h2 className="login-subtitle">
                    {resetMode ? 'Recuperar Contraseña' : registerMode ? 'Únete al Equipo' : 'Bienvenido al equipo'}
                </h2>

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
                ) : registerMode ? (
                    /* Registration Form */
                    registerSuccess ? (
                        <div className="login-reset-success">
                            <div className="login-reset-icon">🚀</div>
                            <p>¡Cuenta creada exitosamente!</p>
                            <p style={{ marginTop: '1rem', marginBottom: '1rem', color: '#003366', fontWeight: '500' }}>
                                Hemos enviado un enlace de activación a: <br />
                                <strong>{email}</strong>
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#555' }}>Por favor, revisa tu correo y haz clic en el enlace para activar tu cuenta antes de iniciar sesión.</p>
                            <button
                                className="login-button"
                                onClick={() => { setRegisterMode(false); setRegisterSuccess(false); setError(''); }}
                                style={{ marginTop: '1.5rem' }}
                            >
                                Volver al Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="login-form">
                            <input
                                type="email"
                                placeholder="Correo electrónico válido"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="login-input"
                            />
                            <input
                                type="password"
                                placeholder="Contraseña (mín. 6 caracteres)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                className="login-input"
                            />
                            <input
                                type="password"
                                placeholder="Confirma tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength="6"
                                className="login-input"
                            />

                            <button
                                type="submit"
                                className="login-button"
                                style={{ backgroundColor: '#FF6600' }}
                                disabled={loading}
                            >
                                {loading ? 'Creando...' : 'Crear Cuenta'}
                            </button>

                            <button
                                type="button"
                                className="login-link-btn"
                                onClick={() => { setRegisterMode(false); setError(''); }}
                            >
                                ¿Ya tienes cuenta? Inicia sesión
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="login-link-btn"
                                style={{ margin: 0, padding: 0 }}
                                onClick={() => { setRegisterMode(true); setError(''); }}
                            >
                                Crear cuenta nueva
                            </button>

                            <button
                                type="button"
                                className="login-link-btn"
                                style={{ margin: 0, padding: 0 }}
                                onClick={() => { setResetMode(true); setError(''); }}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
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
