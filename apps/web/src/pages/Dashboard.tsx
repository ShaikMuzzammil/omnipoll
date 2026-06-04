import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Play, Pause, Square, Share2, Copy, Check, Trash2, MoreHorizontal,
  Users, MessageSquare, TrendingUp, BarChart3, Radio, Clock, Eye, ExternalLink
} from "lucide-react";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { usePolls, useDeletePoll, useSetStatus } from "../hooks/usePolls";
import { useAuthStore } from "../store/authStore";
import { formatRelative, generateJoinCode, CHART_COLORS, formatNumber } from "../lib/utils";
import { POLL_TYPE_CONFIG } from "../types";
import type { Poll } from "../types";
import { toast } from "sonner";

// Demo polls for when backend is unavailable
const DEMO_POLLS: Poll[] = [
  { id: "demo1", code: "ABC123", title: "Q2 Product Roadmap Priorities", type: "multiple_choice", status: "live", question: "Which feature should we build next?", options: [{ id: "1", text: "AI suggestions" }, { id: "2", text: "Mobile app" }, { id: "3", text: "API access" }], quizQuestions: [], responses: Array(127).fill(null).map((_, i) => ({ id: String(i), answer: ["1","2","3"][i % 3], createdAt: Date.now() - i * 5000 })), qaQuestions: [], participants: [], participantCount: 127, settings: { showResults: true }, createdAt: Date.now() - 86400000 },
  { id: "demo2", code: "XYZ789", title: "All-Hands Q&A Session", type: "qa", status: "paused", question: "What questions do you have for leadership?", options: [], quizQuestions: [], responses: [], qaQuestions: [{ id: "q1", questionText: "What are the Q3 hiring plans?", upvotes: 45, downvotes: 2, status: "open", createdAt: Date.now() - 3600000 }], participants: [], participantCount: 89, settings: {}, createdAt: Date.now() - 172800000 },
  { id: "demo3", code: "DEF456", title: "Team Satisfaction Survey", type: "nps", status: "closed", question: "How likely are you to recommend working here?", options: [], quizQuestions: [], responses: Array(45).fill(null).map((_, i) => ({ id: String(i), answer: 7 + Math.floor(Math.random() * 4), createdAt: Date.now() - i * 60000 })), qaQuestions: [], participants: [], participantCount: 45, settings: {}, createdAt: Date.now() - 604800000 },
  { id: "demo4", code: "GHI012", title: "Product Knowledge Quiz", type: "quiz", status: "live", question: "", options: [], quizQuestions: [{ id: "q1", questionText: "What is our core product?", correctAnswer: "a1", points: 100, timeLimit: 30, options: [{ id: "a1", text: "Platform" }, { id: "a2", text: "Plugin" }] }], responses: Array(23).fill(null).map((_, i) => ({ id: String(i), answer: i % 2 === 0 ? "a1" : "a2", isCorrect: i % 2 === 0, score: i % 2 === 0 ? 100 : 0, createdAt: Date.now() - i * 30000 })), qaQuestions: [], participants: [], participantCount: 23, settings: {}, createdAt: Date.now() - 43200000 },
];

