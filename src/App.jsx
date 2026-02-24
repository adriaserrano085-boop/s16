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
const RivalAnalysisPage = React.lazy(() => import('./pages/RivalAnalysisPage'));
const MatchReportPage = React.lazy(() => import('./pages/MatchReportPage'));

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
    const fetchUserRoleAndSetState = async (session) => {
      if (!session?.user) {
        setUser(null);
        localStorage.removeItem('s16_cached_role');
        return;
      }

      console.log("Auth State Change: Detected Session User", session.user.id);

      // Check for cached role first to provide immediate feedback and survive slow connections
      const cachedRoleStr = localStorage.getItem('s16_cached_role');
      if (cachedRoleStr) {
        try {
          const cached = JSON.parse(cachedRoleStr);
          if (cached.userId === session.user.id) {
            console.log("Auth State: Using cached role", cached.role);
            setUser({ ...session.user, ...cached });
          }
        } catch (e) {
          console.error("Error parsing cached role", e);
        }
      }

      try {
        console.log("Auth State: Querying jugadores_propios...");

        // Timeout promise - Increased to 15s to handle wake-from-sleep
        const queryTimeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 15000));

        // A. Check if user is a Player
        const playerQuery = supabase
          .from('jugadores_propios')
          .select('id, nombre, apellidos, Usuario')
          .eq('Usuario', session.user.id)
          .maybeSingle();

        const result = await Promise.race([playerQuery, queryTimeout]);

        if (result.timeout) {
          console.warn("Auth State: Role query timed out (slow connection).");
          // If we have a cached role, keep using it instead of defaulting to INVITADO
          if (cachedRoleStr) {
            console.log("Auth State: Keeping cached role despite timeout.");
            return;
          }
          console.error("Auth State: No cached role and query timed out. Redirecting to login.");
          await supabase.auth.signOut();
          setUser(null);
          return;
        }

        const { data: playerData, error: playerError } = result;

        console.log("Auth State: Query Result", { playerData, playerError });

        if (playerError) console.error("Error fetching player role:", playerError);

        if (playerData) {
          console.log("Role Assigned: JUGADOR", playerData.nombre);
          const userData = {
            role: 'JUGADOR',
            nombre: `${playerData.nombre} ${playerData.apellidos}`,
            playerId: playerData.id,
            userId: session.user.id
          };
          setUser({ ...session.user, ...userData });
          localStorage.setItem('s16_cached_role', JSON.stringify(userData));
        } else {
          // B. Check if user is Staff
          console.log("Auth State: User not in jugadores_propios. Checking Staff table...");

          const { data: staffData, error: staffError } = await supabase
            .from('Staff')
            .select('*')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          if (staffData) {
            console.log("Role Assigned: STAFF (Found in Staff table)", staffData.nombre);
            const userData = {
              role: 'STAFF',
              nombre: `${staffData.nombre} ${staffData.apellidos}`,
              userId: session.user.id
            };
            setUser({ ...session.user, ...userData });
            localStorage.setItem('s16_cached_role', JSON.stringify(userData));
          } else {
            console.warn("Auth State: User not found in Players OR Staff. Access Denied.");
            // If not found in any authorized table, sign them out and clear everything
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('s16_cached_role');
          }
        }
      } catch (err) {
        console.error("Auth Logic Error:", err);
        // Fallback
        setUser({ ...session.user, role: 'INVITADO', nombre: session.user.email });
      }
    };

    // 3. Initial Session Check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await fetchUserRoleAndSetState(session);
      } catch (err) {
        console.error("Initial Session Check Failed:", err);
        setInitError('Error al conectar con el servidor');
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    // 4. Listen for Auth Changes (Login, SignOut, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase Auth Event:", event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUserRoleAndSetState(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(globalTimeout);
      subscription.unsubscribe();
    };
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

