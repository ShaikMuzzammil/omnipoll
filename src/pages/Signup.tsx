import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2, Home, ArrowRight, GraduationCap, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,25,-15,0], y:[0,-20,15,0], scale:[1,1.07,0.96,1] }}
      transition={{ duration:18+delay, repeat:Infinity, ease:'easeInOut', delay }}
    />
  );
}

const PERKS = [
  'All 20 poll types free',
  'Unlimited classrooms',
  'Real-time results',
  'Student key sheets',
];

export default function Signup() {
  const { login }  = useApp();
  const navigate   = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'teacher'|'student'>('teacher');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<'role'|'details'>('role');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authApi.signup({ name, email, password, role }) as { token: string; user: User };
      login(res.token, res.user);
      toast.success(`Welcome to OmniPoll, ${res.user.name}! 🎉`);
      navigate(role === 'student' ? '/student/dashboard' : '/dashboard');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 relative overflow-hidden">
      <Blob className="w-[450px] h-[450px] bg-terracotta-300 top-0 -right-20"  delay={0}/>
      <Blob className="w-[350px] h-[350px] bg-amber-200 -bottom-10 -left-20"   delay={5}/>
      <Blob className="w-[280px] h-[280px] bg-sage-500 top-1/3 left-0"         delay={9}/>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:'linear-gradient(#D96C4A 1px,transparent 1px),linear-gradient(90deg,#D96C4A 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>

      {/* Home button */}
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
            <motion.div whileHover={{ scale:1.1, rotate:-5 }}
              className="w-12 h-12 bg-terracotta-500 rounded-2xl flex items-center justify-center shadow-lg shadow-terracotta-200">
              <BarChart3 size={22} className="text-white"/>
            </motion.div>
            <span className="font-display font-bold text-2xl text-slate-800 group-hover:text-terracotta-600 transition-colors">OmniPoll</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Create your free account — takes 30 seconds</p>
        </div>

        <div className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: Role picker */}
            {step === 'role' && (
              <motion.div key="role"
                initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                className="p-8"
              >
                <h2 className="font-display font-bold text-slate-800 text-xl text-center mb-2">I am a…</h2>
                <p className="text-sm text-slate-500 text-center mb-6">Choose your role to get the right experience</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { r:'teacher' as const, icon: GraduationCap, label:'Teacher', sub:'Create & manage polls', color:'terracotta' },
                    { r:'student' as const, icon: BookOpen,       label:'Student', sub:'Join & take quizzes',  color:'blue' },
                  ]).map(opt => (
                    <motion.button
                      key={opt.r}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      onClick={() => setRole(opt.r)}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        role === opt.r
                          ? 'border-terracotta-400 bg-terracotta-50 shadow-md'
                          : 'border-cream-300 hover:border-terracotta-200 hover:bg-cream-50'
                      }`}
                    >
                      {role === opt.r && (
                        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                          className="absolute top-2 right-2 w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white"/>
                        </motion.div>
                      )}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === opt.r ? 'bg-terracotta-500' : 'bg-cream-200'}`}>
                        <opt.icon size={22} className={role === opt.r ? 'text-white' : 'text-slate-500'}/>
                      </div>
                      <div className="text-center">
                        <p className={`font-display font-bold text-base ${role === opt.r ? 'text-terracotta-700' : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Perks */}
                <div className="bg-cream-100 rounded-xl p-3 mb-5">
                  <p className="text-xs font-semibold text-slate-600 mb-2 text-center">✨ Everything included free</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERKS.map(p => (
                      <div key={p} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>{p}
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale:0.98 }}
                  onClick={() => setStep('details')}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
                >
                  Continue as {role === 'teacher' ? 'Teacher' : 'Student'} <ArrowRight size={16}/>
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2: Details */}
            {step === 'details' && (
              <motion.div key="details"
                initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                className="p-8"
              >
                {/* Back + role badge */}
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => setStep('role')} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-cream-100 rounded-lg">
                    ← Back
                  </button>
                  <div className="ml-auto flex items-center gap-1.5 bg-terracotta-50 border border-terracotta-200 px-2.5 py-1 rounded-full">
                    {role === 'teacher' ? <GraduationCap size={12} className="text-terracotta-600"/> : <BookOpen size={12} className="text-terracotta-600"/>}
                    <span className="text-xs font-medium text-terracotta-700 capitalize">{role}</span>
                  </div>
                </div>

                <h2 className="font-display font-bold text-slate-800 text-xl mb-1">Your details</h2>
                <p className="text-sm text-slate-500 mb-5">Almost there — just a few details</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your full name" autoFocus
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= n * 3 ? (password.length >= 10 ? 'bg-green-400' : password.length >= 6 ? 'bg-yellow-400' : 'bg-red-400') : 'bg-cream-300'
                          }`}/>
                        ))}
                      </div>
                    )}
                  </div>

                  <motion.button
                    type="submit" disabled={loading}
                    whileTap={{ scale:0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin"/> Creating account…</>
                      : <><CheckCircle size={16}/> Create Account — It's Free</>
                    }
                  </motion.button>

                  <p className="text-center text-xs text-slate-400">
                    By signing up you agree to our <a href="#" className="underline hover:text-terracotta-500">Terms</a> and <a href="#" className="underline hover:text-terracotta-500">Privacy Policy</a>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-8 py-4 bg-cream-50 border-t border-cream-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-terracotta-600 hover:text-terracotta-700 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/"       className="hover:text-terracotta-500 transition-colors flex items-center gap-1"><Home size={11}/> Home</Link>
          <span>·</span>
          <Link to="/join"   className="hover:text-terracotta-500 transition-colors">Join a Poll</Link>
          <span>·</span>
          <Link to="/login"  className="hover:text-terracotta-500 transition-colors">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
