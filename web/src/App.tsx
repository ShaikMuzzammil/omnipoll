import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Home = lazy(() => import("@/pages/Home"));
const Auth = lazy(() => import("@/pages/Auth"));
const Create = lazy(() => import("@/pages/Create"));
const DashboardPolls = lazy(() => import("@/pages/DashboardPolls"));
const Results = lazy(() => import("@/pages/Results"));
const PollView = lazy(() => import("@/pages/PollView"));

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
        toastOptions={{
          style: { fontFamily: "Inter, sans-serif", fontSize: "0.875rem" },
        }}
      />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/poll/:code" element={<PollView />} />
          <Route
            path="/create"
            element={<RequireAuth><Create /></RequireAuth>}
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/dashboard/polls" replace />}
          />
          <Route
            path="/dashboard/polls"
            element={<RequireAuth><DashboardPolls /></RequireAuth>}
          />
          <Route
            path="/dashboard/:id"
            element={<RequireAuth><Results /></RequireAuth>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
