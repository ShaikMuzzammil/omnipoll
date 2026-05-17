import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Plus, Users, MessageSquare, TrendingUp, Clock,
  ArrowUpRight, Activity, Vote, Cloud, Zap, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { listPolls } from "@/lib/api";
import type { Poll } from "@/lib/types";

const typeIcons: Record<string, typeof BarChart3> = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  qa: MessageSquare,
  quiz: Zap,
  rating: TrendingUp,
};

function responseCount(poll: Poll) {
  if (poll.type === "qa") return poll.qnaQuestions?.length || 0;
  if (poll.type === "quiz") return poll.quizSubmissions?.length || 0;
  return poll.responses?.length || 0;
}

function participantCount(poll: Poll) {
  const ids = new Set<string>();
  poll.responses?.forEach((response) => ids.add(response.participantId));
  poll.qnaQuestions?.forEach((question) => question.participantId && ids.add(question.participantId));
  poll.quizSubmissions?.forEach((submission) => ids.add(submission.participantId));
  return ids.size;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!state.user) return;
    setLoading(true);
    listPolls(state.user.id)
      .then(({ polls }) => dispatch({ type: "SET_POLLS", payload: polls }))
      .finally(() => setLoading(false));
  }, [dispatch, navigate, state.isAuthenticated, state.user]);

  const totals = useMemo(() => {
    const polls = state.polls;
    const responses = polls.reduce((sum, poll) => sum + responseCount(poll), 0);
    const participants = polls.reduce((sum, poll) => sum + participantCount(poll), 0);
    const live = polls.filter((poll) => poll.status === "live").length;
    const engagement = participants ? Math.round((responses / Math.max(participants, 1)) * 100) : 0;
    return { polls: polls.length, responses, participants, live, engagement };
  }, [state.polls]);

  const stats = [
    { label: "Total Polls", value: totals.polls, change: `${totals.live} live now`, icon: Vote, color: "bg-terracotta/10 text-terracotta" },
    { label: "Participants", value: totals.participants, change: "Unique devices", icon: Users, color: "bg-sage/10 text-sage" },
    { label: "Responses", value: totals.responses, change: "All poll types", icon: MessageSquare, color: "bg-[#D4A574]/10 text-[#D4A574]" },
    { label: "Avg Engagement", value: `${totals.engagement}%`, change: "Responses per participant", icon: TrendingUp, color: "bg-[#7B9EA8]/10 text-[#7B9EA8]" },
  ];

  const recentPolls = state.polls.slice(0, 5);
  const activity = recentPolls.map((poll) => ({
    text: `${poll.title} is ${poll.status}`,
    time: new Date(poll.updatedAt || poll.createdAt).toLocaleString(),
    icon: typeIcons[poll.type] || BarChart3,
  }));

  const quickActions = [
    { label: "Create Poll", icon: Plus, action: () => navigate("/dashboard/polls/create"), color: "bg-terracotta text-white" },
    { label: "View Analytics", icon: TrendingUp, action: () => navigate("/dashboard/analytics"), color: "bg-sage/10 text-sage" },
    { label: "Join Test", icon: MessageSquare, action: () => navigate("/join"), color: "bg-[#D4A574]/10 text-[#D4A574]" },
    { label: "My Polls", icon: Vote, action: () => navigate("/dashboard/polls"), color: "bg-[#7B9EA8]/10 text-[#7B9EA8]" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-charcoal">Dashboard</h1>
              <p className="text-slate mt-1">
                Welcome back, <span className="font-semibold text-charcoal">{state.user?.name || "Presenter"}</span>
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard/polls/create")} className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Plus size={16} className="mr-2" /> Create Poll
            </Button>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {quickActions.map((action) => (
            <button key={action.label} onClick={action.action} className="flex items-center gap-3 p-4 rounded-xl bg-warm-white border border-clay/30 hover:border-terracotta/30 transition-all text-left group">
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon size={18} />
              </div>
              <span className="text-sm font-medium text-charcoal group-hover:text-terracotta transition-colors">{action.label}</span>
            </button>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="bg-warm-white rounded-xl p-5 border border-clay/30" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon size={18} />
                </div>
                <ArrowUpRight size={16} className="text-sage" />
              </div>
              <p className="text-2xl font-bold text-charcoal">{s.value}</p>
              <p className="text-xs text-slate mt-1">{s.label}</p>
              <p className="text-xs text-sage mt-1 font-medium">{s.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-2 bg-warm-white rounded-xl border border-clay/30 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Recent Polls</h2>
              <Button variant="ghost" size="sm" className="text-terracotta hover:text-terracotta/80" onClick={() => navigate("/dashboard/polls")}>
                View all <ArrowUpRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {loading && <p className="text-sm text-slate text-center py-8">Loading polls...</p>}
              {!loading && recentPolls.length === 0 && (
                <div className="text-center py-10 bg-cream rounded-xl">
                  <BarChart3 className="w-10 h-10 text-clay mx-auto mb-2" />
                  <p className="text-charcoal font-medium">No polls yet</p>
                  <p className="text-slate text-sm mt-1">Create your first live poll to see it here.</p>
                </div>
              )}
              {recentPolls.map((poll) => {
                const Icon = typeIcons[poll.type] || BarChart3;
                return (
                  <div key={poll.id} className="flex items-center justify-between p-4 rounded-lg bg-cream hover:bg-cream/80 transition-colors cursor-pointer group" onClick={() => navigate(`/dashboard/polls/${poll.id}/results`)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${poll.status === "live" ? "bg-sage animate-pulse" : poll.status === "closed" ? "bg-slate" : "bg-[#D4A574]"}`} />
                      <Icon size={16} className="text-slate" />
                      <div>
                        <p className="font-medium text-charcoal text-sm group-hover:text-terracotta transition-colors">{poll.title}</p>
                        <p className="text-xs text-slate capitalize">{poll.type.replace("_", " ")} &middot; Code {poll.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-charcoal">{responseCount(poll)}</p>
                        <p className="text-xs text-slate">responses</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${poll.status === "live" ? "bg-sage/10 text-sage" : poll.status === "closed" ? "bg-slate/10 text-slate" : "bg-[#D4A574]/10 text-[#D4A574]"}`}>
                        {poll.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="bg-warm-white rounded-xl border border-clay/30 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-terracotta" />
              <h2 className="font-playfair text-xl font-bold text-charcoal">Activity</h2>
            </div>
            <div className="space-y-4">
              {activity.length === 0 && <p className="text-sm text-slate">No activity yet.</p>}
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0">
                    <a.icon size={14} className="text-slate" />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal">{a.text}</p>
                    <p className="text-xs text-slate flex items-center gap-1 mt-0.5"><Clock size={10} /> {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4 text-terracotta hover:text-terracotta/80" onClick={() => navigate("/dashboard/analytics")}>
              View Analytics <ArrowRight size={14} className="ml-1" />
            </Button>
          </motion.div>
        </div>

        <motion.div className="bg-gradient-to-r from-terracotta/10 to-[#D4A574]/10 rounded-xl border border-terracotta/20 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-terracotta/20 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-terracotta" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">AI-Powered Insights</h3>
              <p className="text-sm text-slate">Word Cloud and Q&A polls now produce local sentiment and theme clustering without requiring an external API key.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
