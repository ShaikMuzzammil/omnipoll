import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, BarChart3, Cloud,
  MessageSquare, Star, Clock, Play, Eye, Trash2,
  Copy, Check, TrendingUp, Users, Pause, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { deletePoll, listPolls, participantUrl, updatePollStatus } from "@/lib/api";
import type { Poll, PollStatus } from "@/lib/types";

const typeIcons: Record<string, typeof BarChart3> = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  qa: MessageSquare,
  quiz: Star,
  rating: Star,
};

const typeColors: Record<string, string> = {
  multiple_choice: "bg-terracotta/10 text-terracotta",
  word_cloud: "bg-sage/10 text-sage",
  qa: "bg-[#D4A574]/10 text-[#D4A574]",
  quiz: "bg-[#7B9EA8]/10 text-[#7B9EA8]",
  rating: "bg-[#9B8AA5]/10 text-[#9B8AA5]",
};

function responseCount(poll: Poll) {
  if (poll.type === "qa") return poll.qnaQuestions?.length || 0;
  if (poll.type === "quiz") return poll.quizSubmissions?.length || 0;
  return poll.responses?.length || 0;
}

function statusClass(status: PollStatus) {
  if (status === "live") return "bg-sage/10 text-sage";
  if (status === "paused") return "bg-[#D4A574]/10 text-[#D4A574]";
  if (status === "closed") return "bg-slate/10 text-slate";
  return "bg-terracotta/10 text-terracotta";
}

export default function Polls() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!state.user) return;
    setLoading(true);
    listPolls(state.user.id)
      .then(({ polls }) => dispatch({ type: "SET_POLLS", payload: polls }))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load polls."))
      .finally(() => setLoading(false));
  }, [dispatch, navigate, state.isAuthenticated, state.user]);

  const polls = useMemo(() => {
    return state.polls.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, search, state.polls]);

  const copyCode = async (poll: Poll) => {
    await navigator.clipboard.writeText(`${poll.code} - ${participantUrl(poll.code)}`);
    setCopiedCode(poll.code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const changeStatus = async (poll: Poll, status: PollStatus) => {
    try {
      const response = await updatePollStatus(poll.id, status);
      dispatch({ type: "UPDATE_POLL", payload: response.poll });
      setMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update poll.");
    }
  };

  const removePoll = async (id: string) => {
    try {
      await deletePoll(id);
      dispatch({ type: "DELETE_POLL", payload: id });
      setMenuOpen(null);
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: Date.now().toString(),
          type: "info",
          message: "Poll deleted successfully.",
          read: false,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete poll.");
    }
  };

  const totalResponses = state.polls.reduce((acc, p) => acc + responseCount(p), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal">My Polls</h1>
            <p className="text-slate mt-1">Manage, launch, pause, close, and analyze your interactive polls</p>
          </div>
          <Button onClick={() => navigate("/dashboard/polls/create")} className="bg-terracotta hover:bg-terracotta/90 text-white">
            <Plus size={16} className="mr-2" /> Create Poll
          </Button>
        </motion.div>

        {error && <div className="rounded-xl bg-crimson/10 text-crimson border border-crimson/20 p-3 text-sm">{error}</div>}

        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {[
            { label: "Total", value: state.polls.length, icon: BarChart3 },
            { label: "Live", value: state.polls.filter((p) => p.status === "live").length, icon: TrendingUp, color: "text-sage" },
            { label: "Paused", value: state.polls.filter((p) => p.status === "paused").length, icon: Clock, color: "text-[#D4A574]" },
            { label: "Responses", value: totalResponses, icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="bg-warm-white rounded-xl border border-clay/30 p-4 flex items-center gap-3">
              <stat.icon size={16} className={`text-slate ${stat.color || ""}`} />
              <div>
                <p className="text-lg font-bold text-charcoal">{stat.value}</p>
                <p className="text-xs text-slate">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search polls by title, description, category, or join code..." className="pl-10 bg-warm-white border-clay/40" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {["all", "live", "paused", "closed", "draft"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === s ? "bg-terracotta text-white" : "bg-warm-white text-slate border border-clay/40 hover:bg-cream"}`}>
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-3">
          {loading && <div className="text-center py-10 bg-warm-white rounded-xl border border-clay/30 text-slate">Loading polls...</div>}
          <AnimatePresence>
            {!loading && polls.map((poll, i) => {
              const Icon = typeIcons[poll.type] || BarChart3;
              const typeColor = typeColors[poll.type] || "bg-slate/10 text-slate";
              return (
                <motion.div key={poll.id} className="bg-warm-white rounded-xl border border-clay/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-terracotta/20 transition-all" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ delay: i * 0.04 }} layout>
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${typeColor} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal group-hover:text-terracotta transition-colors">{poll.title}</h3>
                      {poll.description && <p className="text-xs text-slate mt-0.5">{poll.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate mt-1">
                        <span className="capitalize">{poll.type.replace("_", " ")}</span>
                        {poll.category && <span className="bg-cream px-1.5 py-0.5 rounded text-[10px]">{poll.category}</span>}
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={() => copyCode(poll)} className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cream text-xs font-mono text-charcoal hover:bg-terracotta/10 transition-colors">
                      {copiedCode === poll.code ? <Check size={12} className="text-sage" /> : <Copy size={12} />}
                      {poll.code}
                    </button>
                    <div className="text-right mr-4 hidden sm:block">
                      <p className="text-sm font-semibold text-charcoal">{responseCount(poll)}</p>
                      <p className="text-xs text-slate">responses</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(poll.status)}`}>{poll.status}</span>
                    <div className="relative ml-auto sm:ml-0">
                      <button onClick={() => setMenuOpen(menuOpen === poll.id ? null : poll.id)} className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-slate hover:text-charcoal">
                        <MoreHorizontal size={16} />
                      </button>
                      <AnimatePresence>
                        {menuOpen === poll.id && (
                          <motion.div className="absolute right-0 mt-1 w-44 bg-warm-white rounded-xl border border-clay/40 shadow-lg py-1 z-10" initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }}>
                            {poll.status !== "live" && (
                              <button onClick={() => changeStatus(poll, "live")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors">
                                <Play size={14} /> Resume Live
                              </button>
                            )}
                            {poll.status === "live" && (
                              <button onClick={() => changeStatus(poll, "paused")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors">
                                <Pause size={14} /> Pause
                              </button>
                            )}
                            {poll.status !== "closed" && (
                              <button onClick={() => changeStatus(poll, "closed")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors">
                                <Square size={14} /> Close
                              </button>
                            )}
                            <button onClick={() => { setMenuOpen(null); navigate(`/dashboard/polls/${poll.id}/results`); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors">
                              <Eye size={14} /> Results
                            </button>
                            <button onClick={() => copyCode(poll)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors">
                              <Copy size={14} /> Copy Link
                            </button>
                            <button onClick={() => removePoll(poll.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-crimson hover:bg-crimson/5 transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!loading && polls.length === 0 && (
            <motion.div className="text-center py-16 bg-warm-white rounded-xl border border-clay/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BarChart3 className="w-12 h-12 text-clay mx-auto mb-3" />
              <p className="text-charcoal font-medium">No polls found</p>
              <p className="text-slate text-sm mt-1">Create your first poll to get started</p>
              <Button onClick={() => navigate("/dashboard/polls/create")} className="mt-4 bg-terracotta hover:bg-terracotta/90 text-white">
                <Plus size={16} className="mr-2" /> Create Poll
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
