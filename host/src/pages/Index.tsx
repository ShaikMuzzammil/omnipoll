import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BarChart3, CheckCircle, ArrowRight, ChevronDown, Sparkles,
  Lightbulb, Share2, BarChart2, Zap, Shield, Users, Bell,
  Globe, GraduationCap, Trophy, Layers, Star, Mail,
  MessageSquare, Activity, Radio, FileText, PieChart,
} from 'lucide-react';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType } from '@/lib/types';

/* ── Data ─────────────────────────────────────────────────────────────────── */
const POLL_TYPES: PollType[] = [
  'multiple_choice','quiz','word_cloud','qa','nps','rating','slider','ranking',
  'matrix','priority','heatmap','emoji','bracket','fill_blank','matching',
  'true_false','image_choice','countdown','series','open_ended',
];
const FEATURES = [
  { icon:Zap,           c:'bg-yellow-100 text-yellow-600', t:'Real-Time Results',    d:'Live vote streaming via Pusher. Responses appear instantly on your presenter screen.' },
  { icon:GraduationCap, c:'bg-blue-100 text-blue-600',     t:'Classroom Management', d:'Create classrooms, invite students with a code and track every student\'s progress.' },
  { icon:BarChart3,     c:'bg-purple-100 text-purple-600', t:'Deep Analytics',       d:'Item-level analysis, score distributions, question difficulty ratings.' },
  { icon:Shield,        c:'bg-green-100 text-green-600',   t:'Answer Key Sheets',    d:'Release results with a full per-answer breakdown — correct vs chosen.' },
  { icon:Users,         c:'bg-terracotta-100 text-terracotta-600', t:'20+ Poll Types', d:'Multiple choice, quizzes, NPS, heatmaps, ranking, matrix grids, word clouds.' },
  { icon:Bell,          c:'bg-pink-100 text-pink-600',     t:'Smart Notifications',  d:'Students get notified the moment you release results.' },
  { icon:Globe,         c:'bg-cyan-100 text-cyan-600',     t:'Join Anywhere',        d:'No app needed. Students join via 6-char code or QR on any device.' },
  { icon:Trophy,        c:'bg-orange-100 text-orange-600', t:'Live Leaderboard',     d:'Quiz mode shows a real-time ranked leaderboard on the presenter screen.' },
  { icon:Layers,        c:'bg-indigo-100 text-indigo-600', t:'Templates Library',    d:'10+ built-in templates for education, business, and events.' },
];
const TESTIMONIALS = [
  { name:'Priya Sharma',   role:'High School Teacher, Delhi',   text:'OmniPoll transformed my classroom. Students are 10× more engaged since I started using quizzes with the live leaderboard.' },
  { name:'Rahul Verma',    role:'Corporate Trainer, Bangalore', text:'The NPS and matrix poll types are exactly what I needed for post-training feedback. Results export perfectly.' },
  { name:'Dr. Anita Nair', role:'College Professor, Chennai',   text:'Key sheets are a game-changer. Students review every answer with explanations right after results are released.' },
];
const BG_ICONS = [
  { Icon:BarChart2,     x:'7%',  y:'18%', s:40, r:-15, o:0.18 },
  { Icon:Radio,         x:'88%', y:'14%', s:34, r:10,  o:0.16 },
  { Icon:FileText,      x:'4%',  y:'58%', s:36, r:-8,  o:0.15 },
  { Icon:PieChart,      x:'92%', y:'52%', s:32, r:12,  o:0.17 },
  { Icon:MessageSquare, x:'14%', y:'80%', s:30, r:-5,  o:0.15 },
  { Icon:Activity,      x:'83%', y:'82%', s:38, r:8,   o:0.16 },
  { Icon:Users,         x:'50%', y:'9%',  s:28, r:0,   o:0.14 },
  { Icon:Zap,           x:'76%', y:'30%', s:26, r:15,  o:0.15 },
  { Icon:Star,          x:'24%', y:'36%', s:24, r:-10, o:0.14 },
  { Icon:Trophy,        x:'62%', y:'72%', s:30, r:5,   o:0.16 },
];
const LIVE_DEMO_DATA = [
  { label:'Product improvements', pct:42, color:'#D96C4A' },
  { label:'Market expansion',     pct:28, color:'#C5813A' },
  { label:'Customer support',     pct:18, color:'#7A8C6E' },
  { label:'Team hiring',          pct:12, color:'#5A9AB5' },
];
const NAV = [['#','Home'],['#demo','Demo'],['#how','How It Works'],['#features','Features'],['#testimonials','Testimonials'],['/contact','Contact']];

