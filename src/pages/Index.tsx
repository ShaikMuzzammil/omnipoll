import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Zap, Shield, Users, ChevronRight, CheckCircle,
  Globe, GraduationCap, ArrowRight, Sparkles, BookOpen,
  Trophy, Clock, TrendingUp, Bell, Layers, Star, Mail,
  MessageSquare, Phone, Send, User, ChevronDown,
  BarChart2, Radio, FileText, PieChart, Activity,
} from 'lucide-react';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType } from '@/lib/types';

/* ── data ───────────────────────────────────────────────────────────────────── */
const POLL_TYPES: PollType[] = [
  'multiple_choice','quiz','word_cloud','qa','nps','rating',
  'slider','ranking','matrix','priority','heatmap','emoji',
  'bracket','fill_blank','matching','true_false','image_choice',
  'countdown','series','open_ended',
];

const FEATURES = [
  { icon: Zap,           color:'bg-yellow-100 text-yellow-600', title:'Real-Time Results',    desc:'Live vote streaming via Pusher. Responses appear instantly on your presenter screen as students submit.' },
  { icon: GraduationCap, color:'bg-blue-100 text-blue-600',     title:'Classroom Management', desc:'Create classrooms, invite students, assign polls and track every student\'s progress.' },
  { icon: BarChart3,     color:'bg-purple-100 text-purple-600', title:'Deep Analytics',       desc:'Item-level analysis, score distributions, question difficulty ratings and submission timelines.' },
  { icon: Shield,        color:'bg-green-100 text-green-600',   title:'Answer Key Sheets',    desc:'Release results with a full per-answer breakdown — what students chose vs what was correct.' },
  { icon: Users,         color:'bg-terracotta-100 text-terracotta-600', title:'20+ Poll Types', desc:'Multiple choice, quizzes, NPS, heatmaps, ranking, matrix grids, word clouds, Q&A and more.' },
  { icon: Bell,          color:'bg-pink-100 text-pink-600',     title:'Smart Notifications',  desc:'Students get notified the moment you release results. Teachers see live participant counts.' },
  { icon: Globe,         color:'bg-cyan-100 text-cyan-600',     title:'Join Anywhere',        desc:'No app needed. Students join via 6-char code or QR code on any device — guest mode too.' },
  { icon: Trophy,        color:'bg-orange-100 text-orange-600', title:'Live Leaderboard',     desc:'Quiz mode shows a real-time ranked leaderboard on the presenter screen. Gamify instantly.' },
  { icon: Layers,        color:'bg-indigo-100 text-indigo-600', title:'Templates Library',    desc:'10+ built-in templates for education, business, and events. Save any poll as reusable.' },
];

const HOW = [
  { n:'01', icon: BarChart3,  title:'Create',  desc:'Pick from 20 poll types, add questions and settings in the 5-step wizard. Ready in under 2 minutes.' },
  { n:'02', icon: Globe,      title:'Share',   desc:'Show your 6-char code or QR. Students join on any device — no app, no account required.' },
  { n:'03', icon: TrendingUp, title:'Analyse', desc:'Watch live results, present on screen, deep-dive into analytics and release key sheets to students.' },
];

const TESTIMONIALS = [
  { name:'Priya Sharma',   role:'High School Teacher, Delhi',   text:'OmniPoll transformed my classroom. Students are 10x more engaged since I started using quizzes with the live leaderboard.' },
  { name:'Rahul Verma',    role:'Corporate Trainer, Bangalore', text:'The NPS and matrix poll types are exactly what I needed for post-training feedback. Results export perfectly.' },
  { name:'Dr. Anita Nair', role:'College Professor, Chennai',   text:'Key sheets are a game-changer. Students review every answer with explanations right after results are released.' },
];

const FAQ = [
  { q:'Do students need to create an account?',      a:'No — students join as a guest with just their name. Creating an account lets them track results and key sheets.' },
  { q:'Is there a participant limit?',               a:'The free plan supports unlimited participants per poll. No caps, no paywalls on core features.' },
  { q:'How does real-time work?',                    a:'We use Pusher Channels — votes appear on the presenter screen in under 1 second without page refresh.' },
  { q:'How do I release results to students?',       a:'After closing a poll, click "Release Results". Students get an in-app notification and view their key sheet immediately.' },
  { q:'Can I use OmniPoll for competitive exams?',   a:'Yes. Quiz mode supports timers, negative marking, shuffle, tab-switch detection, and auto-submit on timeout.' },
];

