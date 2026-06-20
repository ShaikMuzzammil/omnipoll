import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Loader2, Home, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

const HOST_APP = import.meta.env.VITE_HOST_APP_URL || 'https://omnipoll-host.vercel.app';

function Blob({ className, delay=0 }: { className:string; delay?:number }) {
  return (
    <motion.div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,20,-15,0], y:[0,-20,10,0], scale:[1,1.06,0.97,1] }}
      transition={{ duration:16+delay, repeat:Infinity, ease:'easeInOut', delay }}/>
  );
}

export default function Login() {
  const { login } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname ?? '/student/dashboard';

  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authApi.signin({ email, password: pw }) as { token:string; user:User };
      login(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}! 📚`);
      navigate(res.user.role === 'student' ? '/student/dashboard' : from);
    } catch (err: any) {
      toast.error(err.message ?? 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background:'linear-gradient(135deg,#FDF6EC 0%,#FAF0DC 40%,#F5E6C8 100%)' }}>
      <Blob className="w-96 h-96 bg-terracotta-300 -top-20 -left-20" delay={0}/>
      <Blob className="w-80 h-80 bg-amber-200 bottom-0 right-0" delay={4}/>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:'radial-gradient(circle,#D96C4A 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

      {/* Home button */}
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
          <p className="text-slate-500 mt-1.5 text-sm">Sign in to your student account</p>
        </div>

        <div className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl p-7">
          {/* Demo hint */}
          <div className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl mb-5 text-xs">
            <Sparkles size={12} className="text-terracotta-500 flex-shrink-0"/>
            <span className="text-terracotta-700">Demo student: <strong>student@omnipoll.io</strong> / <strong>student123</strong></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all"/>
                <button type="button" onClick={() => setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale:0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md">
              {loading ? <><Loader2 size={15} className="animate-spin"/>Signing in…</> : <>Sign In <ArrowRight size={15}/></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link to="/signup" className="text-terracotta-600 hover:text-terracotta-700 font-semibold">Sign up free</Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1 transition-colors"><Home size={10}/> Home</Link>
          <span>·</span>
          <Link to="/join" className="hover:text-terracotta-500 transition-colors">Join a Poll</Link>
          <span>·</span>
          <a href={HOST_APP} className="hover:text-terracotta-500 transition-colors">Teacher Portal</a>
        </div>
      </motion.div>
    </div>
  );
}
