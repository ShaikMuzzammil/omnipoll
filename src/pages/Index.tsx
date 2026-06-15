import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Zap, Shield, Users, ChevronRight, CheckCircle,
  Globe, GraduationCap, Play, Star, ArrowRight, Sparkles,
  BookOpen, Trophy, Clock, TrendingUp, Bell, Layers,
} from 'lucide-react';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType } from '@/lib/types';

const POLL_TYPES: PollType[] = [
  'multiple_choice','quiz','word_cloud','qa','nps','rating',
  'slider','ranking','matrix','priority','heatmap','emoji',
  'bracket','fill_blank','matching','true_false','image_choice',
  'countdown','series','open_ended',
];

const FEATURES = [
  { icon: Zap,           color: 'bg-yellow-100 text-yellow-600', title: 'Real-Time Results',    desc: 'Live vote streaming via Pusher. Watch responses appear instantly on your presenter screen as students submit.' },
  { icon: GraduationCap, color: 'bg-blue-100 text-blue-600',     title: 'Classroom Management', desc: 'Create classrooms, invite students with a join code, assign polls, and track every student\'s progress over time.' },
  { icon: BarChart3,     color: 'bg-purple-100 text-purple-600', title: 'Deep Analytics',       desc: 'Item-level analysis, score distribution charts, question difficulty ratings, and hourly submission timelines.' },
  { icon: Shield,        color: 'bg-green-100 text-green-600',   title: 'Answer Key Sheets',    desc: 'Release results to students with a full per-answer breakdown — what they chose vs what was correct, with explanations.' },
  { icon: Users,         color: 'bg-terracotta-100 text-terracotta-600', title: '20+ Poll Types', desc: 'Multiple choice, quizzes, NPS, heatmaps, ranking, matrix grids, word clouds, Q&A, emoji reactions and more.' },
  { icon: Bell,          color: 'bg-pink-100 text-pink-600',     title: 'Smart Notifications',  desc: 'Students get notified the moment you release results. Teachers see live participant counts in real time.' },
  { icon: Globe,         color: 'bg-cyan-100 text-cyan-600',     title: 'Join Anywhere',        desc: 'No app download. Students join via 6-char code or QR code on any device. Guest mode requires zero login.' },
  { icon: Trophy,        color: 'bg-orange-100 text-orange-600', title: 'Live Leaderboard',     desc: 'Quiz mode shows a real-time ranked leaderboard on the presenter screen — gamify your classroom instantly.' },
  { icon: Layers,        color: 'bg-indigo-100 text-indigo-600', title: 'Templates Library',    desc: '10+ built-in templates for education, business, and events. Save any poll as a reusable template.' },
];

const STATS = [
  { value: '20+', label: 'Poll Types',    icon: Layers },
  { value: '∞',   label: 'Participants',  icon: Users },
  { value: '<1s', label: 'Live Latency',  icon: Zap },
  { value: '100%',label: 'Free to start', icon: Star },
];

const HOW = [
  { n:'01', icon: BarChart3,     title: 'Create',   desc: 'Pick from 20 poll types, add your questions, configure timer and scoring in the 5-step wizard.' },
  { n:'02', icon: Globe,         title: 'Share',     desc: 'Share your 6-char code or show the QR code. Students join on any device instantly — no app needed.' },
  { n:'03', icon: TrendingUp,    title: 'Analyse',   desc: 'Watch live results, present on the big screen, then deep-dive into analytics and release key sheets.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma',     role: 'High School Teacher, Delhi',     text: 'OmniPoll transformed my classroom. Students are 10x more engaged since I started using quizzes with the live leaderboard.' },
  { name: 'Rahul Verma',      role: 'Corporate Trainer, Bangalore',   text: 'The NPS and matrix poll types are exactly what I needed for post-training feedback. Results export perfectly.' },
  { name: 'Dr. Anita Nair',   role: 'College Professor, Chennai',     text: 'Key sheets are a game-changer. Students can review every answer with explanations right after I release results.' },
];

const PRICING = [
  { plan: 'Free',  price: '₹0',   period: 'forever', color: 'border-cream-300',        features: ['Unlimited polls', '10 poll types', '100 participants/poll', 'Basic analytics', 'Join by code'] },
  { plan: 'Pro',   price: '₹499', period: '/month',  color: 'border-terracotta-400',   features: ['All 20 poll types', 'Unlimited participants', 'Deep analytics', 'Key sheets', 'Classrooms', 'Priority support'], popular: true },
  { plan: 'Team',  price: '₹999', period: '/month',  color: 'border-slate-300',        features: ['Everything in Pro', 'Up to 10 teachers', 'Admin dashboard', 'Export reports', 'Custom branding', 'API access'] },
];

