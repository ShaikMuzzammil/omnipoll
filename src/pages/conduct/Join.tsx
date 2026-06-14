import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, ArrowRight, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi, attemptsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { Poll } from '@/lib/types';

export default function Join() {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [code,       setCode]       = useState((paramCode ?? '').toUpperCase());
  const [poll,       setPoll]       = useState<Poll | null>(null);
  const [guestName,  setGuestName]  = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [lookingUp,  setLookingUp]  = useState(false);
  const inputsRef    = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-lookup when code from URL
  useEffect(() => {
    if (paramCode && paramCode.length === 6) lookupPoll(paramCode.toUpperCase());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramCode]);

  const lookupPoll = async (c: string) => {
    setLookingUp(true);
    try {
      const p = await pollsApi.byCode(c) as Poll;
      if (p.status === 'draft') { toast.error('This poll hasn\'t been launched yet'); setPoll(null); return; }
      setPoll(p);
    } catch {
      toast.error('Poll not found. Check the code.');
      setPoll(null);
    } finally {
      setLookingUp(false);
    }
  };

  // 6-char code input split into boxes
  const handleCodeInput = (val: string, idx: number) => {
    const chars = code.split('');
    chars[idx] = val.toUpperCase().slice(-1);
    const newCode = chars.join('').slice(0, 6);
    setCode(newCode.padEnd(6, ' ').slice(0, 6).trimEnd() + (val ? '' : ''));
    const filled = newCode.replace(/\s/g,'');
    setCode(filled.padEnd(6).slice(0,6));
    if (val && idx < 5) inputsRef.current[idx+1]?.focus();
    if (filled.length === 6) lookupPoll(filled.padEnd(6,'0').toUpperCase());
  };

  const handleJoin = async () => {
    if (!poll) return;
    if (!user && !guestName.trim()) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      const meta = user ? {} : { guestName: guestName.trim(), guestEmail: guestEmail.trim() };
      const attempt = await attemptsApi.start(poll.id, meta) as { id: string };
      navigate(`/participate/${poll.id}?attempt=${attempt.id}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-terracotta-500 rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl text-slate-800">OmniPoll</span>
      </Link>

      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm"
      >
        <div className="op-card p-8">
          <h1 className="font-display text-2xl font-bold text-slate-800 text-center mb-2">Join a Poll</h1>
          <p className="text-sm text-slate-500 text-center mb-7">Enter the 6-character code from your teacher</p>

          {/* Code input */}
          <div className="flex gap-2 justify-center mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el; }}
                value={code[i] ?? ''}
                onChange={e => handleCodeInput(e.target.value, i)}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i-1]?.focus();
                }}
                maxLength={1}
                className="w-11 h-12 text-center text-xl font-bold font-mono border-2 border-cream-300 rounded-xl focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 outline-none bg-white uppercase transition-all"
                placeholder="·"
              />
            ))}
          </div>

          {lookingUp && (
            <div className="text-center py-2 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Loader2 size={15} className="animate-spin"/> Looking up…
            </div>
          )}

          {/* Poll preview */}
          {poll && !lookingUp && (
            <motion.div
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className="p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl mb-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{pollTypeIcon(poll.type)}</span>
                <span className="text-xs text-terracotta-600 font-medium bg-terracotta-100 px-2 py-0.5 rounded-full">
                  {pollTypeLabel(poll.type)}
                </span>
                {poll.status === 'active' && <span className="badge-live ml-auto">● Live</span>}
              </div>
              <h3 className="font-display font-semibold text-slate-800">{poll.title}</h3>
              {poll.description && <p className="text-xs text-slate-500 mt-1">{poll.description}</p>}
              <p className="text-xs text-slate-400 mt-2">by {poll.creator?.name ?? 'Teacher'} · {poll.uniqueParticipants} participants</p>
            </motion.div>
          )}

          {/* Guest info if not logged in */}
          {poll && !user && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-cream-100 px-3 py-2 rounded-lg">
                <LogIn size={13}/> 
                <span><Link to="/login" className="text-terracotta-600 font-medium">Sign in</Link> to save your results, or continue as guest</span>
              </div>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Your name *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
              <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Email (optional — for results)"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!poll || loading || lookingUp}
            className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all shadow-sm"
          >
            {loading ? <><Loader2 size={16} className="animate-spin"/> Joining…</> : <>Join Now <ArrowRight size={16}/></>}
          </button>

          {user && (
            <p className="text-center text-xs text-slate-400 mt-3">
              Joining as <strong>{user.name}</strong> · <Link to="/student/dashboard" className="text-terracotta-500">My Dashboard</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
