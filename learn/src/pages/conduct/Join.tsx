import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, ArrowRight, LogIn, Home, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi, attemptsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { Poll } from '@/lib/types';

export default function Join() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user } = useApp();

  const [digits,     setDigits]     = useState<string[]>(Array(6).fill(''));
  const [poll,       setPoll]       = useState<Poll | null>(null);
  const [guestName,  setGuestName]  = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [lookingUp,  setLookingUp]  = useState(false);
  const [joining,    setJoining]    = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-lookup from URL param
  useEffect(() => {
    if (paramCode && paramCode.length >= 4) {
      const chars = paramCode.toUpperCase().slice(0, 6).split('');
      const padded = [...chars, ...Array(6 - chars.length).fill('')];
      setDigits(padded);
      doLookup(paramCode.toUpperCase());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramCode]);

  const getCode = () => digits.join('').trim();

  const doLookup = async (c: string) => {
    if (c.length < 4) return;
    setLookingUp(true);
    setPoll(null);
    try {
      const p = await pollsApi.byCode(c) as Poll;
      if (p.status === 'draft') { toast.error('This poll has not been launched yet.'); return; }
      if (p.status === 'closed' || p.status === 'results_released') {
        toast.warning('This poll is closed. You can no longer participate.');
        setPoll(p);
        return;
      }
      setPoll(p);
    } catch {
      toast.error('Poll not found. Check the code and try again.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleDigit = (val: string, idx: number) => {
    const ch = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < 5) { inputRefs.current[idx + 1]?.focus(); }
    const code = next.join('').trim();
    if (code.length >= 4) doLookup(code);
  };

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter' && poll) handleJoin();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (text) {
      const chars = text.split('');
      const padded = [...chars, ...Array(6 - chars.length).fill('')];
      setDigits(padded);
      if (text.length >= 4) doLookup(text);
      inputRefs.current[Math.min(text.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleJoin = async () => {
    if (!poll || poll.status === 'closed' || poll.status === 'results_released') return;
    if (!user && !guestName.trim()) { toast.error('Please enter your name to continue'); return; }
    setJoining(true);
    try {
      const meta = user ? {} : { guestName: guestName.trim(), guestEmail: guestEmail.trim() };
      const attempt = await attemptsApi.start(poll.id, meta) as { id: string };
      navigate(`/participate/${poll.id}?attempt=${attempt.id}${!user ? `&name=${encodeURIComponent(guestName)}` : ''}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to join');
    } finally { setJoining(false); }
  };

  const isClosed = poll?.status === 'closed' || poll?.status === 'results_released';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#FDF6EC 0%,#FAF0DC 45%,#F5E6C8 100%)' }}>
      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage:'radial-gradient(circle,#D96C4A 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

      {/* Top nav */}
      <div className="fixed top-4 left-4 z-20">
        <Link to="/" className="flex items-center gap-1.5 bg-white/80 backdrop-blur border border-cream-300 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-terracotta-600 shadow-sm transition-all">
          <Home size={14}/> Home
        </Link>
      </div>

      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 size={20} className="text-white"/>
        </div>
        <span className="font-display font-bold text-xl text-slate-800">OmniPoll</span>
      </Link>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:300, damping:28 }}
        className="w-full max-w-sm relative z-10">
        <div className="bg-white/90 backdrop-blur border border-cream-300 rounded-2xl shadow-xl p-7">
          <h1 className="font-display text-2xl font-bold text-slate-800 text-center mb-1">Join a Poll</h1>
          <p className="text-sm text-slate-500 text-center mb-7">Enter the 6-character code from your teacher</p>

          {/* Code boxes */}
          <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i}
                ref={el => { inputRefs.current[i] = el; }}
                value={d} onChange={e => handleDigit(e.target.value, i)}
                onKeyDown={e => handleKey(e, i)}
                maxLength={1}
                className={`w-11 h-13 text-center text-xl font-black font-mono border-2 rounded-xl focus:outline-none transition-all uppercase
                  ${d ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700' : 'border-cream-300 bg-white text-slate-700 hover:border-cream-400'}
                  focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100`}
                style={{ height:'52px' }}
                placeholder="·"
              />
            ))}
          </div>

          {/* Looking up */}
          {lookingUp && (
            <div className="text-center py-3 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Loader2 size={15} className="animate-spin text-terracotta-400"/> Looking up poll…
            </div>
          )}

          {/* Poll found */}
          {poll && !lookingUp && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className={`p-4 rounded-xl mb-4 border ${isClosed ? 'bg-slate-50 border-slate-200' : 'bg-terracotta-50 border-terracotta-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{pollTypeIcon(poll.type)}</span>
                <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full border border-cream-300 text-slate-600">{pollTypeLabel(poll.type)}</span>
                {poll.status === 'active' && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Live
                  </span>
                )}
                {isClosed && <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Closed</span>}
              </div>
              <h3 className="font-display font-bold text-slate-800">{poll.title}</h3>
              {poll.description && <p className="text-xs text-slate-500 mt-1">{poll.description}</p>}
              <p className="text-xs text-slate-400 mt-2">{poll.uniqueParticipants} participants</p>
            </motion.div>
          )}

          {/* Guest fields */}
          {poll && !user && !isClosed && (
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-cream-50 px-3 py-2 rounded-xl border border-cream-200">
                <LogIn size={12} className="text-terracotta-500"/>
                <span><Link to="/login" className="text-terracotta-600 font-semibold">Sign in</Link> to save results, or join as guest</span>
              </div>
              <input value={guestName} onChange={e => setGuestName(e.target.value)}
                placeholder="Your name *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 transition-all"/>
              <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                placeholder="Email (optional — get results emailed)"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 transition-all"/>
            </div>
          )}

          {/* Join button */}
          <motion.button onClick={handleJoin}
            disabled={!poll || joining || lookingUp || isClosed}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md">
            {joining ? <><Loader2 size={15} className="animate-spin"/>Joining…</> :
             isClosed ? '🔒 Poll is Closed' :
             !poll    ? 'Enter Code Above' :
             <><ArrowRight size={15}/> Join Now</>}
          </motion.button>

          {user && (
            <p className="text-center text-xs text-slate-400 mt-3">
              Joining as <strong className="text-slate-600">{user.name}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1 transition-colors"><Home size={10}/> Home</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-terracotta-500 transition-colors">Sign In</Link>
          <span>·</span>
          <Link to="/signup" className="hover:text-terracotta-500 transition-colors">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
}
