import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2, Home, ArrowRight, GraduationCap, BookOpen, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { User } from '@/lib/types';

const LEARN_APP = import.meta.env.VITE_STUDENT_APP_URL ?? 'https://omnipoll-learn.vercel.app';

const TEACHER_PERKS = ['Create 20+ poll types','Classroom management','Real-time analytics','Release key sheets'];
const STUDENT_PERKS = ['Join live quizzes','View your scores','Detailed key sheets','Track progress'];

function Blob({ className, delay=0 }: { className:string; delay?:number }) {
  return (
    <motion.div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{ x:[0,25,-15,0], y:[0,-20,15,0] }}
      transition={{ duration:18+delay, repeat:Infinity, ease:'easeInOut', delay }}/>
  );
}

export default function Signup() {
  const { login } = useApp();
  const navigate  = useNavigate();
  const [role, setRole]     = useState<'teacher'|'student'>('teacher');
  const [step, setStep]     = useState<1|2>(1);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoad]  = useState(false);

  const strength = pw.length===0?0:pw.length<6?1:pw.length<8?2:/[A-Z]/.test(pw)&&/[0-9]/.test(pw)?4:3;
  const strColor = ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'][strength];
  const strLabel = ['','Weak','Fair','Good','Strong'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name||!email||!pw) { toast.error('Please fill in all fields'); return; }
    if (pw.length<6) { toast.error('Password must be at least 6 characters'); return; }
    setLoad(true);
    try {
      const res = await authApi.signup({ name, email, password:pw, role }) as { token:string; user:User };
      login(res.token, res.user);
      toast.success(`Welcome to OmniPoll, ${res.user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err:any) {
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

      <motion.div initial={{ opacity:0,y:20,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
        transition={{ type:'spring',stiffness:300,damping:28 }}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-terracotta-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 size={26} className="text-white"/>
            </div>
            <span className="font-display font-bold text-2xl text-slate-800">OmniPoll</span>
          </Link>
          <p className="text-slate-500 mt-1.5 text-sm">Create your free account — takes 30 seconds</p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Role picker */}
          {step===1 && (
            <motion.div key="s1" initial={{ opacity:0,y:20,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
              exit={{ opacity:0,y:-20 }} transition={{ type:'spring',stiffness:320,damping:28 }}
              className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-7">
                <h2 className="font-display text-xl font-bold text-slate-800 text-center mb-1">I am a…</h2>
                <p className="text-sm text-slate-500 text-center mb-6">Choose your role to get the right experience</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {([
                    { r:'teacher' as const, icon:GraduationCap, label:'Teacher', sub:'Create & manage polls', color:'terracotta' },
                    { r:'student' as const, icon:BookOpen,       label:'Student', sub:'Join & take quizzes',  color:'blue' },
                  ]).map(opt => (
                    <motion.button key={opt.r} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={() => setRole(opt.r)}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        role===opt.r ? 'border-terracotta-400 bg-terracotta-50 shadow-md' : 'border-cream-300 hover:border-terracotta-200 bg-white'}`}>
                      {role===opt.r && (
                        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                          className="absolute top-2.5 right-2.5 w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white"/>
                        </motion.div>
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${role===opt.r ? 'bg-terracotta-500' : 'bg-cream-200'}`}>
                        <opt.icon size={26} className={role===opt.r ? 'text-white' : 'text-slate-500'}/>
                      </div>
                      <div className="text-center">
                        <p className={`font-display font-bold ${role===opt.r ? 'text-terracotta-700' : 'text-slate-800'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Student redirect notice */}
                {role==='student' && (
                  <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
                    className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                    <p className="font-semibold mb-1">👋 Student? Use the Student Portal</p>
                    <p className="text-blue-600">The student experience is better on OmniPoll Learn — our dedicated student app.</p>
                  </motion.div>
                )}

                {/* Perks */}
                <div className="bg-cream-50 border border-cream-200 rounded-xl p-3.5 mb-5">
                  <p className="text-xs font-bold text-slate-600 text-center mb-2.5">✨ Everything included free</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(role==='teacher' ? TEACHER_PERKS : STUDENT_PERKS).map(p => (
                      <div key={p} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>{p}
                      </div>
                    ))}
                  </div>
                </div>

                {role==='student' ? (
                  <div className="space-y-2">
                    <a href={`${LEARN_APP}/signup`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md">
                      Go to Student Portal <ExternalLink size={15}/>
                    </a>
                    <button onClick={() => setStep(2)}
                      className="w-full py-2.5 text-slate-400 hover:text-slate-600 text-xs transition-colors">
                      Continue here as student anyway →
                    </button>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale:0.98 }} onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md text-sm">
                    Continue as Teacher <ArrowRight size={16}/>
                  </motion.button>
                )}
              </div>
              <div className="px-7 py-4 bg-cream-50 border-t border-cream-200 text-center">
                <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-terracotta-600 font-semibold">Sign in</Link></p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Details */}
          {step===2 && (
            <motion.div key="s2" initial={{ opacity:0,y:20,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
              exit={{ opacity:0,y:-20 }} transition={{ type:'spring',stiffness:320,damping:28 }}
              className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-7">
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">← Back</button>
                  <div className="ml-auto flex items-center gap-1.5 bg-terracotta-50 border border-terracotta-200 px-2.5 py-1 rounded-full">
                    {role==='teacher' ? <GraduationCap size={12} className="text-terracotta-600"/> : <BookOpen size={12} className="text-terracotta-600"/>}
                    <span className="text-xs font-semibold text-terracotta-700 capitalize">{role}</span>
                  </div>
                </div>

                <h2 className="font-display font-bold text-slate-800 text-xl mb-1">Your details</h2>
                <p className="text-sm text-slate-500 mb-5">Almost there — just a few details</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" autoFocus
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                      <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                    {pw.length>0 && (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">{[1,2,3,4].map(n=><div key={n} className={`h-1 flex-1 rounded-full transition-all ${strength>=n?strColor:'bg-cream-300'}`}/>)}</div>
                        <p className={`text-[11px] font-medium ${strength<=1?'text-red-500':strength<=2?'text-orange-500':strength<=3?'text-yellow-600':'text-green-600'}`}>{strLabel}</p>
                      </div>
                    )}
                  </div>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale:0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md">
                    {loading?<><Loader2 size={15} className="animate-spin"/>Creating…</>:<><CheckCircle size={15}/> Create Account — It's Free</>}
                  </motion.button>
                  <p className="text-center text-xs text-slate-400">By signing up you agree to our <Link to="/contact" className="underline">Terms</Link></p>
                </form>
              </div>
              <div className="px-7 py-4 bg-cream-50 border-t border-cream-200 text-center">
                <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-terracotta-600 font-semibold">Sign in</Link></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1"><Home size={10}/> Home</Link>
          <span>·</span><Link to="/join" className="hover:text-terracotta-500">Join a Poll</Link>
          <span>·</span><Link to="/login" className="hover:text-terracotta-500">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
