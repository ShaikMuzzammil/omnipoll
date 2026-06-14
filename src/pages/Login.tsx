import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

export default function Login() {
  const { login } = useApp();
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
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(res.user.role === 'student' ? '/student/dashboard' : from);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-slate-800">OmniPoll</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="op-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400 bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400 bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold transition-all shadow-sm mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin"/> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-cream-100 rounded-lg text-xs text-slate-500 text-center">
            Demo: <strong>demo@omnipoll.io</strong> / <strong>demo1234</strong>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-terracotta-600 hover:text-terracotta-700 font-medium">Sign up</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link to="/join" className="hover:text-terracotta-500 transition-colors">Join a poll without signing in →</Link>
        </p>
      </motion.div>
    </div>
  );
}
