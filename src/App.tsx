import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary, FullPageLoader } from '@/components/ErrorBoundary';

import Index           from '@/pages/Index';
import Login           from '@/pages/Login';
import Signup          from '@/pages/Signup';
import Dashboard       from '@/pages/Dashboard';
import Create          from '@/pages/Create';
import Results         from '@/pages/Results';
import Present         from '@/pages/Present';
import Analytics       from '@/pages/Analytics';
import Templates       from '@/pages/Templates';
import Classrooms      from '@/pages/Classrooms';
import ClassroomDetail from '@/pages/ClassroomDetail';
import Settings        from '@/pages/Settings';
import Leaderboard     from '@/pages/Leaderboard';
import Notifications   from '@/pages/Notifications';
import Join            from '@/pages/conduct/Join';
import Participate     from '@/pages/conduct/Participate';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentResults   from '@/pages/student/StudentResults';
import KeySheet         from '@/pages/student/KeySheet';
import AnalyseDetail    from '@/pages/analyse/AnalyseDetail';

type Role = 'teacher' | 'student' | 'admin';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <FullPageLoader message="Loading OmniPoll…" />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role && user.role !== 'admin')
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} replace />;
  return <>{children}</>;
}

function WithDashboard({ children }: { children: React.ReactNode }) {
  return <RequireAuth><DashboardLayout>{children}</DashboardLayout></RequireAuth>;
}

function AppRoutes() {
  const { user } = useApp();
  const dash = user?.role === 'student' ? '/student/dashboard' : '/dashboard';
  return (
    <>
      <Toaster position="top-right" richColors expand
        toastOptions={{ style: { background:'#FEFAF5', border:'1px solid #E4CC94', fontFamily:'Inter, system-ui, sans-serif', borderRadius:'12px' } }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Index />} />
        <Route path="/login"  element={user ? <Navigate to={dash} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={dash} replace /> : <Signup />} />
        {/* Conduct - guest-friendly */}
        <Route path="/join"                element={<Join />} />
        <Route path="/join/:code"          element={<Join />} />
        <Route path="/participate/:pollId" element={<Participate />} />
        {/* Teacher portal */}
        <Route path="/dashboard"           element={<WithDashboard><Dashboard /></WithDashboard>} />
        <Route path="/create"              element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/create/:templateId"  element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/edit/:pollId"        element={<WithDashboard><Create editMode /></WithDashboard>} />
        <Route path="/results/:pollId"     element={<WithDashboard><Results /></WithDashboard>} />
        <Route path="/analytics"           element={<WithDashboard><Analytics /></WithDashboard>} />
        <Route path="/templates"           element={<WithDashboard><Templates /></WithDashboard>} />
        <Route path="/classrooms"          element={<WithDashboard><Classrooms /></WithDashboard>} />
        <Route path="/classrooms/:id"      element={<WithDashboard><ClassroomDetail /></WithDashboard>} />
        <Route path="/leaderboard"         element={<WithDashboard><Leaderboard /></WithDashboard>} />
        <Route path="/notifications"       element={<WithDashboard><Notifications /></WithDashboard>} />
        <Route path="/settings"            element={<WithDashboard><Settings /></WithDashboard>} />
        {/* Fullscreen - no sidebar */}
        <Route path="/present/:pollId"     element={<RequireAuth><Present /></RequireAuth>} />
        {/* Student portal */}
        <Route path="/student/dashboard"    element={<WithDashboard><StudentDashboard /></WithDashboard>} />
        <Route path="/student/results"      element={<WithDashboard><StudentResults /></WithDashboard>} />
        <Route path="/attempt/:id/keysheet" element={<RequireAuth><KeySheet /></RequireAuth>} />
        {/* Deep analysis */}
        <Route path="/analyse/:pollId"      element={<WithDashboard><AnalyseDetail /></WithDashboard>} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ErrorBoundary>
  );
}
