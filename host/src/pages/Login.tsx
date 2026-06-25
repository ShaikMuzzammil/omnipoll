import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2, Home, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

const LEARN_APP = import.meta.env.VITE_STUDENT_APP_URL ?? 'https://omnipoll-learn.vercel.app';

function Blob({ className, delay=0 }: { className:string; delay?:number }) {
  return (
    <motion.div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,20,-15,0], y:[0,-20,10,0] }}
      transition={{ duration:16+delay, repeat:Infinity, ease:'easeInOut', delay }}/>
  );
}

export default function Login() {
  const { login } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname ?? '/dashboard';
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoad]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) { toast.error('Please fill in all fields'); return; }
    setLoad(true);
    try {
      const res = await authApi.signin({ email, password:pw }) as { token:string; user:User };
      login(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}! 👋`);
      navigate(res.user.role === 'student' ? '/student/dashboard' : from);
    } catch (err:any) {
      toast.error(err.message ?? 'Invalid credentials');
    } finally { setLoad(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background:'linear-gradient(135deg,#FDF6EC 0%,#FAF0DC 40%,#F5E6C8 100%)' }}>
      <Blob className="w-96 h-96 bg-terracotta-300 -top-20 -left-20" delay={0}/>
      <Blob className="w-80 h-80 bg-amber-200 bottom-0 right-0" delay={4}/>
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
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <motion.div whileHover={{ scale:1.08, rotate:3 }}
              className="w-14 h-14 bg-terracotta-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 size={26} className="text-white"/>
            </motion.div>
            <span className="font-display font-bold text-2xl text-slate-800">OmniPoll</span>
          </Link>
          <p className="text-slate-500 mt-1.5 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white/92 backdrop-blur border border-cream-300 rounded-2xl shadow-xl p-7">
          {/* Demo hint */}
          <div className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl mb-5 text-xs">
            <Sparkles size={12} className="text-terracotta-500 flex-shrink-0"/>
            <span className="text-terracotta-700">Demo: <strong>demo@omnipoll.io</strong> / <strong>demo1234</strong></span>
          </div>

          {/* Student redirect */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-5 text-xs text-blue-700">
            <ExternalLink size={12} className="flex-shrink-0"/>
            <span>Student? Use the <a href={`${LEARN_APP}/login`} className="font-bold underline hover:text-blue-800">Student Portal →</a></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">Forgot?</a>
              </div>
              <div className="relative">
                <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale:0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md mt-1">
              {loading?<><Loader2 size={15} className="animate-spin"/>Signing in…</>:<>Sign In <ArrowRight size={15}/></>}
            </motion.button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-200"/></div>
            <div className="relative flex justify-center"><span className="text-xs text-slate-400 bg-white px-3">or</span></div>
          </div>

          <Link to="/join"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 transition-all">
            <BarChart3 size={14} className="text-terracotta-500"/> Join a poll without signing in
          </Link>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account? <Link to="/signup" className="text-terracotta-600 hover:text-terracotta-700 font-semibold">Sign up free</Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1 transition-colors"><Home size={10}/> Home</Link>
          <span>·</span>
          <Link to="/join" className="hover:text-terracotta-500 transition-colors">Join Poll</Link>
          <span>·</span>
          <Link to="/signup" className="hover:text-terracotta-500 transition-colors">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
}
