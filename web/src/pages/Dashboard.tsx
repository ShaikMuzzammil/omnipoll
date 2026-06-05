import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Plus, Users, Activity, TrendingUp, Copy, ExternalLink, Play, Pause, X, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { getPolls, updatePollStatus, deletePoll } from "@/lib/api";
import { POLL_TYPE_META } from "@/lib/types";
import type { Poll } from "@/lib/types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TABS = ["all", "live", "paused", "closed"] as const;

export default function Dashboard() {
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const userId = (() => { try { return JSON.parse(localStorage.getItem("omnipoll_auth") || "null")?.user?.id || ""; } catch { return ""; } })();

  const { data, refetch } = useQuery({
    queryKey: ["polls", userId],
    queryFn: () => getPolls(userId),
    refetchInterval: 15000,
  });

  const polls: Poll[] = data?.polls || [];
  const filtered = tab === "all" ? polls : polls.filter(p => p.status === tab);

  const totalParticipants = polls.reduce((a, p) => a + (p.participants?.length || 0), 0);
  const totalResponses = polls.reduce((a, p) => a + (p.responses?.length || 0), 0);
  const livePollsCount = polls.filter(p => p.status === "live").length;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/participate/${code}`);
    toast.success("Join link copied!");
  };

  const setStatus = async (id: string, status: string) => {
    await updatePollStatus(id, status);
    refetch();
    toast.success(`Poll ${status}`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this poll?")) return;
    await deletePoll(id);
    refetch();
    toast.success("Poll deleted");
  };

  const STATS = [
    { icon: BarChart2, label: "Total Polls", value: polls.length, color: "text-terracotta", bg: "bg-terracotta/10" },
    { icon: Activity,  label: "Live Now",    value: livePollsCount, color: "text-green-600", bg: "bg-green-100" },
    { icon: Users,     label: "Participants", value: totalParticipants, color: "text-blue-600", bg: "bg-blue-100" },
    { icon: TrendingUp,label: "Responses",   value: totalResponses, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-playfair font-bold text-foreground">My Polls</h1>
          <Button asChild className="bg-terracotta hover:bg-terracotta/90 gap-2">
            <Link to="/create"><Plus className="w-4 h-4" />New Poll</Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t} {t === "all" ? `(${polls.length})` : `(${polls.filter(p => p.status === t).length})`}
            </button>
          ))}
        </div>

        {/* Poll Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <BarChart2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No polls yet</p>
            <Button asChild className="mt-4 bg-terracotta hover:bg-terracotta/90">
              <Link to="/create">Create your first poll</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((poll, i) => {
              const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
              return (
                <motion.div key={poll.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        poll.status === "live" ? "bg-green-100 text-green-700" :
                        poll.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{poll.status}</span>
                    </div>
                  </div>

                  <Link to={`/poll/${poll.id}`}>
                    <h3 className="font-semibold text-foreground group-hover:text-terracotta transition-colors line-clamp-2 mb-3 leading-snug">
                      {poll.title || poll.question}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{poll.participants?.length || 0}</span>
                    <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{poll.responses?.length || 0} resp.</span>
                    <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="font-mono text-xs bg-muted rounded-lg px-2 py-1.5 text-muted-foreground mb-3 flex items-center justify-between">
                    <span>Code: <strong className="text-terracotta tracking-widest">{poll.code}</strong></span>
                    <button onClick={() => copyLink(poll.code)} className="hover:text-foreground transition-colors"><Copy className="w-3 h-3" /></button>
                  </div>

                  <div className="flex items-center gap-2">
                    {poll.status === "live" ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setStatus(poll.id, "paused")}>
                        <Pause className="w-3 h-3" />Pause
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setStatus(poll.id, "live")}>
                        <Play className="w-3 h-3" />Go Live
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                      <Link to={`/present/${poll.id}`}><ExternalLink className="w-3 h-3" />Present</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 px-2" onClick={() => remove(poll.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
