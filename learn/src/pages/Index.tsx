import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, ArrowRight, CheckCircle, Star, Trophy,
  Clock, BarChart3, ChevronRight, Zap, Shield, Users,
} from 'lucide-react';

const HOST_APP = import.meta.env.VITE_HOST_APP_URL || 'https://omnipoll-host.vercel.app';
const fade = { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0 } };
const stagger = { show:{ transition:{ staggerChildren:0.07 } } };

export default function LearnIndex() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) navigate(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen font-body" style={{ background:'linear-gradient(160deg,#FDF6EC 0%,#FAF0DC 45%,#F5E6C8 100%)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/88 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={16} className="text-white"/>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-800 leading-none">OmniPoll</span>
              <span className="text-terracotta-500 text-[10px] font-bold ml-1">LEARN</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href={HOST_APP} className="text-xs text-slate-500 hover:text-slate-700 font-medium hidden sm:block">Teacher Portal →</a>
            <Link to="/login"  className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 transition-all">Log in</Link>
            <Link to="/signup" className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-semibold shadow-sm transition-all">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-14 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'radial-gradient(circle, #D96C4A 1px, transparent 1px)', backgroundSize:'32px 32px' }}/>

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fade}
              className="inline-flex items-center gap-2 bg-white/70 border border-terracotta-200 rounded-full px-4 py-1.5 text-xs text-terracotta-700 font-bold mb-8 shadow-sm uppercase tracking-wider">
              <Zap size={11}/> Student Portal — Join · Learn · Grow
            </motion.div>

            <motion.h1 variants={fade} className="font-display text-5xl sm:text-6xl font-bold text-slate-800 mb-5 leading-[1.08] tracking-tight">
              Your quizzes,<br/>
              <span className="text-terracotta-500">your results.</span>
            </motion.h1>

            <motion.p variants={fade} className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
              Join live polls and quizzes from your teacher. See your scores, review key sheets
              and track your progress — all in one place.
            </motion.p>

            {/* Join code form */}
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <form onSubmit={handleJoin}
                className="flex items-center bg-white border-2 border-cream-300 hover:border-terracotta-300 rounded-xl overflow-hidden shadow-sm">
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE" maxLength={6}
                  className="px-4 py-3.5 text-sm font-mono font-bold tracking-[0.25em] text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none w-36"/>
                <button type="submit"
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors">
                  Join →
                </button>
              </form>
              <Link to="/signup"
                className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg">
                Create Account <ArrowRight size={15}/>
              </Link>
            </motion.div>

            {/* Trust */}
            <motion.div variants={fade} className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
              {['No app required','Works on any device','Instant results'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500"/> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features for students */}
      <section className="py-20 bg-white border-y border-cream-300">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once:true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fade} className="font-display text-3xl font-bold text-slate-800 mb-3">Everything you need as a student</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon:BarChart3, color:'bg-terracotta-100 text-terracotta-600', title:'Instant Results', desc:'See your score the moment your teacher releases it. No waiting, no manual checking.' },
              { icon:Shield,    color:'bg-blue-100 text-blue-600',             title:'Detailed Key Sheets', desc:'Review every question you attempted — see what you got right, wrong, and why.' },
              { icon:Trophy,    color:'bg-yellow-100 text-yellow-600',         title:'Leaderboard & Progress', desc:'Track your ranking across all quizzes and see how you improve over time.' },
            ].map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="op-card p-6">
                <div className={`w-10 h-10 ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <f.icon size={20}/>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bg-terracotta-500 rounded-3xl p-10 text-white">
            <h2 className="font-display text-3xl font-bold mb-3">Ready to join your class?</h2>
            <p className="text-terracotta-100 mb-6">Sign up to save your results and track your progress across all quizzes.</p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-terracotta-600 px-6 py-3 rounded-xl font-bold transition-all">
              Get Started Free <ArrowRight size={16}/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-300 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BookOpen size={14} className="text-terracotta-500"/>
          <span className="font-display font-bold text-slate-700">OmniPoll Learn</span>
        </div>
        <p className="text-xs mb-2">© {new Date().getFullYear()} OmniPoll. Student portal.</p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <a href={HOST_APP} className="hover:text-terracotta-500 transition-colors">Teacher Portal</a>
          <Link to="/contact" className="hover:text-terracotta-500 transition-colors">Support</Link>
          <Link to="/login"   className="hover:text-terracotta-500 transition-colors">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
