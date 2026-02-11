import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

import './LoginPage.css';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

                // Explicitly set user to avoid race condition with onAuthStateChange redirect
                setUser({
                    ...authData.user,
                    role: 'STAFF',
                    full_name: authData.user.user_metadata?.full_name || 'Staff User'
                });

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
                </form>

                {error && (
                    <p className="login-error">
                        {error}
                    </p>
                )}

                <div className="login-footer">
                    <p>Para probar roles:</p>
                    <p>staff@s16.com / jugador@s16.com</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
