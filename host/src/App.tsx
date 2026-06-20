import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary, FullPageLoader } from '@/components/ErrorBoundary';
import Index         from '@/pages/Index';
import Login         from '@/pages/Login';
import Signup        from '@/pages/Signup';
import Contact       from '@/pages/Contact';
import Dashboard     from '@/pages/Dashboard';
import Create        from '@/pages/Create';
import Results       from '@/pages/Results';
import Present       from '@/pages/Present';
import Analytics     from '@/pages/Analytics';
import Templates     from '@/pages/Templates';
import Classrooms    from '@/pages/Classrooms';
import ClassroomDetail from '@/pages/ClassroomDetail';
import Settings      from '@/pages/Settings';
import Leaderboard   from '@/pages/Leaderboard';
import Notifications from '@/pages/Notifications';
import Moderation    from '@/pages/Moderation';
import AnalyseDetail from '@/pages/analyse/AnalyseDetail';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <FullPageLoader message="Loading OmniPoll Host…" />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
function WithDashboard({ children }: { children: React.ReactNode }) {
  return <RequireAuth><DashboardLayout>{children}</DashboardLayout></RequireAuth>;
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <>
      <Toaster position="top-right" richColors expand toastOptions={{ style:{ background:'#FEFAF5', border:'1px solid #E4CC94', fontFamily:'Inter, system-ui, sans-serif', borderRadius:'12px' }}}/>
      <Routes>
        <Route path="/"        element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login"   element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup"  element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/dashboard"          element={<WithDashboard><Dashboard /></WithDashboard>} />
        <Route path="/create"             element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/create/:templateId" element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/edit/:pollId"       element={<WithDashboard><Create editMode /></WithDashboard>} />
        <Route path="/results/:pollId"    element={<WithDashboard><Results /></WithDashboard>} />
        <Route path="/analytics"          element={<WithDashboard><Analytics /></WithDashboard>} />
        <Route path="/templates"          element={<WithDashboard><Templates /></WithDashboard>} />
        <Route path="/classrooms"         element={<WithDashboard><Classrooms /></WithDashboard>} />
        <Route path="/classrooms/:id"     element={<WithDashboard><ClassroomDetail /></WithDashboard>} />
        <Route path="/leaderboard"        element={<WithDashboard><Leaderboard /></WithDashboard>} />
        <Route path="/notifications"      element={<WithDashboard><Notifications /></WithDashboard>} />
        <Route path="/moderation"         element={<WithDashboard><Moderation /></WithDashboard>} />
        <Route path="/settings"           element={<WithDashboard><Settings /></WithDashboard>} />
        <Route path="/present/:pollId"    element={<RequireAuth><Present /></RequireAuth>} />
        <Route path="/analyse/:pollId"    element={<WithDashboard><AnalyseDetail /></WithDashboard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
export default function App() {
  return <ErrorBoundary><AppProvider><AppRoutes /></AppProvider></ErrorBoundary>;
}
