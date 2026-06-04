import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Zap, BarChart3, Users, Globe, Shield, Brain, ArrowRight, Play,
  Star, CheckCircle2, ChevronDown, Sparkles, TrendingUp, Radio
} from "lucide-react";

const POLL_TYPES_PREVIEW = [
  { icon: "📊", name: "Multiple Choice" }, { icon: "☁️", name: "Word Cloud" },
  { icon: "🏆", name: "Live Quiz" }, { icon: "📈", name: "NPS Score" },
  { icon: "🥇", name: "Ranking" }, { icon: "⚖️", name: "Prioritization" },
  { icon: "🏅", name: "Bracket Vote" }, { icon: "😀", name: "Emoji Reaction" },
  { icon: "🔲", name: "Matrix Grid" }, { icon: "📝", name: "Open Text" },
  { icon: "🗺️", name: "Heatmap" }, { icon: "🔗", name: "Live Matching" },
];

const STATS = [
  { label: "Active Polls", value: "50K+", icon: Radio, color: "text-terracotta" },
  { label: "Responses Today", value: "2.4M", icon: TrendingUp, color: "text-sage" },
  { label: "Organizations", value: "12K+", icon: Globe, color: "text-[#7B9EA8]" },
  { label: "Countries", value: "94", icon: Globe, color: "text-[#D4A574]" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Everything",
    description: "Sub-100ms WebSocket updates. Every vote, every question, every emoji reaction — live.",
    color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"
  },
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Sentiment analysis, theme extraction, smart moderation, and AI-generated insights for every session.",
    color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
  },
  {
    icon: BarChart3,
    title: "20 Poll Types",
    description: "From simple multiple choice to bracket tournaments, heatmaps, NPS, and live matching — all built in.",
    color: "bg-terracotta/10 text-terracotta"
  },
  {
    icon: Users,
    title: "50K Concurrent",
    description: "Designed for scale. Handle thousands of simultaneous participants in a single session.",
    color: "bg-sage/10 text-sage"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SSO, SAML, HIPAA-compliant mode, GDPR tools, audit logs, and data residency options.",
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
  },
  {
    icon: Globe,
    title: "Domain Modules",
    description: "Specialized toolsets for Education, Healthcare, Events, Research, HR, and more.",
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
  },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Head of L&D, Stripe", quote: "OmniPoll transformed our all-hands. 3,000 employees voting in real-time with zero lag.", avatar: "SC" },
  { name: "Dr. Marcus Webb", role: "Professor, MIT", quote: "The quiz and bracket types keep students genuinely engaged. Completion rates went from 60% to 94%.", avatar: "MW" },
  { name: "Priya Sharma", role: "Event Director, TED", quote: "We ran 40,000-person Q&A sessions with AI moderation. Game-changing for large events.", avatar: "PS" },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#12151C] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-clay/10 dark:border-white/5 bg-cream/80 dark:bg-[#12151C]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center">
              <Radio size={16} className="text-white" />
            </div>
            <span className="font-playfair text-xl font-bold text-charcoal dark:text-white">OmniPoll</span>
            <span className="text-xs font-bold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">2.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate dark:text-gray-400">
            <Link to="/pricing" className="hover:text-charcoal dark:hover:text-white transition-colors">Pricing</Link>
            <a href="#features" className="hover:text-charcoal dark:hover:text-white transition-colors">Features</a>
            <a href="#domains" className="hover:text-charcoal dark:hover:text-white transition-colors">Domains</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition-colors px-3 py-2">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.section style={{ y: heroY, opacity: heroOpacity }} className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-sage/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-terracotta/10 text-terracotta px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Sparkles size={14} />
              20 Poll Types · Real-Time · AI-Powered
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-playfair text-5xl md:text-7xl font-bold text-charcoal dark:text-white leading-tight mb-6"
          >
            The Live Polling
            <br />
            <span className="text-terracotta">Platform That</span>
            <br />
            <span className="gradient-text">Thinks With You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl text-slate dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time polls, Q&A, quizzes, and 16 more interaction types — with live sentiment analysis,
            AI moderation, and analytics that actually mean something.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup" className="btn-primary flex items-center gap-2 justify-center text-base px-8 py-3.5">
              Start Free — No Card Required <ArrowRight size={18} />
            </Link>
            <Link to="/join" className="btn-outline flex items-center gap-2 justify-center text-base">
              <Play size={16} /> Join a Poll
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-3xl font-bold font-playfair ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-slate dark:text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="text-slate/40" size={24} />
        </motion.div>
      </motion.section>

      {/* Poll Types Marquee */}
      <section className="py-12 border-y border-clay/10 dark:border-white/5 overflow-hidden bg-warm-white dark:bg-[#1a1e28]">
        <div className="flex gap-4 animate-[marquee_30s_linear_infinite]" style={{ width: "200%" }}>
          {[...POLL_TYPES_PREVIEW, ...POLL_TYPES_PREVIEW].map((t, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0 bg-parchment dark:bg-white/5 rounded-xl px-4 py-2.5 border border-clay/20 dark:border-white/10">
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-medium text-charcoal dark:text-gray-200 whitespace-nowrap">{t.name}</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-charcoal dark:text-white mb-4">Everything You Need</h2>
            <p className="text-slate dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Built for the most demanding live sessions — from 10-person team meetings to 50,000-person conferences.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="card p-6"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-playfair text-xl font-bold text-charcoal dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate dark:text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Domain Modules */}
      <section id="domains" className="py-24 px-6 bg-warm-white dark:bg-[#1a1e28]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-charcoal dark:text-white mb-4">Built for Your Domain</h2>
            <p className="text-slate dark:text-gray-400 text-lg">Specialized toolsets, templates, and compliance modes for every industry.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: "🎓", title: "Education", desc: "LMS integration, attendance tracking, quiz grading, student roster, learning objectives" },
              { emoji: "🏥", title: "Healthcare", desc: "HIPAA-compliant mode, de-identified responses, BAA support, clinical survey templates" },
              { emoji: "🎪", title: "Events", desc: "Session management, speaker controls, event schedule, sponsor displays, live bracket" },
              { emoji: "🔬", title: "Research", desc: "Statistical analysis, SPSS/R/Python export, IRB compliance mode, cohort tracking" },
              { emoji: "👥", title: "HR & People", desc: "Employee feedback cycles, sentiment trending, anonymous reporting, team pulse" },
              { emoji: "📊", title: "Sales & Marketing", desc: "Customer NPS, product feedback, market research, live audience segmentation" },
            ].map((d, i) => (
              <motion.div key={d.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="card p-5 hover:border-terracotta/30 cursor-pointer group transition-all">
                <div className="text-3xl mb-3">{d.emoji}</div>
                <h3 className="font-semibold text-charcoal dark:text-white mb-1 group-hover:text-terracotta transition-colors">{d.title}</h3>
                <p className="text-sm text-slate dark:text-gray-400">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-charcoal dark:text-white text-center mb-16">Trusted by Teams Worldwide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-6">
                <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-sm text-slate dark:text-gray-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-sm text-charcoal dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-terracotta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">Ready to Go Live?</h2>
          <p className="text-white/80 text-lg mb-8">Start for free. No credit card. Your first poll in under 60 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-terracotta font-bold px-8 py-3.5 rounded-xl hover:bg-cream transition-colors inline-flex items-center gap-2">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/join" className="border-2 border-white/40 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Join a Live Poll
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white/60 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-terracotta rounded-lg flex items-center justify-center">
              <Radio size={14} className="text-white" />
            </div>
            <span className="font-playfair text-lg font-bold text-white">OmniPoll 2.0</span>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-sm mb-8">
            {[
              { title: "Product", links: ["Features", "Pricing", "Templates", "Changelog"] },
              { title: "Domain", links: ["Education", "Healthcare", "Events", "Research"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-3">{col.title}</h4>
                <div className="space-y-2">{col.links.map((l) => <a key={l} href="#" className="block hover:text-white transition-colors">{l}</a>)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 OmniPoll. All rights reserved.</p>
            <div className="flex gap-4">
              {["Twitter", "GitHub", "LinkedIn", "Discord"].map((s) => <a key={s} href="#" className="hover:text-white transition-colors">{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
