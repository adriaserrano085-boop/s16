import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
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
              full_name: userData ? `${userData.nombre} ${userData.apellidos}` : (session.user.user_metadata?.full_name || 'Usuario')
            });
          } catch (profileErr) {
            setUser({ ...session.user, role: 'STAFF' });
          }
        }
      } catch (err) {
        setInitError(err.message);
      } finally {
        setInitializing(false);
        clearTimeout(globalTimeout);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          ...session.user,
          role: 'STAFF',
          full_name: session.user.user_metadata?.full_name || 'Usuario'
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, []);

  if (initializing) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-text">Iniciando sesión...</div>
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
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/calendario" element={user ? <CalendarPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/asistencia" element={user ? <AttendancePage user={user} /> : <Navigate to="/login" />} />
          <Route path="/jugadores" element={user ? <PlayersPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/statistics" element={user ? <StatsPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/physical-tests" element={user ? <PhysicalTestsPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
