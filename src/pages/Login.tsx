import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2, Home, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,20,-15,0], y:[0,-20,10,0], scale:[1,1.06,0.97,1] }}
      transition={{ duration:16+delay, repeat:Infinity, ease:'easeInOut', delay }}
    />
  );
}

export default function Login() {
  const { login }  = useApp();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authApi.signin({ email, password }) as { token: string; user: User };
      login(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}! 👋`);
      navigate(res.user.role === 'student' ? '/student/dashboard' : from);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <Blob className="w-[450px] h-[450px] bg-terracotta-300 -top-20 -left-20" delay={0}/>
      <Blob className="w-[350px] h-[350px] bg-amber-200 bottom-0 right-0"      delay={4}/>
      <Blob className="w-[250px] h-[250px] bg-sage-500 bottom-20 left-1/3"     delay={8}/>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:'linear-gradient(#D96C4A 1px,transparent 1px),linear-gradient(90deg,#D96C4A 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>

      {/* Home button — top left */}
      <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
        className="fixed top-4 left-4 z-50">
        <Link to="/" className="flex items-center gap-2 bg-white/80 backdrop-blur border border-cream-300 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-terracotta-600 hover:border-terracotta-300 transition-all shadow-sm">
          <Home size={14}/> Home
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:24, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ type:'spring', stiffness:300, damping:28 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <motion.div whileHover={{ scale:1.1, rotate:5 }}
              className="w-12 h-12 bg-terracotta-500 rounded-2xl flex items-center justify-center shadow-lg shadow-terracotta-200">
              <BarChart3 size={22} className="text-white"/>
            </motion.div>
            <span className="font-display font-bold text-2xl text-slate-800 group-hover:text-terracotta-600 transition-colors">OmniPoll</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl p-8">
          {/* Demo banner */}
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl mb-5 text-xs">
            <Sparkles size={13} className="text-terracotta-500 flex-shrink-0"/>
            <span className="text-terracotta-700">
              Demo: <strong>demo@omnipoll.io</strong> / <strong>demo1234</strong>
              &nbsp;·&nbsp; Student: <strong>student@omnipoll.io</strong> / <strong>student123</strong>
            </span>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email" autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all hover:border-cream-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all hover:border-cream-400"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg mt-2 text-sm"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin"/> Signing in…</>
                : <>Sign In <ArrowRight size={16}/></>
              }
            </motion.button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-200"/></div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3">or</div>
          </div>

          {/* Quick join */}
          <Link to="/join"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 transition-all">
            <BarChart3 size={14} className="text-terracotta-500"/> Join a poll without signing in
          </Link>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-terracotta-600 hover:text-terracotta-700 font-semibold">Create one free</Link>
          </p>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/"       className="hover:text-terracotta-500 transition-colors flex items-center gap-1"><Home size={11}/> Home</Link>
          <span>·</span>
          <Link to="/join"   className="hover:text-terracotta-500 transition-colors">Join a Poll</Link>
          <span>·</span>
          <Link to="/signup" className="hover:text-terracotta-500 transition-colors">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
}
