import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Create from "@/pages/Create";
import PollView from "@/pages/PollView";
import Join from "@/pages/Join";
import Participate from "@/pages/Participate";
import Present from "@/pages/Present";
import Analytics from "@/pages/Analytics";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import Templates from "@/pages/Templates";
import Moderation from "@/pages/Moderation";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<Create />} />
      <Route path="/poll/:id" element={<PollView />} />
      <Route path="/polls/:id" element={<PollView />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/poll/join/:code" element={<Participate />} />
      <Route path="/participate/:code" element={<Participate />} />
      <Route path="/present/:id" element={<Present />} />
      <Route path="/analytics/:id" element={<Analytics />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/pricing" element={<Billing />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/moderation/:id" element={<Moderation />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
