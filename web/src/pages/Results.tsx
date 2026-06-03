import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3, Download, FileText, ArrowLeft, Users, Clock,
  TrendingUp, MessageSquare, Share2, Copy, Check, Pause,
  Play, Square, Cloud, Trophy, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { csvExportUrl, getPoll, participantUrl, updatePollStatus } from "@/lib/api";
import { useSocket, type PollSocketPayload } from "@/hooks/useSocket";
import type { Poll, PollResults, PollStatus } from "@/lib/types";

function responseLabel(poll?: Poll | null, results?: PollResults | null) {
  if (!poll || !results) return "0";
  if (poll.type === "multiple_choice") return String(results.totalVotes || 0);
  if (poll.type === "quiz") return String(results.submissions?.length || 0);
  if (poll.type === "qa") return String(results.questions?.length || 0);
  return String(results.totalResponses || 0);
}

function reportHtml(poll: Poll, results: PollResults) {
  const rows = poll.type === "multiple_choice"
    ? (results.options || []).map((option) => `<li>${option.text}: ${option.votes} votes (${option.pct}%)</li>`).join("")
    : poll.type === "rating"
      ? Object.entries(results.distribution || {}).map(([value, count]) => `<li>${value}: ${count}</li>`).join("")
      : poll.type === "quiz"
        ? (results.leaderboard || []).map((row, index) => `<li>${index + 1}. ${row.name}: ${row.score} points</li>`).join("")
        : poll.type === "qa"
          ? (results.questions || []).map((question) => `<li>${question.questionText} (${question.upvotes} upvotes)</li>`).join("")
          : (results.words || []).map((word) => `<li>${word.text}: ${word.count}</li>`).join("");
  return `
    <html>
      <head><title>${poll.title} Report</title><style>body{font-family:Inter,Arial,sans-serif;padding:40px;color:#2C2C2C}h1{color:#D96C4A}section{margin-top:24px}li{margin:8px 0}.meta{color:#666}</style></head>
      <body>
        <h1>OmniPoll Report</h1>
        <h2>${poll.title}</h2>
        <p class="meta">Type: ${poll.type.replace("_", " ")} | Code: ${poll.code} | Status: ${poll.status}</p>
        <section><h3>Summary</h3><p>${responseLabel(poll, results)} responses from ${results.participants} participants.</p></section>
        <section><h3>Results</h3><ul>${rows || "<li>No responses yet.</li>"}</ul></section>
        ${results.sentiment ? `<section><h3>AI Sentiment</h3><p>${results.sentiment.score}% ${results.sentiment.label}</p></section>` : ""}
      </body>
    </html>
  `;
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "export">("overview");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handlePollUpdate = useCallback((payload: PollSocketPayload) => {
    setPoll(payload.poll);
    setResults(payload.results);
  }, []);

  useSocket(poll?.id || id, handlePollUpdate);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPoll(id)
      .then((payload) => {
        setPoll(payload.poll);
        setResults(payload.results);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load results."))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = async () => {
    if (!poll) return;
    await navigator.clipboard.writeText(participantUrl(poll.code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changeStatus = async (status: PollStatus) => {
    if (!poll) return;
    try {
      const response = await updatePollStatus(poll.id, status);
      setPoll(response.poll);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    }
  };

  const exportPdf = () => {
    if (!poll || !results) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(reportHtml(poll, results));
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) {
    return <DashboardLayout><div className="text-slate">Loading live results...</div></DashboardLayout>;
  }

  if (!poll || !results) {
    return (
      <DashboardLayout>
        <div className="max-w-xl bg-warm-white rounded-xl border border-clay/30 p-8">
          <h1 className="font-playfair text-2xl font-bold text-charcoal">Poll not found</h1>
          <p className="text-slate mt-2">{error || "The poll may have been deleted."}</p>
          <Button onClick={() => navigate("/dashboard/polls")} className="mt-5 bg-terracotta hover:bg-terracotta/90 text-white">Back to polls</Button>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Responses", value: responseLabel(poll, results), icon: MessageSquare, color: "bg-terracotta/10 text-terracotta" },
    { label: "Participants", value: String(results.participants), icon: Users, color: "bg-sage/10 text-sage" },
    { label: "Status", value: poll.status, icon: Clock, color: "bg-[#D4A574]/10 text-[#D4A574]" },
    { label: "Join Code", value: poll.code, icon: TrendingUp, color: "bg-[#7B9EA8]/10 text-[#7B9EA8]" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/dashboard/polls")} className="flex items-center gap-1 text-sm text-slate hover:text-charcoal mb-4">
            <ArrowLeft size={14} /> Back to polls
          </button>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-charcoal">{poll.title}</h1>
              <p className="text-slate mt-1 capitalize">{poll.type.replace("_", " ")} live analytics and controls</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {poll.status !== "live" && <Button size="sm" onClick={() => changeStatus("live")} className="bg-sage hover:bg-sage/90 text-white"><Play size={14} className="mr-1" /> Resume</Button>}
              {poll.status === "live" && <Button size="sm" onClick={() => changeStatus("paused")} className="bg-[#D4A574] hover:bg-[#D4A574]/90 text-white"><Pause size={14} className="mr-1" /> Pause</Button>}
              {poll.status !== "closed" && <Button size="sm" onClick={() => changeStatus("closed")} className="bg-crimson hover:bg-crimson/90 text-white"><Square size={14} className="mr-1" /> Close</Button>}
              <Button variant="outline" className="border-clay/60 text-slate text-sm" onClick={copyLink}>
                {copied ? <><Check size={14} className="mr-1 text-sage" /> Copied</> : <><Share2 size={14} className="mr-1" /> Share</>}
              </Button>
              <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white text-sm">
                <a href={csvExportUrl(poll.id)} download><Download size={14} className="mr-2" /> CSV</a>
              </Button>
            </div>
          </div>
        </motion.div>

        {error && <div className="rounded-xl bg-crimson/10 text-crimson border border-crimson/20 p-3 text-sm">{error}</div>}

        <div className="flex items-center gap-1 bg-warm-white rounded-xl border border-clay/30 p-1">
          {(["overview", "breakdown", "export"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-terracotta text-white shadow-sm" : "text-slate hover:text-charcoal hover:bg-cream"}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid sm:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div key={s.label} className="bg-warm-white rounded-xl p-4 border border-clay/30" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon size={16} /></div>
                  <p className="text-xl font-bold text-charcoal truncate">{s.value}</p>
                  <p className="text-xs text-slate">{s.label}</p>
                </motion.div>
              ))}
            </div>
            <ResultVisualization poll={poll} results={results} />
          </motion.div>
        )}

        {activeTab === "breakdown" && <Breakdown poll={poll} results={results} />}

        {activeTab === "export" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
            <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Export Results</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-terracotta" />
                  <div><p className="font-medium text-charcoal text-sm">CSV Data</p><p className="text-xs text-slate">Raw responses for spreadsheet analysis</p></div>
                </div>
                <Button asChild variant="outline" className="border-clay/60 text-slate text-sm"><a href={csvExportUrl(poll.id)} download><Download size={14} className="mr-2" /> Download</a></Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} className="text-terracotta" />
                  <div><p className="font-medium text-charcoal text-sm">PDF Report</p><p className="text-xs text-slate">Printable branded summary with insights</p></div>
                </div>
                <Button variant="outline" onClick={exportPdf} className="border-clay/60 text-slate text-sm"><Download size={14} className="mr-2" /> Print PDF</Button>
              </div>
              <div className="p-4 bg-cream rounded-xl">
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
  if (poll.type === "multiple_choice") {
    return (
      <div className="bg-warm-white rounded-xl border border-clay/30 p-6">
        <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Response Distribution</h2>
        <div className="space-y-5">
          {results.options?.map((r, i) => (
            <div key={r.id} className="space-y-2">
              <div className="flex justify-between text-sm"><span className="font-medium text-charcoal">{r.text}</span><span className="font-mono text-slate">{r.votes} votes ({r.pct}%)</span></div>
              <div className="h-5 bg-cream rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-terracotta" animate={{ width: `${r.pct}%` }} transition={{ duration: 0.5, delay: i * 0.03 }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (poll.type === "word_cloud") {
    return (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-warm-white rounded-xl border border-clay/30 p-6 min-h-[280px] flex items-center justify-center flex-wrap gap-x-5 gap-y-3">
          {results.words?.length ? results.words.map((word) => <span key={word.text} className="font-bold text-terracotta" style={{ fontSize: `${Math.min(44, 14 + word.count * 6)}px` }}>{word.text}</span>) : <span className="text-slate">No words yet.</span>}
        </div>
        <Insights results={results} />
      </div>
    );
  }

  if (poll.type === "qa") {
    return (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-warm-white rounded-xl border border-clay/30 p-6 space-y-3">
          <h2 className="font-playfair text-xl font-bold text-charcoal mb-3">Ranked Questions</h2>
          {results.questions?.length ? results.questions.map((question) => (
            <div key={question.id} className="bg-cream rounded-xl p-4 flex justify-between gap-4"><p className="text-sm text-charcoal">{question.questionText}</p><span className="text-xs text-terracotta font-bold">{question.upvotes} upvotes</span></div>
          )) : <p className="text-slate">No questions yet.</p>}
        </div>
        <Insights results={results} />
      </div>
    );
  }

  if (poll.type === "quiz") {
    return (
      <div className="bg-warm-white rounded-xl border border-clay/30 p-6">
        <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Leaderboard</h2>
        <div className="space-y-3">
          {results.leaderboard?.length ? results.leaderboard.map((row, index) => (
            <div key={row.participantId} className="bg-cream rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold">{index + 1}</div><div><p className="font-medium text-charcoal">{row.name}</p><p className="text-xs text-slate">{row.correct}/{row.answered} correct</p></div></div>
              <div className="font-bold text-charcoal flex items-center gap-1"><Trophy size={14} className="text-terracotta" /> {row.score}</div>
            </div>
          )) : <p className="text-slate">No quiz answers yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warm-white rounded-xl border border-clay/30 p-6">
      <div className="text-center mb-6">
        <Star className="w-8 h-8 text-terracotta mx-auto mb-2" />
        <p className="text-4xl font-bold text-charcoal">{(results.average || 0).toFixed(1)}</p>
        <p className="text-sm text-slate">Average rating</p>
      </div>
      <div className="space-y-3">
        {Object.entries(results.distribution || {}).map(([value, count]) => {
          const pct = results.totalResponses ? (Number(count) / results.totalResponses) * 100 : 0;
          return (
            <div key={value} className="flex items-center gap-3">
              <span className="w-8 text-sm font-mono text-charcoal">{value}</span>
              <div className="flex-1 h-4 bg-cream rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-terracotta" animate={{ width: `${pct}%` }} /></div>
              <span className="w-10 text-xs text-slate text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Insights({ results }: { results: PollResults }) {
  return (
    <div className="bg-warm-white rounded-xl border border-clay/30 p-6 space-y-4">
      <div>
        <p className="text-xs text-slate uppercase tracking-wide mb-2">Sentiment</p>
        <p className="text-3xl font-bold text-charcoal">{results.sentiment?.score ?? 50}%</p>
        <p className="text-sm text-slate capitalize">{results.sentiment?.label || "neutral"}</p>
      </div>
      <div>
        <p className="text-xs text-slate uppercase tracking-wide mb-2">AI Themes</p>
        <div className="space-y-2">
          {results.themes?.length ? results.themes.slice(0, 4).map((theme) => (
            <div key={theme.label} className="bg-cream rounded-lg p-3"><p className="font-medium text-charcoal text-sm">{theme.label}</p><p className="text-xs text-slate">{theme.count} mentions</p></div>
          )) : <p className="text-sm text-slate">Themes appear after open text responses arrive.</p>}
        </div>
      </div>
    </div>
  );
}

function Breakdown({ poll, results }: { poll: Poll; results: PollResults }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Detailed Breakdown</h2>
      {poll.type === "multiple_choice" && (
        <table className="w-full">
          <thead><tr className="border-b border-clay/30"><th className="text-left text-xs text-slate font-medium uppercase tracking-wide py-3">Option</th><th className="text-right text-xs text-slate font-medium uppercase tracking-wide py-3">Votes</th><th className="text-right text-xs text-slate font-medium uppercase tracking-wide py-3">Percentage</th></tr></thead>
          <tbody>{results.options?.map((r) => <tr key={r.id} className="border-b border-clay/20 last:border-0"><td className="py-3 text-sm text-charcoal font-medium">{r.text}</td><td className="py-3 text-sm text-charcoal text-right font-mono">{r.votes}</td><td className="py-3 text-sm text-charcoal text-right font-mono">{r.pct}%</td></tr>)}</tbody>
        </table>
      )}
      {poll.type !== "multiple_choice" && <pre className="text-xs bg-cream rounded-xl p-4 overflow-auto max-h-[520px] text-charcoal">{JSON.stringify(results, null, 2)}</pre>}
    </motion.div>
  );
}
