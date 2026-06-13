import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { signUp } from '@/lib/api';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await signUp({ name, email, password }) as { user: { id:string;name:string;email:string;plan:string }; token:string };
      signIn(data.user, data.token);
      toast.success(`Welcome to OmniPoll, ${data.user.name}! 🎉`);
      navigate('/dashboard');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Signup failed'); }
    finally { setLoading(false); }
  };

  const FEATURES = ['20 poll types','Real-time results','Neon database','Free to deploy'];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(42,33%,93%)' }}>
      <div className="h-14 flex items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-playfair text-xl font-bold">
          <span className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" /></span>
          <span className="text-terracotta">Omni</span>Poll
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="w-full max-w-sm">
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8">
            <h1 className="font-playfair text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-4">Free forever. No credit card needed.</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-2">{loading ? 'Creating…' : 'Create Free Account'}</Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <Link to="/login" className="text-terracotta hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