const FAQ = [
  { q: 'Do students need to create an account?', a: 'No — students can join any poll as a guest with just their name. Creating an account lets them track their results and key sheets over time.' },
  { q: 'Is there a participant limit?', a: 'Free plan supports up to 100 participants per poll. Pro and Team plans have no limits.' },
  { q: 'How does real-time work?', a: 'We use Pusher Channels — votes appear on the presenter screen in under 1 second without any page refresh.' },
  { q: 'Can I use this offline?', a: 'The presenter view and participate page work on any network. The API requires internet to save responses to the database.' },
  { q: 'How do I release results to students?', a: 'After closing a poll, click "Release Results". Students get an in-app notification and can immediately view their key sheet.' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// Animated floating blob
function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{
        x: [0, 30, -20, 10, 0],
        y: [0, -25, 15, -10, 0],
        scale: [1, 1.08, 0.95, 1.04, 1],
      }}
      transition={{ duration: 18 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// Animated counter
function Counter({ target, suffix = '' }: { target: number | string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  if (typeof target !== 'number') return <>{target}</>;
  return <>{val}{suffix}</>;
}

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY   = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOp  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-cream-100 font-body overflow-x-hidden">

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-cream-300"
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center group-hover:bg-terracotta-600 transition-colors shadow-sm">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {[['#features','Features'],['#how','How it works'],['#pricing','Pricing'],['#faq','FAQ']].map(([h,l]) => (
              <a key={h} href={h} className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-all font-medium">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/join" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-terracotta-600 px-3 py-1.5 rounded-lg hover:bg-cream-200 transition-all">
              <Play size={13} className="text-terracotta-500" /> Join Poll
            </Link>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg transition-all">Sign In</Link>
            <Link to="/signup" className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">
        {/* Background blobs */}
        <Blob className="w-[500px] h-[500px] bg-terracotta-300 top-0 -left-48" delay={0} />
        <Blob className="w-[400px] h-[400px] bg-amber-200 top-20 right-0"       delay={3} />
        <Blob className="w-[350px] h-[350px] bg-sage-500 bottom-0 left-1/3"     delay={6} />
        <Blob className="w-[300px] h-[300px] bg-terracotta-200 bottom-10 right-10" delay={9} />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(#D96C4A 1px,transparent 1px),linear-gradient(90deg,#D96C4A 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

        <motion.div style={{ y: heroY, opacity: heroOp }} className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-8 shadow-sm">
              <motion.span className="w-2 h-2 bg-terracotta-500 rounded-full" animate={{ scale:[1,1.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}/>
              ✨ 20 Poll Types · Real-Time · Free Forever
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-800 mb-6 leading-[1.1] tracking-tight">
              The world's most
              <br />
              <span className="relative inline-block">
                <span className="text-gradient">powerful polling</span>
                <motion.div className="absolute -bottom-1 left-0 right-0 h-1 bg-terracotta-300 rounded-full"
                  initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.8, duration:0.6 }}/>
              </span>
              <br />platform
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fadeUp} className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create live polls, quizzes, and surveys in seconds. Get real-time responses,
              deep analytics, and detailed answer key sheets — all in one beautifully designed platform.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Link to="/signup"
                className="group flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Start for free
                <motion.span animate={{ x:[0,4,0] }} transition={{ repeat:Infinity, duration:1.5 }}>
                  <ChevronRight size={18}/>
                </motion.span>
              </Link>
              <Link to="/join"
                className="flex items-center gap-2 bg-white/90 backdrop-blur border border-cream-300 hover:border-terracotta-300 text-slate-700 px-7 py-3.5 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                <Play size={16} className="text-terracotta-500" /> Join a Poll
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <div className="w-8 h-8 bg-terracotta-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                    <s.icon size={15} className="text-terracotta-600"/>
                  </div>
                  <div className="text-xl font-display font-black text-terracotta-600">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:2 }}>
          <div className="w-6 h-10 border-2 border-terracotta-300 rounded-full flex items-start justify-center pt-2">
            <motion.div className="w-1.5 h-3 bg-terracotta-400 rounded-full"
              animate={{ y:[0,12,0], opacity:[1,0,1] }} transition={{ repeat:Infinity, duration:2 }}/>
          </div>
        </motion.div>
      </section>

      {/* ── Poll Types ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-cream-300 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true, margin:'-80px' }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-4">
              <Sparkles size={13}/> Every interaction type you'll ever need
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">20 unique poll types</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 max-w-xl mx-auto">Built for every use case — from classroom quizzes to corporate NPS surveys</motion.p>
          </motion.div>

          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {POLL_TYPES.map((type, i) => (
              <motion.div key={type}
                initial={{ opacity:0, scale:0.8, y:10 }}
                whileInView={{ opacity:1, scale:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale:1.1, y:-4 }}
                className="type-tile flex flex-col items-center gap-1.5 py-3 px-1 cursor-default"
              >
                <span className="text-2xl">{pollTypeIcon(type)}</span>
                <span className="text-[10px] text-slate-600 font-medium leading-tight text-center">{pollTypeLabel(type)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 relative overflow-hidden">
        <Blob className="w-[400px] h-[400px] bg-terracotta-200 top-10 -right-20" delay={2}/>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true, margin:'-80px' }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-4">
              <Zap size={13}/> Packed with powerful features
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Built for educators & teams</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 max-w-xl mx-auto">Everything you need to engage your audience, run quizzes, and measure outcomes.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity:0, y:20 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y:-4, scale:1.01 }}
                className="op-card p-6 group"
              >
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

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-slate-800 relative overflow-hidden">
        <Blob className="w-[500px] h-[500px] bg-terracotta-500 -top-20 -left-40" delay={1}/>
        <Blob className="w-[400px] h-[400px] bg-slate-600 bottom-0 right-0"      delay={4}/>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 font-medium mb-4">
              <Clock size={13}/> Up and running in 60 seconds
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-white mb-3">Simple. Powerful. Fast.</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">Three steps from idea to live engagement</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-0.5 bg-gradient-to-r from-terracotta-500 via-terracotta-400 to-terracotta-500 opacity-40"/>
            {HOW.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity:0, y:24 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale:1.1, rotate:5 }}
                  className="w-20 h-20 bg-terracotta-500 rounded-3xl flex flex-col items-center justify-center mx-auto mb-5 shadow-lg shadow-terracotta-900/30"
                >
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

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-cream-50 relative overflow-hidden">
        <Blob className="w-[300px] h-[300px] bg-terracotta-200 top-0 left-0" delay={5}/>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-sm text-yellow-700 font-medium mb-4">
              {[1,2,3,4,5].map(s=><Star key={s} size={11} fill="currentColor"/>)} Loved by teachers & trainers
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800">What educators say</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity:0, y:20 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.1 }}
                className="op-card p-6"
              >
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

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <Blob className="w-[400px] h-[400px] bg-terracotta-100 -bottom-20 right-0" delay={3}/>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium mb-4">
              <CheckCircle size={13}/> No credit card required
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Simple, transparent pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500">Start free. Upgrade when you need more power.</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {PRICING.map((p, i) => (
              <motion.div key={p.plan}
                initial={{ opacity:0, y:24 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.1 }}
                className={`relative op-card p-6 ${p.popular ? 'border-2 border-terracotta-400 shadow-lg shadow-terracotta-100' : ''}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <p className="font-display font-bold text-slate-800 text-lg mb-1">{p.plan}</p>
                <div className="flex items-end gap-1 mb-5">
                  <span className="font-display font-black text-4xl text-terracotta-600">{p.price}</span>
                  <span className="text-slate-400 text-sm mb-1">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0"/>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${p.popular ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-sm' : 'bg-cream-100 hover:bg-cream-200 text-slate-700 border border-cream-300'}`}>
                  {p.price === '₹0' ? 'Start Free' : 'Get Started'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-white border-y border-cream-300">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-slate-800 mb-3">Frequently asked</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500">Everything you need to know about OmniPoll</motion.p>
          </motion.div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:10 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i * 0.07 }}
                className="op-card overflow-hidden"
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream-50 transition-colors">
                  <span className="font-medium text-slate-800 text-sm">{f.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} className="text-terracotta-500 flex-shrink-0 ml-3">
                    <ChevronRight size={18}/>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
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

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <Blob className="w-[500px] h-[500px] bg-terracotta-200 top-0 left-1/2 -translate-x-1/2" delay={2}/>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-5xl mb-6">🎯</motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-5xl font-bold text-slate-800 mb-4">
              Ready to engage<br />your audience?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 mb-8 text-lg">
              Join thousands of educators and teams using OmniPoll every day.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup"
                className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Create your first poll <ArrowRight size={18}/>
              </Link>
              <Link to="/join" className="text-terracotta-600 hover:text-terracotta-700 font-semibold px-6 py-4 underline underline-offset-2">
                Join as a participant
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
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
              { title:'Product',   links:[['Features','#features'],['How it works','#how'],['Pricing','#pricing'],['Templates','/templates']] },
              { title:'Use Cases', links:[['For Teachers','/signup'],['For Trainers','/signup'],['For Events','/signup'],['For Research','/signup']] },
              { title:'Account',   links:[['Sign Up','/signup'],['Sign In','/login'],['Join a Poll','/join'],['Dashboard','/dashboard']] },
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
                <a key={l} href="#" className="hover:text-terracotta-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
