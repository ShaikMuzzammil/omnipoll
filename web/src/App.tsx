import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppProvider } from "@/context/AppContext";

const Index        = lazy(() => import("@/pages/Index"));
const Home         = lazy(() => import("@/pages/Home"));
const Auth         = lazy(() => import("@/pages/Auth"));
const Signup       = lazy(() => import("@/pages/Signup"));
const Login        = lazy(() => import("@/pages/Login"));
const Join         = lazy(() => import("@/pages/Join"));
const Create       = lazy(() => import("@/pages/Create"));
const CreatePoll   = lazy(() => import("@/pages/CreatePoll"));
const Dashboard    = lazy(() => import("@/pages/Dashboard"));
const DashboardPolls = lazy(() => import("@/pages/DashboardPolls"));
const Polls        = lazy(() => import("@/pages/Polls"));
const Results      = lazy(() => import("@/pages/Results"));
const Present      = lazy(() => import("@/pages/Present"));
const PollView     = lazy(() => import("@/pages/PollView"));
const Participate  = lazy(() => import("@/pages/Participate"));
const Moderations  = lazy(() => import("@/pages/Moderations"));
const Settings     = lazy(() => import("@/pages/Settings"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg">
      <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: "0.875rem" } }}
        />
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public */}
            <Route path="/"           element={<Index />} />
            <Route path="/home"       element={<Home />} />
            <Route path="/auth"       element={<Auth />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/join"       element={<Join />} />
            <Route path="/join/:code" element={<Join />} />

            {/* Participant */}
            <Route path="/poll/:code"        element={<PollView />} />
            <Route path="/participate/:code" element={<Participate />} />

            {/* Protected */}
            <Route path="/create"
              element={<RequireAuth><Create /></RequireAuth>} />
            <Route path="/create-poll"
              element={<RequireAuth><CreatePoll /></RequireAuth>} />

            {/* Dashboard */}
            <Route path="/dashboard"
              element={<Navigate to="/dashboard/polls" replace />} />
            <Route path="/dashboard/polls"
              element={<RequireAuth><DashboardPolls /></RequireAuth>} />
            <Route path="/dashboard/:id"
              element={<RequireAuth><Results /></RequireAuth>} />

            {/* Extras */}
            <Route path="/polls"
              element={<RequireAuth><Polls /></RequireAuth>} />
            <Route path="/my-polls"
              element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/results/:id"
              element={<RequireAuth><Results /></RequireAuth>} />
            <Route path="/present/:id"
              element={<RequireAuth><Present /></RequireAuth>} />
            <Route path="/moderation"
              element={<RequireAuth><Moderations /></RequireAuth>} />
            <Route path="/moderations"
              element={<RequireAuth><Moderations /></RequireAuth>} />
            <Route path="/settings"
              element={<RequireAuth><Settings /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