const fade = { hidden:{ opacity:0, y:18 }, show:{ opacity:1, y:0 } };
const stagger = { show:{ transition:{ staggerChildren:0.07 } } };

/* ── Animated Demo Widget (image 3) ──────────────────────────────────────── */
function DemoWidget() {
  const [sentiment] = useState(72);
  const [count, setCount]  = useState(247);
  const [bars, setBars]    = useState(LIVE_DEMO_DATA);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-cream-200 overflow-hidden">
      <div className="grid md:grid-cols-[1fr_280px]">
        {/* Left: live results */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-slate-800">What should we prioritize next quarter?</h3>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Live
            </span>
          </div>
          <div className="space-y-4">
            {bars.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <span className="text-slate-500 font-semibold">{item.pct}%</span>
                </div>
                <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration:1.2, delay:i*0.15, ease:'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-5 mt-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Users size={12}/> {count} participants</span>
            <span className="flex items-center gap-1.5"><motion.span animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}>⏱</motion.span> 2m remaining</span>
          </div>
        </div>
        {/* Right: sentiment + themes */}
        <div className="border-t md:border-t-0 md:border-l border-cream-200 p-5 bg-cream-50 space-y-4">
          {/* Sentiment gauge */}
          <div className="bg-white rounded-xl p-4 border border-cream-200">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Sentiment</p>
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 120 70" className="w-32 h-auto">
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#E4CC94" strokeWidth="10" strokeLinecap="round"/>
                <motion.path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#7A8C6E" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray="157" strokeDashoffset="0"
                  initial={{ strokeDashoffset:157 }} animate={{ strokeDashoffset:157*(1-sentiment/100) }}
                  transition={{ duration:1.5, ease:'easeOut' }}/>
                <text x="60" y="62" textAnchor="middle" className="font-bold" fill="#D96C4A" fontSize="16" fontWeight="bold">{sentiment}%</text>
                <text x="60" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8">Positive</text>
              </svg>
            </div>
          </div>
          {/* Top themes */}
          <div className="bg-white rounded-xl p-4 border border-cream-200">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">Top Themes</p>
            <div className="space-y-2">
              {['UX improvements','Global reach','Support scaling'].map((t,i) => (
                <motion.div key={t} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.8+i*0.15 }}
                  className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-2 h-2 bg-terracotta-500 rounded-full flex-shrink-0"/>
                  {t}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function Index() {
  const navigate   = useNavigate();
  const [code, setCode] = useState('');
  const [faq, setFaq]   = useState<number|null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target:heroRef, offset:['start start','end start'] });
  const heroY = useTransform(scrollYProgress, [0,1], ['0%', '18%']);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) navigate(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-cream-100 font-body overflow-x-hidden">

      {/* ── Nav (matching image 2 exactly) ─────────────────────────────── */}
      <motion.nav initial={{ y:-56, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}
        className="fixed top-0 left-0 right-0 z-50 bg-cream-100/88 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
          </Link>
          {/* Center nav */}
          <div className="hidden md:flex items-center gap-0.5 text-sm">
            {NAV.map(([h,l]) => (
              h.startsWith('/') ? (
                <Link key={l} to={h}
                  className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 rounded-lg transition-all font-medium">
                  {l}
                </Link>
              ) : (
                <a key={l} href={h}
                  className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 rounded-lg transition-all font-medium">
                  {l}
                </a>
              )
            ))}
          </div>
          {/* Right */}
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 transition-all">
              Log in
            </Link>
            <Link to="/signup" className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero (image 2) ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden"
        style={{ background:'linear-gradient(160deg, #FDF6EC 0%, #FAF0DC 45%, #F5E6C8 100%)' }}>
        {/* Background floating icons */}
        {BG_ICONS.map(({ Icon, x, y, s, r, o }, i) => (
          <motion.div key={i} className="absolute pointer-events-none"
            style={{ left:x, top:y, opacity:o, transform:`rotate(${r}deg)` }}
            animate={{ y:[0,-10,5,0], rotate:[r,r+4,r-2,r] }}
            transition={{ duration:14+i*1.5, repeat:Infinity, ease:'easeInOut', delay:i*1.1 }}>
            <Icon size={s} className="text-terracotta-500"/>
          </motion.div>
        ))}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage:'radial-gradient(circle, #D96C4A 1px, transparent 1px)', backgroundSize:'36px 36px' }}/>

        <motion.div style={{ y: heroY }} className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fade}
              className="inline-flex items-center gap-2 bg-white/70 border border-terracotta-200 rounded-full px-4 py-1.5 text-xs text-terracotta-700 font-bold mb-8 shadow-sm uppercase tracking-wider">
              <Sparkles size={12}/> AI-Powered Live Engagement
            </motion.div>
            {/* Headline */}
            <motion.h1 variants={fade} className="font-display text-6xl sm:text-7xl font-bold text-slate-800 mb-6 leading-[1.06] tracking-tight">
              Ask. Connect.{' '}
              <span className="text-terracotta-500">Understand.</span>
              <br className="hidden sm:block"/>
              {' '}Instantly.
            </motion.h1>
            <motion.p variants={fade} className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              The live polling platform that feels like paper and thinks like a data scientist.
              Real-time AI clustering, sentiment tracking, and beautiful engagement — for audiences of 10 or 10,000.
            </motion.p>
            {/* CTAs */}
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <Link to="/signup"
                className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Started <ArrowRight size={17}/>
              </Link>
              <form onSubmit={handleJoin}
                className="flex items-center bg-white border-2 border-cream-300 hover:border-terracotta-300 rounded-xl overflow-hidden shadow-sm transition-all">
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="JOIN CODE" maxLength={6}
                  className="px-4 py-3 text-sm font-mono font-bold tracking-[0.25em] text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none w-32"/>
                <button type="submit"
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors">
                  Join
                </button>
              </form>
            </motion.div>
            {/* Trust */}
            <motion.div variants={fade} className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
              {['No credit card','Unlimited polls','Real-time results'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500"/> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:2 }}>
          <ChevronDown size={22} className="text-slate-400"/>
        </motion.div>
      </section>

      {/* ── Demo Section (image 3) ─────────────────────────────────────── */}
      <section id="demo" className="py-20 bg-cream-50 border-y border-cream-300">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fade} className="font-display text-4xl font-bold text-slate-800 mb-3">
              See It In Action
            </motion.h2>
            <motion.p variants={fade} className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Watch as responses flow in real-time. AI clustering groups themes automatically while the sentiment gauge tracks audience mood.
            </motion.p>
          </motion.div>
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
            <DemoWidget />
          </motion.div>
        </div>
      </section>

      {/* ── How It Works (image 4) ─────────────────────────────────────── */}
      <section id="how" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(#D96C4A 1px,transparent 1px),linear-gradient(90deg,#D96C4A 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fade} className="font-display text-4xl font-bold text-slate-800 mb-3">How It Works</motion.h2>
            <motion.p variants={fade} className="text-slate-500">
              From idea to insight in three simple steps. No technical setup, no learning curve.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'1', icon:Lightbulb, title:'Create',  desc:'Build your poll in seconds with our intuitive editor. Choose from multiple formats and customize settings.' },
              { n:'2', icon:Share2,    title:'Share',   desc:'Distribute a simple join code or link. Participants join instantly — no app downloads, no signups required.' },
              { n:'3', icon:BarChart2, title:'Analyze', desc:'Watch results flow in real-time. AI clustering, sentiment analysis, and rich exports deliver instant insights.' },
            ].map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.12 }}
                className="relative bg-cream-50 border border-cream-200 rounded-2xl p-7 text-center hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-terracotta-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {step.n}
                </div>
                <div className="w-14 h-14 bg-terracotta-100 group-hover:bg-terracotta-200 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2 transition-colors">
                  <step.icon size={26} className="text-terracotta-600"/>
                </div>
                <h3 className="font-display font-bold text-slate-800 text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Poll type strip ─────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-y border-cream-300">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-8">
            <motion.div variants={fade} className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-3">
              <Sparkles size={13}/> Every interaction type you'll ever need
            </motion.div>
            <motion.h2 variants={fade} className="font-display text-3xl font-bold text-slate-800">20 powerful poll types</motion.h2>
          </motion.div>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {POLL_TYPES.map((type, i) => (
              <motion.div key={type}
                initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
                transition={{ delay:i*0.02 }} whileHover={{ scale:1.1, y:-3 }}
                className="type-tile flex flex-col items-center gap-1.5 py-3 px-1">
                <span className="text-2xl">{pollTypeIcon(type)}</span>
                <span className="text-[10px] text-slate-600 font-medium leading-tight text-center">{pollTypeLabel(type)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fade} className="font-display text-4xl font-bold text-slate-800 mb-3">Everything you need</motion.h2>
            <motion.p variants={fade} className="text-slate-500">Built for educators, trainers and teams worldwide</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.t}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.06 }} whileHover={{ y:-3 }}
                className="op-card p-6 group">
                <div className={`w-10 h-10 ${f.c} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={20}/>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-2">{f.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 bg-cream-50 border-y border-cream-300">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fade} className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-sm text-yellow-700 font-medium mb-4">
              {[1,2,3,4,5].map(s=><Star key={s} size={11} fill="currentColor"/>)} Loved by educators
            </motion.div>
            <motion.h2 variants={fade} className="font-display text-4xl font-bold text-slate-800">What educators say</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.1 }} className="op-card p-6">
                <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s=><Star key={s} size={14} className="text-yellow-400" fill="currentColor"/>)}</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-terracotta-100 rounded-full flex items-center justify-center text-sm font-bold text-terracotta-700">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bg-terracotta-500 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'22px 22px' }}/>
            <h2 className="font-display text-4xl font-bold text-white mb-4 relative z-10">Ready to Engage Your Audience?</h2>
            <p className="text-terracotta-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
              Join thousands of presenters who use OmniPoll to create memorable, data-driven live experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link to="/signup"
                className="flex items-center gap-2 bg-white hover:bg-cream-100 text-terracotta-600 px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5">
                Create Free Account <ArrowRight size={17}/>
              </Link>
              <Link to="/contact"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 px-7 py-3.5 rounded-xl font-bold text-base transition-all">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center"><BarChart3 size={16}/></div>
                <span className="font-display font-bold text-lg">OmniPoll</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">The most powerful live polling & quiz platform for educators and teams.</p>
            </div>
            {[
              { title:'Product',  links:[['Demo','#demo'],['How It Works','#how'],['Features','#features'],['Testimonials','#testimonials']] },
              { title:'Platform', links:[['For Teachers','/signup'],['For Students','/join'],['Templates','/signup'],['Analytics','/signup']] },
              { title:'Company',  links:[['Contact','/contact'],['Sign Up','/signup'],['Sign In','/login'],['Join a Poll','/join']] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-3 text-white/90">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(([l, h]) => (
                    <li key={l}>
                      {h.startsWith('#')
                        ? <a href={h} className="text-slate-400 hover:text-terracotta-400 text-sm transition-colors">{l}</a>
                        : <Link to={h} className="text-slate-400 hover:text-terracotta-400 text-sm transition-colors">{l}</Link>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} OmniPoll. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="hover:text-terracotta-400 transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-terracotta-400 transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-terracotta-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
