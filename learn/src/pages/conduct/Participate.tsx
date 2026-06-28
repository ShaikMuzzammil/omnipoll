import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Clock, CheckCircle, Star, ChevronUp, ChevronDown,
  ArrowRight, AlertTriangle, Shield, Eye,
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
  const [showPre,    setShowPre]    = useState(true);  // Pre-quiz screen
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);
  const [tabWarns,   setTabWarns]   = useState(0);
  const [tabBlocked, setTabBlocked] = useState(false);
  const [currentQ,   setCurrentQ]   = useState(0);
  const [fsExited,   setFsExited]   = useState(false);

  // Answers
  const [selected,    setSelected]   = useState<string[]>([]);
  const [textAns,     setTextAns]    = useState('');
  const [numAns,      setNumAns]     = useState(5);
  const [ranking,     setRanking]    = useState<string[]>([]);
  const [matrixAns,   setMatrixAns]  = useState<Record<string,string>>({});
  const [heatXY,      setHeatXY]     = useState<{x:number;y:number}|null>(null);
  const [starRating,  setStarRating] = useState(0);
  const [allAnswers,  setAllAnswers] = useState<Record<number, {
    selected:string[]; text:string; num:number; ranking:string[]; matrix:Record<string,string>;
  }>>({});

  const heatRef  = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(Date.now());
  const pusherRef = useRef<any>(null);

  // Detect multi-question quiz
  // Build questions array: use poll.questions if available (multi-Q), else wrap single poll as one question
  const questions = (() => {
    if (!poll) return [];
    const qs = (poll as any).questions;
    if (qs && Array.isArray(qs) && qs.length > 0) return qs;
    // Single-question poll: wrap options into one question object
    return [{ ...poll, options: poll.options, title: poll.title }];
  })();
  const totalQ    = Math.max(questions.length, 1);
  const q         = questions[currentQ] ?? questions[0];

  /* ── Load poll ── */
  useEffect(() => {
    if (!pollId) return;
    pollsApi.get(pollId).then(p => {
      const poll = p as Poll;
      setPoll(poll);
      if (['ranking','bracket'].includes(poll.type)) setRanking(poll.options.map(o => o.id));
    }).catch(() => toast.error('Poll not found')).finally(() => setLoading(false));
  }, [pollId]);

  /* ── Fullscreen mode + ESC interception ── */
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
      if (!document.fullscreenElement && poll?.settings?.fullscreenMode) {
        setFsExited(true); // show re-enter overlay
      } else {
        setFsExited(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    enterFs();
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
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

        // Push event to teacher via API
        fetch(`/api/polls/${pollId}/tab-switch`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('op_token')||''}` },
          body: JSON.stringify({
            studentName:  user?.name ?? 'Guest',
            studentEmail: user?.email,
            pollTitle:    poll.title,
            switchCount:  next, severity: sev,
          }),
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

  /* ── Pusher: poll closed by teacher ── */
  usePollChannel(pollId, {
    'poll-closed': () => { toast.info('Poll closed by host'); handleSubmit(); },
  });

  const saveCurrentAnswer = () => {
    setAllAnswers(prev => ({
      ...prev,
      [currentQ]: { selected, text: textAns, num: numAns, ranking: [...ranking], matrix: {...matrixAns} },
    }));
  };

  const loadAnswer = (qi: number) => {
    const saved = allAnswers[qi];
    if (saved) {
      setSelected(saved.selected);
      setTextAns(saved.text);
      setNumAns(saved.num);
      setRanking(saved.ranking.length ? saved.ranking : (questions[qi]?.options ?? []).map((o: any) => o.id));
      setMatrixAns(saved.matrix);
    } else {
      setSelected([]); setTextAns(''); setNumAns(5);
      setRanking((questions[qi]?.options ?? []).map((o: any) => o.id));
      setMatrixAns({});
    }
  };

  const goToQ = (qi: number) => {
    saveCurrentAnswer();
    setCurrentQ(qi);
    loadAnswer(qi);
    setTimeLeft(null);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted || !poll) return;
    setSubmitting(true);
    saveCurrentAnswer();
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000);
    const answerData = { selectedOptions: selected, textAnswer: textAns||undefined, numericAnswer: numAns,
      rankingOrder: ranking.length ? ranking : undefined, matrixAnswers: Object.keys(matrixAns).length ? matrixAns : undefined,
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
  }, [poll, submitting, submitted, selected, textAns, numAns, ranking, matrixAns, heatXY, attemptId]);

  const moveRank = (idx: number, dir: -1|1) => {
    const r = [...ranking]; const sw = idx+dir;
    if (sw < 0 || sw >= r.length) return;
    [r[idx],r[sw]] = [r[sw],r[idx]];
    setRanking(r);
  };

  /* ── Loading ── */
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

  /* ── Pre-quiz screen ── */
  if (showPre) return (
    <PreQuiz poll={poll} guestName={user?.name ?? sp.get('name') ?? undefined} onJoin={() => { setShowPre(false); startRef.current = Date.now(); }}/>
  );

  /* ── Submitted screen ── */
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
        {attemptId ? (
          <p className="text-xs text-slate-400 mb-6">
            Your teacher will release results shortly. You’ll see your score and full key sheet once available.
          </p>
        ) : (
          <p className="text-xs text-slate-400 mb-6">Thank you for participating!</p>
        )}
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
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        className="text-center max-w-xs w-full">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-400"/>
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-2">Fullscreen Required</h2>
        <p className="text-slate-400 text-sm mb-6">This quiz requires fullscreen mode. Please re-enter fullscreen to continue.</p>
        <button
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen();
            } catch { toast.error('Could not enter fullscreen. Please allow fullscreen in browser settings.'); }
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
              {/* Tab warnings */}
              {tabWarns > 0 && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${tabWarns >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  <AlertTriangle size={12}/> {tabWarns}/3
                </div>
              )}
              {/* Timer */}
              {timeLeft !== null && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${timerDanger ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-terracotta-100 text-terracotta-700'}`}>
                  <Clock size={14}/> {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
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

          {/* Timer bar */}
          {timeLeft !== null && poll.settings?.timeLimit && (
            <div className="mt-1.5 h-1 bg-cream-200 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${timerDanger ? 'bg-red-500' : 'bg-terracotta-400'}`}
                style={{ width:`${timerPct}%` }} transition={{ duration:1 }}/>
            </div>
          )}

          {/* Tab warning banner */}
          {tabWarns > 0 && (
            <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${tabWarns >= 3 ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
              <Eye size={12}/>
              {tabWarns >= 3
                ? '⛔ Final warning — next switch will auto-submit your quiz!'
                : `⚠️ Tab switch detected (${tabWarns}/3) — teacher has been alerted`}
            </div>
          )}
        </div>
      </div>

      {/* Multi-question number bar */}
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
          {/* Question title */}
          <div className="op-card p-5 mb-4">
            {totalQ > 1 && <p className="text-xs font-bold text-terracotta-500 mb-2">Question {currentQ+1}</p>}
            <p className="font-display font-semibold text-slate-800 text-lg leading-snug">
              {q?.title || poll.title}
            </p>
            {q?.description && <p className="text-sm text-slate-500 mt-1">{q.description}</p>}
            {q?.points && <p className="text-xs text-slate-400 mt-2">{q.points} pt{q.points !== 1 ? 's' : ''}</p>}
          </div>

          {/* Answer area */}
          <AnimatePresence mode="wait">
            <motion.div key={`${currentQ}-${poll.type}`}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="op-card p-5">

              {/* MC / Quiz / TF — single or multi-answer */}
              {['multiple_choice','quiz','true_false','image_choice'].includes(q?.type ?? poll.type) && (() => {
                const isMultiAnswer = Boolean((q as any)?.multipleCorrect);
                const isTF = (q?.type ?? poll.type) === 'true_false';
                const displayOpts = isTF ? [{id:'t',text:'True'},{id:'f',text:'False'}] : opts;
                return (
                  <div className="space-y-2">
                    {isMultiAnswer && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 mb-3">
                        <CheckCircle size={13}/> <span><span className="font-bold">Multi-answer question</span> — select all that apply</span>
                      </div>
                    )}
                    {displayOpts.map((opt: any, oi: number) => {
                      const isSelected = selected.includes(opt.id);
                      const toggle = () => {
                        if (isMultiAnswer) {
                          setSelected(prev => prev.includes(opt.id) ? prev.filter(id=>id!==opt.id) : [...prev, opt.id]);
                        } else {
                          setSelected([opt.id]);
                        }
                      };
                      return (
                        <button key={opt.id} onClick={toggle}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                            isSelected ? 'border-terracotta-500 bg-terracotta-50' : 'border-cream-300 bg-white hover:border-terracotta-300'}`}>
                          <span className={`w-7 h-7 ${isMultiAnswer?'rounded-md':'rounded-full'} border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${isSelected ? 'border-terracotta-500 bg-terracotta-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                            {isMultiAnswer ? (isSelected ? <CheckCircle size={14}/> : String.fromCharCode(65+oi)) : String.fromCharCode(65+oi)}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                          {isMultiAnswer && isSelected && <span className="ml-auto text-xs text-terracotta-600 font-bold">✓ Selected</span>}
                        </button>
                      );
                    })}
                    {isMultiAnswer && selected.length > 0 && (
                      <p className="text-xs text-slate-400 text-center pt-1">{selected.length} option{selected.length!==1?'s':''} selected</p>
                    )}
                  </div>
                );
              })()}

              {/* Open / Word Cloud / Fill blank */}
              {['word_cloud','open_ended','fill_blank','qa'].includes(q?.type ?? poll.type) && (
                <textarea value={textAns} onChange={e => setTextAns(e.target.value)}
                  rows={3} placeholder={poll.type === 'fill_blank' ? 'Type your answer…' : poll.type === 'word_cloud' ? 'Enter a word or phrase…' : 'Write your response…'}
                  className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none resize-none bg-cream-50"/>
              )}

              {/* NPS */}
              {(q?.type ?? poll.type) === 'nps' && (
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
                  <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                    <span>Not likely</span><span>Extremely likely</span>
                  </div>
                </div>
              )}

              {/* Rating */}
              {(q?.type ?? poll.type) === 'rating' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setNumAns(n)}
                      onMouseEnter={() => setStarRating(n)} onMouseLeave={() => setStarRating(0)}
                      className={`transition-transform hover:scale-125 ${(starRating||numAns)>=n ? 'text-yellow-400' : 'text-slate-300'}`}>
                      <Star size={40} fill={(starRating||numAns)>=n ? 'currentColor' : 'none'}/>
                    </button>
                  ))}
                </div>
              )}

              {/* Slider */}
              {(q?.type ?? poll.type) === 'slider' && (
                <div className="py-4">
                  <div className="text-center text-3xl font-display font-bold text-terracotta-600 mb-4">{numAns}</div>
                  <input type="range" min={0} max={100} value={numAns} onChange={e => setNumAns(Number(e.target.value))}
                    className="w-full h-2 bg-cream-300 rounded-full appearance-none cursor-pointer accent-terracotta-500"/>
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>100</span></div>
                </div>
              )}

              {/* Ranking */}
              {(q?.type ?? poll.type) === 'ranking' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 text-center mb-2">Use arrows to rank from best to least</p>
                  {ranking.map((id, idx) => {
                    const opt = opts.find((o: any) => o.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-cream-50 border border-cream-300 rounded-xl">
                        <span className="w-6 h-6 bg-terracotta-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx+1}</span>
                        <span className="flex-1 text-sm font-medium text-slate-700">{opt?.text}</span>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveRank(idx,-1)} disabled={idx===0} className="p-0.5 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronUp size={14}/></button>
                          <button onClick={() => moveRank(idx,1)} disabled={idx===ranking.length-1} className="p-0.5 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronDown size={14}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Heatmap */}
              {(q?.type ?? poll.type) === 'heatmap' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">Click on the area you'd choose</p>
                  <div ref={heatRef} onClick={e => {
                    const r = heatRef.current?.getBoundingClientRect();
                    if (!r) return;
                    setHeatXY({ x:Math.round(((e.clientX-r.left)/r.width)*100), y:Math.round(((e.clientY-r.top)/r.height)*100) });
                  }} className="relative w-full h-48 bg-gradient-to-br from-cream-200 to-cream-400 rounded-xl cursor-crosshair border-2 border-cream-300 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Click anywhere</div>
                    {heatXY && (
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        style={{ left:`${heatXY.x}%`, top:`${heatXY.y}%` }}
                        className="absolute w-5 h-5 bg-terracotta-500 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2"/>
                    )}
                  </div>
                </div>
              )}

              {/* Emoji */}
              {(q?.type ?? poll.type) === 'emoji' && (
                <div className="grid grid-cols-4 gap-3 py-2">
                  {(opts.length ? opts : [{id:'1',text:'😍'},{id:'2',text:'😊'},{id:'3',text:'😐'},{id:'4',text:'😞'}]).map((opt: any) => (
                    <button key={opt.id} onClick={() => setSelected([opt.id])}
                      className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-50 scale-110' : 'border-cream-300 hover:border-terracotta-300'}`}>
                      <span className="text-4xl">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Matrix */}
              {(q?.type ?? poll.type) === 'matrix' && poll.matrixRows && poll.matrixCols && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr>
                      <th className="text-left py-2 pr-4"></th>
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

              {/* Submit / Next */}
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
