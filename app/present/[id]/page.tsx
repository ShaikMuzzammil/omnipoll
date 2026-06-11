'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, ExternalLink, QrCode,
  Users, BarChart2, ChevronRight, Maximize2, Copy, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { getPoll, updatePollStatus, getResults } from '@/lib/api';
import { usePusher } from '@/hooks/usePusher';
import { useAuth } from '@/hooks/useAuth';
import { POLL_TYPE_META, CHART_COLORS, EMOJIS } from '@/lib/types';
import { toast } from 'sonner';
import type { Poll, PollResults, QAQuestion } from '@/lib/types';

export default function PresentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [participants, setParticipants] = useState(0);
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pollData, resultsData] = await Promise.all([
        getPoll(id) as Promise<{ poll: Poll; results: PollResults }>,
        getResults(id) as Promise<{ results: PollResults }>
      ]);
      setPoll(pollData.poll);
      setResults(resultsData.results);
      setParticipants(pollData.poll.participants?.length || 0);
      setQaQuestions(pollData.poll.qaQuestions || []);
    } catch { toast.error('Failed to load poll'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  usePusher(poll?.id || null, {
    'results-update': (data) => setResults(data as PollResults),
    'status-changed': (data) => {
      if (data && typeof data === 'object' && 'status' in data)
        setPoll((p) => p ? { ...p, status: (data as { status: Poll['status'] }).status } : p);
    },
    'participant-joined': (data) => {
      if (data && typeof data === 'object' && 'count' in data)
        setParticipants((data as { count: number }).count);
    },
    'qa-update': (data) => {
      if (data && typeof data === 'object' && 'questions' in data)
        setQaQuestions((data as { questions: QAQuestion[] }).questions);
    },
  });

  const setStatus = async (status: string) => {
    if (!poll) return;
    try {
      await updatePollStatus(poll.id, status);
      setPoll((p) => p ? { ...p, status: status as Poll['status'] } : p);
      toast.success(`Poll ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const copyJoinLink = () => {
    if (!poll) return;
    navigator.clipboard.writeText(`${window.location.origin}/participate/${poll.code}`);
    toast.success('Join link copied!');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!poll) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Poll not found</div>;

  const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/participate/${poll.code}` : '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors text-sm">← Back</button>
          <span className="text-white/20">|</span>
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <h1 className="font-playfair font-bold text-white leading-tight">{poll.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${poll.status === 'live' ? 'bg-green-400 animate-pulse' : poll.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
              <span className="text-white/50 text-xs capitalize">{poll.status}</span>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-xs">{meta.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Participant count */}
          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-white font-bold">{participants}</span>
          </div>

          {/* Join info */}
          <button onClick={copyJoinLink} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors">
            <span className="font-mono text-terracotta font-bold tracking-widest text-sm">{poll.code}</span>
            <Copy className="w-3.5 h-3.5 text-white/40" />
          </button>

          {/* Controls */}
          {poll.status === 'live' ? (
            <Button size="sm" variant="outline" onClick={() => setStatus('paused')} className="bg-transparent border-white/20 text-white hover:bg-white/10 gap-1.5">
              <Pause className="w-3.5 h-3.5" />Pause
            </Button>
          ) : poll.status === 'paused' ? (
            <Button size="sm" onClick={() => setStatus('live')} className="gap-1.5 bg-green-600 hover:bg-green-700 border-0">
              <Play className="w-3.5 h-3.5" />Resume
            </Button>
          ) : null}
          {poll.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={() => setStatus('closed')} className="bg-transparent border-white/20 text-white hover:bg-white/10 gap-1.5">
              <Square className="w-3.5 h-3.5" />Close
            </Button>
          )}
          <button onClick={() => fetchData()} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Maximize2 className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex gap-0 overflow-hidden">
        {/* Results panel */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Question */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <p className="text-white/40 text-sm mb-2">{meta.label}</p>
            <h2 className="font-playfair text-3xl font-bold text-white">{poll.question}</h2>
            {poll.description && <p className="text-white/50 mt-2 text-sm">{poll.description}</p>}
          </motion.div>

          {/* Results by type */}
          <AnimatePresence mode="wait">
            <motion.div key={poll.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {!results || results.totalVotes === 0 ? (
                <WaitingScreen code={poll.code} joinUrl={joinUrl} />
              ) : (
                <ResultsView poll={poll} results={results} qaQuestions={qaQuestions} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side panel - join QR + stats */}
        <aside className="w-64 border-l border-white/10 p-5 flex flex-col gap-5 flex-shrink-0">
          {/* Mini QR / join info */}
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-white/40 text-xs mb-2">Join at</p>
            <p className="text-white text-xs font-medium mb-3 break-all">{typeof window !== 'undefined' ? window.location.hostname : 'omnipoll.io'}</p>
            <div className="bg-white rounded-xl p-3 mb-3">
              <QRCode value={joinUrl} size={120} />
            </div>
            <div className="font-mono text-terracotta text-3xl font-black tracking-[0.3em]">{poll.code}</div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{participants}</div>
              <div className="text-white/40 text-xs">Participants</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{results?.totalVotes ?? 0}</div>
              <div className="text-white/40 text-xs">Responses</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ── Waiting screen ──
function WaitingScreen({ code, joinUrl }: { code: string; joinUrl: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white/50 text-sm">Waiting for participants…</span>
      </div>
      <div className="font-mono text-8xl font-black text-terracotta tracking-widest mb-4">{code}</div>
      <p className="text-white/30 text-sm">Share this code or the link below</p>
      <p className="text-white/20 text-xs mt-1 break-all">{joinUrl}</p>
    </div>
  );
}

// ── Results view — dispatches to type-specific component ──
function ResultsView({ poll, results, qaQuestions }: { poll: Poll; results: PollResults; qaQuestions: QAQuestion[] }) {
  const type = poll.type;

  if (['multiple_choice', 'image_choice', 'true_false', 'countdown_vote', 'poll_series', 'bracket'].includes(type) && results.options) {
    return <BarResults options={results.options} total={results.totalVotes || 0} />;
  }
  if (type === 'word_cloud' && results.words) return <WordCloudResults words={results.words} />;
  if (type === 'open_text' || type === 'fill_blank') return <TextResults answers={results.answers || results.submissions?.map(r => String(r.answer)) || []} />;
  if (type === 'qa') return <QAResults questions={qaQuestions} />;
  if (type === 'quiz') return <QuizResults leaderboard={results.leaderboard || []} />;
  if (type === 'rating') return <RatingResults average={results.average || 0} distribution={results.distribution || {}} />;
  if (type === 'nps') return <NPSResults score={results.npsScore || 0} detractors={results.detractors || 0} passives={results.passives || 0} promoters={results.promoters || 0} total={results.totalVotes || 0} />;
  if (type === 'slider') return <SliderResults average={results.average || 0} distribution={results.distribution || {}} min={poll.settings?.min ?? 0} max={poll.settings?.max ?? 100} />;
  if (type === 'ranking') return <RankingResults rankings={results.rankingResults || []} />;
  if (type === 'matrix') return <MatrixResults poll={poll} matrixResults={results.matrixResults || {}} />;
  if (type === 'emoji_reaction') return <EmojiResults counts={results.emojiCounts || {}} />;
  if (type === 'prioritization') return <PrioritizationResults options={results.options || []} />;
  if (type === 'heatmap') return <HeatmapResults points={results.heatmapPoints || []} imageUrl={poll.settings?.imageUrl} />;
  if (type === 'live_matching') return <MatchingResults matchingResults={results.matchingResults || []} />;

  return <div className="text-white/30 text-center py-8">No results to display yet.</div>;
}

// ── Bar chart results (Multiple choice, True/False, etc.) ──
function BarResults({ options, total }: { options: Array<{ id: string; text: string; votes: number; pct: number }>; total: number }) {
  const data = options.map((o) => ({ name: o.text.length > 18 ? o.text.slice(0, 18) + '…' : o.text, votes: o.votes, pct: o.pct, full: o.text }));
  const max = Math.max(...options.map((o) => o.pct), 1);
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {options.map((opt, i) => (
        <motion.div key={opt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white font-medium text-sm">{opt.text}</span>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">{opt.votes}</span>
              <span className="text-white font-bold text-lg w-14 text-right">{opt.pct}%</span>
            </div>
          </div>
          <div className="h-10 bg-white/5 rounded-xl overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${opt.pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
              className="h-full rounded-xl flex items-center justify-end pr-3"
              style={{ background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}cc, ${CHART_COLORS[i % CHART_COLORS.length]})` }}
            />
          </div>
        </motion.div>
      ))}
      <p className="text-white/30 text-sm text-right mt-2">{total} total votes</p>
    </div>
  );
}

// ── Word cloud ──
function WordCloudResults({ words }: { words: Array<{ text: string; count: number }> }) {
  const max = Math.max(...words.map((w) => w.count), 1);
  return (
    <div className="flex flex-wrap gap-3 justify-center items-center py-8 max-w-3xl mx-auto">
      {words.slice(0, 50).map((w, i) => {
        const size = 0.8 + ((w.count / max) * 2.5);
        const color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          <motion.span key={w.text}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
            className="font-bold cursor-default select-none transition-transform hover:scale-110"
            style={{ fontSize: `${size}rem`, color }}>
            {w.text}
          </motion.span>
        );
      })}
    </div>
  );
}

// ── Open text responses ──
function TextResults({ answers }: { answers: string[] }) {
  return (
    <div className="max-w-2xl mx-auto space-y-2 max-h-[50vh] overflow-y-auto">
      {answers.slice(0, 50).map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white/5 rounded-xl px-4 py-3 text-white/80 text-sm">
          {a}
        </motion.div>
      ))}
    </div>
  );
}

// ── Q&A ──
function QAResults({ questions }: { questions: QAQuestion[] }) {
  const sorted = [...questions].sort((a, b) => b.upvotes - a.upvotes).slice(0, 10);
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {sorted.map((q, i) => (
        <motion.div key={q.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className={`flex items-start gap-4 p-4 rounded-xl border ${
            q.status === 'highlighted' ? 'border-terracotta bg-terracotta/10' : 'border-white/10 bg-white/5'
          }`}>
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-black text-terracotta">{q.upvotes}</div>
            <div className="text-white/30 text-xs">votes</div>
          </div>
          <p className="text-white font-medium text-sm flex-1">{q.questionText}</p>
          {q.status === 'answered' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex-shrink-0">Answered</span>}
        </motion.div>
      ))}
      {sorted.length === 0 && <p className="text-white/30 text-center py-8">No questions yet</p>}
    </div>
  );
}

// ── Quiz leaderboard ──
function QuizResults({ leaderboard }: { leaderboard: Array<{ name: string; score: number; correct: number; answered: number }> }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="max-w-xl mx-auto space-y-2">
      {leaderboard.slice(0, 10).map((entry, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5 border border-white/10'}`}>
          <span className="text-2xl flex-shrink-0">{medals[i] || `${i + 1}.`}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white truncate">{entry.name}</div>
            <div className="text-white/40 text-xs">{entry.correct}/{entry.answered} correct</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-terracotta">{entry.score}</div>
            <div className="text-white/30 text-xs">pts</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Rating distribution ──
function RatingResults({ average, distribution }: { average: number; distribution: Record<string, number> }) {
  const data = Array.from({ length: 10 }, (_, i) => ({ name: String(i + 1), value: distribution[String(i + 1)] || 0 }));
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-8xl font-black text-terracotta font-playfair">{average}</div>
        <div className="text-white/40 text-sm mt-1">Average rating out of 10</div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="name" stroke="#ffffff30" tick={{ fill: '#ffffff60', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── NPS ──
function NPSResults({ score, detractors, passives, promoters, total }: { score: number; detractors: number; passives: number; promoters: number; total: number }) {
  const color = score >= 50 ? '#4ade80' : score >= 0 ? '#facc15' : '#f87171';
  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="mb-8">
        <div className="text-7xl font-black font-playfair" style={{ color }}>{score > 0 ? '+' : ''}{score}</div>
        <div className="text-white/40 text-sm mt-1">Net Promoter Score</div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: 'Detractors', count: detractors, color: '#f87171' }, { label: 'Passives', count: passives, color: '#facc15' }, { label: 'Promoters', count: promoters, color: '#4ade80' }].map(({ label, count, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold" style={{ color }}>{total ? Math.round((count / total) * 100) : 0}%</div>
            <div className="text-white/40 text-xs mt-1">{label}</div>
            <div className="text-white/20 text-xs">{count} votes</div>
          </div>
        ))}
      </div>
      <div className="h-4 rounded-full overflow-hidden flex">
        <div className="bg-red-400 transition-all duration-700" style={{ width: `${total ? (detractors / total) * 100 : 0}%` }} />
        <div className="bg-yellow-400 transition-all duration-700" style={{ width: `${total ? (passives / total) * 100 : 0}%` }} />
        <div className="bg-green-400 transition-all duration-700" style={{ width: `${total ? (promoters / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

// ── Slider distribution ──
function SliderResults({ average, distribution, min, max }: { average: number; distribution: Record<string, number>; min: number; max: number }) {
  const data = Object.entries(distribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => ({ name: k, value: v }));
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-7xl font-black text-terracotta font-playfair">{average}</div>
        <div className="text-white/40 text-sm">Average value ({min}–{max})</div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={20}>
          <XAxis dataKey="name" stroke="#ffffff30" tick={{ fill: '#ffffff60', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          <Bar dataKey="value" fill="#D96C4A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Ranking ──
function RankingResults({ rankings }: { rankings: Array<{ text: string; points: number }> }) {
  return (
    <div className="max-w-xl mx-auto space-y-3">
      {rankings.map((r, i) => (
        <motion.div key={r.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <span className="text-3xl font-black text-terracotta/50">{i + 1}</span>
          <span className="flex-1 font-medium text-white">{r.text}</span>
          <span className="text-white/40 text-sm">{r.points} pts</span>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-terracotta rounded-full" style={{ width: `${Math.min(100, r.points)}%` }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Matrix ──
function MatrixResults({ poll, matrixResults }: { poll: Poll; matrixResults: Record<string, Record<string, number>> }) {
  const rows = poll.settings?.matrixRows || [];
  const cols = poll.settings?.matrixColumns || [];
  if (!rows.length || !cols.length) return <div className="text-white/30 text-center">No matrix data</div>;
  return (
    <div className="overflow-x-auto max-w-2xl mx-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 text-white/40 font-normal w-1/4"></th>
            {cols.map((col) => <th key={col.id} className="text-center py-2 px-3 text-white/60 font-medium text-xs">{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowData = matrixResults[row.id] || {};
            const rowMax = Math.max(...Object.values(rowData), 1);
            return (
              <tr key={row.id} className="border-t border-white/10">
                <td className="py-3 pr-4 text-white/80 text-sm font-medium">{row.label}</td>
                {cols.map((col) => {
                  const val = rowData[col.id] || 0;
                  const pct = Math.round((val / rowMax) * 100);
                  return (
                    <td key={col.id} className="text-center py-3 px-3">
                      <div className="w-full h-8 bg-white/5 rounded-lg overflow-hidden relative mx-auto" style={{ maxWidth: '60px' }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-terracotta rounded-lg transition-all duration-700" style={{ height: `${pct}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{val}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Emoji reaction ──
function EmojiResults({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-wrap gap-6 justify-center items-end py-8">
      {EMOJIS.filter((e) => counts[e] !== undefined).concat(
        Object.keys(counts).filter((e) => !EMOJIS.includes(e))
      ).map((emoji) => {
        const count = counts[emoji] || 0;
        const pct = (count / total) * 100;
        const size = 2 + (pct / 20);
        return (
          <motion.div key={emoji} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="transition-all duration-500" style={{ fontSize: `${size}rem` }}>{emoji}</div>
            <div className="text-white font-bold text-lg mt-1">{count}</div>
            <div className="text-white/30 text-xs">{Math.round(pct)}%</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Prioritization ──
function PrioritizationResults({ options }: { options: Array<{ text: string; votes: number; pct: number }> }) {
  const max = Math.max(...options.map((o) => o.votes), 1);
  return (
    <div className="max-w-xl mx-auto space-y-3">
      {options.map((opt, i) => (
        <motion.div key={opt.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-white font-medium">{opt.text}</span>
            <span className="text-white/50">{opt.votes} avg pts</span>
          </div>
          <div className="h-8 bg-white/5 rounded-xl overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(opt.votes / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
              className="h-full rounded-xl"
              style={{ background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}cc, ${CHART_COLORS[i % CHART_COLORS.length]})` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Heatmap ──
function HeatmapResults({ points, imageUrl }: { points: Array<{ x: number; y: number }>; imageUrl?: string }) {
  if (!imageUrl) return <div className="text-white/30 text-center">No image configured</div>;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden border border-white/10">
        <img src={imageUrl} alt="heatmap" className="w-full object-cover max-h-80" />
        <div className="absolute inset-0">
          {points.map((p, i) => (
            <div key={i} className="absolute w-8 h-8 rounded-full -translate-x-4 -translate-y-4 opacity-60"
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: 'radial-gradient(circle, rgba(217,108,74,0.8) 0%, transparent 70%)' }} />
          ))}
        </div>
      </div>
      <p className="text-white/30 text-sm text-center mt-3">{points.length} clicks recorded</p>
    </div>
  );
}

// ── Live Matching ──
function MatchingResults({ matchingResults }: { matchingResults: Array<{ left: string; right: string; correct: number; total: number }> }) {
  return (
    <div className="max-w-xl mx-auto space-y-3">
      {matchingResults.map((m, i) => {
        const pct = m.total ? Math.round((m.correct / m.total) * 100) : 0;
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="flex-1 text-white/80 text-sm font-medium">{m.left}</span>
            <span className="text-white/30">→</span>
            <span className="flex-1 text-white/80 text-sm font-medium">{m.right}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-sm font-bold ${pct >= 60 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
              <span className="text-white/30 text-xs">{m.correct}/{m.total}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Simple QR code (CSS-only placeholder) ──
function QRCode({ value, size }: { value: string; size: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&format=png&bgcolor=ffffff&color=000000`;
  return (
    <img
      src={qrUrl} alt="QR Code" width={size} height={size}
      className="rounded-lg mx-auto"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
