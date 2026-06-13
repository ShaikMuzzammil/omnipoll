import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Copy, RefreshCw, Maximize2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { getPoll, updatePollStatus, getResults } from '@/lib/api';
import { usePusher } from '@/hooks/usePusher';
import { POLL_TYPE_META, CHART_COLORS, EMOJIS } from '@/lib/types';
import { toast } from 'sonner';
import type { Poll, PollResults, QAQuestion } from '@/lib/types';

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [participants, setParticipants] = useState(0);
  const [qaList, setQaList] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [pd, rd] = await Promise.all([
        getPoll(id) as Promise<{ poll: Poll }>,
        getResults(id) as Promise<{ results: PollResults }>,
      ]);
      setPoll(pd.poll);
      setResults(rd.results);
      setParticipants(pd.poll.participants?.length || 0);
      setQaList(pd.poll.qaQuestions || []);
    } catch { toast.error('Failed to load poll'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  usePusher(poll?.id || null, {
    'results-update': d => setResults(d as PollResults),
    'status-changed': d => { if (d && typeof d === 'object' && 'status' in d) setPoll(p => p ? { ...p, status: (d as { status: Poll['status'] }).status } : p); },
    'participant-joined': d => { if (d && typeof d === 'object' && 'count' in d) setParticipants((d as { count: number }).count); },
    'qa-update': d => { if (d && typeof d === 'object' && 'questions' in d) setQaList((d as { questions: QAQuestion[] }).questions); },
  });

  const setStatus = async (status: string) => {
    if (!poll) return;
    try {
      await updatePollStatus(poll.id, status);
      setPoll(p => p ? { ...p, status: status as Poll['status'] } : p);
      toast.success(`Poll ${status}`);
    } catch { toast.error('Failed'); }
  };

  const copyLink = () => {
    if (!poll) return;
    navigator.clipboard.writeText(`${window.location.origin}/participate/${poll.code}`);
    toast.success('Join link copied!');
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" /></div>;
  if (!poll) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Poll not found</div>;

  const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
  const joinUrl = `${window.location.origin}/participate/${poll.code}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-white/50 hover:text-white transition-colors text-sm">← Back</button>
          <span className="text-white/20">|</span>
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <h1 className="font-playfair font-bold text-white leading-tight">{poll.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${poll.status === 'live' ? 'bg-green-400 animate-pulse' : poll.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
              <span className="text-white/50 text-xs capitalize">{poll.status}</span>
              <span className="text-white/30 text-xs">· {meta.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-white font-bold">{participants}</span>
          </div>
          <button onClick={copyLink} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors">
            <span className="font-mono text-terracotta font-bold tracking-widest text-sm">{poll.code}</span>
            <Copy className="w-3.5 h-3.5 text-white/40" />
          </button>
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
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><RefreshCw className="w-4 h-4 text-white/50" /></button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">
        {/* Results */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="text-center mb-8">
            <p className="text-white/40 text-sm mb-2">{meta.label}</p>
            <h2 className="font-playfair text-3xl font-bold text-white">{poll.question}</h2>
            {poll.description && <p className="text-white/50 mt-2 text-sm">{poll.description}</p>}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={poll.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {!results || (results.totalVotes === 0 && poll.type !== 'qa') ? (
                <WaitingScreen code={poll.code} joinUrl={joinUrl} />
              ) : (
                <ResultsView poll={poll} results={results} qaList={qaList} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side panel */}
        <aside className="w-56 border-l border-white/10 p-5 flex flex-col gap-5 flex-shrink-0">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-white/40 text-xs mb-2">Join at</p>
            <p className="text-white/60 text-xs mb-3 break-all">{window.location.hostname}</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(joinUrl)}&size=120x120&format=png&bgcolor=ffffff&color=000000`}
              alt="QR" className="rounded-xl mx-auto w-[120px] h-[120px]"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="font-mono text-terracotta text-3xl font-black tracking-[0.3em] mt-3">{poll.code}</div>
          </div>
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

function WaitingScreen({ code, joinUrl }: { code: string; joinUrl: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white/50 text-sm">Waiting for participants…</span>
      </div>
      <div className="font-mono text-8xl font-black text-terracotta tracking-widest mb-4">{code}</div>
      <p className="text-white/30 text-sm break-all">{joinUrl}</p>
    </div>
  );
}

function ResultsView({ poll, results, qaList }: { poll: Poll; results: PollResults; qaList: QAQuestion[] }) {
  const type = poll.type;

  if (['multiple_choice', 'image_choice', 'true_false', 'countdown_vote', 'poll_series', 'bracket'].includes(type) && results.options)
    return <BarResults options={results.options} total={results.totalVotes || 0} />;
  if (type === 'word_cloud' && results.words) return <WordCloud words={results.words} />;
  if (type === 'open_text' || type === 'fill_blank') return <TextList answers={results.answers || results.submissions?.map(r => String(r.answer)) || []} />;
  if (type === 'qa') return <QAView questions={qaList} />;
  if (type === 'quiz') return <QuizLeaderboard leaderboard={results.leaderboard || []} />;
  if (type === 'rating') return <RatingView average={results.average || 0} distribution={results.distribution || {}} />;
  if (type === 'nps') return <NPSView score={results.npsScore || 0} detractors={results.detractors || 0} passives={results.passives || 0} promoters={results.promoters || 0} total={results.totalVotes || 0} />;
  if (type === 'slider') return <RatingView average={results.average || 0} distribution={results.distribution || {}} label={`${poll.settings?.min ?? 0}–${poll.settings?.max ?? 100}`} />;
  if (type === 'ranking') return <RankingView rankings={results.rankingResults || []} />;
  if (type === 'matrix') return <MatrixView poll={poll} matrixResults={results.matrixResults || {}} />;
  if (type === 'emoji_reaction') return <EmojiView counts={results.emojiCounts || {}} />;
  if (type === 'prioritization') return <BarResults options={results.options || []} total={results.totalVotes || 0} label="avg pts" />;
  if (type === 'heatmap') return <HeatmapView points={results.heatmapPoints || []} imageUrl={poll.settings?.imageUrl} />;
  if (type === 'live_matching') return <MatchingView matchingResults={results.matchingResults || []} />;
  return <div className="text-white/30 text-center py-8">No results yet.</div>;
}

function BarResults({ options, total, label = '' }: { options: { id: string; text: string; votes: number; pct: number }[]; total: number; label?: string }) {
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {options.map((opt, i) => (
        <motion.div key={opt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white font-medium text-sm">{opt.text}</span>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">{opt.votes}{label && ` ${label}`}</span>
              <span className="text-white font-bold text-lg w-14 text-right">{opt.pct}%</span>
            </div>
          </div>
          <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${opt.pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }}
              className="h-full rounded-xl" style={{ background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}cc, ${CHART_COLORS[i % CHART_COLORS.length]})` }} />
          </div>
        </motion.div>
      ))}
      <p className="text-white/30 text-sm text-right mt-2">{total} total responses</p>
    </div>
  );
}

function WordCloud({ words }: { words: { text: string; count: number }[] }) {
  const max = Math.max(...words.map(w => w.count), 1);
  return (
    <div className="flex flex-wrap gap-3 justify-center items-center py-8 max-w-3xl mx-auto">
      {words.slice(0, 50).map((w, i) => (
        <motion.span key={w.text} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
          className="font-bold cursor-default hover:scale-110 transition-transform"
          style={{ fontSize: `${0.8 + (w.count / max) * 2.5}rem`, color: CHART_COLORS[i % CHART_COLORS.length] }}>
          {w.text}
        </motion.span>
      ))}
    </div>
  );
}

function TextList({ answers }: { answers: string[] }) {
  return (
    <div className="max-w-2xl mx-auto space-y-2 max-h-[50vh] overflow-y-auto">
      {answers.slice(0, 50).map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white/5 rounded-xl px-4 py-3 text-white/80 text-sm">{a}</motion.div>
      ))}
    </div>
  );
}

function QAView({ questions }: { questions: QAQuestion[] }) {
  const sorted = [...questions].sort((a, b) => b.upvotes - a.upvotes).slice(0, 10);
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {sorted.map((q, i) => (
        <motion.div key={q.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className={`flex items-start gap-4 p-4 rounded-xl border ${q.status === 'highlighted' ? 'border-terracotta bg-terracotta/10' : 'border-white/10 bg-white/5'}`}>
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-black text-terracotta">{q.upvotes}</div>
            <div className="text-white/30 text-xs">votes</div>
          </div>
          <p className="text-white font-medium text-sm flex-1">{q.questionText}</p>
          {q.status === 'answered' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Answered</span>}
        </motion.div>
      ))}
      {sorted.length === 0 && <p className="text-white/30 text-center py-8">No questions yet</p>}
    </div>
  );
}

function QuizLeaderboard({ leaderboard }: { leaderboard: { name: string; score: number; correct: number; answered: number }[] }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="max-w-xl mx-auto space-y-2">
      {leaderboard.slice(0, 10).map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5 border border-white/10'}`}>
          <span className="text-2xl">{medals[i] || `${i + 1}.`}</span>
          <div className="flex-1"><div className="font-bold text-white">{e.name}</div><div className="text-white/40 text-xs">{e.correct}/{e.answered} correct</div></div>
          <div className="text-2xl font-black text-terracotta">{e.score}<span className="text-white/30 text-xs ml-1">pts</span></div>
        </motion.div>
      ))}
    </div>
  );
}

