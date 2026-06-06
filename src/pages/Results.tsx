import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Share2, Copy, Check,
  Pause, Play, Square, Users, Clock, MessageSquare, TrendingUp,
  Trophy, Star, FileText, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { getPoll, updatePollStatus, csvExportUrl, participantUrl } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import type { Poll, PollResults } from "@/lib/types";

type Tab = "overview" | "breakdown" | "export";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function responseLabel(poll?: Poll | null, results?: PollResults | null): string {
  if (!poll || !results) return "0";
  if (poll.type === "multiple_choice") return String(results.totalVotes || 0);
  if (poll.type === "quiz") return String(results.submissions?.length || 0);
  if (poll.type === "qa") return String(results.questions?.length || 0);
  return String(results.totalResponses || 0);
}

function reportHtml(poll: Poll, results: PollResults): string {
  const rows =
    poll.type === "multiple_choice"
      ? (results.options || []).map(o => `<tr><td>${o.text}</td><td>${o.votes}</td><td>${o.pct}%</td></tr>`).join("")
      : poll.type === "rating"
      ? Object.entries(results.distribution || {}).map(([v, c]) => `<tr><td>${v}</td><td>${c}</td></tr>`).join("")
      : poll.type === "quiz"
      ? (results.leaderboard || []).map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.score}</td><td>${r.correct}/${r.answered}</td></tr>`).join("")
      : poll.type === "qa"
      ? (results.questions || []).map(q => `<tr><td>${q.questionText}</td><td>${q.upvotes}</td></tr>`).join("")
      : (results.words || []).slice(0, 20).map(w => `<tr><td>${w.text}</td><td>${w.count}</td></tr>`).join("");

  return `<!DOCTYPE html><html><head><title>OmniPoll Report – ${poll.title}</title>
  <style>body{font-family:Georgia,serif;padding:40px;color:#2C2C2C;max-width:800px;margin:0 auto}h1{color:#D96C4A;font-size:2rem}h2{color:#2C2C2C;border-bottom:1px solid #C4A882;padding-bottom:8px}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #EDE4D5}th{background:#F5EFE4;font-weight:600}.badge{background:#D96C4A;color:white;padding:3px 10px;border-radius:99px;font-size:12px}.meta{color:#6B6B6B;font-size:14px}</style>
  </head><body>
  <h1>OmniPoll Report</h1>
  <h2>${poll.title} <span class="badge">${poll.status.toUpperCase()}</span></h2>
  <p class="meta">Type: ${poll.type.replace(/_/g, " ")} | Code: ${poll.code} | Date: ${fmtDate(poll.createdAt)}</p>
  <p class="meta">${responseLabel(poll, results)} responses · ${results.participants} participants</p>
  <h2>Results</h2>
  <table><tr>${poll.type === "multiple_choice" ? "<th>Option</th><th>Votes</th><th>%</th>" : poll.type === "rating" ? "<th>Value</th><th>Count</th>" : poll.type === "quiz" ? "<th>Rank</th><th>Name</th><th>Score</th><th>Correct</th>" : poll.type === "qa" ? "<th>Question</th><th>Upvotes</th>" : "<th>Word</th><th>Count</th>"}</tr>${rows || "<tr><td colspan='4'>No responses yet.</td></tr>"}</table>
  ${results.sentiment ? `<h2>AI Sentiment</h2><p>${results.sentiment.score}% ${results.sentiment.label}</p>` : ""}
  </body></html>`;
}

export default function Results() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ?? null;
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const handleUpdate = useCallback(({ poll, results }: { poll: Poll; results: PollResults }) => {
    setPoll(poll); setResults(results);
  }, []);

  // useSocket(id, handleUpdate); -- replaced with direct polling

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPoll(id)
      .then(({ poll, results }) => { setPoll(poll); setResults(results); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status: string) => {
    if (!poll) return;
    try {
      const data = await updatePollStatus(poll.id, status);
      setPoll(data.poll); setResults(data.results);
      toast.success(status === "live" ? "Resumed" : status === "paused" ? "Paused" : "Closed");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const copyLink = async () => {
    if (!poll) return;
    await navigator.clipboard.writeText(participantUrl(poll.code));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const exportPdf = () => {
    if (!poll || !results) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(reportHtml(poll, results));
    win.document.close(); win.focus(); win.print();
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" /></div></DashboardLayout>;

  if (!poll) return (
    <DashboardLayout>
      <div className="max-w-xl bg-warm-white rounded-2xl border border-clay/30 p-8">
        <h1 className="font-playfair text-2xl font-bold text-charcoal">Poll not found</h1>
        <p className="text-slate mt-2">{error || "The poll may have been deleted."}</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-5 bg-terracotta text-white">Back to Dashboard</Button>
      </div>
    </DashboardLayout>
  );

  const stats = [
    { label: "Responses", value: responseLabel(poll, results), icon: MessageSquare, color: "bg-terracotta/10 text-terracotta" },
    { label: "Participants", value: String(results?.participants || 0), icon: Users, color: "bg-sage/10 text-sage" },
    { label: "Status", value: poll.status, icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Join Code", value: poll.code, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
  ];

  const TYPE_ICONS: Record<string, string> = { multiple_choice: "📊", word_cloud: "☁️", qa: "❓", quiz: "🏆", rating: "⭐" };
  const STATUS_COLORS: Record<string, string> = { live: "bg-sage/10 text-sage", paused: "bg-amber-100 text-amber-700", closed: "bg-red-100 text-red-600" };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate hover:text-charcoal mb-4">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{TYPE_ICONS[poll.type]}</span>
                <h1 className="font-playfair text-3xl font-bold text-charcoal">{poll.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[poll.status]}`}>{poll.status.toUpperCase()}</span>
              </div>
              <p className="text-slate text-sm capitalize">{poll.type.replace(/_/g, " ")} · Join code: <code className="font-mono text-terracotta">{poll.code}</code></p>
            </div>
            <div className="flex flex-wrap gap-2">
              {poll.status !== "live" && <Button size="sm" onClick={() => changeStatus("live")} className="bg-sage hover:bg-green-700 text-white"><Play size={14} className="mr-1" /> Resume</Button>}
              {poll.status === "live" && <Button size="sm" onClick={() => changeStatus("paused")} className="bg-amber-500 hover:bg-amber-600 text-white"><Pause size={14} className="mr-1" /> Pause</Button>}
              {poll.status !== "closed" && <Button size="sm" onClick={() => changeStatus("closed")} className="bg-crimson hover:bg-red-700 text-white"><Square size={14} className="mr-1" /> Close</Button>}
              <Button variant="outline" size="sm" onClick={copyLink} className="border-clay/50 text-slate">
                {copied ? <><Check size={14} className="mr-1 text-sage" /> Copied</> : <><Share2 size={14} className="mr-1" /> Share</>}
              </Button>
              <Button asChild variant="outline" size="sm" className="border-clay/50 text-slate">
                <a href={csvExportUrl(poll.id)} download><Download size={14} className="mr-1" /> CSV</a>
              </Button>
            </div>
          </div>
        </motion.div>

        {error && <div className="rounded-xl bg-crimson/10 text-crimson border border-crimson/20 p-3 text-sm">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-warm-white rounded-2xl border border-clay/30 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}><s.icon size={16} /></div>
              <p className="text-xl font-bold text-charcoal font-mono truncate">{s.value}</p>
              <p className="text-xs text-slate">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-warm-white rounded-xl border border-clay/30 p-1">
          {(["overview", "breakdown", "export"] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-terracotta text-white shadow-sm" : "text-slate hover:text-charcoal hover:bg-parchment"}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && results && <ResultVisualization poll={poll} results={results} />}
        {activeTab === "breakdown" && results && <Breakdown poll={poll} results={results} />}
        {activeTab === "export" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-warm-white rounded-2xl border border-clay/30 p-6">
            <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Export Results</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-parchment rounded-xl">
                <div className="flex items-center gap-3"><FileText size={18} className="text-terracotta" /><div><p className="font-medium text-charcoal text-sm">CSV Data</p><p className="text-xs text-slate">Raw data for spreadsheets</p></div></div>
                <Button asChild variant="outline" size="sm" className="border-clay/50 text-slate"><a href={csvExportUrl(poll.id)} download><Download size={14} className="mr-1" /> Download</a></Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-parchment rounded-xl">
                <div className="flex items-center gap-3"><BarChart3 size={18} className="text-terracotta" /><div><p className="font-medium text-charcoal text-sm">PDF Report</p><p className="text-xs text-slate">Printable branded summary</p></div></div>
                <Button variant="outline" size="sm" onClick={exportPdf} className="border-clay/50 text-slate"><Download size={14} className="mr-1" /> Print PDF</Button>
              </div>
              <div className="p-4 bg-parchment rounded-xl">
                <p className="text-xs text-slate uppercase tracking-wide mb-2">Embed Widget</p>
                <code className="text-xs text-charcoal break-all">{`<iframe src="${participantUrl(poll.code)}" width="100%" height="640" />`}</code>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ResultVisualization({ poll, results }: { poll: Poll; results: PollResults }) {
  if (poll.type === "multiple_choice") return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Vote Distribution</h2>
      <div className="space-y-4">
        {results.options?.map((r, i) => (
          <div key={r.id} className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="font-medium text-charcoal">{r.text}</span><span className="font-mono text-slate">{r.votes} ({r.pct}%)</span></div>
            <div className="h-5 bg-parchment rounded-full overflow-hidden">
              <motion.div className="h-full bg-terracotta rounded-full" animate={{ width: `${r.pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
            </div>
          </div>
        ))}
        {!results.options?.length && <p className="text-slate text-sm">No votes yet.</p>}
      </div>
    </motion.div>
  );

  if (poll.type === "word_cloud") return (
    <div className="grid lg:grid-cols-3 gap-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-warm-white rounded-2xl border border-clay/30 p-6 min-h-64 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        {results.words?.length ? results.words.map(w => (
          <span key={w.text} className="font-bold text-terracotta transition-all" style={{ fontSize: `${Math.min(48, 14 + w.count * 8)}px` }}>{w.text}</span>
        )) : <span className="text-slate">Waiting for responses…</span>}
      </motion.div>
      <Insights results={results} />
    </div>
  );

  if (poll.type === "qa") return (
    <div className="grid lg:grid-cols-3 gap-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-3">
        <h2 className="font-playfair text-xl font-bold text-charcoal">Ranked Questions</h2>
        {results.questions?.length ? results.questions.map((q, i) => (
          <div key={q.id} className="bg-parchment rounded-xl p-4 flex justify-between gap-4 items-start">
            <div className="flex gap-3"><span className="text-xs font-bold text-terracotta pt-0.5 w-5">{i + 1}</span><p className="text-sm text-charcoal">{q.questionText}</p></div>
            <span className="text-xs text-terracotta font-bold whitespace-nowrap">▲ {q.upvotes}</span>
          </div>
        )) : <p className="text-slate text-sm">No questions yet.</p>}
      </motion.div>
      <Insights results={results} />
    </div>
  );

  if (poll.type === "quiz") return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Leaderboard</h2>
      <div className="space-y-3">
        {results.leaderboard?.length ? results.leaderboard.map((row, i) => {
          const medals = ["bg-yellow-100 text-yellow-700", "bg-gray-100 text-gray-600", "bg-amber-100 text-amber-700"];
          return (
            <div key={row.participantId} className="bg-parchment rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${medals[i] || "bg-parchment text-slate"}`}>{i + 1}</div>
                <div><p className="font-semibold text-charcoal text-sm">{row.name}</p><p className="text-xs text-slate">{row.correct}/{row.answered} correct</p></div>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-charcoal"><Trophy size={14} className="text-terracotta" />{row.score}</div>
            </div>
          );
        }) : <p className="text-slate text-sm">No submissions yet.</p>}
      </div>
    </motion.div>
  );

  // Rating
  const avg = results.average || 0;
  const max = poll.settings?.max || 5;
  const total = results.totalResponses || 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <div className="text-center mb-6">
        <Star className="w-8 h-8 text-terracotta mx-auto mb-2" />
        <p className="text-5xl font-bold text-charcoal font-playfair">{avg.toFixed(1)}</p>
        <p className="text-sm text-slate mt-1">Average · {total} responses</p>
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: max }).map((_, i) => (
            <span key={i} className="text-xl" style={{ opacity: i < Math.round(avg) ? 1 : 0.2 }}>⭐</span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(results.distribution || {}).reverse().map(([value, count]) => {
          const pct = total ? Math.round((count as number) / total * 100) : 0;
          return (
            <div key={value} className="flex items-center gap-3">
              <span className="w-6 text-sm font-mono text-charcoal text-right">{value}</span>
              <div className="flex-1 h-4 bg-parchment rounded-full overflow-hidden">
                <motion.div className="h-full bg-terracotta rounded-full" animate={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-xs text-slate text-right">{count as number}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Insights({ results }: { results: PollResults }) {
  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5">
      <div>
        <p className="text-xs text-slate uppercase tracking-wide mb-2">Sentiment</p>
        <p className="text-3xl font-bold text-charcoal">{results.sentiment?.score ?? 50}%</p>
        <div className="h-2 bg-parchment rounded-full mt-2 mb-1">
          <div className={`h-full rounded-full transition-all ${results.sentiment?.label === "positive" ? "bg-sage" : results.sentiment?.label === "negative" ? "bg-crimson" : "bg-amber-400"}`} style={{ width: `${results.sentiment?.score ?? 50}%` }} />
        </div>
        <p className="text-sm text-slate capitalize">{results.sentiment?.label || "neutral"}</p>
      </div>
      <div>
        <p className="text-xs text-slate uppercase tracking-wide mb-2">AI Themes</p>
        <div className="space-y-2">
          {results.themes?.length ? results.themes.slice(0, 5).map(t => (
            <div key={t.label} className="bg-parchment rounded-lg px-3 py-2 flex justify-between">
              <span className="text-sm text-charcoal">{t.label}</span>
              <span className="text-xs text-slate">{t.count}</span>
            </div>
          )) : <p className="text-xs text-slate">Themes appear after open text responses.</p>}
        </div>
      </div>
    </div>
  );
}

function Breakdown({ poll, results }: { poll: Poll; results: PollResults }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Detailed Breakdown</h2>
      {poll.type === "multiple_choice" && (
        <table className="w-full">
          <thead><tr className="border-b border-clay/30"><th className="text-left text-xs text-slate font-medium uppercase tracking-wide py-3">Option</th><th className="text-right text-xs text-slate font-medium uppercase tracking-wide py-3">Votes</th><th className="text-right text-xs text-slate font-medium uppercase tracking-wide py-3">%</th></tr></thead>
          <tbody>{results.options?.map(r => <tr key={r.id} className="border-b border-clay/20 last:border-0"><td className="py-3 text-sm text-charcoal font-medium">{r.text}</td><td className="py-3 text-sm text-charcoal text-right font-mono">{r.votes}</td><td className="py-3 text-sm text-charcoal text-right font-mono">{r.pct}%</td></tr>)}</tbody>
        </table>
      )}
      {poll.type !== "multiple_choice" && <pre className="text-xs bg-parchment rounded-xl p-4 overflow-auto max-h-96 text-charcoal">{JSON.stringify(results, null, 2)}</pre>}
    </motion.div>
  );
}
