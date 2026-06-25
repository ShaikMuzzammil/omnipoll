import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Loader2, ArrowRight, LogIn,
  Home, CheckCircle, AlertCircle, Users, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi, attemptsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { Poll } from '@/lib/types';

export default function Join() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate  = useNavigate();
  const { user }  = useApp();

  const [digits,     setDigits]     = useState<string[]>(Array(6).fill(''));
  const [poll,       setPoll]       = useState<Poll | null>(null);
  const [lookingUp,  setLookingUp]  = useState(false);
  const [joining,    setJoining]    = useState(false);
  const [guestName,  setGuestName]  = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [error,      setError]      = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── lookup ── */
  const doLookup = useCallback(async (code: string) => {
    const clean = code.replace(/\s/g,'').toUpperCase();
    if (clean.length < 4) return;
    setLookingUp(true);
    setError('');
    setPoll(null);
    try {
      const p = await pollsApi.byCode(clean) as Poll;
      if (p.status === 'draft') { setError("This poll hasn't been launched yet."); return; }
      setPoll(p);
    } catch {
      setError('Poll not found. Double-check the code and try again.');
    } finally {
      setLookingUp(false);
    }
  }, []);

  /* ── auto lookup from URL param ── */
  useEffect(() => {
    if (!paramCode) return;
    const clean = paramCode.toUpperCase().slice(0, 6);
    const chars = clean.split('').concat(Array(6 - clean.length).fill(''));
    setDigits(chars);
    doLookup(clean);
  }, [paramCode, doLookup]);

  /* ── handle single digit input ── */
  const handleDigit = (val: string, idx: number) => {
    const ch = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError('');

    if (ch && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    const code = next.join('').trim();
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (code.length >= 4) {
      lookupTimer.current = setTimeout(() => doLookup(code), 300);
    } else {
      setPoll(null);
    }
  };

  /* ── paste handler — clears old digits, fills from paste ── */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (!pasted) return;

    // Always start fresh from position 0 when pasting
    const fresh = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { fresh[i] = ch; });
    setDigits(fresh);
    setError('');
    setPoll(null);

    // Focus last filled or next empty
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (pasted.length >= 4) {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      lookupTimer.current = setTimeout(() => doLookup(pasted), 300);
    }
  };

  /* ── backspace ── */
  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
        setPoll(null);
        setError('');
      }
    }
    if (e.key === 'Enter' && poll && !isClosed) handleJoin();
  };

  /* ── clear all ── */
  const clearAll = () => {
    setDigits(Array(6).fill(''));
    setPoll(null);
    setError('');
    inputRefs.current[0]?.focus();
  };

  /* ── join ── */
  const handleJoin = async () => {
    if (!poll || isClosed) return;
    if (!user && !guestName.trim()) {
      toast.error('Please enter your name to continue');
      return;
    }
    setJoining(true);
    try {
      const meta = user ? {} : {
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
      };
      const attempt = await attemptsApi.start(poll.id, meta) as { id: string };
      navigate(`/participate/${poll.id}?attempt=${attempt.id}${!user ? `&name=${encodeURIComponent(guestName)}` : ''}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to join. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const isClosed = poll?.status === 'closed' || poll?.status === 'results_released';
  const code     = digits.join('').trim();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#FDF6EC 0%,#FAF0DC 45%,#F5E6C8 100%)' }}>

      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage:'radial-gradient(circle,#D96C4A 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

      {/* Home button */}
      <div className="fixed top-4 left-4 z-20">
        <Link to="/" className="flex items-center gap-1.5 bg-white/80 backdrop-blur border border-cream-300 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-terracotta-600 shadow-sm transition-all">
          <Home size={14}/> Home
        </Link>
      </div>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 size={20} className="text-white"/>
        </div>
        <span className="font-display font-bold text-xl text-slate-800">OmniPoll</span>
      </Link>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:300, damping:28 }}
        className="w-full max-w-sm relative z-10">
        <div className="bg-white/92 backdrop-blur border border-cream-300 rounded-2xl shadow-xl p-7">
          <h1 className="font-display text-2xl font-bold text-slate-800 text-center mb-1">Join a Poll</h1>
          <p className="text-sm text-slate-500 text-center mb-7">Enter the 6-character code from your teacher</p>

          {/* 6-box code entry */}
          <div className="flex gap-2 justify-center mb-1.5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i}
                ref={el => { inputRefs.current[i] = el; }}
                value={d}
                onChange={e => handleDigit(e.target.value, i)}
                onKeyDown={e => handleKey(e, i)}
                maxLength={1}
                autoFocus={i === 0}
                className={`w-11 h-12 text-center text-xl font-black font-mono border-2 rounded-xl focus:outline-none transition-all uppercase select-all
                  ${d
                    ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700'
                    : 'border-cream-300 bg-white text-slate-700 hover:border-cream-400'
                  }
                  focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100`}
                placeholder="·"
              />
            ))}
          </div>

          {/* Clear + tip */}
          <div className="flex items-center justify-between mb-4">
            {code.length > 0 ? (
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-terracotta-600 transition-colors ml-1">Clear</button>
            ) : (
              <span className="text-xs text-slate-400 ml-1">Paste your code anywhere</span>
            )}
            {lookingUp && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 size={11} className="animate-spin"/> Looking up…
              </span>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && !lookingUp && (
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Poll preview */}
          <AnimatePresence>
            {poll && !lookingUp && (
              <motion.div initial={{ opacity:0, y:8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0 }}
                className={`rounded-xl mb-4 border overflow-hidden ${isClosed ? 'bg-slate-50 border-slate-200' : 'bg-terracotta-50 border-terracotta-200'}`}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{pollTypeIcon(poll.type)}</span>
                    <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full border border-cream-300 text-slate-600">
                      {pollTypeLabel(poll.type)}
                    </span>
                    {poll.status === 'active' && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Live
                      </span>
                    )}
                    {isClosed && (
                      <span className="ml-auto text-xs text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Closed</span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-base">{poll.title}</h3>
                  {poll.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{poll.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users size={10}/>{poll.uniqueParticipants} joined</span>
                    {(poll.settings as any)?.timeLimit && (
                      <span className="flex items-center gap-1"><Clock size={10}/>{(poll.settings as any).timeLimit}s limit</span>
                    )}
                  </div>
                </div>
                {isClosed && (
                  <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1.5">
                    <AlertCircle size={12}/> This poll has ended — you can no longer participate.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guest fields */}
          {poll && !user && !isClosed && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className="space-y-2.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-cream-50 px-3 py-2 rounded-xl border border-cream-200">
                <LogIn size={12} className="text-terracotta-500 flex-shrink-0"/>
                <span>
                  <Link to="/login" className="text-terracotta-600 font-semibold hover:underline">Sign in</Link> to save results, or continue as guest
                </span>
              </div>
              <input value={guestName} onChange={e => setGuestName(e.target.value)}
                placeholder="Your name *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 transition-all"/>
              <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                placeholder="Email (optional — get results emailed)"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 transition-all"/>
            </motion.div>
          )}

          {/* Join button */}
          <motion.button onClick={handleJoin}
            disabled={!poll || joining || lookingUp || isClosed}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md
              ${!poll || isClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-terracotta-500 hover:bg-terracotta-600 text-white hover:shadow-lg'}`}>
            {joining
              ? <><Loader2 size={16} className="animate-spin"/> Joining…</>
              : isClosed
              ? '🔒 Poll Closed'
              : !poll
              ? 'Enter Code Above'
              : <><ArrowRight size={16}/> Join {['quiz','multiple_choice','true_false'].includes(poll.type) ? 'Quiz' : 'Poll'}</>
            }
          </motion.button>

          {user && (
            <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
              <CheckCircle size={11} className="text-green-500"/>
              Joining as <strong className="text-slate-600">{user.name}</strong>
            </p>
          )}
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <Link to="/" className="hover:text-terracotta-500 flex items-center gap-1 transition-colors">
            <Home size={10}/> Home
          </Link>
          <span>·</span>
          <Link to="/login" className="hover:text-terracotta-500 transition-colors">Sign In</Link>
          <span>·</span>
          <Link to="/signup" className="hover:text-terracotta-500 transition-colors">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
}
