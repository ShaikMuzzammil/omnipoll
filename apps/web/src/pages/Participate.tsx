/// <reference types="../vite-env" />
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Star, ArrowUp, ArrowDown, Send, Wifi, WifiOff, Clock } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'sonner';
import type { Poll } from '../types';

interface PollState {
  poll: Poll | null;
  status: 'waiting' | 'active' | 'closed';
  hasVoted: boolean;
  timeLeft?: number;
}

export default function Participate() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PollState>({ poll: null, status: 'waiting', hasVoted: false });
  const [answer, setAnswer] = useState<any>(null);
  const [name, setName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { socket, connected, emitVote } = useSocket();

  // Fetch poll by join code
  useEffect(() => {
    if (!code) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/polls/join/${code.toUpperCase()}`)
      .then(r => r.json())
      .then(data => {
        if (data.poll) {
          setState(s => ({ ...s, poll: data.poll, status: data.poll.status === 'live' ? 'active' : 'waiting' }));
        } else {
          toast.error('Poll not found or not active');
          navigate('/join');
        }
      })
      .catch(() => { toast.error('Could not connect'); navigate('/join'); });
  }, [code]);

  // Socket events
  useEffect(() => {
    if (!socket || !state.poll) return;
    socket.emit('join-poll', { pollId: state.poll.id, participantName: name });
    socket.on('poll-status-changed', ({ status }) => setState(s => ({ ...s, status })));
    socket.on('poll-closed', () => setState(s => ({ ...s, status: 'closed' })));
    socket.on('time-update', ({ timeLeft }) => setState(s => ({ ...s, timeLeft })));
    return () => {
      socket.off('poll-status-changed');
      socket.off('poll-closed');
      socket.off('time-update');
    };
  }, [socket, state.poll, name]);

  const submitVote = useCallback(async () => {
    if (!state.poll || !answer || submitting) return;
    setSubmitting(true);
    try {
      emitVote({ pollId: state.poll.id, answer, participantName: name });
      setState(s => ({ ...s, hasVoted: true }));
      toast.success('Vote submitted! 🎉');
    } catch {
      toast.error('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  }, [state.poll, answer, submitting, emitVote, name]);

  if (!nameSet) return (
    <NameScreen name={name} setName={setName} onConfirm={() => setNameSet(true)} />
  );

  if (!state.poll) return (
    <LoadingScreen />
  );

  if (state.status === 'waiting') return (
    <WaitingScreen poll={state.poll} connected={connected} />
  );

  if (state.status === 'closed' || state.hasVoted) return (
    <ThankYouScreen poll={state.poll} hasVoted={state.hasVoted} />
  );

  return (
    <PollUI
      poll={state.poll}
      answer={answer}
      setAnswer={setAnswer}
      onSubmit={submitVote}
      submitting={submitting}
      timeLeft={state.timeLeft}
      connected={connected}
    />
  );
}

// ─── Name Screen ───────────────────────────────────────────────
function NameScreen({ name, setName, onConfirm }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment to-terracotta/10 dark:from-background dark:to-terracotta/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-8 text-center">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-xl font-bold text-charcoal dark:text-white mb-2">What's your name?</h2>
        <p className="text-sm text-slate dark:text-gray-400 mb-6">Optional — helps the presenter see who voted</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="input-field mb-4"
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          autoFocus
        />
        <button onClick={onConfirm} className="btn-primary w-full">
          {name.trim() ? `Join as ${name}` : 'Join Anonymously'}
        </button>
      </div>
    </div>
  );
}

// ─── Loading ────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-parchment dark:bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Waiting ────────────────────────────────────────────────────
function WaitingScreen({ poll, connected }: { poll: Poll; connected: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-terracotta/5 to-sage/5 dark:from-background dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Waiting for host…</h2>
        <p className="text-slate dark:text-gray-400 mb-2">{poll.question}</p>
        <div className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Connected' : 'Reconnecting…'}
        </div>
      </div>
    </div>
  );
}

// ─── Thank You ──────────────────────────────────────────────────
function ThankYouScreen({ poll, hasVoted }: { poll: Poll; hasVoted: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage/10 to-terracotta/10 dark:from-background dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm card p-10">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
          {hasVoted ? 'Vote Submitted!' : 'Poll Closed'}
        </h2>
        <p className="text-slate dark:text-gray-400 mb-4">{poll.question}</p>
        {poll.settings?.showResults && (
          <p className="text-sm text-terracotta">Results will be shown by the host</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Poll UI ───────────────────────────────────────────────
function PollUI({ poll, answer, setAnswer, onSubmit, submitting, timeLeft, connected }: any) {
  const canSubmit = answer !== null && answer !== undefined && answer !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment to-terracotta/5 dark:from-background dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-clay/20 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-slate dark:text-gray-400">OmniPoll Live</span>
        </div>
        {timeLeft !== undefined && (
          <div className="flex items-center gap-1 text-sm font-mono font-bold text-terracotta">
            <Clock className="w-4 h-4" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Poll Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 py-8">
        <h2 className="text-xl font-bold text-charcoal dark:text-white mb-6 text-center leading-tight">
          {poll.question}
        </h2>

        <div className="flex-1">
          <PollTypeInput poll={poll} answer={answer} setAnswer={setAnswer} />
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed py-4 text-base"
        >
          {submitting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Send className="w-4 h-4" /> Submit Answer</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Poll Type Input Components ─────────────────────────────────
function PollTypeInput({ poll, answer, setAnswer }: any) {
  const type = poll.type;

  // Multiple Choice / Image Choice / Emoji Reaction
  if (['multiple_choice', 'image_choice', 'emoji_reaction', 'prioritization', 'countdown_vote'].includes(type)) {
    return (
      <div className="space-y-3">
        {poll.options?.map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => {
              if (poll.settings?.multiSelect) {
                const arr: number[] = Array.isArray(answer) ? [...answer] : [];
                setAnswer(arr.includes(i) ? arr.filter(x => x !== i) : [...arr, i]);
              } else {
                setAnswer(i);
              }
            }}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${
              (Array.isArray(answer) ? answer.includes(i) : answer === i)
                ? 'border-terracotta bg-terracotta/10 text-terracotta'
                : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white hover:border-terracotta/50'
            }`}
          >
            <span className="mr-2">{type === 'emoji_reaction' ? opt.emoji : String.fromCharCode(65 + i)}.</span>
            {opt.text || opt.label || opt}
          </button>
        ))}
      </div>
    );
  }

  // True / False
  if (type === 'true_false') {
    return (
      <div className="grid grid-cols-2 gap-4">
        {['True', 'False'].map(val => (
          <button
            key={val}
            onClick={() => setAnswer(val)}
            className={`p-8 rounded-2xl border-2 text-2xl font-bold transition-all ${
              answer === val
                ? val === 'True'
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20'
                  : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white hover:border-terracotta/50'
            }`}
          >
            {val === 'True' ? '✅' : '❌'}<br />{val}
          </button>
        ))}
      </div>
    );
  }

  // Rating
  if (type === 'rating') {
    return (
      <div className="text-center">
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setAnswer(star)}
              className={`text-5xl transition-transform hover:scale-110 ${star <= (answer || 0) ? 'opacity-100' : 'opacity-30'}`}
            >
              <Star className={`w-12 h-12 ${star <= (answer || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        {answer && <p className="text-lg font-medium text-terracotta">{answer} / 5 stars</p>}
      </div>
    );
  }

  // NPS
  if (type === 'nps') {
    return (
      <div>
        <div className="flex justify-between text-xs text-slate dark:text-gray-400 mb-2">
          <span>{poll.lowLabel || 'Not likely'}</span>
          <span>{poll.highLabel || 'Extremely likely'}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setAnswer(i)}
              className={`p-3 rounded-lg text-sm font-bold border-2 transition-all ${
                answer === i
                  ? 'border-terracotta bg-terracotta text-white'
                  : i <= 6 ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:border-red-400'
                  : i <= 8 ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:border-amber-400'
                  : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:border-green-400'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Slider
  if (type === 'slider') {
    const min = poll.sliderMin ?? 0, max = poll.sliderMax ?? 100, step = poll.sliderStep ?? 1;
    const val = answer ?? Math.floor((min + max) / 2);
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-terracotta mb-4">{val}</div>
        <input
          type="range" min={min} max={max} step={step}
          value={val}
          onChange={e => setAnswer(Number(e.target.value))}
          className="w-full accent-terracotta h-3 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-sm text-slate dark:text-gray-400 mt-2">
          <span>{poll.leftLabel || min}</span>
          <span>{poll.rightLabel || max}</span>
        </div>
      </div>
    );
  }

  // Open Text / Word Cloud
  if (['open_text', 'word_cloud'].includes(type)) {
    return (
      <textarea
        value={answer || ''}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Type your answer…"
        rows={4}
        className="input-field resize-none"
      />
    );
  }

  // Fill in the Blank
  if (type === 'fill_blank') {
    return (
      <div>
        <div className="bg-parchment dark:bg-gray-800 rounded-xl p-4 mb-4 text-center text-lg font-medium text-charcoal dark:text-white">
          {poll.blankTemplate?.replace('___', '[ ? ]')}
        </div>
        <input
          type="text"
          value={answer || ''}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Fill in the blank…"
          className="input-field text-center text-lg font-medium"
          autoFocus
        />
      </div>
    );
  }

  // Ranking
  if (type === 'ranking') {
    const options = answer || poll.options?.map((o: any) => o.text) || [];
    const moveUp = (i: number) => {
      if (i === 0) return;
      const arr = [...options];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      setAnswer(arr);
    };
    const moveDown = (i: number) => {
      if (i === options.length - 1) return;
      const arr = [...options];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      setAnswer(arr);
    };
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate dark:text-gray-400 text-center mb-3">Drag or use arrows to rank</p>
        {options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-clay/30 dark:border-gray-600 rounded-xl px-4 py-3">
            <span className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <span className="flex-1 text-charcoal dark:text-white">{opt}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 hover:text-terracotta disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => moveDown(i)} disabled={i === options.length - 1} className="p-0.5 hover:text-terracotta disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Matrix
  if (type === 'matrix') {
    const matrixAnswer = answer || {};
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 text-slate dark:text-gray-400 font-normal"></th>
              {poll.matrixColumns?.map((col: string) => (
                <th key={col} className="py-2 px-2 text-center text-xs font-medium text-charcoal dark:text-white">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poll.matrixRows?.map((row: string) => (
              <tr key={row} className="border-t border-clay/20 dark:border-gray-700">
                <td className="py-3 pr-4 text-charcoal dark:text-white font-medium whitespace-nowrap">{row}</td>
                {poll.matrixColumns?.map((col: string) => (
                  <td key={col} className="py-3 px-2 text-center">
                    <button
                      onClick={() => setAnswer({ ...matrixAnswer, [row]: col })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        matrixAnswer[row] === col
                          ? 'border-terracotta bg-terracotta'
                          : 'border-clay/40 dark:border-gray-600 hover:border-terracotta'
                      }`}
                    >
                      {matrixAnswer[row] === col && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Live Matching
  if (type === 'live_matching') {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const matchAnswer = answer || {};
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {poll.matchLeft?.map((item: string) => (
            <button
              key={item}
              onClick={() => {
                if (selectedLeft === item) setSelectedLeft(null);
                else setSelectedLeft(item);
              }}
              className={`w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                selectedLeft === item
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : matchAnswer[item]
                  ? 'border-sage bg-sage/10 text-sage'
                  : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {poll.matchRight?.map((item: string) => (
            <button
              key={item}
              onClick={() => {
                if (!selectedLeft) return;
                setAnswer({ ...matchAnswer, [selectedLeft]: item });
                setSelectedLeft(null);
              }}
              disabled={!selectedLeft}
              className={`w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                Object.values(matchAnswer).includes(item)
                  ? 'border-sage bg-sage/10 text-sage'
                  : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white disabled:opacity-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Q&A
  if (type === 'qa') {
    return (
      <div>
        <textarea
          value={answer || ''}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Ask your question…"
          rows={4}
          className="input-field resize-none"
          maxLength={500}
        />
        <div className="text-right text-xs text-slate dark:text-gray-400 mt-1">{(answer || '').length}/500</div>
      </div>
    );
  }

  // Quiz
  if (type === 'quiz') {
    const currentQ = poll.quizQuestions?.[0];
    if (!currentQ) return <p className="text-slate dark:text-gray-400 text-center">Loading question…</p>;
    return (
      <div className="space-y-3">
        {currentQ.options?.map((opt: string, i: number) => (
          <button
            key={i}
            onClick={() => setAnswer(i)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${
              answer === i
                ? 'border-terracotta bg-terracotta/10 text-terracotta'
                : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white hover:border-terracotta/50'
            }`}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
          </button>
        ))}
      </div>
    );
  }

  // Heatmap
  if (type === 'heatmap') {
    return (
      <div>
        <p className="text-sm text-slate dark:text-gray-400 text-center mb-3">Click on the area that applies</p>
        <div
          className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-crosshair border-2 border-clay/30 dark:border-gray-600"
          style={{ height: 240 }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
            const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
            setAnswer({ x, y });
          }}
        >
          {answer && (
            <div
              className="absolute w-6 h-6 bg-terracotta rounded-full -translate-x-3 -translate-y-3 border-2 border-white shadow-lg"
              style={{ left: `${answer.x}%`, top: `${answer.y}%` }}
            />
          )}
          {!answer && (
            <div className="absolute inset-0 flex items-center justify-center text-slate dark:text-gray-400 text-sm">
              Tap anywhere to mark your answer
            </div>
          )}
        </div>
        {answer && (
          <p className="text-center text-sm text-terracotta mt-2 font-medium">
            Selected: ({answer.x}%, {answer.y}%)
          </p>
        )}
      </div>
    );
  }

  // Bracket
  if (type === 'bracket') {
    const options = poll.options || [];
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate dark:text-gray-400 text-center">Vote for your winner</p>
        {options.slice(0, 2).map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => setAnswer(i)}
            className={`w-full p-5 rounded-2xl border-2 text-lg font-bold transition-all ${
              answer === i
                ? 'border-terracotta bg-terracotta/10 text-terracotta'
                : 'border-clay/30 dark:border-gray-600 bg-white dark:bg-gray-800 text-charcoal dark:text-white hover:border-terracotta/50'
            }`}
          >
            {opt.text || opt}
          </button>
        ))}
        {options.length > 2 && (
          <p className="text-center text-xs text-slate dark:text-gray-400">Round 1 of {Math.ceil(Math.log2(options.length))} rounds</p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-slate dark:text-gray-400">
      <p>This poll type is loading…</p>
    </div>
  );
}
