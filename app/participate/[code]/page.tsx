'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, ThumbsUp, CheckCircle, Clock, Sparkles, ArrowRight, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { joinByCode, vote, addQAQuestion, upvoteQAQuestion, getResults } from '@/lib/api';
import { usePusher } from '@/hooks/usePusher';
import { getParticipantId } from '@/lib/api';
import { POLL_TYPE_META, EMOJIS } from '@/lib/types';
import { toast } from 'sonner';
import type { Poll, PollResults, QAQuestion } from '@/lib/types';

export default function ParticipatePage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [participantId] = useState(() => getParticipantId());
  const [name, setName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);

  // vote state by type
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [rating, setRating] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [ranking, setRanking] = useState<string[]>([]);
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string, string>>({});
  const [priorityAlloc, setPriorityAlloc] = useState<Record<string, number>>({});
  const [heatmapClick, setHeatmapClick] = useState<{ x: number; y: number } | null>(null);
  const [qaText, setQaText] = useState('');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pusher real-time
  usePusher(poll?.id || null, {
    'results-update': (data) => { setResults(data as PollResults); },
    'status-changed': (data) => { if (data && typeof data === 'object' && 'status' in data) setPoll((p) => p ? { ...p, status: (data as { status: Poll['status'] }).status } : p); },
    'participant-joined': (data) => { if (data && typeof data === 'object' && 'count' in data) setParticipants((data as { count: number }).count); },
    'qa-update': (data) => { if (data && typeof data === 'object' && 'questions' in data) setQaQuestions((data as { questions: QAQuestion[] }).questions); },
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await joinByCode(code) as { poll: Poll };
        setPoll(data.poll);
        setParticipants(data.poll.participants?.length || 0);
        setQaQuestions(data.poll.qaQuestions || []);
        if (data.poll.type === 'ranking') setRanking(data.poll.options.map((o) => o.id));
        if (data.poll.type === 'prioritization') {
          const even = Math.floor(100 / (data.poll.options.length || 1));
          const init: Record<string, number> = {};
          data.poll.options.forEach((o) => { init[o.id] = even; });
          setPriorityAlloc(init);
        }
        if (data.poll.settings?.min !== undefined) setSliderValue(data.poll.settings.min);
        const stored = localStorage.getItem(`voted_${data.poll.id}`);
        if (stored) setVoted(true);
        const r = await getResults(data.poll.id) as { results: PollResults };
        setResults(r.results);
      } catch { toast.error('Poll not found'); router.push('/join'); }
      finally { setLoading(false); }
    })();
  }, [code, router]);

  // Quiz timer
  useEffect(() => {
    if (poll?.type !== 'quiz' || quizDone || !nameSet) return;
    const q = poll.quizQuestions?.[quizStep];
    if (!q) return;
    setTimer(q.timeLimit);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!);
          handleQuizNext(quizStep, null);
          return null;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quizStep, poll?.type, nameSet, quizDone]);

  const handleQuizNext = (step: number, selected: string | null) => {
    if (!poll?.quizQuestions) return;
    const q = poll.quizQuestions[step];
    const correct = selected === q.correctAnswer;
    const pts = correct ? q.points : 0;
    setQuizAnswers((a) => ({ ...a, [q.id]: selected || '' }));
    setQuizScore((s) => s + pts);
    if (correct) setQuizCorrect((c) => c + 1);
    if (step + 1 >= poll.quizQuestions.length) {
      setQuizDone(true);
      submitVote({ answer: selected, quizSubmission: { score: quizScore + pts, correct: quizCorrect + (correct ? 1 : 0), answered: step + 1, answers: Object.entries(quizAnswers).map(([qId, ans]) => ({ questionId: qId, selected: ans, isCorrect: ans === poll.quizQuestions.find((x) => x.id === qId)?.correctAnswer, points: ans === poll.quizQuestions.find((x) => x.id === qId)?.correctAnswer ? poll.quizQuestions.find((x) => x.id === qId)?.points || 0 : 0 })) } });
    } else {
      setQuizStep(step + 1);
    }
  };

  const submitVote = async (overrides?: Record<string, unknown>) => {
    if (!poll) return;
    setSubmitting(true);
    try {
      let answer: unknown;
      if (overrides?.answer !== undefined) { answer = overrides.answer; }
      else if (poll.type === 'multiple_choice' && poll.settings?.multiSelect) answer = selectedOptions;
      else if (poll.type === 'multiple_choice') answer = selectedOption;
      else if (poll.type === 'true_false') answer = selectedOption;
      else if (poll.type === 'image_choice') answer = selectedOption;
      else if (poll.type === 'rating') answer = rating;
      else if (poll.type === 'nps') answer = rating;
      else if (poll.type === 'open_text' || poll.type === 'word_cloud' || poll.type === 'fill_blank') answer = textAnswer;
      else if (poll.type === 'slider') answer = sliderValue;
      else if (poll.type === 'ranking') answer = ranking;
      else if (poll.type === 'matrix') answer = matrixAnswers;
      else if (poll.type === 'prioritization') answer = priorityAlloc;
      else if (poll.type === 'heatmap') answer = heatmapClick;
      else if (poll.type === 'emoji_reaction') answer = selectedOption;
      else if (poll.type === 'bracket') answer = selectedOption;
      else if (poll.type === 'countdown_vote') answer = selectedOption;
      else if (poll.type === 'live_matching') answer = matchingAnswers;
      else answer = textAnswer || selectedOption;

      await vote(poll.id, {
        participantId, participantName: name || 'Anonymous',
        answer, ...overrides,
      });

      localStorage.setItem(`voted_${poll.id}`, '1');
      setVoted(true);
      setParticipants((p) => p + 1);

      const r = await getResults(poll.id) as { results: PollResults };
      setResults(r.results);
      if (poll.type !== 'quiz') toast.success('Vote submitted! ✓');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit';
      if (msg === 'Already voted') { setVoted(true); toast.info('Already voted!'); }
      else toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const submitQA = async () => {
    if (!qaText.trim() || !poll) return;
    await addQAQuestion(poll.id, { questionText: qaText, participantId });
    setQaText('');
    toast.success('Question submitted!');
  };

  const upvoteQ = async (qid: string) => {
    if (!poll) return;
    await upvoteQAQuestion(poll.id, qid);
    setQaQuestions((qs) => qs.map((q) => q.id === qid ? { ...q, upvotes: q.upvotes + 1 } : q));
  };

  // Ranking helpers
  const moveRank = (id: string, dir: -1 | 1) => {
    setRanking((r) => {
      const idx = r.indexOf(id);
      const next = idx + dir;
      if (next < 0 || next >= r.length) return r;
      const arr = [...r];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const allocRemaining = 100 - Object.values(priorityAlloc).reduce((a, b) => a + b, 0);

  if (loading) return (
    <div className="min-h-screen bg-warm-bg mesh-gradient flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!poll) return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Poll not found</p>
        <Button asChild><a href="/join">Back to Join</a></Button>
      </div>
    </div>
  );

  const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
  const isClosed = poll.status === 'closed';
  const isPaused = poll.status === 'paused';

  // ── Name entry screen ──
  if (!nameSet && poll.type !== 'qa') {
    return (
      <div className="min-h-screen bg-warm-bg mesh-gradient flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-4xl mb-4">{meta.icon}</div>
            <h1 className="font-playfair text-xl font-bold text-foreground mb-1">{poll.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">{meta.label}</p>
            <div className="space-y-3">
              <Input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setNameSet(true)} autoFocus className="text-center" />
              <Button className="w-full gap-2" onClick={() => setNameSet(true)}>
                Join Poll <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />{participants} participant{participants !== 1 ? 's' : ''}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Voted / Closed / Result view ──
  if ((voted || isClosed) && poll.type !== 'quiz' && poll.type !== 'qa') {
    return (
      <div className="min-h-screen bg-warm-bg mesh-gradient flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-playfair text-xl font-bold text-foreground">{isClosed ? 'Poll closed' : 'Response recorded!'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isClosed ? 'This poll is no longer accepting votes.' : 'Thank you for participating!'}</p>
            </div>
            {poll.settings?.showResults !== false && results && <ResultsDisplay poll={poll} results={results} />}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Paused screen ──
  if (isPaused) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⏸️</div>
          <h2 className="font-playfair text-xl font-bold text-foreground mb-2">Poll paused</h2>
          <p className="text-sm text-muted-foreground">The host has paused this poll. Please wait…</p>
        </div>
      </div>
    );
  }

  // ── Q&A type ──
  if (poll.type === 'qa') {
    return (
      <div className="min-h-screen bg-warm-bg mesh-gradient p-4">
        <div className="max-w-lg mx-auto pt-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">❓</div>
              <h1 className="font-playfair text-2xl font-bold text-foreground">{poll.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">Ask a question or upvote existing ones</p>
            </div>

            <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl p-5 mb-4 shadow-sm">
              <div className="flex gap-2">
                <Input placeholder="Type your question…" value={qaText} onChange={(e) => setQaText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitQA()} />
                <Button onClick={submitQA} disabled={!qaText.trim()} size="icon"><Send className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              {[...qaQuestions].sort((a, b) => b.upvotes - a.upvotes).map((q) => (
                <motion.div key={q.id} layout
                  className={`bg-warm-white dark:bg-card border rounded-xl p-4 flex items-start gap-3 shadow-sm ${
                    q.status === 'highlighted' ? 'border-terracotta bg-terracotta/5' : 'border-clay/30'
                  }`}
                >
                  <button onClick={() => upvoteQ(q.id)}
                    className="flex flex-col items-center gap-0.5 flex-shrink-0 hover:text-terracotta transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-bold">{q.upvotes}</span>
                  </button>
                  <p className="text-sm text-foreground flex-1">{q.questionText}</p>
                  {q.status === 'answered' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Answered</span>}
                </motion.div>
              ))}
              {qaQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No questions yet — be the first to ask!
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Quiz type ──
  if (poll.type === 'quiz') {
    if (quizDone) {
      const total = poll.quizQuestions?.reduce((a, q) => a + q.points, 0) || 1;
      return (
        <div className="min-h-screen bg-warm-bg mesh-gradient flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
            <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-2">Quiz complete!</h2>
              <div className="text-4xl font-bold text-terracotta mb-1">{quizScore}</div>
              <p className="text-sm text-muted-foreground">points out of {total}</p>
              <p className="text-sm text-muted-foreground mt-1">{quizCorrect} / {poll.quizQuestions?.length} correct</p>
              <Progress value={(quizScore / total) * 100} className="mt-4" />
            </div>
          </motion.div>
        </div>
      );
    }

    const q = poll.quizQuestions?.[quizStep];
    if (!q) return null;
    const totalQs = poll.quizQuestions?.length || 1;

    return (
      <div className="min-h-screen bg-warm-bg mesh-gradient p-4">
        <div className="max-w-md mx-auto pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{quizStep + 1} / {totalQs}</span>
            {timer !== null && (
              <div className={`flex items-center gap-1.5 text-sm font-bold ${timer <= 5 ? 'text-red-500' : 'text-terracotta'}`}>
                <Clock className="w-4 h-4" />{timer}s
              </div>
            )}
          </div>
          <Progress value={((quizStep) / totalQs) * 100} className="mb-5" />

          <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
            <div className="text-sm font-semibold text-terracotta mb-3">{q.points} pts · {q.timeLimit}s</div>
            <h2 className="font-playfair text-xl font-bold text-foreground mb-6">{q.questionText}</h2>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => (
                <button key={opt.id} onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  handleQuizNext(quizStep, opt.id);
                }}
                  className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-terracotta hover:bg-terracotta/5 transition-all font-medium text-sm">
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Main vote UI ──
  return (
    <div className="min-h-screen bg-warm-bg mesh-gradient p-4">
      <div className="max-w-lg mx-auto pt-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{meta.icon}</div>
            <h1 className="font-playfair text-2xl font-bold text-foreground">{poll.title}</h1>
            {poll.description && <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>}
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />{participants} participant{participants !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
            <p className="font-semibold text-foreground mb-5">{poll.question}</p>

            {/* ── Multiple Choice ── */}
            {(poll.type === 'multiple_choice' || poll.type === 'image_choice') && (
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const isSelected = poll.settings?.multiSelect
                    ? selectedOptions.includes(opt.id)
                    : selectedOption === opt.id;
                  return (
                    <button key={opt.id}
                      onClick={() => {
                        if (poll.settings?.multiSelect) {
                          setSelectedOptions((s) => s.includes(opt.id) ? s.filter((x) => x !== opt.id) : [...s, opt.id]);
                        } else { setSelectedOption(opt.id); }
                      }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        isSelected ? 'border-terracotta bg-terracotta/5' : 'border-border hover:border-terracotta/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isSelected ? 'border-terracotta bg-terracotta' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt.imageUrl && <img src={opt.imageUrl} alt={opt.text} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                      <span className="text-sm font-medium text-foreground">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── True / False ── */}
            {poll.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'true', label: '✅ True', color: 'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700' }, { id: 'false', label: '❌ False', color: 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700' }].map(({ id, label, color }) => (
                  <button key={id} onClick={() => setSelectedOption(id)}
                    className={`p-5 rounded-2xl border-2 font-bold text-lg transition-all ${selectedOption === id ? color + ' ring-2 ring-offset-1 ring-current' : 'border-border hover:border-muted-foreground'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Word Cloud / Open Text / Fill Blank ── */}
            {(poll.type === 'word_cloud' || poll.type === 'open_text') && (
              <Textarea placeholder={poll.type === 'word_cloud' ? 'Type a word or short phrase…' : 'Share your thoughts…'}
                value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} className="min-h-[100px]" autoFocus />
            )}
            {poll.type === 'fill_blank' && (
              <div className="space-y-3">
                {poll.settings?.sentence && (
                  <p className="text-sm text-muted-foreground font-medium">
                    {poll.settings.sentence.replace('___', '________')}
                  </p>
                )}
                <Input placeholder="Fill in the blank…" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} autoFocus />
              </div>
            )}

            {/* ── Rating ── */}
            {poll.type === 'rating' && (
              <div className="space-y-4">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button key={n} onClick={() => setRating(n)}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                        rating === n ? 'bg-terracotta text-white scale-110 shadow-md' :
                        rating > 0 && n <= rating ? 'bg-terracotta/20 text-terracotta' : 'bg-muted text-muted-foreground hover:bg-terracotta/10'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                {rating > 0 && <p className="text-center text-sm font-semibold text-terracotta">Selected: {rating}/10</p>}
              </div>
            )}

            {/* ── NPS ── */}
            {poll.type === 'nps' && (
              <div className="space-y-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Not at all likely</span><span>Extremely likely</span>
                </div>
                <div className="flex gap-1">
                  {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button key={n} onClick={() => setRating(n)}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                        rating === n ? 'bg-terracotta text-white shadow-md scale-105' :
                        n <= 6 ? 'bg-red-100 dark:bg-red-950/30 text-red-600 hover:opacity-80' :
                        n <= 8 ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 hover:opacity-80' :
                        'bg-green-100 dark:bg-green-950/30 text-green-700 hover:opacity-80'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Slider ── */}
            {poll.type === 'slider' && (
              <div className="space-y-5">
                <Slider
                  min={poll.settings?.min ?? 0}
                  max={poll.settings?.max ?? 100}
                  step={poll.settings?.step ?? 1}
                  value={[sliderValue]}
                  onValueChange={([v]) => setSliderValue(v)}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{poll.settings?.labelLeft ?? (poll.settings?.min ?? 0)}</span>
                  <span className="text-terracotta font-bold text-lg">{sliderValue}</span>
                  <span>{poll.settings?.labelRight ?? (poll.settings?.max ?? 100)}</span>
                </div>
              </div>
            )}

            {/* ── Ranking ── */}
            {poll.type === 'ranking' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Drag or use arrows to rank from top (1) to bottom</p>
                {ranking.map((id, idx) => {
                  const opt = poll.options.find((o) => o.id === id);
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl border border-border">
                      <span className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <span className="flex-1 text-sm font-medium">{opt?.text}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveRank(id, -1)} disabled={idx === 0} className="w-7 h-7 rounded-lg border hover:bg-accent transition-colors disabled:opacity-30 text-sm">↑</button>
                        <button onClick={() => moveRank(id, 1)} disabled={idx === ranking.length - 1} className="w-7 h-7 rounded-lg border hover:bg-accent transition-colors disabled:opacity-30 text-sm">↓</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Matrix ── */}
            {poll.type === 'matrix' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-1/3"></th>
                      {poll.settings?.matrixColumns?.map((col) => (
                        <th key={col.id} className="text-center py-2 px-2 font-medium text-xs text-muted-foreground">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {poll.settings?.matrixRows?.map((row) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="py-3 pr-4 text-sm font-medium">{row.label}</td>
                        {poll.settings?.matrixColumns?.map((col) => (
                          <td key={col.id} className="text-center py-3 px-2">
                            <button onClick={() => setMatrixAnswers((a) => ({ ...a, [row.id]: col.id }))}
                              className={`w-5 h-5 rounded-full border-2 transition-all mx-auto ${
                                matrixAnswers[row.id] === col.id ? 'border-terracotta bg-terracotta' : 'border-muted-foreground hover:border-terracotta'
                              }`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Prioritization ── */}
            {poll.type === 'prioritization' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Allocate 100 points</span>
                  <span className={`font-bold ${allocRemaining < 0 ? 'text-red-500' : allocRemaining === 0 ? 'text-green-600' : 'text-terracotta'}`}>
                    {allocRemaining} remaining
                  </span>
                </div>
                {poll.options.map((opt) => (
                  <div key={opt.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{opt.text}</span>
                      <span className="text-sm font-bold text-terracotta">{priorityAlloc[opt.id] ?? 0}</span>
                    </div>
                    <input type="range" min={0} max={100} value={priorityAlloc[opt.id] ?? 0}
                      onChange={(e) => setPriorityAlloc((a) => ({ ...a, [opt.id]: Number(e.target.value) }))}
                      className="w-full accent-terracotta" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Emoji Reaction ── */}
            {poll.type === 'emoji_reaction' && (
              <div className="flex flex-wrap gap-3 justify-center">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setSelectedOption(e)}
                    className={`w-14 h-14 rounded-2xl text-3xl transition-all border-2 ${
                      selectedOption === e ? 'border-terracotta bg-terracotta/10 scale-110 shadow-md' : 'border-border hover:border-terracotta/50 hover:scale-105'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* ── Heatmap ── */}
            {poll.type === 'heatmap' && poll.settings?.imageUrl && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Click on the image to place your vote</p>
                <div className="relative cursor-crosshair rounded-xl overflow-hidden border border-border"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setHeatmapClick({ x, y });
                  }}>
                  <img src={poll.settings.imageUrl} alt="heatmap" className="w-full object-cover max-h-64" />
                  {heatmapClick && (
                    <div className="absolute w-6 h-6 rounded-full bg-terracotta/70 border-2 border-white -translate-x-3 -translate-y-3 pointer-events-none"
                      style={{ left: `${heatmapClick.x}%`, top: `${heatmapClick.y}%` }} />
                  )}
                </div>
                {heatmapClick && <p className="text-xs text-center text-muted-foreground">Point placed at ({heatmapClick.x}%, {heatmapClick.y}%)</p>}
              </div>
            )}

            {/* ── Bracket ── */}
            {poll.type === 'bracket' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Pick the winner of this matchup</p>
                {poll.options.filter((o) => !o.eliminated).slice(0, 2).map((opt) => (
                  <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                    className={`w-full p-4 rounded-xl border-2 font-semibold text-left transition-all ${
                      selectedOption === opt.id ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-border hover:border-terracotta/40'
                    }`}>
                    🥊 {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* ── Countdown Vote ── */}
            {poll.type === 'countdown_vote' && (
              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      selectedOption === opt.id ? 'border-terracotta bg-terracotta/5' : 'border-border hover:border-terracotta/40'
                    }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedOption === opt.id ? 'border-terracotta bg-terracotta' : 'border-muted-foreground'}`}>
                      {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium flex-1">{opt.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Live Matching ── */}
            {poll.type === 'live_matching' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Match each left item to the correct right item</p>
                {poll.settings?.matchingPairs?.map((pair) => {
                  const allRight = poll.settings?.matchingPairs?.map((p) => p.right) || [];
                  return (
                    <div key={pair.id} className="flex items-center gap-3">
                      <div className="flex-1 p-3 bg-accent/50 rounded-xl border border-border text-sm font-medium">{pair.left}</div>
                      <span className="text-muted-foreground">→</span>
                      <select value={matchingAnswers[pair.id] || ''} onChange={(e) => setMatchingAnswers((a) => ({ ...a, [pair.id]: e.target.value }))}
                        className="flex-1 p-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select…</option>
                        {allRight.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Poll Series (simplified) ── */}
            {poll.type === 'poll_series' && (
              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      selectedOption === opt.id ? 'border-terracotta bg-terracotta/5' : 'border-border hover:border-terracotta/40'
                    }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selectedOption === opt.id ? 'border-terracotta bg-terracotta' : 'border-muted-foreground'}`}>
                      {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium">{opt.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Submit button */}
            <Button
              className="w-full mt-6 gap-2" size="lg"
              disabled={submitting || (
                        (poll.type === 'multiple_choice' && !poll.settings?.multiSelect && !selectedOption) ||
                        (poll.type === 'multiple_choice' && !!poll.settings?.multiSelect && selectedOptions.length === 0) ||
                        (poll.type === 'true_false' && !selectedOption) ||
                        (poll.type === 'emoji_reaction' && !selectedOption) ||
                        ((poll.type === 'open_text' || poll.type === 'word_cloud' || poll.type === 'fill_blank') && !textAnswer.trim()) ||
                        (poll.type === 'heatmap' && !heatmapClick) ||
                        (poll.type === 'image_choice' && !selectedOption)
              )}
              onClick={() => submitVote()}
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit Vote'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Inline results display for after voting
function ResultsDisplay({ poll, results }: { poll: Poll; results: PollResults }) {
  const meta = POLL_TYPE_META[poll.type];
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-terracotta" />
        <span className="text-sm font-semibold text-foreground">Live Results</span>
        <span className="text-xs text-muted-foreground ml-auto">{results.participants} votes</span>
      </div>
      {results.options?.map((opt) => (
        <div key={opt.id} className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground font-medium">{opt.text}</span>
            <span className="text-muted-foreground">{opt.pct}%</span>
          </div>
          <Progress value={opt.pct} className="h-2" />
        </div>
      ))}
      {results.average !== undefined && (
        <div className="text-center p-3 bg-accent/50 rounded-xl">
          <div className="text-2xl font-bold text-terracotta">{results.average}</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
      )}
      {results.words && results.words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {results.words.slice(0, 20).map((w) => (
            <span key={w.text} className="px-2 py-1 bg-terracotta/10 text-terracotta rounded-full text-xs font-medium"
              style={{ fontSize: `${Math.min(1 + w.count * 0.15, 1.5)}rem` }}>{w.text}</span>
          ))}
        </div>
      )}
    </div>
  );
}