function RatingView({ average, distribution, label = 'Average rating out of 10' }: { average: number; distribution: Record<string, number>; label?: string }) {
  const data = Object.entries(distribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => ({ name: k, value: v }));
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-8xl font-black text-terracotta font-playfair">{average}</div>
        <div className="text-white/40 text-sm mt-1">{label}</div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={24}>
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

function NPSView({ score, detractors, passives, promoters, total }: { score: number; detractors: number; passives: number; promoters: number; total: number }) {
  const color = score >= 50 ? '#4ade80' : score >= 0 ? '#facc15' : '#f87171';
  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="mb-8"><div className="text-7xl font-black font-playfair" style={{ color }}>{score > 0 ? '+' : ''}{score}</div><div className="text-white/40 text-sm">Net Promoter Score</div></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: 'Detractors', count: detractors, color: '#f87171' }, { label: 'Passives', count: passives, color: '#facc15' }, { label: 'Promoters', count: promoters, color: '#4ade80' }].map(({ label, count, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold" style={{ color }}>{total ? Math.round((count / total) * 100) : 0}%</div>
            <div className="text-white/40 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="h-4 rounded-full overflow-hidden flex">
        <div className="bg-red-400 transition-all" style={{ width: `${total ? (detractors / total) * 100 : 0}%` }} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${total ? (passives / total) * 100 : 0}%` }} />
        <div className="bg-green-400 transition-all" style={{ width: `${total ? (promoters / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

function RankingView({ rankings }: { rankings: { text: string; points: number }[] }) {
  return (
    <div className="max-w-xl mx-auto space-y-3">
      {rankings.map((r, i) => (
        <motion.div key={r.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <span className="text-3xl font-black text-terracotta/50">{i + 1}</span>
          <span className="flex-1 font-medium text-white">{r.text}</span>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-terracotta rounded-full" style={{ width: `${Math.min(100, r.points)}%` }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MatrixView({ poll, matrixResults }: { poll: Poll; matrixResults: Record<string, Record<string, number>> }) {
  const rows = poll.settings?.matrixRows || [];
  const cols = poll.settings?.matrixColumns || [];
  return (
    <div className="overflow-x-auto max-w-2xl mx-auto">
      <table className="w-full text-sm">
        <thead><tr>
          <th className="text-left py-2 pr-4 text-white/40 font-normal w-1/4"></th>
          {cols.map(col => <th key={col.id} className="text-center py-2 px-3 text-white/60 text-xs font-medium">{col.label}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(row => {
            const rd = matrixResults[row.id] || {};
            const mx = Math.max(...Object.values(rd), 1);
            return (
              <tr key={row.id} className="border-t border-white/10">
                <td className="py-3 pr-4 text-white/80 text-sm font-medium">{row.label}</td>
                {cols.map(col => {
                  const val = rd[col.id] || 0;
                  return (
                    <td key={col.id} className="text-center py-3 px-3">
                      <div className="w-full h-8 bg-white/5 rounded-lg overflow-hidden relative mx-auto" style={{ maxWidth: '60px' }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-terracotta rounded-lg transition-all" style={{ height: `${Math.round((val / mx) * 100)}%` }} />
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

function EmojiView({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex flex-wrap gap-6 justify-center items-end py-8">
      {EMOJIS.filter(e => counts[e]).map((emoji, i) => {
        const count = counts[emoji] || 0;
        const pct = (count / total) * 100;
        return (
          <motion.div key={emoji} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="text-center">
            <div style={{ fontSize: `${2 + (pct / 20)}rem` }}>{emoji}</div>
            <div className="text-white font-bold text-lg mt-1">{count}</div>
            <div className="text-white/30 text-xs">{Math.round(pct)}%</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HeatmapView({ points, imageUrl }: { points: { x: number; y: number }[]; imageUrl?: string }) {
  if (!imageUrl) return <div className="text-white/30 text-center py-8">No image configured</div>;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden border border-white/10">
        <img src={imageUrl} alt="" className="w-full object-cover max-h-80" />
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

function MatchingView({ matchingResults }: { matchingResults: { left: string; right: string; correct: number; total: number }[] }) {
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
            <span className={`text-sm font-bold ${pct >= 60 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
          </motion.div>
        );
      })}
    </div>
  );
}
