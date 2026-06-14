import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';

// Pages
import Index         from '@/pages/Index';
import Login         from '@/pages/Login';
import Signup        from '@/pages/Signup';
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

// Conduct (student-facing)
import Join          from '@/pages/conduct/Join';
import Participate   from '@/pages/conduct/Participate';

// Student portal
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentResults   from '@/pages/student/StudentResults';
import KeySheet         from '@/pages/student/KeySheet';

// Analyse
import AnalyseDetail from '@/pages/analyse/AnalyseDetail';

type Role = 'teacher' | 'student' | 'admin';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading OmniPoll…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function WithDashboard({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}

function AppRoutes() {
  const { user } = useApp();

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: '#FEFAF5',
            border: '1px solid #E4CC94',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Index />} />
        <Route path="/login"    element={user ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} /> : <Login />} />
        <Route path="/signup"   element={user ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} /> : <Signup />} />

        {/* Join / Conduct – accessible without login (but login preferred) */}
        <Route path="/join"          element={<Join />} />
        <Route path="/join/:code"    element={<Join />} />
        <Route path="/participate/:pollId" element={<Participate />} />

        {/* Teacher dashboard */}
        <Route path="/dashboard"        element={<WithDashboard><Dashboard /></WithDashboard>} />
        <Route path="/create"           element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/create/:templateId" element={<WithDashboard><Create /></WithDashboard>} />
        <Route path="/edit/:pollId"     element={<WithDashboard><Create editMode /></WithDashboard>} />
        <Route path="/results/:pollId"  element={<WithDashboard><Results /></WithDashboard>} />
        <Route path="/analytics"        element={<WithDashboard><Analytics /></WithDashboard>} />
        <Route path="/templates"        element={<WithDashboard><Templates /></WithDashboard>} />
        <Route path="/classrooms"       element={<WithDashboard><Classrooms /></WithDashboard>} />
        <Route path="/classrooms/:id"   element={<WithDashboard><ClassroomDetail /></WithDashboard>} />
        <Route path="/leaderboard"      element={<WithDashboard><Leaderboard /></WithDashboard>} />
        <Route path="/notifications"    element={<WithDashboard><Notifications /></WithDashboard>} />
        <Route path="/settings"         element={<WithDashboard><Settings /></WithDashboard>} />

        {/* Present – fullscreen, no sidebar */}
        <Route path="/present/:pollId"  element={<RequireAuth><Present /></RequireAuth>} />

        {/* Student portal */}
        <Route path="/student/dashboard" element={<WithDashboard><StudentDashboard /></WithDashboard>} />
        <Route path="/student/results"   element={<WithDashboard><StudentResults /></WithDashboard>} />
        <Route path="/attempt/:id/keysheet" element={<RequireAuth><KeySheet /></RequireAuth>} />

        {/* Analyse deep-dive */}
        <Route path="/analyse/:pollId"  element={<WithDashboard><AnalyseDetail /></WithDashboard>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
