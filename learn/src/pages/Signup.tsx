import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Loader2, Home, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

const HOST_APP = import.meta.env.VITE_HOST_APP_URL || 'https://omnipoll-host.vercel.app';

function Blob({ className, delay=0 }: { className:string; delay?:number }) {
  return (
    <motion.div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,25,-15,0], y:[0,-20,15,0] }}
      transition={{ duration:18+delay, repeat:Infinity, ease:'easeInOut', delay }}/>
  );
}

const PERKS = ['Join live quizzes','View your scores','Detailed key sheets','Track your progress'];

export default function Signup() {
  const { login } = useApp();
  const navigate  = useNavigate();

  const [name,    setName]   = useState('');
  const [email,   setEmail]  = useState('');
  const [pw,      setPw]     = useState('');
  const [showPw,  setShowPw] = useState(false);
  const [loading, setLoad]   = useState(false);

  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 8 ? 2 : /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4 : 3;
  const strengthColor = ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !pw) { toast.error('Please fill in all fields'); return; }
    if (pw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoad(true);
    try {
      const res = await authApi.signup({ name, email, password: pw, role: 'student' }) as { token:string; user:User };
      login(res.token, res.user);
      toast.success(`Welcome to OmniPoll, ${res.user.name}! 📚`);
      navigate('/student/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Signup failed');
    } finally { setLoad(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-16"
      style={{ background:'linear-gradient(135deg,#FDF6EC 0%,#FAF0DC 40%,#F5E6C8 100%)' }}>
      <Blob className="w-80 h-80 bg-terracotta-300 -top-10 right-0" delay={0}/>
      <Blob className="w-72 h-72 bg-amber-200 -bottom-10 -left-10" delay={5}/>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:'radial-gradient(circle,#D96C4A 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

      <div className="fixed top-4 left-4 z-20">
        <Link to="/" className="flex items-center gap-1.5 bg-white/80 backdrop-blur border border-cream-300 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-terracotta-600 shadow-sm transition-all">
          <Home size={14}/> Home
        </Link>
      </div>

      <motion.div initial={{ opacity:0, y:20, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ type:'spring', stiffness:300, damping:28 }}
        className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-terracotta-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen size={26} className="text-white"/>
            </div>
            <div>
              <span className="font-display font-bold text-2xl text-slate-800">OmniPoll</span>
              <span className="text-terracotta-500 text-xs font-bold ml-1">LEARN</span>
            </div>
          </Link>
          <p className="text-slate-500 mt-1.5 text-sm">Create your free student account</p>
        </div>

        <div className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-7">
            {/* Perks */}
            <div className="bg-terracotta-50 border border-terracotta-100 rounded-xl p-3 mb-5">
              <p className="text-xs font-bold text-terracotta-700 mb-2 text-center">✨ Everything free for students</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PERKS.map(p => (
                  <div key={p} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>{p}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus
                  className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white transition-all"/>
                  <button type="button" onClick={() => setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {pw.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {[1,2,3,4].map(n => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-all ${strength >= n ? strengthColor : 'bg-cream-300'}`}/>
                    ))}
                  </div>
                )}
              </div>
              <motion.button type="submit" disabled={loading} whileTap={{ scale:0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md">
                {loading ? <><Loader2 size={15} className="animate-spin"/>Creating…</> : <><CheckCircle size={15}/> Create Student Account</>}
              </motion.button>
              <p className="text-center text-xs text-slate-400">
                By signing up you agree to our <Link to="/contact" className="underline">Terms</Link>
              </p>
            </form>
          </div>
          <div className="px-7 py-4 bg-cream-50 border-t border-cream-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account? <Link to="/login" className="text-terracotta-600 font-semibold">Sign in</Link>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Are you a teacher? <a href={HOST_APP} className="text-terracotta-500 font-medium">Go to Host Portal →</a>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1"><Home size={10}/> Home</Link>
          <span>·</span>
          <Link to="/join" className="hover:text-terracotta-500">Join a Poll</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-terracotta-500">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
