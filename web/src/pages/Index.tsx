import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Cloud, HelpCircle, Trophy, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getPollByCode } from "@/lib/api";
import { toast } from "sonner";

const POLL_TYPES = [
  { icon: BarChart3, label: "Multiple Choice", desc: "Real-time vote bars & percentages", color: "bg-terracotta/10 text-terracotta" },
  { icon: Cloud,     label: "Word Cloud",      desc: "Live visual word aggregation",       color: "bg-sage/10 text-sage" },
  { icon: HelpCircle,label: "Q&A Session",     desc: "Questions ranked by upvotes",        color: "bg-amber-100 text-amber-700" },
  { icon: Trophy,    label: "Live Quiz",        desc: "Timed scoring & leaderboard",        color: "bg-blue-50 text-blue-600" },
  { icon: Star,      label: "Rating Scale",     desc: "Customizable 1–10 scale",            color: "bg-purple-50 text-purple-600" },
  { icon: Zap,       label: "AI Insights",      desc: "Sentiment & theme analysis",         color: "bg-pink-50 text-pink-600" },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error("Enter a join code"); return; }
    setJoining(true);
    try {
      const { poll } = await getPollByCode(trimmed);
      navigate(`/poll/${poll.code}`);
    } catch {
      toast.error("Poll not found — check your code");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-warm-white/90 backdrop-blur border-b border-clay/30 h-14 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <span className="font-playfair text-xl font-bold text-charcoal">
            <span className="text-terracotta">Omni</span>Poll
          </span>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="text-slate">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button size="sm" asChild className="bg-terracotta hover:bg-orange-600 text-white">
                  <Link to="/create">New Poll</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-slate">
                  <Link to="/auth?mode=signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="bg-terracotta hover:bg-orange-600 text-white">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-terracotta/10 text-terracotta text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            ✦ Real-time polling for everyone
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-charcoal mb-6 leading-tight">
            Engage your audience{" "}
            <span className="text-terracotta">live</span>
          </h1>
          <p className="text-slate text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Create polls, quizzes, word clouds, and Q&A sessions. Watch results update in real-time.
          </p>
        </motion.div>

        {/* Join code input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-16"
        >
          <Input
            placeholder="Enter join code (e.g. AB12CD)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="flex-1 font-mono tracking-widest uppercase bg-warm-white border-clay/40 focus:border-terracotta text-center"
            maxLength={6}
          />
          <Button onClick={handleJoin} disabled={joining} className="bg-terracotta hover:bg-orange-600 text-white">
            {joining ? "Joining…" : "Join Poll"} <ArrowRight size={14} className="ml-1" />
          </Button>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="font-playfair text-3xl font-bold text-charcoal text-center mb-10">Everything you need</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {POLL_TYPES.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-warm-white rounded-2xl p-6 border border-clay/20 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center mb-3`}>
                <t.icon size={20} />
              </div>
              <h3 className="font-playfair text-lg font-bold text-charcoal mb-1">{t.label}</h3>
              <p className="text-slate text-sm">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-terracotta rounded-3xl p-10 text-center text-white">
          <h2 className="font-playfair text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/80 mb-8 text-lg">Create your first poll in under a minute.</p>
          <Button asChild size="lg" className="bg-warm-white text-terracotta hover:bg-cream font-semibold">
            <Link to={user ? "/create" : "/signup"}>
              Create Your First Poll <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