/* ── Background floating icons (like image 2) ───────────────────────────────── */
const BG_ICONS = [
  { Icon: BarChart2,    x:'8%',  y:'15%', size:36, rot:-15, op:0.08 },
  { Icon: Radio,        x:'88%', y:'12%', size:28, rot:10,  op:0.07 },
  { Icon: FileText,     x:'5%',  y:'55%', size:32, rot:-8,  op:0.06 },
  { Icon: PieChart,     x:'92%', y:'50%', size:30, rot:12,  op:0.07 },
  { Icon: MessageSquare,x:'15%', y:'82%', size:26, rot:-5,  op:0.06 },
  { Icon: Activity,     x:'82%', y:'80%', size:34, rot:8,   op:0.07 },
  { Icon: Users,        x:'50%', y:'8%',  size:22, rot:0,   op:0.05 },
  { Icon: Zap,          x:'75%', y:'28%', size:20, rot:15,  op:0.06 },
  { Icon: Star,         x:'25%', y:'35%', size:18, rot:-10, op:0.05 },
  { Icon: Trophy,       x:'60%', y:'70%', size:24, rot:5,   op:0.06 },
];

const fadeUp = { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0 } };
const stagger = { show:{ transition:{ staggerChildren:0.08 } } };

/* ── Contact form ────────────────────────────────────────────────────────────── */
function ContactSection() {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({ name:'', email:'', subject:'General Question', message:'' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const subjects = ['General Question','Feature Request','Bug Report','Partnership','Billing','Other'];

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <section id="contact" className="py-24 bg-white border-y border-cream-300">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-4">
            <Mail size={13}/> Get in Touch
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Get in Touch</motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500">
            Have questions? We'd love to hear from you. Your message will be sent directly to our team.
          </motion.p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[1,2,3].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step >= s ? 'bg-terracotta-500 border-terracotta-500 text-white' : 'border-cream-400 text-slate-400'
              }`}>{s}</div>
              {i < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-terracotta-400' : 'bg-cream-300'} transition-colors`}/>}
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="op-card p-7">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500"/>
                </div>
                <h3 className="font-display font-bold text-slate-800 text-xl mb-2">Message Sent!</h3>
                <p className="text-slate-500 text-sm">We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
                <button onClick={() => { setSent(false); setStep(1); setForm({ name:'', email:'', subject:'General Question', message:'' }); }}
                  className="mt-5 text-sm text-terracotta-600 font-medium hover:text-terracotta-700">Send another message →</button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
                <h3 className="font-display font-semibold text-slate-700 mb-4">Your details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"><User size={13}/> Your Name</label>
                    <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Enter your name"
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"><Mail size={13}/> Your Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"><MessageSquare size={13}/> Message</label>
                  <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} rows={4} placeholder="Tell us what's on your mind..."
                    className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 resize-none"/>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <Shield size={14} className="flex-shrink-0 mt-0.5"/>
                  Your message will be sent to our host team. We'll reply to the email address you provide above.
                </div>
                <button onClick={() => { if(form.name && form.email && form.message) setStep(2); }}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white py-3 rounded-xl font-semibold text-sm transition-all">
                  Review Message <ArrowRight size={15}/>
                </button>
              </motion.div>
            ) : step === 2 ? (
              <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
                <h3 className="font-display font-semibold text-slate-700 mb-1">Select a topic</h3>
                <p className="text-sm text-slate-500 mb-4">Help us route your message to the right team</p>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map(s => (
                    <button key={s} onClick={() => setForm(f=>({...f,subject:s}))}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 text-left transition-all ${form.subject===s ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700' : 'border-cream-300 text-slate-600 hover:border-terracotta-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-all">← Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all">Continue →</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="step3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
                <h3 className="font-display font-semibold text-slate-700 mb-1">Confirm & Send</h3>
                <div className="space-y-2 p-4 bg-cream-50 rounded-xl text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Topic</span><span className="font-medium text-slate-800">{form.subject}</span></div>
                  <div className="pt-2 border-t border-cream-200"><p className="text-slate-500 mb-1">Message</p><p className="text-slate-700 leading-relaxed">{form.message}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-all">← Edit</button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-all">
                    {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send size={14}/>}
                    {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact options */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { icon: Mail,  label:'Email Us',   val:'hello@omnipoll.app' },
            { icon: Phone, label:'Response',   val:'Within 24 hours' },
            { icon: Globe, label:'Based in',   val:'India 🇮🇳' },
          ].map(c => (
            <div key={c.label} className="text-center p-3 bg-white border border-cream-300 rounded-xl">
              <c.icon size={16} className="text-terracotta-500 mx-auto mb-1.5"/>
              <p className="text-xs font-semibold text-slate-700">{c.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.val}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function Index() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [joinCode, setJoinCode] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset:['start start','end start'] });
  const heroY  = useTransform(scrollYProgress, [0,1], ['0%','20%']);
  const heroOp = useTransform(scrollYProgress, [0,0.7], [1,0]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length >= 4) navigate(`/join/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-cream-100 font-body overflow-x-hidden">

      {/* ── Nav (matching image 2) ─────────────────────────────────────── */}
      <motion.nav initial={{ y:-56, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.45 }}
        className="fixed top-0 left-0 right-0 z-50 bg-cream-100/85 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center group-hover:bg-terracotta-600 transition-colors shadow-sm">
              <BarChart3 size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
          </Link>
          <div className="hidden md:flex items-center gap-0.5 text-sm">
            {[['#','Home'],['#features','Features'],['#how','How It Works'],['#features','Features'],['#testimonials','Testimonials'],['#contact','Contact']].map(([h,l]) => (
              <a key={l} href={h}
                className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 hover:bg-terracotta-50/60 rounded-lg transition-all font-medium">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg transition-all">
              Log in
            </Link>
            <Link to="/signup"
              className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero (image 2 style) ───────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden bg-gradient-to-b from-cream-200 via-cream-100 to-cream-100">
        {/* Background floating icons */}
        {BG_ICONS.map(({ Icon, x, y, size, rot, op }, i) => (
          <motion.div key={i}
            className="absolute pointer-events-none"
            style={{ left:x, top:y, opacity:op, transform:`rotate(${rot}deg)` }}
            animate={{ y:[0,-12,6,0], rotate:[rot, rot+5, rot-3, rot] }}
            transition={{ duration:12+i*2, repeat:Infinity, ease:'easeInOut', delay:i*1.2 }}
          >
            <Icon size={size} className="text-terracotta-400"/>
          </motion.div>
        ))}
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage:'radial-gradient(circle, #D96C4A 1px, transparent 1px)', backgroundSize:'40px 40px' }}/>

        <motion.div style={{ y:heroY, opacity:heroOp }} className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-terracotta-200 rounded-full px-4 py-1.5 text-xs text-terracotta-700 font-semibold mb-8 shadow-sm uppercase tracking-wider">
              <Sparkles size={12}/> AI-Powered Live Engagement
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="font-display text-6xl sm:text-7xl font-bold text-slate-800 mb-6 leading-[1.08] tracking-tight">
              Ask. Connect.{' '}
              <span className="text-terracotta-500">Understand.</span>
              <br/>Instantly.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              The live polling platform that feels like paper and thinks like a data scientist.
              Real-time results, sentiment tracking, and beautiful engagement — for audiences of 10 or 10,000.
            </motion.p>

            {/* CTAs with inline join code (image 2 style) */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link to="/signup"
                className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Started <ArrowRight size={17}/>
              </Link>
              <form onSubmit={handleJoin} className="flex items-center bg-white border-2 border-cream-300 hover:border-terracotta-300 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                <input
                  value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="JOIN CODE"
                  maxLength={6}
                  className="px-4 py-3 text-sm font-mono font-bold tracking-[0.2em] text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none w-32"
                />
                <button type="submit"
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors">
                  Join
                </button>
              </form>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 text-sm text-slate-500">
              {['No credit card','Unlimited polls','Real-time results'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500"/> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll caret */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:2 }}>
          <ChevronDown size={22} className="text-slate-400"/>
        </motion.div>
      </section>

      {/* ── Poll type grid ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-cream-300 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-10">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-4">
              <Sparkles size={13}/> Every interaction type you'll ever need
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold text-slate-800">20 powerful poll types</motion.h2>
          </motion.div>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {POLL_TYPES.map((type, i) => (
              <motion.div key={type}
                initial={{ opacity:0, scale:0.8 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
                transition={{ delay:i*0.025 }} whileHover={{ scale:1.1, y:-3 }}
                className="type-tile flex flex-col items-center gap-1.5 py-3 px-1">
                <span className="text-2xl">{pollTypeIcon(type)}</span>
                <span className="text-[10px] text-slate-600 font-medium leading-tight text-center">{pollTypeLabel(type)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(#D96C4A 1px,transparent 1px),linear-gradient(90deg,#D96C4A 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-4">
              <Zap size={13}/> Built for educators &amp; teams
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Everything you need</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 max-w-xl mx-auto">Engage your audience, run quizzes, and measure outcomes — all in one platform.</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.06 }} whileHover={{ y:-4 }}
                className="op-card p-6 group">
                <div className={`w-11 h-11 ${f.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={21}/>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:'radial-gradient(circle, #D96C4A 1px, transparent 1px)', backgroundSize:'30px 30px' }}/>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 font-medium mb-4">
              <Clock size={13}/> Up and running in 60 seconds
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-white mb-3">Simple. Powerful. Fast.</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-0.5 bg-gradient-to-r from-terracotta-500 via-terracotta-400 to-terracotta-500 opacity-30"/>
            {HOW.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.15 }} className="text-center">
                <motion.div whileHover={{ scale:1.1, rotate:5 }}
                  className="w-20 h-20 bg-terracotta-500 rounded-3xl flex flex-col items-center justify-center mx-auto mb-5 shadow-lg shadow-terracotta-900/30">
                  <span className="text-xs font-bold text-terracotta-200 mb-0.5">{step.n}</span>
                  <step.icon size={24} className="text-white"/>
                </motion.div>
                <h3 className="font-display font-bold text-white text-xl mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-cream-50">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-sm text-yellow-700 font-medium mb-4">
              {[1,2,3,4,5].map(s=><Star key={s} size={11} fill="currentColor"/>)} Loved by teachers &amp; trainers
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800">What educators say</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.1 }} className="op-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s=><Star key={s} size={14} className="text-yellow-400" fill="currentColor"/>)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-terracotta-100 rounded-full flex items-center justify-center text-sm font-bold text-terracotta-700">
                    {t.name.charAt(0)}
                  </div>
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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-white border-y border-cream-300">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Frequently asked</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500">Everything you need to know about OmniPoll</motion.p>
          </motion.div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.06 }} className="op-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream-50 transition-colors">
                  <span className="font-medium text-slate-800 text-sm">{f.q}</span>
                  <motion.span animate={{ rotate:openFaq===i ? 180 : 0 }} className="text-terracotta-500 flex-shrink-0 ml-3">
                    <ChevronDown size={18}/>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq===i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}>
                      <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-cream-200 pt-3">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <ContactSection />

      {/* ── CTA card (image 5 style) ──────────────────────────────────── */}
      <section className="py-16 bg-cream-100">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bg-terracotta-500 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>
            <h2 className="font-display text-4xl font-bold text-white mb-4 relative z-10">
              Ready to Engage Your Audience?
            </h2>
            <p className="text-terracotta-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
              Join thousands of presenters who use OmniPoll to create memorable, data-driven live experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link to="/signup"
                className="flex items-center gap-2 bg-white hover:bg-cream-100 text-terracotta-600 px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5">
                Create Free Account <ArrowRight size={17}/>
              </Link>
              <a href="#contact"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 px-7 py-3.5 rounded-xl font-bold text-base transition-all">
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
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
              { title:'Product',  links:[['Features','#features'],['How It Works','#how'],['Testimonials','#testimonials'],['Contact','#contact']] },
              { title:'Platform', links:[['For Teachers','/signup'],['For Students','/join'],['For Events','/signup'],['For Business','/signup']] },
              { title:'Account',  links:[['Get Started','/signup'],['Sign In','/login'],['Join a Poll','/join'],['Dashboard','/dashboard']] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-3 text-white/90">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="text-slate-400 hover:text-terracotta-400 text-sm transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} OmniPoll. All rights reserved.</span>
            <div className="flex items-center gap-4">
              {['Privacy Policy','Terms of Service','Contact'].map(l => (
                <a key={l} href="#contact" className="hover:text-terracotta-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