function PollCard({ poll }: { poll: Poll }) {
  const navigate = useNavigate();
  const { mutate: deletePoll } = useDeletePoll();
  const { mutate: setStatus } = useSetStatus();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const config = POLL_TYPE_CONFIG[poll.type];
  const joinUrl = `${window.location.origin}/poll/${poll.code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success("Join link copied!");
  };

  const statusColors = {
    live: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    paused: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    closed: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    draft: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 hover:shadow-md transition-all group relative">
      {/* Status dot */}
      {poll.status === "live" && (
        <div className="absolute top-4 right-4">
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config?.icon || "📊"}</span>
          <div>
            <h3 className="font-semibold text-charcoal dark:text-white text-sm line-clamp-1">{poll.title}</h3>
            <p className="text-xs text-slate dark:text-gray-500">{config?.label} · {formatRelative(poll.createdAt)}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-parchment dark:hover:bg-white/5 text-slate opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 rounded-xl shadow-xl z-10 w-44 overflow-hidden" onClick={() => setShowMenu(false)}>
              <button onClick={() => navigate(`/dashboard/${poll.id}`)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate hover:text-charcoal dark:hover:text-white hover:bg-parchment dark:hover:bg-white/5 transition-colors">
                <Eye size={14} /> View Details
              </button>
              <button onClick={() => navigate(`/dashboard/${poll.id}/present`)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate hover:text-charcoal dark:hover:text-white hover:bg-parchment dark:hover:bg-white/5 transition-colors">
                <Radio size={14} /> Present Live
              </button>
              <a href={joinUrl} target="_blank" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate hover:text-charcoal dark:hover:text-white hover:bg-parchment dark:hover:bg-white/5 transition-colors">
                <ExternalLink size={14} /> Open Join Page
              </a>
              <div className="border-t border-clay/10 dark:border-white/5" />
              <button onClick={() => { if (confirm("Delete this poll?")) deletePoll(poll.id); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-crimson hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate dark:text-gray-400">
          <Users size={12} /> {formatNumber(poll.participantCount)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate dark:text-gray-400">
          <MessageSquare size={12} /> {formatNumber(poll.responses.length)}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-auto ${statusColors[poll.status]}`}>
          {poll.status}
        </span>
      </div>

      {/* Join code */}
      <div className="flex items-center justify-between bg-parchment dark:bg-white/5 rounded-xl px-3 py-2 mb-3">
        <span className="text-xs text-slate dark:text-gray-400">Join code:</span>
        <code className="font-mono text-sm font-bold text-terracotta">{poll.code}</code>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {poll.status !== "live" && (
          <button onClick={() => setStatus({ id: poll.id, status: "live" })}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-sage/10 text-sage hover:bg-sage hover:text-white py-2 rounded-lg transition-colors">
            <Play size={12} /> Go Live
          </button>
        )}
        {poll.status === "live" && (
          <button onClick={() => setStatus({ id: poll.id, status: "paused" })}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white py-2 rounded-lg transition-colors">
            <Pause size={12} /> Pause
          </button>
        )}
        <button onClick={() => navigate(`/dashboard/${poll.id}/present`)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-terracotta/10 text-terracotta hover:bg-terracotta hover:text-white py-2 rounded-lg transition-colors">
          <Radio size={12} /> Present
        </button>
        <button onClick={copyLink}
          className="px-3 py-2 rounded-lg border border-clay/20 dark:border-white/10 text-slate hover:text-charcoal dark:hover:text-white hover:bg-parchment dark:hover:bg-white/5 transition-colors">
          {copied ? <Check size={12} className="text-sage" /> : <Copy size={12} />}
        </button>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: polls, isLoading, error } = usePolls();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "live" | "paused" | "closed">("all");

  // Use demo polls if backend unavailable
  const allPolls = polls ?? (error ? DEMO_POLLS : []);
  const filteredPolls = filter === "all" ? allPolls : allPolls.filter(p => p.status === filter);
  const liveCount = allPolls.filter(p => p.status === "live").length;
  const totalResponses = allPolls.reduce((sum, p) => sum + p.responses.length, 0);
  const totalParticipants = allPolls.reduce((sum, p) => sum + p.participantCount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal dark:text-white">
              Welcome back, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-slate dark:text-gray-400 mt-1">Your audience is waiting.</p>
          </div>
          <button onClick={() => navigate("/dashboard/create")} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Poll
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Polls", value: allPolls.length, icon: BarChart3, color: "text-terracotta bg-terracotta/10", change: "+3 this week" },
            { label: "Live Now", value: liveCount, icon: Radio, color: "text-green-600 bg-green-100 dark:bg-green-900/30", change: liveCount > 0 ? "Active" : "None active" },
            { label: "Total Responses", value: formatNumber(totalResponses), icon: MessageSquare, color: "text-sage bg-sage/10", change: "+23% vs last week" },
            { label: "Participants", value: formatNumber(totalParticipants), icon: Users, color: "text-[#7B9EA8] bg-[#7B9EA8]/10", change: "All time" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon size={18} />
                </div>
                {s.label === "Live Now" && liveCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-charcoal dark:text-white font-mono">{s.value}</div>
              <div className="text-xs text-slate dark:text-gray-500 mt-1">{s.label}</div>
              <div className="text-xs text-sage mt-1">{s.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Polls list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-xl font-bold text-charcoal dark:text-white">Your Polls</h2>
            <div className="flex gap-1 bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 rounded-xl p-1">
              {(["all", "live", "paused", "closed"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-terracotta text-white" : "text-slate hover:text-charcoal dark:hover:text-white"}`}>
                  {f} {f !== "all" && `(${allPolls.filter(p => p.status === f).length})`}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="card p-5 h-52 animate-pulse" />)}
            </div>
          ) : filteredPolls.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 card">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="font-playfair text-xl font-bold text-charcoal dark:text-white mb-2">
                {filter === "all" ? "Create your first poll" : `No ${filter} polls`}
              </h3>
              <p className="text-slate dark:text-gray-400 text-sm mb-6">
                {filter === "all" ? "Engage your audience in real-time with 20+ poll types." : `You have no ${filter} polls right now.`}
              </p>
              {filter === "all" && (
                <button onClick={() => navigate("/dashboard/create")} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} /> Create Your First Poll
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
