import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import { Users, Wifi, WifiOff, Play, Pause, Square, Maximize2, BarChart2, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { getPoll, getResults } from "@/lib/api";
import { CHART_COLORS, POLL_TYPE_META } from "@/lib/types";
import type { Poll, PollResults } from "@/lib/types";
import { toast } from "sonner";

const PID = "host_" + Math.random().toString(36).slice(2);
const API = (import.meta.env.VITE_API_URL as string) || "";

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll]           = useState<Poll | null>(null);
  const [results, setResults]     = useState<PollResults | null>(null);
  const [participants, setParticipants] = useState(0);
  const [fullscreen, setFullscreen]     = useState(false);
  const [showQR, setShowQR]             = useState(false);

  const { on, connected, participantCount } = useSocket(id || null, "HOST");

  // Load poll
  useEffect(() => {
    if (!id) return;
    getPoll(id).then(d => {
      setPoll(d.poll);
      setParticipants(d.poll?.participants?.length || 0);
    }).catch(console.error);
    getResults(id).then(d => setResults(d.results)).catch(() => {});
  }, [id]);

  // Bind Pusher events
  useEffect(() => {
    const u1 = on("poll:vote", (d: unknown) => {
      const { results: r } = d as { results: PollResults; totalVotes: number };
      setResults(r);
    });
    const u2 = on("participant:joined", (d: unknown) => {
      const { count } = d as { count: number; name: string };
      setParticipants(count);
    });
    const u3 = on("poll:updated", (d: unknown) => {
      const { poll: up } = d as { poll: Poll };
      setPoll(p => p ? { ...p, status: up.status } : p);
    });
    const u4 = on("poll:started", () => setPoll(p => p ? { ...p, status: "live" } : p));
    const u5 = on("poll:ended",   (d: unknown) => {
      const { results: r } = d as { results: PollResults };
      setResults(r);
      setPoll(p => p ? { ...p, status: "closed" } : p);
    });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [on, id]);

  // Sync participantCount from hook
  useEffect(() => {
    if (participantCount > 0) setParticipants(participantCount);
  }, [participantCount]);

  const setStatus = useCallback(async (status: string) => {
    if (!poll) return;
    const endpoint = status === "live" ? "go-live" : status === "paused" ? "pause" : "end";
    try {
      await fetch(API + "/api/polls/" + poll.id + "/" + endpoint, { method: "POST" });
      setPoll(p => p ? { ...p, status: status as Poll["status"] } : p);
    } catch {
      toast.error("Failed to update poll status");
    }
  }, [poll]);

  const copyJoinLink = useCallback(() => {
    if (!poll) return;
    navigator.clipboard.writeText(window.location.origin + "/participate/" + poll.code);
    toast.success("Join link copied!");
  }, [poll]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  if (!poll) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Loading poll...</p>
      </div>
    </div>
  );

  const joinUrl = window.location.origin + "/participate/" + poll.code;
  const meta = POLL_TYPE_META[poll.type as keyof typeof POLL_TYPE_META];

  return (
    <div className={`min-h-screen bg-gray-950 text-white ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
          <span className="text-gray-600">|</span>
          <span className="font-semibold truncate max-w-xs">{poll.title}</span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{meta?.label || poll.type}</span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Users className="w-4 h-4" /> {participants}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowQR(!showQR)} className="border-gray-700">
            <BarChart2 className="w-4 h-4 mr-1" /> QR
          </Button>
          <Button size="sm" variant="outline" onClick={copyJoinLink} className="border-gray-700">
            <Copy className="w-4 h-4 mr-1" /> Copy Link
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen} className="border-gray-700">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Main presenter area */}
        <div className="flex-1 flex flex-col p-8">
          <AnimatePresence mode="wait">
            <motion.div key={poll.status} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{poll.question || poll.title}</h1>
              {poll.description && <p className="text-gray-400 mb-6">{poll.description}</p>}

              {/* Join code display */}
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gray-800 rounded-xl px-6 py-3">
                  <p className="text-xs text-gray-400 mb-1">Join at omnipoll.vercel.app/participate/</p>
                  <p className="text-4xl font-mono font-bold tracking-widest text-teal-400">{poll.code}</p>
                </div>
                {showQR && (
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeCanvas value={joinUrl} size={120} />
                  </div>
                )}
              </div>

              {/* Results */}
              {results && poll.status === "live" && <LiveResults poll={poll} results={results} />}
              {results && poll.status === "closed" && <FinalResults poll={poll} results={results} />}

              {poll.status === "draft" && (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-xl mb-2">Ready to start?</p>
                  <p>Click "Go Live" to begin collecting responses</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side controls */}
        <div className="w-56 border-l border-gray-800 p-4 flex flex-col gap-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Controls</div>
          <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${
            poll.status==="live" ? "bg-green-900 text-green-300" :
            poll.status==="paused" ? "bg-yellow-900 text-yellow-300" :
            poll.status==="closed" ? "bg-red-900 text-red-300" : "bg-gray-800 text-gray-400"
          }`}>{poll.status.toUpperCase()}</div>

          {poll.status === "draft" && (
            <Button onClick={() => setStatus("live")} className="bg-green-600 hover:bg-green-700 w-full">
              <Play className="w-4 h-4 mr-2" /> Go Live
            </Button>
          )}
          {poll.status === "live" && <>
            <Button onClick={() => setStatus("paused")} variant="outline" className="border-yellow-600 text-yellow-400 w-full">
              <Pause className="w-4 h-4 mr-2" /> Pause
            </Button>
            <Button onClick={() => setStatus("closed")} variant="outline" className="border-red-600 text-red-400 w-full">
              <Square className="w-4 h-4 mr-2" /> End Poll
            </Button>
          </>}
          {poll.status === "paused" && <>
            <Button onClick={() => setStatus("live")} className="bg-green-600 hover:bg-green-700 w-full">
              <Play className="w-4 h-4 mr-2" /> Resume
            </Button>
            <Button onClick={() => setStatus("closed")} variant="outline" className="border-red-600 text-red-400 w-full">
              <Square className="w-4 h-4 mr-2" /> End Poll
            </Button>
          </>}

          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-2">Responses</div>
            <div className="text-3xl font-bold text-teal-400">{results?.totalVotes || 0}</div>
          </div>

          <Button asChild variant="outline" size="sm" className="border-gray-700">
            <Link to={"/analytics/" + poll.id}><BarChart2 className="w-4 h-4 mr-1" /> Analytics</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={copyJoinLink} className="border-gray-700">
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}

function LiveResults({ poll, results }: { poll: Poll; results: PollResults }) {
  const { type } = poll;

  if (["multiple_choice","image_choice","true_false","bracket","countdown_vote"].includes(type) && results.options) {
    const data = results.options.map(o => ({ name: o.text || o.emoji || o.id, votes: o.votes, pct: o.pct }));
    return (
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="#666" />
            <YAxis type="category" dataKey="name" stroke="#666" width={120} />
            <Tooltip formatter={(v: number) => [v + " votes"]} />
            <Bar dataKey="votes" radius={[0,4,4,0]}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {results.options?.map((o, i) => (
            <div key={o.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm truncate">{o.text || o.emoji}</span>
              <span className="font-bold text-teal-400">{o.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "word_cloud" || type === "open_text") {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {(results.words || []).slice(0, 40).map((w, i) => (
          <motion.span key={w.text} initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.02}}
            className="bg-gray-800 rounded-lg px-3 py-1 text-sm"
            style={{fontSize: Math.max(12, Math.min(32, 12 + w.count * 4))}}>
            {w.text}
          </motion.span>
        ))}
      </div>
    );
  }

  if (type === "rating" || type === "slider") {
    return (
      <div className="text-center mt-8">
        <div className="text-7xl font-bold text-teal-400">{results.average}</div>
        <p className="text-gray-400 mt-2">Average score • {results.totalVotes} votes</p>
      </div>
    );
  }

  if (type === "nps") {
    return (
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[["NPS", results.npsScore, "teal"],["Promoters", results.promoters, "green"],["Passives", results.passives, "yellow"],["Detractors", results.detractors, "red"]].map(([label, val, color]) => (
          <div key={label as string} className="bg-gray-800 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold text-${color}-400`}>{val}</div>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "emoji_reaction") {
    return (
      <div className="flex gap-6 mt-6 flex-wrap">
        {(results.emojis || []).map(e => (
          <div key={e.id} className="text-center">
            <div className="text-5xl">{e.emoji || e.text}</div>
            <div className="text-2xl font-bold mt-2">{e.count}</div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "ranking" || type === "prioritization") {
    return (
      <div className="space-y-2 mt-4">
        {(results.rankings || []).map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
            <span className="text-2xl font-bold text-gray-500 w-8">#{i+1}</span>
            <span className="flex-1">{r.text}</span>
            <span className="text-teal-400 font-bold">{r.score}pts</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "quiz") {
    return (
      <div className="space-y-2 mt-4">
        <p className="text-gray-400 text-sm mb-3">Leaderboard</p>
        {(results.leaderboard || []).slice(0, 10).map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
            <span className="text-lg font-bold w-6">{i+1}</span>
            <span className="flex-1">{p.name}</span>
            <span className="text-teal-400 font-bold">{p.score}pts</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "qa") {
    return (
      <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
        {(results.questions || []).map(q => (
          <div key={q.id} className={`bg-gray-800 rounded-lg p-3 ${q.starred ? "border border-yellow-500" : ""}`}>
            <p className="text-sm">{q.text}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>👍 {q.upvotes}</span>
              <span>{q.author}</span>
              {q.answered && <span className="text-green-400">✓ Answered</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center mt-8 text-gray-400">
      <p className="text-5xl font-bold text-white">{results.totalVotes}</p>
      <p className="mt-2">responses received</p>
    </div>
  );
}

function FinalResults({ poll, results }: { poll: Poll; results: PollResults }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">POLL ENDED</span>
        <span className="text-gray-400 text-sm">{results.totalVotes} total responses</span>
      </div>
      <LiveResults poll={poll} results={results} />
    </div>
  );
}
