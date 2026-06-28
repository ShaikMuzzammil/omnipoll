import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Clock, CheckCircle, Star, ChevronUp, ChevronDown,
  ArrowRight, AlertTriangle, Eye, Minus, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi, attemptsApi, voteApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel, formatTime } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import PreQuiz from './PreQuiz';
import type { Poll } from '@/lib/types';

export default function Participate() {
  const { pollId }    = useParams<{ pollId:string }>();
  const [sp]          = useSearchParams();
  const attemptId     = sp.get('attempt');
  const navigate      = useNavigate();
  const { user }      = useApp();

  const [poll,       setPoll]       = useState<Poll | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [showPre,    setShowPre]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);
  const [tabWarns,   setTabWarns]   = useState(0);
  const [currentQ,   setCurrentQ]   = useState(0);
  const [fsExited,   setFsExited]   = useState(false);
  const [countdown,  setCountdown]  = useState<number | null>(null);

  // Answer state
  const [selected,    setSelected]   = useState<string[]>([]);
  const [textAns,     setTextAns]    = useState('');
  const [numAns,      setNumAns]     = useState(5);
  const [ranking,     setRanking]    = useState<string[]>([]);
  const [matrixAns,   setMatrixAns]  = useState<Record<string,string>>({});
  const [matchAns,    setMatchAns]   = useState<Record<string,string>>({});
  const [priority,    setPriority]   = useState<Record<string,number>>({});
  const [heatXY,      setHeatXY]     = useState<{x:number;y:number}|null>(null);
  const [starRating,  setStarRating] = useState(0);
  const [sliderMin,   setSliderMin]  = useState(0);
  const [sliderMax,   setSliderMax]  = useState(100);
  const [allAnswers,  setAllAnswers] = useState<Record<number,any>>({});

  const heatRef  = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(Date.now());

  /* ── Build questions array ── */
  const questions = (() => {
    if (!poll) return [];
    const qs = (poll as any).questions;
    if (qs && Array.isArray(qs) && qs.length > 0) return qs;
    return [{ ...poll, options: poll.options, title: poll.title }];
  })();
  const totalQ = Math.max(questions.length, 1);
  const q      = questions[currentQ] ?? questions[0];
  const qType  = (q?.type ?? poll?.type ?? '') as string;

  /* ── Load poll ── */
  useEffect(() => {
    if (!pollId) return;
    pollsApi.get(pollId).then(p => {
      const poll = p as Poll;
      setPoll(poll);
      const qs = (poll as any).questions;
      const firstQ = qs?.length ? qs[0] : poll;
      // Initialize range for slider
      setSliderMin(firstQ?.sliderMin ?? 0);
      setSliderMax(firstQ?.sliderMax ?? 100);
      setNumAns(Math.round(((firstQ?.sliderMin ?? 0) + (firstQ?.sliderMax ?? 100)) / 2));
      if (['ranking','bracket'].includes(poll.type)) setRanking(poll.options.map(o => o.id));
    }).catch(() => toast.error('Poll not found')).finally(() => setLoading(false));
  }, [pollId]);

  /* ── Countdown poll type ── */
  useEffect(() => {
    if (!poll || qType !== 'countdown' || showPre) return;
    const secs = (q as any)?.countdownSecs ?? poll.settings?.globalTimerSecs ?? 60;
    setCountdown(secs);
    const id = setInterval(() => setCountdown(t => {
      if (!t || t <= 1) { clearInterval(id); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [qType, showPre, poll]);

  /* ── Per-question setup when switching Q ── */
  const setupQ = (qi: number, qs: any[]) => {
    const nq = qs[qi] ?? qs[0];
    const nqType = nq?.type ?? poll?.type ?? '';
    if (['ranking','bracket'].includes(nqType) && nq?.options?.length) {
      setRanking(nq.options.map((o: any) => o.id));
    }
    if (nqType === 'slider') {
      const min = nq?.sliderMin ?? 0;
      const max = nq?.sliderMax ?? 100;
      setSliderMin(min); setSliderMax(max);
      setNumAns(Math.round((min + max) / 2));
    }
    if (nqType === 'priority' && nq?.options?.length) {
      const even = Math.floor(100 / nq.options.length);
      const init: Record<string,number> = {};
      nq.options.forEach((o: any, i: number) => { init[o.id] = i === 0 ? 100 - even*(nq.options.length-1) : even; });
      setPriority(init);
    }
  };

  /* ── Fullscreen ── */
  useEffect(() => {
    if (!poll?.settings?.fullscreenMode || showPre || submitted) return;
    const enterFs = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setFsExited(false);
        }
      } catch { /* denied */ }
    };
    const onFsChange = () => {
      setFsExited(!document.fullscreenElement && !!poll?.settings?.fullscreenMode);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    // Also try vendor prefixes
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    enterFs();
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      const el = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (el) {
        (document.exitFullscreen || (document as any).webkitExitFullscreen || (() => {})).call(document).catch(() => {});
      }
    };
  }, [poll?.settings?.fullscreenMode, showPre, submitted]);

  /* ── Timer ── */
  useEffect(() => {
    const limit = q?.timeLimit ?? poll?.settings?.timeLimit;
    if (!limit || showPre || submitted) return;
    setTimeLeft(limit);
    const id = setInterval(() => setTimeLeft(t => {
      if (!t || t <= 1) { clearInterval(id); handleSubmit(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, showPre, poll]);

  /* ── Tab detection ── */
  useEffect(() => {
    if (!poll?.settings?.preventTabSwitch || showPre || submitted) return;
    const handleVis = () => {
      if (!document.hidden) return;
      setTabWarns(w => {
        const next = w + 1;
        const sev  = next >= 3 ? 'high' : next >= 2 ? 'medium' : 'low';
        fetch(`/api/polls/${pollId}/tab-switch`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('op_token')||''}` },
          body: JSON.stringify({ studentName: user?.name ?? 'Guest', studentEmail: user?.email, pollTitle: poll.title, switchCount: next, severity: sev }),
        }).catch(() => {});
        if (next >= 3) {
          toast.error('⛔ Final warning! Submitting your quiz now.', { duration: 4000 });
          setTimeout(handleSubmit, 3000);
        } else {
          toast.warning(`⚠️ Tab switch detected (${next}/3) — your teacher has been notified!`, { duration: 5000 });
        }
        return next;
      });
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll, showPre, submitted, user]);

  /* ── Pusher: poll closed ── */
  usePollChannel(pollId, {
    'poll-closed': () => { toast.info('Poll closed by host'); handleSubmit(); },
    'poll-opened': () => { toast.success('Poll reopened!'); },
  });

  const saveCurrentAnswer = () => {
    setAllAnswers(prev => ({
      ...prev,
      [currentQ]: { selected, text: textAns, num: numAns, ranking: [...ranking], matrix: {...matrixAns}, match: {...matchAns}, priority: {...priority} },
    }));
  };

  const loadAnswer = (qi: number) => {
    const saved = allAnswers[qi];
    if (saved) {
      setSelected(saved.selected ?? []);
      setTextAns(saved.text ?? '');
      setNumAns(saved.num ?? 5);
      setRanking(saved.ranking?.length ? saved.ranking : (questions[qi]?.options ?? []).map((o: any) => o.id));
      setMatrixAns(saved.matrix ?? {});
      setMatchAns(saved.match ?? {});
      setPriority(saved.priority ?? {});
    } else {
      setSelected([]); setTextAns(''); setStarRating(0);
      setRanking((questions[qi]?.options ?? []).map((o: any) => o.id));
      setMatrixAns({}); setMatchAns({});
      setupQ(qi, questions);
    }
  };

  const goToQ = (qi: number) => {
    saveCurrentAnswer(); setCurrentQ(qi); loadAnswer(qi); setTimeLeft(null);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted || !poll) return;
    setSubmitting(true);
    saveCurrentAnswer();
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000);
    const answerData = {
      selectedOptions: selected, textAnswer: textAns||undefined, numericAnswer: numAns,
      rankingOrder: ranking.length ? ranking : undefined,
      matrixAnswers: Object.keys(matrixAns).length ? matrixAns : undefined,
      matchAnswers: Object.keys(matchAns).length ? matchAns : undefined,
      priorityAllocation: Object.keys(priority).length ? priority : undefined,
      heatmapX: heatXY?.x, heatmapY: heatXY?.y, timeTaken, allAnswers,
    };
    try {
      if (attemptId) await attemptsApi.submit(attemptId, answerData);
      else           await voteApi.cast(poll.id, answerData);
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message ?? 'Submission failed');
    } finally { setSubmitting(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll, submitting, submitted, selected, textAns, numAns, ranking, matrixAns, matchAns, priority, heatXY, attemptId]);

  const moveRank = (idx: number, dir: -1|1) => {
    const r = [...ranking]; const sw = idx+dir;
    if (sw < 0 || sw >= r.length) return;
    [r[idx],r[sw]] = [r[sw],r[idx]]; setRanking(r);
  };

  /* ── Priority helpers ── */
  const totalPriority = Object.values(priority).reduce((a, b) => a + b, 0);
  const adjustPriority = (id: string, delta: number) => {
    setPriority(prev => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, Math.min(cur + delta, 100 - (totalPriority - cur)));
      return { ...prev, [id]: next };
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-terracotta-400"/>
    </div>
  );
  if (!poll) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">😕</div><p className="text-slate-600">Poll not found</p></div>
    </div>
  );

  if (showPre) return (
    <PreQuiz poll={poll} guestName={user?.name ?? sp.get('name') ?? undefined} onJoin={() => { setShowPre(false); startRef.current = Date.now(); setupQ(0, questions); }}/>
  );

  if (submitted) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center max-w-sm w-full">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.1 }}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500"/>
          </div>
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">Responses Saved!</h2>
        <p className="text-slate-500 mb-2 text-sm">Your answers have been recorded successfully.</p>
        {attemptId
          ? <p className="text-xs text-slate-400 mb-6">Your teacher will release results shortly. You'll see your score and full key sheet once available.</p>
          : <p className="text-xs text-slate-400 mb-6">Thank you for participating!</p>}
        <div className="space-y-2">
          {attemptId && (
            <button onClick={() => navigate(`/attempt/${attemptId}/keysheet`)}
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Star size={15}/> View Key Sheet
            </button>
          )}
          {user && (
            <button onClick={() => navigate('/student/results')}
              className="w-full py-2.5 bg-white border border-cream-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-cream-100 transition-all">
              My Results Dashboard
            </button>
          )}
          <button onClick={() => navigate('/join')}
            className="w-full py-2.5 bg-cream-100 border border-cream-200 text-slate-500 rounded-xl text-sm hover:bg-cream-200 transition-all">
            Join Another Poll
          </button>
        </div>
      </motion.div>
    </div>
  );

  /* ── Fullscreen ESC overlay ── */
  if (fsExited && poll?.settings?.fullscreenMode) return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center max-w-xs w-full">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-400"/>
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-2">Fullscreen Required</h2>
        <p className="text-slate-400 text-sm mb-6">This quiz requires fullscreen mode. Please re-enter to continue.</p>
        <button
          onClick={async () => {
            try {
              const el = document.documentElement as any;
              const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
              if (requestFs) await requestFs.call(el);
            } catch { toast.error('Could not enter fullscreen. Please check browser settings.'); }
          }}
          className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-bold text-sm transition-all mb-2">
          Re-enter Fullscreen
        </button>
        <p className="text-xs text-slate-500">Your progress is saved. Return to fullscreen to continue.</p>
      </motion.div>
    </div>
  );

  const timerPct    = poll.settings?.timeLimit ? ((timeLeft ?? 0) / poll.settings.timeLimit) * 100 : 100;
  const timerDanger = timeLeft !== null && timeLeft < 10;
  const opts        = (q?.options ?? poll.options) as any[];

  /* ── Matching helpers ── */
  const matchPairs: {id:string;left:string;right:string}[] = (q as any)?.matchPairs ?? [];
  const rightOptions = matchPairs.map(p => p.right);

  /* ── Bracket voting (current round) ── */
  const bracketPairs: [any, any][] = [];
  for (let i = 0; i < opts.length - 1; i += 2) {
    bracketPairs.push([opts[i], opts[i+1]]);
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-cream-300 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400">{pollTypeLabel(poll.type)}</p>
              <h1 className="font-display font-semibold text-slate-800 text-sm truncate max-w-[200px]">{poll.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {tabWarns > 0 && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${tabWarns >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  <AlertTriangle size={12}/> {tabWarns}/3
                </div>
              )}
              {timeLeft !== null && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${timerDanger ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-terracotta-100 text-terracotta-700'}`}>
                  <Clock size={14}/> {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>
          {poll.settings?.showProgressBar && totalQ > 1 && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Q{currentQ+1} of {totalQ}</span>
                <span>{Math.round(((currentQ+1)/totalQ)*100)}%</span>
              </div>
              <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                <motion.div className="h-full bg-terracotta-500 rounded-full"
                  style={{ width:`${((currentQ+1)/totalQ)*100}%` }} transition={{ duration:0.3 }}/>
              </div>
            </div>
          )}
          {timeLeft !== null && poll.settings?.timeLimit && (
            <div className="mt-1.5 h-1 bg-cream-200 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${timerDanger ? 'bg-red-500' : 'bg-terracotta-400'}`}
                style={{ width:`${timerPct}%` }} transition={{ duration:1 }}/>
            </div>
          )}
          {tabWarns > 0 && (
            <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${tabWarns >= 3 ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
              <Eye size={12}/>
              {tabWarns >= 3 ? '⛔ Final warning — next switch will auto-submit your quiz!' : `⚠️ Tab switch detected (${tabWarns}/3) — teacher has been alerted`}
            </div>
          )}
        </div>
      </div>

      {/* Question number bar */}
      {totalQ > 1 && (
        <div className="bg-white border-b border-cream-200 px-4 py-2 overflow-x-auto">
          <div className="flex gap-1.5 max-w-xl mx-auto">
            {questions.map((_: any, i: number) => {
              const answered = !!allAnswers[i]?.selected?.length || !!allAnswers[i]?.text || i === currentQ;
              return (
                <button key={i} onClick={() => goToQ(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${
                    i === currentQ ? 'bg-terracotta-500 text-white ring-2 ring-terracotta-200' :
                    answered       ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-slate-600 hover:bg-cream-300'}`}>
                  {i+1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-xl">
          {/* Question title card */}
          <div className="op-card p-5 mb-4">
            {totalQ > 1 && <p className="text-xs font-bold text-terracotta-500 mb-2">Question {currentQ+1}</p>}
            <p className="font-display font-semibold text-slate-800 text-lg leading-snug">{q?.title || poll.title}</p>
            {q?.description && <p className="text-sm text-slate-500 mt-1">{q.description}</p>}
            {q?.points && <p className="text-xs text-slate-400 mt-2">{q.points} pt{q.points !== 1 ? 's' : ''}</p>}
          </div>

          {/* ── Answer card ── */}
          <AnimatePresence mode="wait">
            <motion.div key={`${currentQ}-${qType}`}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="op-card p-5">

              {/* ─── Multiple Choice / Quiz / True-False / Image Choice ─── */}
              {['multiple_choice','quiz','true_false','image_choice'].includes(qType) && (() => {
                const isMultiAnswer = Boolean((q as any)?.multipleCorrect);
                const isTF = qType === 'true_false';
                const displayOpts = isTF ? [{id:'t',text:'True'},{id:'f',text:'False'}] : opts;
                return (
                  <div className="space-y-2">
                    {isMultiAnswer && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 mb-3">
                        <CheckCircle size={13}/> <span><strong>Multi-answer</strong> — select all that apply</span>
                      </div>
                    )}
                    {displayOpts.map((opt: any, oi: number) => {
                      const isSelected = selected.includes(opt.id);
                      const toggle = () => isMultiAnswer
                        ? setSelected(prev => prev.includes(opt.id) ? prev.filter(id=>id!==opt.id) : [...prev, opt.id])
                        : setSelected([opt.id]);
                      return (
                        <button key={opt.id} onClick={toggle}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isSelected ? 'border-terracotta-500 bg-terracotta-50' : 'border-cream-300 bg-white hover:border-terracotta-300'}`}>
                          {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0"/>}
                          <span className={`w-7 h-7 ${isMultiAnswer?'rounded-md':'rounded-full'} border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${isSelected ? 'border-terracotta-500 bg-terracotta-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                            {isSelected ? <CheckCircle size={14}/> : String.fromCharCode(65+oi)}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ─── Fill in Blank ─── */}
              {qType === 'fill_blank' && (
                <div>
                  <p className="text-xs text-slate-500 mb-3">Type your answer in the blank:</p>
                  <input
                    value={textAns}
                    onChange={e => setTextAns(e.target.value)}
                    placeholder="Your answer…"
                    className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none bg-cream-50 font-medium"
                  />
                </div>
              )}

              {/* ─── Open / Word Cloud / QA ─── */}
              {['word_cloud','open_ended','qa'].includes(qType) && (
                <textarea value={textAns} onChange={e => setTextAns(e.target.value)} rows={4}
                  placeholder={qType === 'word_cloud' ? 'Enter a word or phrase…' : qType === 'qa' ? 'Ask your question…' : 'Write your response…'}
                  className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none resize-none bg-cream-50"/>
              )}

              {/* ─── NPS ─── */}
              {qType === 'nps' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">How likely are you to recommend? (0–10)</p>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({length:11},(_,i)=>i).map(n => (
                      <button key={n} onClick={() => setNumAns(n)}
                        className={`h-10 rounded-lg text-sm font-bold transition-all ${numAns===n ? 'bg-terracotta-500 text-white shadow-md scale-110' : 'bg-cream-200 text-slate-600 hover:bg-terracotta-100'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 px-0.5">
                    <span>Not likely</span><span>Extremely likely</span>
                  </div>
                </div>
              )}

              {/* ─── Star Rating ─── */}
              {qType === 'rating' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">Tap a star to rate</p>
                  <div className="flex items-center justify-center gap-3 py-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setNumAns(n)}
                        onMouseEnter={() => setStarRating(n)} onMouseLeave={() => setStarRating(0)}
                        className={`transition-transform hover:scale-125 ${(starRating||numAns)>=n ? 'text-yellow-400' : 'text-slate-300'}`}>
                        <Star size={40} fill={(starRating||numAns)>=n ? 'currentColor' : 'none'}/>
                      </button>
                    ))}
                  </div>
                  {numAns > 0 && <p className="text-center text-sm font-semibold text-terracotta-600 mt-2">{numAns} / 5 stars</p>}
                </div>
              )}

              {/* ─── Slider ─── */}
              {qType === 'slider' && (
                <div className="py-2">
                  <div className="text-center text-4xl font-display font-bold text-terracotta-600 mb-6">{numAns}</div>
                  <input
                    type="range"
                    min={sliderMin} max={sliderMax}
                    step={(q as any)?.sliderStep ?? 1}
                    value={numAns}
                    onChange={e => setNumAns(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer accent-terracotta-500"
                    style={{ background: `linear-gradient(to right, #c1674f ${((numAns-sliderMin)/(sliderMax-sliderMin))*100}%, #e8ddd4 ${((numAns-sliderMin)/(sliderMax-sliderMin))*100}%)` }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>{sliderMin}</span>
                    <span>{Math.round((sliderMin+sliderMax)/2)}</span>
                    <span>{sliderMax}</span>
                  </div>
                </div>
              )}

              {/* ─── Ranking ─── */}
              {qType === 'ranking' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 text-center mb-2">Use arrows to rank — drag top item first</p>
                  {ranking.map((id, idx) => {
                    const opt = opts.find((o: any) => o.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-cream-50 border border-cream-300 rounded-xl">
                        <span className="w-6 h-6 bg-terracotta-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx+1}</span>
                        <span className="flex-1 text-sm font-medium text-slate-700">{opt?.text}</span>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveRank(idx,-1)} disabled={idx===0} className="p-1 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronUp size={14}/></button>
                          <button onClick={() => moveRank(idx,1)} disabled={idx===ranking.length-1} className="p-1 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronDown size={14}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── Matrix Grid ─── */}
              {qType === 'matrix' && poll.matrixRows && poll.matrixCols && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr>
                      <th className="text-left py-2 pr-4"/>
                      {poll.matrixCols.map((c: any) => <th key={c.id} className="text-center py-2 px-2 text-xs text-slate-600 font-medium">{c.text}</th>)}
                    </tr></thead>
                    <tbody>
                      {poll.matrixRows.map((row: any) => (
                        <tr key={row.id} className="border-t border-cream-200">
                          <td className="py-3 pr-4 text-slate-700 font-medium text-xs">{row.text}</td>
                          {poll.matrixCols!.map((col: any) => (
                            <td key={col.id} className="text-center py-3 px-2">
                              <button onClick={() => setMatrixAns(m => ({...m,[row.id]:col.id}))}
                                className={`w-5 h-5 rounded-full border-2 mx-auto transition-all ${matrixAns[row.id]===col.id ? 'border-terracotta-500 bg-terracotta-500' : 'border-slate-300 hover:border-terracotta-300'}`}>
                                {matrixAns[row.id]===col.id && <span className="block w-2 h-2 bg-white rounded-full m-auto mt-0.5"/>}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─── Heatmap Click ─── */}
              {qType === 'heatmap' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">Click the area you'd choose</p>
                  <div ref={heatRef} onClick={e => {
                    const r = heatRef.current?.getBoundingClientRect();
                    if (!r) return;
                    setHeatXY({ x: Math.round(((e.clientX-r.left)/r.width)*100), y: Math.round(((e.clientY-r.top)/r.height)*100) });
                  }} className="relative w-full h-52 bg-gradient-to-br from-cream-200 to-cream-400 rounded-xl cursor-crosshair border-2 border-cream-300 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Click anywhere on the grid</div>
                    {heatXY && (
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        style={{ left:`${heatXY.x}%`, top:`${heatXY.y}%` }}
                        className="absolute w-6 h-6 bg-terracotta-500 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2">
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-terracotta-600 text-white px-1 rounded whitespace-nowrap">{heatXY.x},{heatXY.y}</span>
                      </motion.div>
                    )}
                  </div>
                  {heatXY && <p className="text-xs text-terracotta-600 text-center mt-2 font-medium">Selected: ({heatXY.x}%, {heatXY.y}%)</p>}
                </div>
              )}

              {/* ─── Emoji Reactions ─── */}
              {qType === 'emoji' && (
                <div className="grid grid-cols-4 gap-3 py-2">
                  {(opts.length ? opts : [{id:'1',text:'😍'},{id:'2',text:'😊'},{id:'3',text:'😐'},{id:'4',text:'😞'}]).map((opt: any) => (
                    <button key={opt.id} onClick={() => setSelected([opt.id])}
                      className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-50 scale-110' : 'border-cream-300 hover:border-terracotta-300'}`}>
                      <span className="text-4xl">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Live Matching (match pairs) ─── */}
              {qType === 'matching' && matchPairs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-3">Match each item on the left with the correct option on the right</p>
                  {matchPairs.map((pair) => (
                    <div key={pair.id} className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 bg-terracotta-50 border border-terracotta-200 rounded-xl text-sm font-medium text-slate-700">
                        {pair.left}
                      </div>
                      <span className="text-slate-400 text-lg">→</span>
                      <select
                        value={matchAns[pair.id] ?? ''}
                        onChange={e => setMatchAns(m => ({...m, [pair.id]: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none">
                        <option value="">Select…</option>
                        {rightOptions.map((r, i) => (
                          <option key={i} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 text-center pt-1">
                    {Object.keys(matchAns).length}/{matchPairs.length} matched
                  </p>
                </div>
              )}

              {/* ─── 100-Point Priority ─── */}
              {qType === 'priority' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500">Allocate 100 points across options</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalPriority === 100 ? 'bg-green-100 text-green-700' : totalPriority > 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {totalPriority}/100 pts
                    </span>
                  </div>
                  {opts.map((opt: any) => {
                    const val = priority[opt.id] ?? 0;
                    const pct = val;
                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 font-medium">{opt.text}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => adjustPriority(opt.id, -5)} className="w-6 h-6 rounded-md bg-cream-200 hover:bg-cream-300 text-slate-600 flex items-center justify-center transition-all">
                              <Minus size={11}/>
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-terracotta-600">{val}</span>
                            <button onClick={() => adjustPriority(opt.id, 5)} className="w-6 h-6 rounded-md bg-cream-200 hover:bg-cream-300 text-slate-600 flex items-center justify-center transition-all">
                              <Plus size={11}/>
                            </button>
                          </div>
                        </div>
                        <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-terracotta-500 rounded-full"
                            style={{ width: `${pct}%` }} transition={{ duration:0.2 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── Bracket Vote ─── */}
              {qType === 'bracket' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 text-center mb-3">Vote for your favourite in each match-up</p>
                  {bracketPairs.map(([a, b], pi) => {
                    const selectedA = selected.includes(a.id);
                    const selectedB = selected.includes(b.id);
                    return (
                      <div key={pi} className="flex items-center gap-3">
                        <button onClick={() => setSelected(prev => {
                            const withoutB = prev.filter(id => id !== b?.id);
                            return withoutB.includes(a.id) ? withoutB.filter(id => id !== a.id) : [...withoutB, a.id];
                          })}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${selectedA ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-cream-300 hover:border-terracotta-300 text-slate-700'}`}>
                          {a.text}
                          {selectedA && <span className="ml-2 text-xs">✓</span>}
                        </button>
                        <span className="text-xs font-bold text-slate-400 flex-shrink-0">VS</span>
                        <button onClick={() => setSelected(prev => {
                            const withoutA = prev.filter(id => id !== a?.id);
                            return withoutA.includes(b.id) ? withoutA.filter(id => id !== b.id) : [...withoutA, b.id];
                          })}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${selectedB ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-cream-300 hover:border-terracotta-300 text-slate-700'}`}>
                          {b.text}
                          {selectedB && <span className="ml-2 text-xs">✓</span>}
                        </button>
                      </div>
                    );
                  })}
                  {opts.length % 2 !== 0 && (
                    <p className="text-xs text-slate-400 text-center">One item auto-advances this round</p>
                  )}
                </div>
              )}

              {/* ─── Countdown Timer display ─── */}
              {qType === 'countdown' && (
                <div className="text-center py-6">
                  <div className={`text-7xl font-display font-bold mb-4 transition-colors ${countdown === 0 ? 'text-green-500' : countdown !== null && countdown < 10 ? 'text-red-500 animate-pulse' : 'text-terracotta-600'}`}>
                    {countdown !== null ? formatTime(countdown) : '—'}
                  </div>
                  {countdown === 0
                    ? <p className="text-lg font-semibold text-green-600">Time's up! ⏰</p>
                    : <p className="text-sm text-slate-500">Countdown in progress — stay focused!</p>}
                </div>
              )}

              {/* ─── Poll Series — handled by multi-Q ─── */}
              {qType === 'series' && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  <p>This is a series poll — answer each question in sequence using the navigation above.</p>
                </div>
              )}

              {/* ─── Submit / Next ─── */}
              <div className="flex gap-2 mt-5">
                {totalQ > 1 && currentQ < totalQ - 1 ? (
                  <button onClick={() => goToQ(currentQ+1)}
                    className="flex-1 flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                    Next Question <ArrowRight size={15}/>
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                    {submitting ? <><Loader2 size={15} className="animate-spin"/>Submitting…</> : <>Submit <ArrowRight size={15}/></>}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
