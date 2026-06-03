import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3, Users, TrendingUp, ShieldAlert, MessageSquare,
  Cloud, Play, Square, Copy, Check, AlertTriangle, Clock,
  Download, Maximize2, Minimize2, Zap, Volume2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";

interface VoteData {
  option: string;
  count: number;
  color: string;
}

interface WordData {
  text: string;
  size: number;
}

interface QAItem {
  id: string;
  text: string;
  upvotes: number;
  approved: boolean;
}

export default function Present() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connected } = useSocket();
  const [isLive, setIsLive] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "sentiment" | "themes" | "moderation">("results");
  const [sentiment, setSentiment] = useState(72);
  const [attention, setAttention] = useState(87);
  const [showAlert, setShowAlert] = useState(false);
  const [participantCount, setParticipantCount] = useState(247);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const code = "OMNI-7842";

  const [votes, setVotes] = useState<VoteData[]>([
    { option: "Product improvements", count: 102, color: "bg-terracotta" },
    { option: "Market expansion", count: 68, color: "bg-[#D4A574]" },
    { option: "Customer support", count: 44, color: "bg-sage" },
    { option: "Team hiring", count: 33, color: "bg-[#7B9EA8]" },
  ]);

  const words: WordData[] = [
    { text: "innovation", size: 32 }, { text: "growth", size: 28 }, { text: "customers", size: 24 },
    { text: "quality", size: 22 }, { text: "speed", size: 20 }, { text: "collaboration", size: 18 },
    { text: "UX", size: 26 }, { text: "AI", size: 30 }, { text: "global", size: 16 },
    { text: "sustainability", size: 14 }, { text: "trust", size: 18 }, { text: "data", size: 20 },
  ];

  const [qaItems] = useState<QAItem[]>([
    { id: "1", text: "When will the new mobile app be released?", upvotes: 24, approved: true },
    { id: "2", text: "Can we prioritize API documentation improvements?", upvotes: 18, approved: true },
    { id: "3", text: "What's the timeline for international expansion?", upvotes: 15, approved: true },
  ]);

  const themes = [
    { label: "Product Velocity", count: 89, examples: ["Faster releases", "Better CI/CD", "Automated testing"] },
    { label: "Customer Experience", count: 67, examples: ["Onboarding flow", "Support chat", "Documentation"] },
    { label: "Team Growth", count: 45, examples: ["Hiring engineers", "Remote culture", "Learning budget"] },
  ];

  const totalVotes = votes.reduce((s, v) => s + v.count, 0);

  useEffect(() => {
    if (!isLive) return;
    timerRef.current = setInterval(() => {
      setVotes((prev) =>
        prev.map((v) => ({
          ...v,
          count: v.count + Math.floor(Math.random() * 3),
        }))
      );
      setParticipantCount((p) => p + Math.floor(Math.random() * 2));
      setSentiment((s) => Math.max(40, Math.min(95, s + (Math.random() - 0.5) * 4)));
      setAttention((a) => {
        const next = Math.max(50, Math.min(100, a + (Math.random() - 0.5) * 3));
        if (next < 65) setShowAlert(true);
        else setShowAlert(false);
        return next;
      });
    }, 2000);
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 glass border-b border-clay/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="text-slate hover:text-charcoal">
              <BarChart3 size={20} />
            </button>
            <div>
              <h1 className="font-playfair text-lg font-bold text-charcoal">What should we prioritize next quarter?</h1>
              <div className="flex items-center gap-3 text-xs text-slate">
                <span className="flex items-center gap-1"><Users size={10} /> {participantCount} participants</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {isLive ? "Live" : "Ended"}</span>
                {connected && <span className="flex items-center gap-1 text-sage"><Zap size={10} /> Connected</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-cream rounded-lg px-3 py-1.5 border border-clay/40">
              <span className="text-xs text-slate">Code:</span>
              <span className="font-mono text-sm font-bold text-charcoal">{code}</span>
              <button onClick={copyCode} className="text-slate hover:text-terracotta transition-colors">
                {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
              </button>
            </div>
            <Button size="sm" onClick={() => setIsLive(!isLive)} className={isLive ? "bg-crimson hover:bg-crimson/90 text-white" : "bg-sage hover:bg-sage/90 text-white"}>
              {isLive ? <><Square size={14} className="mr-1" /> End</> : <><Play size={14} className="mr-1" /> Start</>}
            </Button>
            <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-slate hover:text-charcoal">
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Attention Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            className="bg-crimson/10 border border-crimson/20 px-4 py-2 flex items-center justify-center gap-2 text-crimson text-sm"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <AlertTriangle size={16} />
            <span>Attention dropped to {Math.round(attention)}%. Try a quick poll to re-engage!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-warm-white rounded-xl border border-clay/30 p-1">
            {(["results", "sentiment", "themes", "moderation"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? "bg-terracotta text-white shadow-sm" : "text-slate hover:text-charcoal hover:bg-cream"
                }`}
              >
                {tab === "qa" ? "Q&A" : tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Live Results</h2>
                <div className="space-y-5">
                  {votes.map((v, i) => {
                    const pct = totalVotes > 0 ? (v.count / totalVotes) * 100 : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-charcoal">{v.option}</span>
                          <span className="font-mono text-slate">{v.count} votes ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-4 bg-cream rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${v.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate mt-6 text-center">{totalVotes} total votes &middot; Updating live</p>
              </motion.div>
            )}

            {activeTab === "sentiment" && (
              <motion.div key="sentiment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">Sentiment & Attention</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-xs text-slate uppercase tracking-wide mb-4">Sentiment</p>
                    <div className="relative h-40 flex items-center justify-center">
                      <svg viewBox="0 0 120 70" className="w-full max-w-[200px]">
                        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#E5DDD3" strokeWidth="10" strokeLinecap="round" />
                        <motion.path
                          d="M10,60 A50,50 0 0,1 110,60"
                          fill="none"
                          stroke="#87A878"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${sentiment * 1.57} 157`}
                          initial={{ strokeDasharray: "0 157" }}
                          animate={{ strokeDasharray: `${sentiment * 1.57} 157` }}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <div className="absolute bottom-4 text-center">
                        <motion.span className="text-3xl font-bold text-sage" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                          {Math.round(sentiment)}%
                        </motion.span>
                        <p className="text-xs text-slate">Positive</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate uppercase tracking-wide mb-4">Attention</p>
                    <div className="relative h-40 flex items-center justify-center">
                      <svg viewBox="0 0 120 70" className="w-full max-w-[200px]">
                        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#E5DDD3" strokeWidth="10" strokeLinecap="round" />
                        <motion.path
                          d="M10,60 A50,50 0 0,1 110,60"
                          fill="none"
                          stroke={attention < 65 ? "#C95E5E" : attention < 80 ? "#D4A574" : "#87A878"}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${attention * 1.57} 157`}
                          initial={{ strokeDasharray: "0 157" }}
                          animate={{ strokeDasharray: `${attention * 1.57} 157` }}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <div className="absolute bottom-4 text-center">
                        <span className={`text-3xl font-bold ${attention < 65 ? "text-crimson" : attention < 80 ? "text-[#D4A574]" : "text-sage"}`}>
                          {Math.round(attention)}%
                        </span>
                        <p className="text-xs text-slate">Engaged</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "themes" && (
              <motion.div key="themes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal mb-6">AI-Detected Themes</h2>
                <div className="space-y-4">
                  {themes.map((theme, i) => (
                    <motion.div
                      key={theme.label}
                      className="bg-cream rounded-xl p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-charcoal">{theme.label}</h3>
                        <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full font-medium">{theme.count} mentions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {theme.examples.map((ex) => (
                          <span key={ex} className="text-xs bg-warm-white border border-clay/30 px-2 py-1 rounded-md text-slate">{ex}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-xs text-slate uppercase tracking-wide mb-3">Live Word Cloud</p>
                  <div className="bg-cream rounded-xl p-6 min-h-[180px] flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
                    {words.map((word, i) => (
                      <motion.span
                        key={word.text}
                        className="text-terracotta font-medium cursor-default select-none"
                        style={{ fontSize: word.size }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: i * 0.08 }}
                        whileHover={{ scale: 1.2 }}
                      >
                        {word.text}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "moderation" && (
              <motion.div key="moderation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-warm-white rounded-xl border border-clay/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-playfair text-xl font-bold text-charcoal">Moderation Queue</h2>
                  <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-1 rounded-full font-medium">3 pending</span>
                </div>
                <div className="space-y-3">
                  {[
                    { text: "Why is the focus on enterprise features rather than consumer needs?", score: 0.45 },
                    { text: "The new dashboard is confusing to navigate", score: 0.32 },
                    { text: "Can we get dark mode support please?", score: 0.12 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="bg-cream rounded-xl p-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div>
                        <p className="text-sm text-charcoal">{item.text}</p>
                        <p className="text-xs text-slate mt-1">Toxicity: {(item.score * 100).toFixed(0)}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-sage/10 text-sage text-xs font-medium hover:bg-sage/20 transition-colors">Approve</button>
                        <button className="px-3 py-1.5 rounded-lg bg-crimson/10 text-crimson text-xs font-medium hover:bg-crimson/20 transition-colors">Reject</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-warm-white rounded-xl border border-clay/30 p-5">
            <h3 className="font-semibold text-charcoal text-sm mb-3">Q&A Feed</h3>
            <div className="space-y-3">
              {qaItems.map((qa) => (
                <div key={qa.id} className="bg-cream rounded-lg p-3">
                  <p className="text-sm text-charcoal">{qa.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate">
                    <TrendingUp size={10} /> {qa.upvotes} upvotes
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-warm-white rounded-xl border border-clay/30 p-5">
            <h3 className="font-semibold text-charcoal text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full border-clay/60 text-slate text-sm justify-start" onClick={() => {}}>
                <Download size={14} className="mr-2" /> Export CSV
              </Button>
              <Button variant="outline" className="w-full border-clay/60 text-slate text-sm justify-start" onClick={() => {}}>
                <Volume2 size={14} className="mr-2" /> Announcement
              </Button>
              <Button variant="outline" className="w-full border-clay/60 text-slate text-sm justify-start" onClick={() => {}}>
                <Eye size={14} className="mr-2" /> Embed Widget
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
