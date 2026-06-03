import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Wifi, WifiOff, Share2, Check,
  Pause, Play, Square, Users, MessageSquare,
  Trophy, Star, BarChart2, Shield, Brain, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { getPoll, updatePollStatus } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import type { Poll, PollResults, QAQuestion } from "@/lib/types";

type PresentTab = "results" | "moderation" | "sentiment" | "themes" | "qa";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // connected comes from useSocket() with 0 args
  const { connected } = useSocket();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PresentTab>("results");
  const [copied, setCopied] = useState(false);

  const handleUpdate = useCallback(
    ({ poll, results }: { poll: Poll; results: PollResults }) => {
      setPoll(poll); setResults(results);
    },
    []
  );

  // Subscribe with pollId + handler
  useSocket(id, handleUpdate);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPoll(id)
      .then(({ poll, results }) => { setPoll(poll); setResults(results); })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status: string) => {
    if (!poll) return;
    try {
      const data = await updatePollStatus(poll.id, status);
      setPoll(data.poll); setResults(data.results);
      toast.success(
        status === "live" ? "Resumed" :
        status === "paused" ? "Paused" : "Poll closed"
      );
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const copyLink = async () => {
    if (!poll) return;
    const url = `${window.location.origin}/poll/${poll.code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const moderateQA = async (q: QAQuestion, action: "highlight" | "dismiss") => {
    // optimistic update
    if (!poll) return;
    toast.success(action === "highlight" ? "Question highlighted" : "Question dismissed");
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  if (!poll) return (
    <DashboardLayout>
      <div className="bg-warm-white rounded-2xl border border-clay/30 p-8 max-w-md">
        <h1 className="font-playfair text-2xl font-bold text-charcoal">Poll not found</h1>
        <Button onClick={() => navigate("/dashboard")} className="mt-4 bg-terracotta text-white">
          Back to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );

  const TYPE_ICONS: Record<string, string> = {
    multiple_choice: "📊", word_cloud: "☁️", qa: "❓", quiz: "🏆", rating: "⭐",
  };
  const STATUS_COLORS: Record<string, string> = {
    live: "bg-sage/10 text-sage", paused: "bg-amber-100 text-amber-700", closed: "bg-red-100 text-red-600",
  };

  const TABS: { id: PresentTab; label: string; icon: React.ElementType }[] = [
    { id: "results", label: "Live Results", icon: BarChart2 },
    { id: "moderation", label: "Moderation", icon: Shield },
    { id: "sentiment", label: "Sentiment", icon: Brain },
    { id: "themes", label: "Themes", icon: Tag },
    ...(poll.type === "qa" ? [{ id: "qa" as PresentTab, label: "Q&A", icon: MessageSquare }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back + connection status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-sm text-slate hover:text-charcoal"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ml-auto ${connected ? "bg-sage/10 text-sage" : "bg-red-100 text-red-500"}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{TYPE_ICONS[poll.type]}</span>
                <h1 className="font-playfair text-3xl font-bold text-charcoal">{poll.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[poll.status]}`}>
                  {poll.status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate text-sm">
                Join code: <code className="font-mono text-terracotta">{poll.code}</code>
                {" · "}
                <span className="capitalize">{poll.type.replace(/_/g, " ")}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {poll.status !== "live" && (
                <Button size="sm" onClick={() => changeStatus("live")} className="bg-sage hover:bg-green-700 text-white">
                  <Play size={14} className="mr-1" /> Resume
                </Button>
              )}
              {poll.status === "live" && (
                <Button size="sm" onClick={() => changeStatus("paused")} className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Pause size={14} className="mr-1" /> Pause
                </Button>
              )}
              {poll.status !== "closed" && (
                <Button size="sm" onClick={() => changeStatus("closed")} className="bg-crimson hover:bg-red-700 text-white">
                  <Square size={14} className="mr-1" /> Close
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={copyLink} className="border-clay/50 text-slate">
                {copied ? <><Check size={14} className="mr-1 text-sage" /> Copied</> : <><Share2 size={14} className="mr-1" /> Share</>}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Responses", value: results?.totalVotes ?? results?.totalResponses ?? poll.responses?.length ?? 0, icon: MessageSquare, color: "bg-terracotta/10 text-terracotta" },
            { label: "Participants", value: results?.participants ?? 0, icon: Users, color: "bg-sage/10 text-sage" },
            { label: "Questions", value: poll.qaQuestions?.length ?? 0, icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
            { label: "Status", value: poll.status, icon: Trophy, color: STATUS_COLORS[poll.status] },
          ].map((s) => (
            <div key={s.label} className="bg-warm-white rounded-2xl border border-clay/30 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                <s.icon size={16} />
              </div>
              <p className="text-xl font-bold text-charcoal font-mono truncate">{s.value}</p>
              <p className="text-xs text-slate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-warm-white rounded-xl border border-clay/30 p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-terracotta text-white shadow-sm" : "text-slate hover:text-charcoal hover:bg-parchment"
              }`}
            >
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === "results" && <LiveResults poll={poll} results={results} />}

            {activeTab === "moderation" && (
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-4">
                <h2 className="font-playfair text-xl font-bold text-charcoal">Moderation Queue</h2>
                {(poll.qaQuestions ?? []).length === 0 ? (
                  <p className="text-slate text-sm">No questions to moderate.</p>
                ) : (
                  <div className="space-y-3">
                    {poll.qaQuestions.map((q) => (
                      <div key={q.id} className="bg-parchment rounded-xl p-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-charcoal">{q.questionText}</p>
                          <p className="text-xs text-slate mt-1">{fmtDate(q.createdAt)} · {q.upvotes} upvotes · {q.status}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="text-sage text-xs px-2"
                            onClick={() => moderateQA(q, "highlight")}>Highlight</Button>
                          <Button size="sm" variant="ghost" className="text-slate text-xs px-2"
                            onClick={() => moderateQA(q, "dismiss")}>Dismiss</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sentiment" && (
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Sentiment Analysis</h2>
                {results?.sentiment ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-charcoal font-playfair">{results.sentiment.score}%</p>
                      <p className="text-slate text-sm mt-1 capitalize">{results.sentiment.label} sentiment</p>
                    </div>
                    <div className="h-3 bg-parchment rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          results.sentiment.label === "positive" ? "bg-sage" :
                          results.sentiment.label === "negative" ? "bg-crimson" : "bg-amber-400"
                        }`}
                        animate={{ width: `${results.sentiment.score}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {["positive", "neutral", "negative"].map((l) => (
                        <div key={l} className={`rounded-xl p-4 text-center ${
                          results.sentiment?.label === l ? "bg-terracotta/10 border-2 border-terracotta/30" : "bg-parchment"
                        }`}>
                          <p className="text-lg">{l === "positive" ? "😊" : l === "negative" ? "😟" : "😐"}</p>
                          <p className="text-xs font-medium text-charcoal capitalize mt-1">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate text-sm">Sentiment data available for word cloud and Q&A polls with open-text responses.</p>
                )}
              </div>
            )}

            {activeTab === "themes" && (
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">AI Theme Clusters</h2>
                {results?.themes?.length ? (
                  <div className="space-y-3">
                    {results.themes.map((t, i) => (
                      <div key={t.label} className="flex items-center gap-4 bg-parchment rounded-xl p-4">
                        <span className="text-sm font-bold text-terracotta w-6">{i + 1}</span>
                        <span className="flex-1 font-medium text-charcoal capitalize">{t.label}</span>
                        <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-terracotta rounded-full"
                            animate={{ width: `${Math.min(100, t.count * 20)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate w-8 text-right">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate text-sm">Themes appear after open-text responses are submitted.</p>
                )}
              </div>
            )}

            {/* qa tab — only rendered when poll.type === "qa" */}
            {activeTab === "qa" && poll.type === "qa" && (
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Q&A Questions</h2>
                <div className="space-y-3">
                  {(results?.questions ?? []).length ? (
                    results!.questions!.map((q, i) => (
                      <div key={q.id} className="bg-parchment rounded-xl p-4 flex justify-between gap-3">
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-terracotta w-5 pt-0.5">{i + 1}</span>
                          <p className="text-sm text-charcoal">{q.questionText}</p>
                        </div>
                        <span className="text-xs font-bold text-terracotta whitespace-nowrap">▲ {q.upvotes}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate text-sm">No questions yet.</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function LiveResults({ poll, results }: { poll: Poll; results: PollResults | null }) {
  if (!results) return <div className="bg-warm-white rounded-2xl border border-clay/30 p-6"><p className="text-slate">Loading results…</p></div>;

  if (poll.type === "multiple_choice") return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Vote Distribution</h2>
      <div className="space-y-4">
        {results.options?.map((r, i) => (
          <div key={r.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-charcoal">{r.text}</span>
              <span className="font-mono text-slate">{r.votes} ({r.pct}%)</span>
            </div>
            <div className="h-5 bg-parchment rounded-full overflow-hidden">
              <motion.div className="h-full bg-terracotta rounded-full" animate={{ width: `${r.pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
            </div>
          </div>
        ))}
        {!results.options?.length && <p className="text-slate text-sm">No votes yet.</p>}
      </div>
    </div>
  );

  if (poll.type === "word_cloud") return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 min-h-56 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
      {results.words?.length
        ? results.words.map((w) => (
            <span key={w.text} className="font-bold text-terracotta" style={{ fontSize: `${Math.min(48, 14 + w.count * 8)}px` }}>{w.text}</span>
          ))
        : <span className="text-slate">Waiting for responses…</span>}
    </div>
  );

  if (poll.type === "rating") {
    const avg = results.average || 0;
    const total = results.totalResponses || 0;
    return (
      <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
        <div className="text-center mb-6">
          <Star className="w-8 h-8 text-terracotta mx-auto mb-2" />
          <p className="text-5xl font-bold text-charcoal font-playfair">{avg.toFixed(1)}</p>
          <p className="text-sm text-slate mt-1">Average · {total} responses</p>
        </div>
        <div className="space-y-2">
          {Object.entries(results.distribution || {}).reverse().map(([val, count]) => {
            const pct = total ? Math.round((count as number) / total * 100) : 0;
            return (
              <div key={val} className="flex items-center gap-3">
                <span className="w-6 text-sm font-mono text-charcoal text-right">{val}</span>
                <div className="flex-1 h-4 bg-parchment rounded-full overflow-hidden">
                  <motion.div className="h-full bg-terracotta rounded-full" animate={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-xs text-slate text-right">{count as number}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (poll.type === "quiz") return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Leaderboard</h2>
      <div className="space-y-3">
        {results.leaderboard?.length ? results.leaderboard.map((row, i) => {
          const medals = ["bg-yellow-100 text-yellow-700", "bg-gray-100 text-gray-600", "bg-amber-100 text-amber-700"];
          return (
            <div key={row.participantId} className="bg-parchment rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${medals[i] || "bg-parchment text-slate"}`}>{i + 1}</div>
                <div>
                  <p className="font-semibold text-charcoal text-sm">{row.name}</p>
                  <p className="text-xs text-slate">{row.correct}/{row.answered} correct</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-charcoal">
                <Trophy size={14} className="text-terracotta" />{row.score}
              </div>
            </div>
          );
        }) : <p className="text-slate text-sm">No submissions yet.</p>}
      </div>
    </div>
  );

  // Q&A
  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">Top Questions</h2>
      <div className="space-y-3">
        {results.questions?.length ? results.questions.map((q, i) => (
          <div key={q.id} className="bg-parchment rounded-xl p-4 flex justify-between gap-3">
            <div className="flex gap-3">
              <span className="text-xs font-bold text-terracotta w-5 pt-0.5">{i + 1}</span>
              <p className="text-sm text-charcoal">{q.questionText}</p>
            </div>
            <span className="text-xs font-bold text-terracotta whitespace-nowrap">▲ {q.upvotes}</span>
          </div>
        )) : <p className="text-slate text-sm">No questions yet.</p>}
      </div>
    </div>
  );
}
