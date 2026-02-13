import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import './index.css';

// Lazy-loaded pages — only downloaded when user navigates to them
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const PlayersPage = React.lazy(() => import('./pages/PlayersPage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const PhysicalTestsPage = React.lazy(() => import('./pages/PhysicalTestsPage'));

// Shared loading fallback
const PageLoader = () => (
  <div className="app-loading-screen">
    <div className="app-loading-text">Cargando...</div>
  </div>
);

// Authenticated layout with sidebar
function AuthLayout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      <Sidebar onLogout={handleLogout} />
      <div className="app-with-sidebar">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/calendario" element={<CalendarPage user={user} />} />
            <Route path="/asistencia" element={<AttendancePage user={user} />} />
            <Route path="/jugadores" element={<PlayersPage user={user} />} />
            <Route path="/statistics" element={<StatsPage user={user} />} />
            <Route path="/physical-tests" element={<PhysicalTestsPage user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      if (initializing) {
        setInitializing(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setInitError('Error al recuperar sesión');
        } else if (session?.user) {
          try {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('*')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            setUser({
              ...session.user,
              role: 'STAFF',
              nombre: userData?.nombre || session.user.email
            });
          } catch {
            setUser({ ...session.user, role: 'STAFF', nombre: session.user.email });
          }
        }
      } catch {
        setInitError('Error de conexión');
      } finally {
        setInitializing(false);
      }
    };

    initAuth();
    return () => clearTimeout(globalTimeout);
  }, []);

  if (initializing) {
    return (
      <div className="app-loading-screen">
        <img src="https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png" alt="Logo" width="80" />
        <div className="app-loading-text">RCLH - S16</div>
        {initError && <div className="app-loading-error">{initError}</div>}
        <button onClick={() => setInitializing(false)} className="app-loading-skip">
          Saltar y entrar al Login
        </button>
        <div className="app-loading-hint">Verificando conexión con Supabase</div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          {user ? (
            <Route path="/*" element={<AuthLayout user={user} setUser={setUser} />} />
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

