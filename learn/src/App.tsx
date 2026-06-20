import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary, FullPageLoader } from '@/components/ErrorBoundary';

// Public pages
import Index   from '@/pages/Index';
import Login   from '@/pages/Login';
import Signup  from '@/pages/Signup';
import Contact from '@/pages/Contact';

// Conduct (public/guest)
import Join        from '@/pages/conduct/Join';
import Participate from '@/pages/conduct/Participate';

// Student portal (auth required)
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentResults   from '@/pages/student/StudentResults';
import KeySheet         from '@/pages/student/KeySheet';
import Classrooms       from '@/pages/Classrooms';
import Leaderboard      from '@/pages/Leaderboard';
import Notifications    from '@/pages/Notifications';
import Settings         from '@/pages/Settings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <FullPageLoader message="Loading OmniPoll Learn…" />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function WithDashboard({ children }: { children: React.ReactNode }) {
  return <RequireAuth><DashboardLayout>{children}</DashboardLayout></RequireAuth>;
}

function AppRoutes() {
  const { user } = useApp();
  const dash = '/student/dashboard';

  return (
    <>
      <Toaster position="top-right" richColors expand
        toastOptions={{ style:{ background:'#FEFAF5', border:'1px solid #E4CC94', fontFamily:'Inter, system-ui, sans-serif', borderRadius:'12px' }}}/>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login"   element={user ? <Navigate to={dash} replace /> : <Login />} />
        <Route path="/signup"  element={user ? <Navigate to={dash} replace /> : <Signup />} />

        {/* Conduct - guest OK */}
        <Route path="/join"                element={<Join />} />
        <Route path="/join/:code"          element={<Join />} />
        <Route path="/participate/:pollId" element={<Participate />} />

        {/* Student portal */}
        <Route path="/student/dashboard"    element={<WithDashboard><StudentDashboard /></WithDashboard>} />
        <Route path="/student/results"      element={<WithDashboard><StudentResults /></WithDashboard>} />
        <Route path="/attempt/:id/keysheet" element={<RequireAuth><KeySheet /></RequireAuth>} />
        <Route path="/classrooms"           element={<WithDashboard><Classrooms /></WithDashboard>} />
        <Route path="/leaderboard"          element={<WithDashboard><Leaderboard /></WithDashboard>} />
        <Route path="/notifications"        element={<WithDashboard><Notifications /></WithDashboard>} />
        <Route path="/settings"             element={<WithDashboard><Settings /></WithDashboard>} />

        {/* Redirect teacher routes to student dashboard */}
        <Route path="/dashboard" element={<Navigate to={dash} replace />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <ErrorBoundary><AppProvider><AppRoutes /></AppProvider></ErrorBoundary>;
}
