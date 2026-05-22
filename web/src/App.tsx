import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Home        = lazy(() => import("@/pages/Home"));
const Auth        = lazy(() => import("@/pages/Auth"));
const Signup      = lazy(() => import("@/pages/Signup"));
const Create      = lazy(() => import("@/pages/Create"));
const Polls       = lazy(() => import("@/pages/Polls"));
const DashboardPolls = lazy(() => import("@/pages/DashboardPolls"));
const Results     = lazy(() => import("@/pages/Results"));
const Present     = lazy(() => import("@/pages/Present"));
const PollView    = lazy(() => import("@/pages/PollView"));
const Participate = lazy(() => import("@/pages/Participate"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth?mode=signin" replace />;
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
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: "0.875rem" } }}
      />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Home />} />
          <Route path="/auth"        element={<Auth />} />
          <Route path="/signup"      element={<Signup />} />

          {/* Participant join routes */}
          <Route path="/poll/:code"        element={<PollView />} />
          <Route path="/participate/:code" element={<Participate />} />
          <Route path="/join/:code"        element={<Participate />} />

          {/* Protected creator routes */}
          <Route path="/create"
            element={<RequireAuth><Create /></RequireAuth>} />

          {/* Dashboard — both /dashboard and /dashboard/polls */}
          <Route path="/dashboard"
            element={<Navigate to="/dashboard/polls" replace />} />
          <Route path="/dashboard/polls"
            element={<RequireAuth><DashboardPolls /></RequireAuth>} />

          {/* Polls list page */}
          <Route path="/polls"
            element={<RequireAuth><Polls /></RequireAuth>} />

          {/* Results / analytics */}
          <Route path="/dashboard/:id"
            element={<RequireAuth><Results /></RequireAuth>} />
          <Route path="/results/:id"
            element={<RequireAuth><Results /></RequireAuth>} />

          {/* Presenter / moderation view */}
          <Route path="/present/:id"
            element={<RequireAuth><Present /></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
