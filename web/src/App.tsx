import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Polls from "@/pages/Polls";
import CreatePoll from "@/pages/CreatePoll";
import Present from "@/pages/Present";
import Join from "@/pages/Join";
import Participate from "@/pages/Participate";
import Contact from "@/pages/Contact";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import Moderation from "@/pages/Moderations";
import Results from "@/pages/Results";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/polls" element={<Polls />} />
              <Route path="/dashboard/polls/create" element={<CreatePoll />} />
              <Route path="/dashboard/polls/:id/edit" element={<CreatePoll />} />
              <Route path="/dashboard/polls/:id/results" element={<Results />} />
              <Route path="/dashboard/:id" element={<Results />} />
              <Route path="/present/:id" element={<Present />} />
              <Route path="/join" element={<Join />} />
              <Route path="/join/:code" element={<Join />} />
              <Route path="/p/:code" element={<Participate />} />
              <Route path="/poll/:code" element={<Participate />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/moderation" element={<Moderation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
