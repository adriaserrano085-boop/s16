import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { apiGet } from './lib/apiClient';
import Sidebar from './components/Sidebar';
import './index.css';

const HOSPITALET_SHIELD = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";

// Lazy-loaded pages — only downloaded when user navigates to them
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const PlayersPage = React.lazy(() => import('./pages/PlayersPage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const PhysicalTestsPage = React.lazy(() => import('./pages/PhysicalTestsPage'));
const RivalAnalysisPage = React.lazy(() => import('./pages/RivalAnalysisPage'));
const MatchReportPage = React.lazy(() => import('./pages/MatchReportPage'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Shared loading fallback
const PageLoader = () => (
  <div className="app-loading-screen">
    <div className="app-loading-text">Cargando...</div>
  </div>
);

// Authenticated layout with sidebar
function AuthLayout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('s16_auth_token');
    localStorage.removeItem('s16_cached_role');
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      {user?.role !== 'JUGADOR' && <Sidebar user={user} onLogout={handleLogout} />}
      <div className="app-with-sidebar">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/analysis/rival/:rivalId" element={<RivalAnalysisPage user={user} />} />
            <Route path="/analysis/match/:type/:id" element={<MatchReportPage user={user} />} />

            {/* Restricted Routes: Only for STAFF (or non-players) */}
            {user?.role !== 'JUGADOR' && (
              <>
                <Route path="/calendario" element={<CalendarPage user={user} />} />
                <Route path="/asistencia" element={<AttendancePage user={user} />} />
                <Route path="/jugadores" element={<PlayersPage user={user} />} />
                <Route path="/statistics" element={<StatsPage user={user} />} />
                <Route path="/physical-tests" element={<PhysicalTestsPage user={user} />} />
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Route path="/admin/usuarios" element={<UserManagement user={user} />} />
            )}

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
    // 1. Loading Timeout
    const globalTimeout = setTimeout(() => {
      if (initializing) setInitializing(false);
    }, 4000);

    // 2. Auth Helper Function
    const fetchUserRoleAndSetState = async (token) => {
      if (!token) {
        setUser(null);
        localStorage.removeItem('s16_cached_role');
        return;
      }

      console.log("Auth State Change: Detected Token");

      try {
        console.log("Auth State: Querying latest profile from backend...");
        const response = await fetch(`/api/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log("Auth State: Profile refreshed successfully:", profileData);
          localStorage.setItem('s16_cached_role', JSON.stringify(profileData));
          setUser(profileData);
        } else {
          console.warn("Auth State: Token invalid or expired. Cleaning up.");
          localStorage.removeItem('s16_auth_token');
          localStorage.removeItem('s16_cached_role');
          setUser(null);
        }
      } catch (err) {
        console.error("Auth Logic Error:", err);
        // On network error, we can try to use the cache if it exists
        const cachedRoleStr = localStorage.getItem('s16_cached_role');
        if (cachedRoleStr) {
          try {
            setUser(JSON.parse(cachedRoleStr));
          } catch (e) { }
        }
      }
    };

    // 3. Initial Session Check
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('s16_auth_token');
        if (token) {
          await fetchUserRoleAndSetState(token);
        }
      } catch (err) {
        console.error("Initial Session Check Failed:", err);
        setInitError('Error al conectar con el servidor');
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    return () => {
      clearTimeout(globalTimeout);
    };
  }, []);

  if (initializing) {
    return (
      <div className="app-loading-screen">
        <img src={HOSPITALET_SHIELD} alt="Logo" width="80" />
        <div className="app-loading-text">RCLH - S16</div>
        {initError && <div className="app-loading-error">{initError}</div>}
        <button onClick={() => setInitializing(false)} className="app-loading-skip">
          Saltar y entrar al Login
        </button>
        <div className="app-loading-hint">Conectando con el Servidor</div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

