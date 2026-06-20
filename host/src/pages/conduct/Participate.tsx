import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, CheckCircle, Star, ChevronUp, ChevronDown, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi, attemptsApi, voteApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel } from '@/lib/utils';
import type { Poll, Attempt } from '@/lib/types';

export default function Participate() {
  const { pollId }   = useParams<{ pollId: string }>();
  const [sp]         = useSearchParams();
  const attemptId    = sp.get('attempt');
  const navigate     = useNavigate();

  const [poll,       setPoll]       = useState<Poll | null>(null);
  const [attempt,    setAttempt]    = useState<Attempt | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);
  const [tabWarns,   setTabWarns]   = useState(0);

  // Answer state
  const [selected,   setSelected]   = useState<string[]>([]);
  const [textAns,    setTextAns]    = useState('');
  const [numAns,     setNumAns]     = useState<number>(5);
  const [ranking,    setRanking]    = useState<string[]>([]);
  const [matrixAns,  setMatrixAns]  = useState<Record<string,string>>({});
  const [priorityAns,setPriorityAns]= useState<Record<string,number>>({});
  const [starRating, setStarRating] = useState(0);
  const [heatXY,     setHeatXY]     = useState<{x:number,y:number}|null>(null);
  const heatRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const startRef = useRef<number>(Date.now());

  // Load poll + attempt
  useEffect(() => {
    if (!pollId) return;
    Promise.all([
      pollsApi.get(pollId),
      attemptId ? attemptsApi.get(attemptId) : null,
    ]).then(([p, a]) => {
      const poll = p as Poll;
      setPoll(poll);
      if (a) setAttempt(a as Attempt);
      // Init ranking with option ids
      if (['ranking','bracket'].includes(poll.type)) {
        setRanking(poll.options.map(o => o.id));
      }
      // Init priority with equal points
      if (poll.type === 'priority') {
        const each = Math.floor(100 / poll.options.length);
        const init: Record<string,number> = {};
        poll.options.forEach(o => { init[o.id] = each; });
        setPriorityAns(init);
      }
      // Start timer
      if (poll.settings.timeLimit) {
        setTimeLeft(poll.settings.timeLimit);
      }
    }).catch(() => toast.error('Failed to load poll')).finally(() => setLoading(false));
  }, [pollId, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setInterval(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  // Tab-switch detection
  useEffect(() => {
    if (!poll?.settings.preventTabSwitch) return;
    const handleVis = () => {
      if (document.hidden) {
        setTabWarns(w => {
          const next = w + 1;
          toast.warning(`⚠️ Tab switch detected (${next}/3)`);
          if (next >= 3) { toast.error('Too many tab switches. Submitting…'); handleSubmit(); }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll]);

  // Realtime: close signal from presenter
  usePollChannel(pollId, {
    'poll-closed': () => { toast.info('Poll has been closed by the host'); handleSubmit(); },
  });

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted || !poll) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000);

    const answerData = {
      selectedOptions: selected,
      textAnswer: textAns || undefined,
      numericAnswer: ['slider','nps','rating'].includes(poll.type) ? numAns : undefined,
      rankingOrder: ['ranking','bracket'].includes(poll.type) ? ranking : undefined,
      matrixAnswers: poll.type === 'matrix' ? matrixAns : undefined,
      heatmapX: heatXY?.x, heatmapY: heatXY?.y,
      timeTaken,
    };

    try {
      if (attemptId) {
        await attemptsApi.submit(attemptId, answerData);
      } else {
        await voteApi.cast(poll.id, answerData);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [poll, submitting, submitted, selected, textAns, numAns, ranking, matrixAns, heatXY, attemptId]);

  const moveRank = (idx: number, dir: -1 | 1) => {
    const next = [...ranking];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setRanking(next);
  };

  const totalPriority = Object.values(priorityAns).reduce((a,b) => a+b, 0);

  const handleHeatClick = (e: React.MouseEvent) => {
    const rect = heatRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHeatXY({
      x: Math.round(((e.clientX - rect.left) / rect.width)  * 100),
      y: Math.round(((e.clientY - rect.top)  / rect.height) * 100),
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-terracotta-400" />
    </div>
  );
  if (!poll) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">😕</div><p className="text-slate-600">Poll not found</p></div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center max-w-sm">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.1 }}>
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">Response Submitted!</h2>
        <p className="text-slate-500 mb-6">Your answer has been recorded. Your teacher will release results shortly.</p>
        <div className="space-y-2">
          {attempt && (
            <button onClick={() => navigate(`/attempt/${attemptId}/keysheet`)}
              className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold text-sm transition-all">
              View My Key Sheet
            </button>
          )}
          <button onClick={() => navigate('/join')}
            className="w-full py-2.5 bg-white border border-cream-300 hover:bg-cream-100 text-slate-700 rounded-xl font-semibold text-sm transition-all">
            Join Another Poll
          </button>
        </div>
      </motion.div>
    </div>
  );

  const timerPct = poll.settings.timeLimit ? ((timeLeft ?? 0) / poll.settings.timeLimit) * 100 : 100;
  const timerDanger = timeLeft !== null && timeLeft < 10;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-cream-300 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">{pollTypeLabel(poll.type)}</p>
            <h1 className="font-display font-semibold text-slate-800 text-sm">{poll.title}</h1>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${timerDanger ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-terracotta-100 text-terracotta-700'}`}>
              <Clock size={14}/> {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
            </div>
          )}
        </div>
        {timeLeft !== null && (
          <div className="max-w-xl mx-auto mt-2">
            <div className="h-1 bg-cream-200 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${timerDanger ? 'bg-red-500' : 'bg-terracotta-500'}`}
                style={{ width:`${timerPct}%` }} transition={{ duration:1 }}/>
            </div>
          </div>
        )}
        {tabWarns > 0 && (
          <div className="max-w-xl mx-auto mt-1 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
            <AlertTriangle size={12}/> Tab switch detected ({tabWarns}/3)
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {poll.description && <p className="text-sm text-slate-500 mb-5 text-center">{poll.description}</p>}

          <AnimatePresence mode="wait">
            <motion.div key={poll.type} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="op-card p-6">

              {/* MULTIPLE CHOICE / IMAGE CHOICE */}
              {['multiple_choice','image_choice'].includes(poll.type) && (
                <div className="space-y-2">
                  {poll.options.map(opt => (
                    <button key={opt.id} onClick={() => setSelected([opt.id])}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-50' : 'border-cream-300 bg-white hover:border-terracotta-300'}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-500' : 'border-slate-300'}`}>
                        {selected.includes(opt.id) && <span className="block w-2 h-2 bg-white rounded-full m-auto mt-0.5"/>}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* QUIZ / TRUE_FALSE */}
              {['quiz','true_false'].includes(poll.type) && (
                <div className="space-y-2">
                  {(poll.type === 'true_false' ? [{id:'t',text:'True'},{id:'f',text:'False'}] : poll.options).map(opt => (
                    <button key={opt.id} onClick={() => setSelected([opt.id])}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-50' : 'border-cream-300 bg-white hover:border-terracotta-300'}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-500' : 'border-slate-300'}`}>
                        {selected.includes(opt.id) && <span className="block w-2 h-2 bg-white rounded-full m-auto mt-0.5"/>}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* WORD CLOUD / OPEN ENDED / FILL_BLANK */}
              {['word_cloud','open_ended','fill_blank'].includes(poll.type) && (
                <div>
                  <textarea value={textAns} onChange={e => setTextAns(e.target.value)} rows={poll.type === 'open_ended' ? 4 : 2}
                    placeholder={poll.type === 'fill_blank' ? 'Type your answer…' : poll.type === 'word_cloud' ? 'Type a word or phrase…' : 'Write your response…'}
                    className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none resize-none bg-cream-50"/>
                </div>
              )}

              {/* Q&A */}
              {poll.type === 'qa' && (
                <div>
                  <textarea value={textAns} onChange={e => setTextAns(e.target.value)} rows={3} placeholder="Ask your question…"
                    className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-sm focus:border-terracotta-400 focus:outline-none resize-none bg-cream-50"/>
                </div>
              )}

              {/* NPS */}
              {poll.type === 'nps' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">How likely are you to recommend? (0–10)</p>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({length:11},(_,i)=>i).map(n => (
                      <button key={n} onClick={() => setNumAns(n)}
                        className={`h-10 rounded-lg text-sm font-bold transition-all ${numAns === n ? 'bg-terracotta-500 text-white shadow-md scale-110' : 'bg-cream-200 text-slate-600 hover:bg-terracotta-100'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                    <span>Not likely</span><span>Extremely likely</span>
                  </div>
                </div>
              )}

              {/* RATING */}
              {poll.type === 'rating' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setNumAns(n)}
                      className={`transition-transform ${starRating >= n || numAns >= n ? 'text-yellow-400 scale-110' : 'text-slate-300'} hover:scale-125`}
                      onMouseEnter={() => setStarRating(n)} onMouseLeave={() => setStarRating(0)}>
                      <Star size={40} fill={starRating >= n || numAns >= n ? 'currentColor' : 'none'}/>
                    </button>
                  ))}
                </div>
              )}

              {/* SLIDER */}
              {poll.type === 'slider' && (
                <div className="py-4">
                  <div className="text-center text-3xl font-display font-bold text-terracotta-600 mb-4">{numAns}</div>
                  <input type="range" min={0} max={100} value={numAns} onChange={e => setNumAns(Number(e.target.value))}
                    className="w-full h-2 bg-cream-300 rounded-full appearance-none cursor-pointer accent-terracotta-500"/>
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>100</span></div>
                </div>
              )}

              {/* RANKING */}
              {poll.type === 'ranking' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-3 text-center">Drag or use arrows to rank from most to least preferred</p>
                  {ranking.map((id, idx) => {
                    const opt = poll.options.find(o => o.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-cream-50 border border-cream-300 rounded-xl">
                        <span className="w-6 h-6 bg-terracotta-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx+1}</span>
                        <span className="flex-1 text-sm font-medium text-slate-700">{opt?.text}</span>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveRank(idx, -1)} disabled={idx===0} className="p-0.5 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronUp size={14}/></button>
                          <button onClick={() => moveRank(idx, 1)} disabled={idx===ranking.length-1} className="p-0.5 hover:bg-cream-200 rounded disabled:opacity-30"><ChevronDown size={14}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MATRIX */}
              {poll.type === 'matrix' && poll.matrixRows && poll.matrixCols && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left py-2 pr-4 text-slate-600 font-medium"></th>
                        {poll.matrixCols.map(c => (
                          <th key={c.id} className="text-center py-2 px-2 text-xs text-slate-600 font-medium">{c.text}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {poll.matrixRows.map(row => (
                        <tr key={row.id} className="border-t border-cream-200">
                          <td className="py-3 pr-4 text-slate-700 font-medium text-xs">{row.text}</td>
                          {poll.matrixCols!.map(col => (
                            <td key={col.id} className="text-center py-3 px-2">
                              <button onClick={() => setMatrixAns(m => ({...m, [row.id]: col.id}))}
                                className={`w-5 h-5 rounded-full border-2 mx-auto transition-all ${matrixAns[row.id] === col.id ? 'border-terracotta-500 bg-terracotta-500' : 'border-slate-300 hover:border-terracotta-300'}`}>
                                {matrixAns[row.id] === col.id && <span className="block w-2 h-2 bg-white rounded-full m-auto mt-0.5"/>}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PRIORITY (100-point allocation) */}
              {poll.type === 'priority' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 text-center">Allocate exactly 100 points across options</p>
                  <div className={`text-center text-sm font-bold ${Math.abs(totalPriority-100) < 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalPriority}/100 points allocated
                  </div>
                  {poll.options.map(opt => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{opt.text}</span>
                      <input type="number" min={0} max={100} value={priorityAns[opt.id] ?? 0}
                        onChange={e => setPriorityAns(p => ({...p, [opt.id]: Number(e.target.value)}))}
                        className="w-16 text-center px-2 py-1.5 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                    </div>
                  ))}
                </div>
              )}

              {/* HEATMAP */}
              {poll.type === 'heatmap' && (
                <div>
                  <p className="text-xs text-slate-500 text-center mb-3">Click on the area you'd choose</p>
                  <div ref={heatRef} onClick={handleHeatClick}
                    className="relative w-full h-48 bg-gradient-to-br from-cream-200 to-cream-400 rounded-xl cursor-crosshair border-2 border-cream-300 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Click anywhere</div>
                    {heatXY && (
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        style={{ left:`${heatXY.x}%`, top:`${heatXY.y}%` }}
                        className="absolute w-5 h-5 bg-terracotta-500 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2"/>
                    )}
                  </div>
                </div>
              )}

              {/* EMOJI */}
              {poll.type === 'emoji' && (
                <div className="grid grid-cols-4 gap-3 py-2">
                  {(poll.options.length ? poll.options : [{id:'1',text:'😍'},{id:'2',text:'😊'},{id:'3',text:'😐'},{id:'4',text:'😞'}]).map(opt => (
                    <button key={opt.id} onClick={() => setSelected([opt.id])}
                      className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all ${selected.includes(opt.id) ? 'border-terracotta-500 bg-terracotta-50 scale-110' : 'border-cream-300 hover:border-terracotta-300'}`}>
                      <span className="text-4xl">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={submitting}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all shadow-sm">
                {submitting ? <><Loader2 size={16} className="animate-spin"/>Submitting…</> : <>Submit <ArrowRight size={16}/></>}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
