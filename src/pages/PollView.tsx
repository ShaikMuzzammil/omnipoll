import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Play, Pause, Square, BarChart2, Users, Clock, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import DashboardLayout from "@/components/DashboardLayout";
import { getPoll, updatePollStatus, deletePoll } from "@/lib/api";
import { POLL_TYPE_META } from "@/lib/types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function PollView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["poll", id], queryFn: () => getPoll(id!), enabled: !!id });
  const poll = data?.poll;
  const results = data?.results;
  const meta = poll ? POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice : null;

  const setStatus = useMutation({
    mutationFn: (status: string) => updatePollStatus(id!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["poll", id] }); toast.success("Status updated"); },
  });

  const remove = useMutation({
    mutationFn: () => deletePoll(id!),
    onSuccess: () => { navigate("/dashboard"); toast.success("Poll deleted"); },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/participate/${poll?.code}`);
    toast.success("Link copied!");
  };

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!poll) return <DashboardLayout><div className="p-6 text-center text-muted-foreground">Poll not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit">
          <ArrowLeft className="w-4 h-4" />Back to dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {meta && <span className="text-2xl">{meta.icon}</span>}
              {meta && <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${poll.status==="live" ? "bg-green-100 text-green-700" : poll.status==="paused" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{poll.status}</span>
            </div>
            <h1 className="text-2xl font-playfair font-bold text-foreground">{poll.title || poll.question}</h1>
            {poll.description && <p className="text-muted-foreground mt-1">{poll.description}</p>}
            <p className="text-xs text-muted-foreground mt-2">Created {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Participants", value: poll.participants?.length || 0 },
            { icon: BarChart2, label: "Responses", value: poll.responses?.length || 0 },
            { icon: Clock, label: "Created", value: formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Icon className="w-5 h-5 text-terracotta mx-auto mb-1.5" />
              <div className="text-xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Join info */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Join info</h2>
            <div className="flex gap-4 items-start">
              <div className="bg-white rounded-xl p-2 border border-border shadow-sm">
                <QRCodeCanvas value={`${window.location.origin}/participate/${poll.code}`} size={100} fgColor="#D96C4A" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Join code</p>
                  <p className="text-2xl font-mono font-bold text-terracotta tracking-widest">{poll.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Join URL</p>
                  <p className="text-xs text-foreground font-mono break-all">{window.location.origin}/participate/{poll.code}</p>
                </div>
                <Button size="sm" onClick={copyLink} variant="outline" className="gap-1.5 w-full text-xs">
                  <Copy className="w-3 h-3" />Copy link
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Actions</h2>
            <div className="space-y-2">
              <Button asChild className="w-full bg-terracotta hover:bg-terracotta/90 gap-2">
                <Link to={`/present/${poll.id}`}><ExternalLink className="w-4 h-4" />Open Presenter View</Link>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link to={`/analytics/${poll.id}`}><BarChart2 className="w-4 h-4" />View Analytics</Link>
              </Button>
              {poll.type === "qa" && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to={`/moderation/${poll.id}`}>🛡️ Moderate Q&A</Link>
                </Button>
              )}
              <div className="flex gap-2 pt-2">
                {poll.status === "live"
                  ? <Button variant="outline" className="flex-1 gap-1.5 text-yellow-600 border-yellow-300" onClick={() => setStatus.mutate("paused")}><Pause className="w-3.5 h-3.5" />Pause</Button>
                  : <Button variant="outline" className="flex-1 gap-1.5 text-green-600 border-green-300" onClick={() => setStatus.mutate("live")}><Play className="w-3.5 h-3.5" />Go Live</Button>}
                <Button variant="outline" className="flex-1 gap-1.5 text-gray-600" onClick={() => setStatus.mutate("closed")}><Square className="w-3.5 h-3.5" />End Poll</Button>
              </div>
              <Button variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 mt-2" onClick={() => { if(confirm("Delete this poll?")) remove.mutate(); }}>
                <Trash2 className="w-4 h-4" />Delete Poll
              </Button>
            </div>
          </div>
        </div>

        {/* Live results preview */}
        {results?.options && results.options.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Live results</h2>
            <div className="space-y-2">
              {results.options.map((opt, i) => (
                <div key={opt.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{opt.text}</span>
                    <span className="text-muted-foreground">{opt.votes} ({opt.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${opt.pct}%`, background: POLL_TYPE_META[poll.type]?.color.split(" ")[0]?.replace("bg-","") || "#D96C4A" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
