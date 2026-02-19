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
        if (!email) {
            setError('Introduce tu correo electrónico.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (resetError) {
                setError(resetError.message);
            } else {
                setResetSent(true);
            }
        } catch {
            setError('Error al enviar el correo de recuperación.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 10000));

        try {
            console.log('Login: Attempting sign in for:', email);
            // 1. Sign in with Supabase Auth (with 10s timeout)
            const signinPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const result = await Promise.race([signinPromise, timeoutPromise]);

            if (result.timeout) {
                console.error('Login: Auth request timed out.');
                setError('El servicio está tardando demasiado. Por favor, intenta de nuevo.');
                setLoading(false);
                return;
            }

            const { data: authData, error: authError } = result;

            if (authError) {
                console.error('Login: Auth error:', authError.message);
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (authData?.user) {
                console.log('Login: Success. Redirection to dashboard...');

                // User state will be handled by onAuthStateChange in App.jsx
                // But we act optimistically here to trigger navigation
                console.log("Login: Triggering navigation to dashboard.");
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login: Unexpected error:', err);
            setError('Ocurrió un error inesperado al conectar con el servidor.');
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
