import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Cloud, HelpCircle, Trophy, Star, Zap, Sparkles, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinByCode } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const TYPES = [
  { icon: BarChart3, label:'Multiple Choice', desc:'Real-time vote bars', color:'bg-blue-50 dark:bg-blue-950/40 text-blue-600' },
  { icon: Cloud,     label:'Word Cloud',      desc:'Live word aggregation', color:'bg-sky-50 dark:bg-sky-950/40 text-sky-600' },
  { icon: HelpCircle,label:'Q&A Session',     desc:'Upvote best questions', color:'bg-amber-50 dark:bg-amber-950/40 text-amber-600' },
  { icon: Trophy,    label:'Live Quiz',        desc:'Timed scoring & leaderboard', color:'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700' },
  { icon: Star,      label:'Rating Scale',     desc:'1–10 with distribution', color:'bg-orange-50 dark:bg-orange-950/40 text-orange-600' },
  { icon: Zap,       label:'15 More Types',    desc:'NPS · Matrix · Heatmap…', color:'bg-purple-50 dark:bg-purple-950/40 text-purple-600' },
];

const STATS = [
  { value:'20',   label:'Poll types' },
  { value:'∞',    label:'Participants' },
  { value:'<1s',  label:'Update speed' },
  { value:'Free', label:'To start' },
];

const HOW = [
  { step:'1', title:'Create', desc:'Pick from 20 poll types and set up your question in seconds.' },
  { step:'2', title:'Share',  desc:'Share your 6-char code or link — no app download needed.' },
  { step:'3', title:'Watch',  desc:'Results update live as your audience votes in real-time.' },
];

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) { toast.error('Enter a join code'); return; }
    setLoading(true);
    try {
      const data = await joinByCode(code.trim().toUpperCase()) as { poll: { code: string } };
      navigate(`/participate/${data.poll.code}`);
    } catch { toast.error('Poll not found — check your code'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen mesh-gradient" style={{ background: 'hsl(42,33%,93%)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-warm-white/90 dark:bg-card/90 backdrop-blur border-b border-clay/30 h-14 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-playfair text-xl font-bold text-charcoal dark:text-foreground">
            <span className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-terracotta">Omni</span>Poll
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Dashboard</Link></Button>
                <Button size="sm" asChild><Link to="/create">New Poll</Link></Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
                <Button size="sm" asChild><Link to="/signup">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <div className="inline-flex items-center gap-2 bg-terracotta/10 text-terracotta text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-terracotta/20">
            ✦ Real-time polling for everyone
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-charcoal dark:text-foreground mb-5 leading-tight">
            Engage your audience{' '}
            <span className="text-terracotta italic">live</span>
          </h1>
          <p className="text-slate dark:text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Create polls, quizzes, word clouds, Q&A sessions and 16 more interactive types. Watch results update in real-time.
          </p>
        </motion.div>

        {/* Join code */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-14">
          <Input
            placeholder="Enter join code (e.g. AB12CD)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="flex-1 font-mono tracking-widest uppercase bg-warm-white dark:bg-card border-clay/40 focus:border-terracotta text-center text-lg h-11"
            maxLength={6}
          />
          <Button onClick={handleJoin} disabled={loading} size="lg" className="gap-2">
            {loading ? 'Finding…' : 'Join Poll'} <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-warm-white/70 dark:bg-card/70 rounded-xl border border-clay/20 p-3">
              <div className="font-playfair text-2xl font-bold text-terracotta">{value}</div>
              <div className="text-xs text-slate dark:text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Poll Types */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-playfair text-3xl font-bold text-charcoal dark:text-foreground mb-2">Every type of engagement</h2>
          <p className="text-slate dark:text-muted-foreground">20 poll types built for every audience and moment</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TYPES.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
              className="bg-warm-white dark:bg-card border border-clay/20 rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-charcoal dark:text-foreground text-sm">{label}</div>
                <div className="text-xs text-slate dark:text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-warm-white/60 dark:bg-card/40 border-y border-clay/20 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-charcoal dark:text-foreground mb-2">How it works</h2>
            <p className="text-slate dark:text-muted-foreground">From idea to live poll in under a minute</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW.map(({ step, title, desc }) => (
              <motion.div key={step} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: Number(step) * 0.1 }} className="text-center">
                <div className="w-12 h-12 rounded-full bg-terracotta/10 border-2 border-terracotta/30 text-terracotta font-playfair font-bold text-lg flex items-center justify-center mx-auto mb-4">{step}</div>
                <h3 className="font-playfair font-semibold text-lg text-charcoal dark:text-foreground mb-2">{title}</h3>
                <p className="text-sm text-slate dark:text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <h2 className="font-playfair text-4xl font-bold text-charcoal dark:text-foreground mb-4">Start polling for free</h2>
          <p className="text-slate dark:text-muted-foreground mb-8 text-lg">No credit card. No download. Deploy to Vercel in 2 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="gap-2 px-8">
              <Link to={user ? '/create' : '/signup'}>Create your first poll <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild><Link to="/join">Join with a code</Link></Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-clay/20 bg-warm-white/40 dark:bg-card/40 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-playfair font-bold text-charcoal dark:text-foreground">
            <span className="text-terracotta">Omni</span>Poll
          </div>
          <p className="text-xs text-slate dark:text-muted-foreground">Built with React · Neon PostgreSQL · Pusher · Vercel</p>
          <div className="flex gap-4 text-xs text-slate dark:text-muted-foreground">
            <Link to="/login" className="hover:text-terracotta transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-terracotta transition-colors">Sign Up</Link>
            <Link to="/join" className="hover:text-terracotta transition-colors">Join Poll</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
