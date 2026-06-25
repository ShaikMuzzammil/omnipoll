import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  BookOpen, ArrowRight, CheckCircle, Star, Trophy,
  Clock, BarChart3, Zap, Shield, Users, ChevronDown,
  Activity, FileText, PieChart, MessageSquare, Radio,
  BarChart2, Sparkles,
} from 'lucide-react';

const HOST_APP = import.meta.env.VITE_HOST_APP_URL ?? 'https://omnipoll-host.vercel.app';

// Matching HOST bg icons style
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

const FEATURES = [
  { icon:BarChart3, color:'bg-terracotta-100 text-terracotta-600', title:'Instant Results',     desc:'See your score the moment your teacher releases it.' },
  { icon:Shield,    color:'bg-blue-100 text-blue-600',             title:'Detailed Key Sheets', desc:'Review every answer with explanations — what you got right and why.' },
  { icon:Trophy,    color:'bg-yellow-100 text-yellow-600',         title:'Leaderboard & Progress', desc:'Track your ranking across all quizzes over time.' },
  { icon:Zap,       color:'bg-green-100 text-green-600',           title:'Live Quizzes',        desc:'Real-time quiz participation with instant feedback.' },
  { icon:Users,     color:'bg-purple-100 text-purple-600',         title:'Classrooms',          desc:'Join your teacher\'s classroom to access all polls.' },
  { icon:Clock,     color:'bg-pink-100 text-pink-600',             title:'Time Tracking',       desc:'See how long you spend on each question.' },
];

const fade = { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0 } };
const stagger = { show:{ transition:{ staggerChildren:0.07 } } };

// NAV links like image 10
const NAV = [
  { label:'Home',           href:'/' },
  { label:'Features',       href:'#features' },
  { label:'How It Works',   href:'#how' },
  { label:'Support',        href:'/contact' },
];

