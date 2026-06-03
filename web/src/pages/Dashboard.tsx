import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Copy, Pause, Play, Square, Trash2, BarChart3, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function fmtDate(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // user.id might be undefined if session not ready — guard it
    const creatorId = user?.id;
    if (!creatorId) return;
    try {
      const data = await listPolls(creatorId);
      setPolls(data.polls || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (poll: Poll, status: string) => {
    try {
      await updatePollStatus(poll.id, status);
      toast.success(status === "live" ? "Resumed" : status === "paused" ? "Paused" : "Closed");
      load();
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (poll: Poll) => {
    if (!confirm(`Delete "${poll.title}"?`)) return;
    try {
      await deletePoll(poll.id);
      toast.success("Poll deleted");
      load();
    } catch { toast.error("Failed to delete poll"); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal">Dashboard</h1>
            <p className="text-slate text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <Button asChild className="bg-terracotta hover:bg-orange-600 text-white">
            <Link to="/create"><Plus size={14} className="mr-1.5" /> Create Poll</Link>
          </Button>
        </div>

        {!polls.length ? (
          <div className="text-center py-20 bg-warm-white rounded-2xl border border-clay/30">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">No polls yet</h2>
            <p className="text-slate mb-6">Create your first poll to engage your audience</p>
            <Button asChild className="bg-terracotta hover:bg-orange-600 text-white">
              <Link to="/create">Create Your First Poll</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {polls.map((poll, i) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-warm-white rounded-2xl border border-clay/30 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col gap-3"
                onClick={() => navigate(`/dashboard/${poll.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl mb-1.5">{TYPE_ICONS[poll.type] || "📊"}</div>
                    <h3 className="font-semibold text-charcoal truncate">{poll.title}</h3>
                    <p className="text-xs text-slate mt-0.5 capitalize">{poll.type.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[poll.status]}`}>
                    {poll.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate">
                  <span>👥 {poll.participants?.length || 0}</span>
                  {/* updatedAt is optional — use createdAt as fallback */}
                  <span>📅 {fmtDate(poll.updatedAt ?? poll.createdAt)}</span>
                </div>

                <div
                  className="flex items-center gap-1.5 pt-2 border-t border-clay/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <code className="flex-1 text-xs font-mono bg-parchment px-2 py-1 rounded-lg text-terracotta truncate">
                    {poll.code}
                  </code>
                  <Button variant="ghost" size="sm" className="p-1.5 text-slate"
                    onClick={() => { navigator.clipboard.writeText(poll.code); toast.success("Copied!"); }}>
                    <Copy size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1.5 text-slate"
                    onClick={() => navigate(`/dashboard/${poll.id}`)}>
                    <BarChart3 size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1.5 text-slate"
                    onClick={() => window.open(`/present/${poll.id}`, "_blank")}>
                    <Monitor size={13} />
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
        )}
      </div>
    </DashboardLayout>
  );
}
