import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Copy, Pause, Play, Square, Trash2, BarChart3, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { listPolls, updatePollStatus, deletePoll } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Poll } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  multiple_choice: "📊", word_cloud: "☁️", qa: "❓", quiz: "🏆", rating: "⭐",
};
const STATUS_COLORS: Record<string, string> = {
  live: "bg-sage/10 text-sage",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-red-100 text-red-600",
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getResponseCount(poll: Poll): number {
  // qaQuestions / qnaQuestions length for qa type
  const qaLen = (poll.qaQuestions ?? poll.qnaQuestions ?? []).length;
  // quizSubmissions length for quiz type
  const quizLen = (poll.quizSubmissions ?? []).length;
  if (poll.type === "qa") return qaLen;
  if (poll.type === "quiz") return quizLen || poll.responses?.length || 0;
  return poll.responses?.length || 0;
}

export default function Polls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listPolls(user.id);
      setPolls(data.polls || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (poll: Poll, status: string) => {
    try {
      await updatePollStatus(poll.id, status);
      toast.success(
        status === "live" ? "Resumed" : status === "paused" ? "Paused" : "Closed"
      );
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (poll: Poll) => {
    if (!confirm(`Delete "${poll.title}"? This cannot be undone.`)) return;
    try {
      await deletePoll(poll.id);
      toast.success("Poll deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const displayed = polls.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "live" && p.status === "live") ||
      (filter === "paused" && p.status === "paused") ||
      (filter === "closed" && p.status === "closed") ||
      p.type === filter ||
      (p.category ?? "") === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal">My Polls</h1>
            <p className="text-slate text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <Button asChild className="bg-terracotta hover:bg-orange-600 text-white">
            <Link to="/create"><Plus size={14} className="mr-1.5" /> Create Poll</Link>
          </Button>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search polls…"
              className="pl-9 bg-warm-white border-clay/40 focus:border-terracotta"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "live", "paused", "closed", "multiple_choice", "quiz", "qa", "word_cloud", "rating"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-terracotta text-white"
                    : "bg-warm-white border border-clay/40 text-slate hover:border-terracotta/50"
                }`}
              >
                {f === "multiple_choice" ? "MC" : f === "word_cloud" ? "Cloud" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {!displayed.length && (
          <div className="text-center py-20 bg-warm-white rounded-2xl border border-clay/30">
            <div className="text-5xl mb-4">{search ? "🔍" : "📊"}</div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">
              {search ? "No polls match your search" : "No polls yet"}
            </h2>
            <p className="text-slate mb-6">
              {search ? "Try a different term" : "Create your first poll to start engaging your audience"}
            </p>
            {!search && (
              <Button asChild className="bg-terracotta hover:bg-orange-600 text-white">
                <Link to="/create">Create Your First Poll</Link>
              </Button>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((poll, i) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-warm-white rounded-2xl border border-clay/30 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col gap-3"
              onClick={() => navigate(`/dashboard/${poll.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-2xl mb-1.5">{TYPE_ICONS[poll.type] || "📊"}</div>
                  <h3 className="font-semibold text-charcoal truncate">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-xs text-slate mt-0.5 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate capitalize">
                      {poll.type.replace(/_/g, " ")}
                    </span>
                    {poll.category && (
                      <span className="text-xs bg-parchment text-slate px-2 py-0.5 rounded-full">
                        {poll.category}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[poll.status]}`}>
                  {poll.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate">
                <span>👥 {poll.participants?.length || 0}</span>
                <span>💬 {getResponseCount(poll)}</span>
                <span>📅 {fmtDate(poll.createdAt)}</span>
              </div>

              <div
                className="flex items-center gap-1.5 pt-2 border-t border-clay/20"
                onClick={(e) => e.stopPropagation()}
              >
                <code className="flex-1 text-xs font-mono bg-parchment px-2 py-1 rounded-lg text-terracotta truncate">
                  {poll.code}
                </code>
                <Button
                  variant="ghost" size="sm" className="p-1.5 text-slate"
                  onClick={() => { navigator.clipboard.writeText(poll.code); toast.success("Copied!"); }}
                >
                  <Copy size={13} />
                </Button>
                <Button
                  variant="ghost" size="sm" className="p-1.5 text-slate"
                  onClick={() => navigate(`/dashboard/${poll.id}`)}
                >
                  <BarChart3 size={13} />
                </Button>
                {poll.status === "live" && (
                  <Button variant="ghost" size="sm" className="p-1.5 text-amber-600"
                    onClick={() => changeStatus(poll, "paused")}>
                    <Pause size={13} />
                  </Button>
                )}
                {poll.status === "paused" && (
                  <Button variant="ghost" size="sm" className="p-1.5 text-sage"
                    onClick={() => changeStatus(poll, "live")}>
                    <Play size={13} />
                  </Button>
                )}
                {poll.status !== "closed" && (
                  <Button variant="ghost" size="sm" className="p-1.5 text-crimson"
                    onClick={() => changeStatus(poll, "closed")}>
                    <Square size={13} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="p-1.5 text-slate hover:text-crimson"
                  onClick={() => handleDelete(poll)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
