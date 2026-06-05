import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import { Users, Wifi, WifiOff, Play, Pause, Square, Maximize2, BarChart2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { getPoll, updatePollStatus } from "@/lib/api";
import { CHART_COLORS, POLL_TYPE_META } from "@/lib/types";
import type { Poll, PollResults } from "@/lib/types";

const PID = "host-" + Math.random().toString(36).slice(2);

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [participants, setParticipants] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { socket, connected } = useSocket(id || null, PID);

  useEffect(() => {
    if (!id) return;
    getPoll(id).then(d => {
      setPoll(d.poll);
      setResults(d.results);
      setParticipants(d.poll?.participants?.length || 0);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("host-join", { pollId: id });
    socket.on("results-update", (r: PollResults) => setResults(r));
    socket.on("participant-joined", ({ count }: { count: number }) => setParticipants(count));
    socket.on("status-changed", ({ status }: { status: string }) => {
      setPoll(p => p ? { ...p, status: status as Poll["status"] } : p);
    });
    return () => { socket.off("results-update"); socket.off("participant-joined"); socket.off("status-changed"); };
  }, [socket, id]);

  const setStatus = async (status: string) => {
    if (!poll) return;
    await updatePollStatus(poll.id, status);
    setPoll(p => p ? { ...p, status: status as Poll["status"] } : p);
    socket?.emit(status === "live" ? "go-live" : status === "paused" ? "pause-poll" : "close-poll", { pollId: poll.id });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  if (!poll) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
  const joinUrl = `${window.location.origin}/participate/${poll.code}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">← Dashboard</Link>
        <div className="flex-1" />
        <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-green-400" : "text-gray-500"}`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? "Live" : "Offline"}
        </div>
        <div className="flex items-center gap-1.5 text-gray-300 text-sm">
          <Users className="w-4 h-4 text-terracotta" />{participants}
        </div>
        <button onClick={() => setShowQR(q => !q)} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Share2 className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Maximize2 className="w-4 h-4 text-gray-400" />
        </button>
        {poll.status === "live"
          ? <Button size="sm" onClick={() => setStatus("paused")} className="gap-1.5 bg-yellow-600 hover:bg-yellow-700"><Pause className="w-3.5 h-3.5" />Pause</Button>
          : poll.status === "paused"
          ? <Button size="sm" onClick={() => setStatus("live")} className="gap-1.5 bg-green-600 hover:bg-green-700"><Play className="w-3.5 h-3.5" />Resume</Button>
          : null}
        <Button size="sm" onClick={() => setStatus("closed")} variant="outline" className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800"><Square className="w-3.5 h-3.5" />End</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main stage */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          {/* Poll info */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl">{meta.icon}</span>
              <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{meta.label}</span>
            </div>
            <h1 className="text-4xl font-playfair font-bold text-white leading-snug max-w-3xl mx-auto">{poll.question}</h1>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-400">
              <span className="font-mono">Code: <strong className="text-terracotta text-lg tracking-widest">{poll.code}</strong></span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${poll.status === "live" ? "bg-green-900 text-green-300" : poll.status === "paused" ? "bg-yellow-900 text-yellow-300" : "bg-gray-800 text-gray-400"}`}>
                {poll.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Result visualization */}
          <div className="flex-1 flex items-center justify-center">
            <ResultRenderer poll={poll} results={results} participants={participants} />
          </div>
        </div>

        {/* QR Panel */}
        <AnimatePresence>
          {showQR && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col items-center justify-center p-6 gap-4 overflow-hidden">
              <p className="text-xs text-gray-400 uppercase tracking-wider text-center">Scan to join</p>
              <div className="bg-white rounded-2xl p-3">
                <QRCodeCanvas value={joinUrl} size={160} fgColor="#D96C4A" bgColor="#ffffff" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Join code</p>
                <p className="text-2xl font-mono font-bold text-terracotta tracking-widest">{poll.code}</p>
              </div>
              <p className="text-xs text-gray-500 text-center break-all">{window.location.origin}/participate/{poll.code}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="h-10 bg-gray-900 border-t border-gray-800 flex items-center px-4 gap-4 text-xs text-gray-500">
        <span><Users className="w-3 h-3 inline mr-1" />{participants} participants</span>
        <span><BarChart2 className="w-3 h-3 inline mr-1" />{results?.totalVotes ?? 0} responses</span>
        {results?.totalVotes && participants
          ? <span>📈 {Math.round(((results.totalVotes) / Math.max(participants,1)) * 100)}% response rate</span>
          : null}
      </div>
    </div>
  );
}

function ResultRenderer({ poll, results, participants }: { poll: Poll; results: PollResults | null; participants: number }) {
  const t = poll.type;
  const r = results;

  if (!r) return <EmptyState />;

  /* ── Multiple Choice / Image Choice / True-False / Bracket / Countdown ── */
  if (["multiple_choice","image_choice","true_false","bracket","countdown_vote","prioritization"].includes(t)) {
    const data = r.options || [];
    if (!data.length) return <EmptyState />;
    return (
      <div className="w-full max-w-2xl space-y-3">
        {data.map((opt, i) => (
          <motion.div key={opt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-200 font-medium">{opt.text}</span>
              <span className="text-gray-400 text-sm">{opt.votes} ({opt.pct}%)</span>
            </div>
            <div className="h-10 bg-gray-800 rounded-lg overflow-hidden">
              <motion.div className="h-full rounded-lg flex items-center pl-3"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                initial={{ width: 0 }} animate={{ width: `${Math.max(opt.pct, opt.votes > 0 ? 4 : 0)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}>
                {opt.pct >= 8 && <span className="text-white text-sm font-bold">{opt.pct}%</span>}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  /* ── Word Cloud ── */
  if (t === "word_cloud") {
    const words = r.words || [];
    if (!words.length) return <EmptyState />;
    const max = words[0]?.count || 1;
    return (
      <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
        {words.slice(0, 40).map((w, i) => (
          <motion.span key={w.text} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03, type: "spring" }}
            className="font-bold rounded-lg px-3 py-1"
            style={{ fontSize: `${Math.max(0.8, (w.count / max) * 2.8)}rem`, color: CHART_COLORS[i % CHART_COLORS.length], background: `${CHART_COLORS[i % CHART_COLORS.length]}22` }}>
            {w.text}
          </motion.span>
        ))}
      </div>
    );
  }

  /* ── Q&A ── */
  if (t === "qa") {
    const qs = r.questions || [];
    return (
      <div className="w-full max-w-2xl space-y-3 max-h-96 overflow-y-auto">
        {qs.length === 0 && <EmptyState label="Questions will appear here" />}
        {qs.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`p-4 rounded-xl border ${q.status === "highlighted" ? "border-yellow-500 bg-yellow-900/30" : q.status === "answered" ? "border-green-500 bg-green-900/20" : "border-gray-700 bg-gray-800/60"}`}>
            <p className="text-white font-medium">{q.questionText}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>👍 {q.upvotes}</span>
              {q.status === "highlighted" && <span className="text-yellow-400">⭐ Featured</span>}
              {q.status === "answered" && <span className="text-green-400">✓ Answered</span>}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  /* ── Quiz Leaderboard ── */
  if (t === "quiz") {
    const lb = r.leaderboard || [];
    if (!lb.length) return <EmptyState label="Complete the quiz to see results" />;
    return (
      <div className="w-full max-w-lg space-y-2">
        {lb.slice(0, 10).map((entry, i) => (
          <motion.div key={entry.participantId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? "bg-yellow-900/40 border border-yellow-600" : i === 1 ? "bg-gray-700/60 border border-gray-500" : i === 2 ? "bg-orange-900/30 border border-orange-700" : "bg-gray-800/60 border border-gray-700"}`}>
            <span className="text-2xl">{["🥇","🥈","🥉"][i] || `${i+1}.`}</span>
            <span className="flex-1 text-white font-semibold">{entry.name}</span>
            <span className="text-terracotta font-bold text-lg">{entry.score}pts</span>
            <span className="text-gray-400 text-xs">{entry.correct}/{entry.answered} ✓</span>
          </motion.div>
        ))}
      </div>
    );
  }

  /* ── Rating / NPS ── */
  if (t === "rating" || t === "nps") {
    const dist = r.distribution || {};
    const data = Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0])).map(([val, count]) => ({ val, count }));
    return (
      <div className="text-center space-y-6 w-full max-w-xl">
        <div>
          <div className="text-8xl font-bold text-terracotta">{r.average}</div>
          <div className="text-gray-400 mt-1">{t === "nps" ? "Net Promoter Score" : "Average Rating"}</div>
        </div>
        {t === "nps" && (
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center"><div className="text-3xl font-bold text-red-400">{r.detractors}</div><div className="text-gray-500">Detractors</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-yellow-400">{r.passives}</div><div className="text-gray-500">Passives</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-green-400">{r.promoters}</div><div className="text-gray-500">Promoters</div></div>
          </div>
        )}
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data}>
              <XAxis dataKey="val" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="text-gray-400 text-sm">{participants} participants</div>
      </div>
    );
  }

  /* ── Slider ── */
  if (t === "slider") {
    return (
      <div className="text-center">
        <div className="text-9xl font-bold text-terracotta">{r.average}</div>
        <div className="text-gray-400 mt-2 text-lg">Average value · {results?.totalVotes ?? 0} responses</div>
      </div>
    );
  }

  /* ── Open Text / Fill Blank ── */
  if (t === "open_text" || t === "fill_blank") {
    const answers = r.answers || r.words?.map(w => w.text) || [];
    return (
      <div className="w-full max-w-xl space-y-2 max-h-96 overflow-y-auto">
        {answers.length === 0 && <EmptyState />}
        {answers.slice(0, 20).map((ans: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200">{ans}</motion.div>
        ))}
      </div>
    );
  }

  /* ── Ranking ── */
  if (t === "ranking") {
    const ranked = r.rankingResults || [];
    return (
      <div className="w-full max-w-lg space-y-2">
        {ranked.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3">
            <span className="w-8 h-8 rounded-full bg-terracotta/20 text-terracotta font-bold flex items-center justify-center">{i+1}</span>
            <span className="flex-1 text-white font-medium">{item.text}</span>
            <span className="text-gray-400 text-sm font-semibold">{item.points}pts</span>
          </motion.div>
        ))}
        {!ranked.length && <EmptyState />}
      </div>
    );
  }

  /* ── Matrix ── */
  if (t === "matrix") {
    const mr = r.matrixResults || {};
    const rows = poll.settings?.matrixRows || [];
    const cols = poll.settings?.matrixColumns || [];
    return (
      <div className="overflow-x-auto w-full max-w-2xl">
        <table className="w-full text-sm">
          <thead><tr><th className="text-left pb-3 text-gray-400 pr-4"></th>
            {cols.map(c => <th key={c.id} className="pb-3 text-center text-gray-300 text-xs font-medium px-2">{c.label}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t border-gray-700">
                <td className="py-3 pr-4 text-gray-200 font-medium">{row.label}</td>
                {cols.map(col => {
                  const count = mr[row.id]?.[col.id] || 0;
                  const max = Math.max(...cols.map(c => mr[row.id]?.[c.id] || 0), 1);
                  return (
                    <td key={col.id} className="text-center py-3 px-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: `rgba(217,108,74,${count/max})`, color: count > 0 ? "white" : "#6b7280" }}>
                          {count}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── Emoji Reaction ── */
  if (t === "emoji_reaction") {
    const counts = r.emojiCounts || {};
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return (
      <div className="flex flex-wrap gap-6 justify-center max-w-lg">
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([emoji, count]) => (
          <motion.div key={emoji} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
            className="text-center">
            <div className="text-5xl mb-1">{emoji}</div>
            <div className="text-white font-bold text-lg">{count}</div>
            <div className="text-gray-400 text-xs">{Math.round((count/total)*100)}%</div>
          </motion.div>
        ))}
        {!Object.keys(counts).length && <EmptyState />}
      </div>
    );
  }

  /* ── Heatmap ── */
  if (t === "heatmap") {
    const points = r.heatmapPoints || [];
    return (
      <div className="space-y-3 text-center">
        <div className="relative inline-block rounded-xl overflow-hidden border border-gray-700">
          <img src={poll.settings?.imageUrl || "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"}
            alt="heatmap" className="max-h-64 object-cover" />
          {points.map((p: { x: number; y: number; count?: number }, i: number) => (
            <div key={i} className="absolute w-5 h-5 rounded-full bg-terracotta/70 border border-white/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%` }} />
          ))}
        </div>
        <p className="text-gray-400 text-sm">{points.length} responses</p>
      </div>
    );
  }

  /* ── Live Matching ── */
  if (t === "live_matching") {
    const mr2 = r.matchingResults || [];
    return (
      <div className="w-full max-w-lg space-y-3">
        {mr2.map((m, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3">
            <span className="bg-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">{m.left}</span>
            <span className="text-terracotta">↔</span>
            <span className="bg-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">{m.right}</span>
            <span className="ml-auto text-xs text-gray-400">{m.correct}/{m.total} correct</span>
          </div>
        ))}
        {!mr2.length && <EmptyState />}
      </div>
    );
  }

  /* ── Fallback pie chart ── */
  const data = r.options || [];
  if (data.length > 0) {
    return (
      <div className="flex items-center gap-8 max-w-xl">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="votes" paddingAngle={3}>
              {data.map((_: unknown, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 flex-1">
          {data.map((opt: { id: string; text: string; votes: number; pct: number }, i: number) => (
            <div key={opt.id} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-gray-200 flex-1">{opt.text}</span>
              <span className="text-gray-400 font-semibold">{opt.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <EmptyState />;
}

function EmptyState({ label = "Waiting for responses…" }: { label?: string }) {
  return (
    <div className="text-center text-gray-600 space-y-3">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
        <BarChart2 className="w-8 h-8" />
      </div>
      <p className="text-lg">{label}</p>
    </div>
  );
}