export default function LearnIndex() {
  const navigate  = useNavigate();
  const [code, setCode] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target:heroRef, offset:['start start','end start'] });
  const heroY = useTransform(scrollYProgress, [0,1], ['0%','18%']);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length >= 4) navigate(`/join/${clean}`);
  };

  return (
    <div className="min-h-screen font-body overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#FDF6EC 0%,#FAF0DC 45%,#F5E6C8 100%)' }}>

      {/* ── Nav — matching image 10 exactly ── */}
      <motion.nav initial={{ y:-56, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}
        className="fixed top-0 left-0 right-0 z-50 bg-cream-100/88 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={16} className="text-white"/>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
              <span className="text-[10px] font-bold text-terracotta-500 uppercase tracking-wide">Learn</span>
            </div>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-0.5 text-sm">
            {NAV.map(({ label, href }) => (
              href.startsWith('/')
                ? <Link key={label} to={href} className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 hover:bg-terracotta-50/60 rounded-lg transition-all font-medium">{label}</Link>
                : <a key={label} href={href} className="px-3 py-1.5 text-slate-600 hover:text-terracotta-600 hover:bg-terracotta-50/60 rounded-lg transition-all font-medium">{label}</a>
            ))}
          </div>

          {/* Right — Teacher Portal + Log in + Sign Up (image 10 style) */}
          <div className="flex items-center gap-2">
            <a href={HOST_APP}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-terracotta-600 px-3 py-1.5 rounded-lg transition-all">
              Teacher Portal →
            </a>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg transition-all">
              Log in
            </Link>
            <Link to="/signup"
              className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-semibold shadow-sm transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero — background icons like HOST ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">
        {/* Floating bg icons */}
        {BG_ICONS.map(({ Icon, x, y, s, r, o }, i) => (
          <motion.div key={i} className="absolute pointer-events-none"
            style={{ left:x, top:y, opacity:o, transform:`rotate(${r}deg)` }}
            animate={{ y:[0,-10,5,0], rotate:[r,r+4,r-2,r] }}
            transition={{ duration:14+i*1.5, repeat:Infinity, ease:'easeInOut', delay:i*1.1 }}>
            <Icon size={s} className="text-terracotta-500"/>
          </motion.div>
        ))}
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage:'radial-gradient(circle,#D96C4A 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

        <motion.div style={{ y: heroY }} className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fade}
              className="inline-flex items-center gap-2 bg-white/70 border border-terracotta-200 rounded-full px-4 py-1.5 text-xs text-terracotta-700 font-bold mb-8 shadow-sm uppercase tracking-wider">
              <Sparkles size={12}/> Student Portal — Join · Learn · Grow
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fade} className="font-display text-5xl sm:text-6xl font-bold text-slate-800 mb-5 leading-[1.08] tracking-tight">
              Your quizzes,<br/>
              <span className="text-terracotta-500">your results.</span>
            </motion.h1>

            <motion.p variants={fade} className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join live polls and quizzes from your teacher. See your scores,
              review key sheets and track your progress — all in one place.
            </motion.p>

            {/* CTAs - inline JOIN CODE */}
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <form onSubmit={handleJoin}
                className="flex items-center bg-white border-2 border-cream-300 hover:border-terracotta-300 rounded-xl overflow-hidden shadow-sm transition-all">
                <input value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE" maxLength={6}
                  className="px-4 py-3.5 text-sm font-mono font-bold tracking-[0.25em] text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none w-36 uppercase"/>
                <button type="submit"
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors">
                  Join →
                </button>
              </form>
              <Link to="/signup"
                className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5">
                Create Account <ArrowRight size={15}/>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fade} className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
              {['No app required','Works on any device','Instant results'].map(t => (
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

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-white border-y border-cream-300">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fade} className="font-display text-3xl font-bold text-slate-800 mb-3">Everything for students</motion.h2>
            <motion.p variants={fade} className="text-slate-500">Built to help you learn, track and grow</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.07 }} whileHover={{ y:-3 }}
                className="op-card p-5 group">
                <div className={`w-10 h-10 ${f.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <f.icon size={20}/>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fade} className="font-display text-3xl font-bold text-slate-800 mb-3">How it works</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'1', title:'Get a Code',   desc:'Your teacher shares a 6-character code or QR.' },
              { n:'2', title:'Join the Quiz', desc:'Enter the code, see the pre-quiz guide, then start.' },
              { n:'3', title:'See Results',   desc:'Get your score and detailed key sheet instantly.' },
            ].map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay:i*0.1 }}
                className="relative bg-cream-50 border border-cream-200 rounded-2xl p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-terracotta-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                  {s.n}
                </div>
                <h3 className="font-display font-bold text-slate-800 text-lg mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bg-terracotta-500 rounded-3xl p-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize:'22px 22px' }}/>
            <h2 className="font-display text-3xl font-bold mb-3 relative z-10">Ready to join your class?</h2>
            <p className="text-terracotta-100 mb-6 relative z-10">Sign up to save your results and track progress across all quizzes.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link to="/signup"
                className="flex items-center gap-2 bg-white hover:bg-cream-100 text-terracotta-600 px-6 py-3 rounded-xl font-bold transition-all">
                Create Free Account <ArrowRight size={16}/>
              </Link>
              <Link to="/join"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-3 rounded-xl font-bold transition-all">
                Join with Code
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-800 text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-terracotta-500 rounded-lg flex items-center justify-center"><BookOpen size={14}/></div>
                <span className="font-display font-bold">OmniPoll Learn</span>
              </div>
              <p className="text-slate-400 text-sm">The student portal for OmniPoll — join, learn and grow.</p>
            </div>
            {[
              { title:'Student',  links:[['Join a Poll','/join'],['My Results','/student/results'],['Classrooms','/classrooms'],['Leaderboard','/leaderboard']] },
              { title:'Account',  links:[['Sign Up','/signup'],['Log In','/login'],['Support','/contact'],['Teacher Portal →',HOST_APP]] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-3 text-white/90">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(([l,h]) => (
                    <li key={l}>
                      {h.startsWith('http')
                        ? <a href={h} className="text-slate-400 hover:text-terracotta-400 text-sm transition-colors">{l}</a>
                        : <Link to={h} className="text-slate-400 hover:text-terracotta-400 text-sm transition-colors">{l}</Link>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} OmniPoll Learn. Student portal.</span>
            <a href={HOST_APP} className="hover:text-terracotta-400 transition-colors text-xs">Educator? Use the Teacher Portal →</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
