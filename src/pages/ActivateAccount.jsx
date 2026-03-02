import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import './LoginPage.css'; // Reusing similar styling for simplicity

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('Activando tu cuenta...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('El enlace de activación no es válido o está incompleto.');
            return;
        }

        const activate = async () => {
            try {
                const response = await fetch(`/api/v1/auth/activate?token=${encodeURIComponent(token)}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || '¡Cuenta activada con éxito!');
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'No hemos podido activar la cuenta. Es posible que el enlace haya caducado.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Error de conexión con el servidor al activar la cuenta.');
            }
        };

        activate();
    }, [token]);

    return (
        <div className="login-container">
            <div className="login-background" />
            <div className="login-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>

                <img
                    src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png"
                    alt="Logo"
                    className="login-logo"
                    style={{ marginBottom: '2rem' }}
                />

                {status === 'loading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 size={48} className="spin" color="#003366" />
                        <h2 style={{ color: '#003366' }}>{message}</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <CheckCircle size={64} color="#28a745" />
                        <h2 style={{ color: '#003366' }}>¡Todo listo!</h2>
                        <p style={{ color: '#475569', marginBottom: '1.5rem' }}>{message}</p>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                            style={{ width: 'auto', padding: '0.75rem 2rem' }}
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <XCircle size={64} color="#dc3545" />
                        <h2 style={{ color: '#dc3545' }}>Error de Activación</h2>
                        <p style={{ color: '#475569', marginBottom: '1.5rem' }}>{message}</p>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                            style={{ width: 'auto', padding: '0.75rem 2rem', backgroundColor: '#64748b' }}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                )}

            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ActivateAccount;
