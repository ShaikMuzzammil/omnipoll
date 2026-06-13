import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { signIn } from '@/lib/api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { signIn: ctxSignIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await signIn({ email, password }) as { user: { id:string;name:string;email:string;plan:string }; token:string };
      ctxSignIn(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      navigate('/dashboard');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(42,33%,93%)' }}>
      <div className="h-14 flex items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-playfair text-xl font-bold">
          <span className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="text-terracotta">Omni</span>Poll
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="w-full max-w-sm">
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8">
            <h1 className="font-playfair text-2xl font-bold text-charcoal dark:text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-slate dark:text-muted-foreground mb-6">Sign in to your OmniPoll account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-2">{loading ? 'Signing in…' : 'Sign In'}</Button>
            </form>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">Demo: <span className="font-mono text-terracotta">demo@omnipoll.io</span> / <span className="font-mono text-terracotta">demo1234</span></p>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              No account? <Link to="/signup" className="text-terracotta hover:underline font-medium">Create one free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
