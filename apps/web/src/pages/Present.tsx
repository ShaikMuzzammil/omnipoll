import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Wifi, WifiOff, Play, Square, ChevronRight, Copy, BarChart2, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts';
import { useSocket } from '../hooks/useSocket';
import { usePoll, useSetStatus } from '../hooks/usePolls';
import { POLL_TYPE_CONFIG, CHART_COLORS } from '../types';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

interface LiveResults {
  counts: Record<string, number>;
  total: number;
  words?: Record<string, number>;
  openResponses?: string[];
  ratings?: number[];
  npsScores?: number[];
  matrixData?: Record<string, Record<string, number>>;
  rankingData?: Record<string, number>;
  sliderValues?: number[];
  heatmapPoints?: { x: number; y: number }[];
  matchingData?: Record<string, Record<string, number>>;
  quizResults?: { questionIdx: number; correctPct: number; avgTime: number }[];
}

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = usePoll(id!);
  const poll = data?.poll;
  const setStatus = useSetStatus();
  const { socket, connected } = useSocket();
  const [results, setResults] = useState<LiveResults>({ counts: {}, total: 0 });
  const [participantCount, setParticipantCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);


  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('host-join', { pollId: id });
    socket.on('results-update', (data: LiveResults) => setResults(data));
    socket.on('participant-joined', ({ count }: { count: number }) => setParticipantCount(count));
    socket.on('participant-left', ({ count }: { count: number }) => setParticipantCount(count));
    socket.on('time-update', ({ timeLeft }: { timeLeft: number }) => setTimeLeft(timeLeft));
    return () => {
      socket.off('results-update');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('time-update');
    };
  }, [socket, id]);

  const goLive = useCallback(() => {
    setStatus.mutate({ id: id!, status: 'live' });
    socket?.emit('go-live', { pollId: id });
    toast.success('Poll is now live!');
  }, [id, setStatus, socket]);

  const closePoll = useCallback(() => {
    setStatus.mutate({ id: id!, status: 'closed' });
    socket?.emit('close-poll', { pollId: id });
    toast.info('Poll closed');
  }, [id, setStatus, socket]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${poll?.code}`);
    toast.success('Join link copied!');
  };

  if (!poll) return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const config = POLL_TYPE_CONFIG[poll.type as keyof typeof POLL_TYPE_CONFIG];
  const joinUrl = `${window.location.origin}/join/${poll.code}`;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex flex-col">
      {/* Control Bar */}
      <div className="bg-[#16213e] border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{config?.icon}</span>
          <span className="font-semibold truncate max-w-xs">{poll.question}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            poll.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>{poll.status}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sage" />
            <span className="font-bold text-sage">{participantCount}</span>
            <span className="text-gray-400">joined</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-terracotta" />
            <span className="font-bold text-terracotta">{results.total}</span>
            <span className="text-gray-400">votes</span>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-amber-400">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-xs">{connected ? 'Live' : 'Reconnecting'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {poll.status !== 'live' ? (
            <button onClick={goLive} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Go Live
            </button>
          ) : (
            <button onClick={closePoll} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors">
              <Square className="w-4 h-4" /> Close
            </button>
          )}
          <button onClick={() => navigate(`/analytics/${id}`)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Presenter View */}
      <div className="flex-1 flex gap-0">
        {/* Results Area */}
        <div className="flex-1 p-8 flex flex-col">
          <h1 className="text-3xl font-bold text-center mb-2 leading-tight">{poll.question}</h1>
          <div className="flex items-center justify-center gap-2 mb-8 text-gray-400 text-sm">
            <span>{config?.icon} {config?.label}</span>
            <span>·</span>
            <span>{results.total} response{results.total !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <ResultRenderer poll={poll} results={results} />
          </div>
        </div>

        {/* Join Panel */}
        <div className="w-64 bg-[#16213e] border-l border-white/10 p-5 flex flex-col gap-5">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-medium">Audience Join</div>
            <div className="flex justify-center mb-3">
              <QRCodeCanvas
                value={`${window.location.origin}/participate/${poll.code}`}
                size={160}
                fgColor="#E07A5F"
                bgColor="#FAFAFA"
                className="rounded-xl"
              />
            </div>
            <div className="bg-white/10 rounded-lg p-3 mb-2">
              <div className="text-xs text-gray-400 mb-1">{window.location.hostname}</div>
              <div className="text-2xl font-black font-mono tracking-[0.3em] text-terracotta">{poll.code}</div>
            </div>
            <button onClick={copyJoinLink} className="text-xs flex items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors mx-auto">
              <Copy className="w-3 h-3" /> Copy link
            </button>
          </div>

          {/* Live Participants */}
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-medium">Participants</div>
            <div className="text-4xl font-black text-sage text-center">{participantCount}</div>
            <div className="text-xs text-center text-gray-400 mt-1">currently joined</div>
          </div>

          {/* Response Rate */}
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-medium">Response Rate</div>
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-terracotta to-sage h-full transition-all duration-500"
                style={{ width: `${participantCount > 0 ? Math.min(100, (results.total / participantCount) * 100) : 0}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">
              {participantCount > 0 ? Math.round((results.total / participantCount) * 100) : 0}%
            </div>
          </div>

          <button
            onClick={() => navigate(`/analytics/${id}`)}
            className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta/20 hover:bg-terracotta/30 border border-terracotta/30 rounded-lg text-sm font-medium text-terracotta transition-colors"
          >
            <ChevronRight className="w-4 h-4" /> Full Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Result Renderer ─────────────────────────────────────────────
function ResultRenderer({ poll, results }: { poll: any; results: LiveResults }) {
  const type = poll.type;
  const total = results.total || 1;

  // Multiple Choice / True-False / Image Choice / Emoji Reaction / Bracket / Countdown
  if (['multiple_choice', 'true_false', 'image_choice', 'emoji_reaction', 'bracket', 'countdown_vote', 'prioritization'].includes(type)) {
    const data = (poll.options || poll.bracketOptions || []).map((opt: any, i: number) => ({
      name: opt.text || opt.label || opt || `Option ${i + 1}`,
      votes: results.counts[i] || 0,
      pct: Math.round(((results.counts[i] || 0) / total) * 100),
    })).sort((a: any, b: any) => b.votes - a.votes);

    return (
      <div className="w-full max-w-2xl">
        {data.map((item: any, i: number) => (
          <div key={i} className="mb-4">
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="font-medium truncate max-w-xs">{item.name}</span>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{item.votes} votes</span>
                <span className="font-bold text-white">{item.pct}%</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-full h-10 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.pct}%`,
                  background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`
                }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Word Cloud
  if (type === 'word_cloud') {
    const words = Object.entries(results.words || results.counts || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 30);
    const max = words[0]?.[1] as number || 1;
    return (
      <div className="flex flex-wrap justify-center items-center gap-3 max-w-2xl">
        {words.map(([word, count]) => (
          <span
            key={word}
            className="font-bold transition-all"
            style={{
              fontSize: `${Math.max(14, Math.min(60, (count as number / max) * 60))}px`,
              color: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)],
              opacity: 0.7 + ((count as number) / max) * 0.3,
            }}
          >
            {word}
          </span>
        ))}
        {!words.length && <p className="text-gray-400 text-lg">Waiting for responses…</p>}
      </div>
    );
  }

  // Rating
  if (type === 'rating') {
    const ratings = results.ratings || [];
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const dist = [1, 2, 3, 4, 5].map(r => ({ name: `${r}★`, value: ratings.filter(x => x === r).length }));
    return (
      <div className="text-center w-full max-w-lg">
        <div className="text-8xl font-black text-terracotta mb-2">{avg.toFixed(1)}</div>
        <div className="text-lg text-gray-400 mb-8">Average rating from {ratings.length} votes</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dist}>
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Bar dataKey="value" fill="#E07A5F" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // NPS
  if (type === 'nps') {
    const scores = results.npsScores || [];
    const detractors = scores.filter(s => s <= 6).length;
    const passives = scores.filter(s => s >= 7 && s <= 8).length;
    const promoters = scores.filter(s => s >= 9).length;
    const nps = scores.length ? Math.round(((promoters - detractors) / scores.length) * 100) : 0;
    const dist = Array.from({ length: 11 }, (_, i) => ({
      name: String(i),
      value: scores.filter(s => s === i).length,
    }));
    return (
      <div className="text-center w-full max-w-2xl">
        <div className={`text-8xl font-black mb-2 ${nps >= 50 ? 'text-green-400' : nps >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
          {nps > 0 ? '+' : ''}{nps}
        </div>
        <div className="text-gray-400 mb-6">Net Promoter Score</div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Detractors', count: detractors, color: 'text-red-400' },
            { label: 'Passives', count: passives, color: 'text-amber-400' },
            { label: 'Promoters', count: promoters, color: 'text-green-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4">
              <div className={`text-3xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={dist}>
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {dist.map((_, i) => (
                <Cell key={i} fill={i <= 6 ? '#C84B4B' : i <= 8 ? '#F59E0B' : '#10B981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Slider
  if (type === 'slider') {
    const vals = results.sliderValues || [];
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const min = poll.sliderMin ?? 0, max = poll.sliderMax ?? 100;
    const pct = ((avg - min) / (max - min)) * 100;
    return (
      <div className="text-center w-full max-w-lg">
        <div className="text-8xl font-black text-terracotta mb-2">{avg.toFixed(1)}</div>
        <div className="text-gray-400 mb-8">Average from {vals.length} responses</div>
        <div className="relative h-6 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-terracotta to-sage rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>{poll.leftLabel || min}</span>
          <span>{poll.rightLabel || max}</span>
        </div>
      </div>
    );
  }

  // Open Text / Q&A
  if (['open_text', 'qa', 'fill_blank'].includes(type)) {
    const responses = results.openResponses || [];
    return (
      <div className="w-full max-w-2xl space-y-3 max-h-80 overflow-y-auto">
        {responses.slice(-10).reverse().map((text, i) => (
          <div key={i} className="bg-white/10 rounded-xl px-5 py-3 text-sm animate-in fade-in slide-in-from-bottom-2">
            {text}
          </div>
        ))}
        {!responses.length && <p className="text-center text-gray-400">Waiting for responses…</p>}
      </div>
    );
  }

  // Ranking
  if (type === 'ranking') {
    const ranked = Object.entries(results.rankingData || {})
      .sort(([, a], [, b]) => (b as number) - (a as number));
    return (
      <div className="w-full max-w-lg space-y-3">
        {ranked.map(([label, score], i) => (
          <div key={label} className="flex items-center gap-4">
            <span className="w-8 h-8 rounded-full bg-terracotta/20 text-terracotta font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{label}</span>
                <span className="text-gray-400">{score as number} pts</span>
              </div>
              <div className="bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-terracotta to-sage h-full rounded-full" style={{ width: `${Math.min(100, (score as number / total) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
        {!ranked.length && <p className="text-center text-gray-400">Waiting for rankings…</p>}
      </div>
    );
  }

  // Matrix
  if (type === 'matrix') {
    const rows = poll.matrixRows || [];
    const cols = poll.matrixColumns || [];
    const data = poll.matrixRows || [];
    return (
      <div className="overflow-x-auto w-full max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 text-gray-400 font-normal pr-4"></th>
              {cols.map((col: string) => (
                <th key={col} className="py-2 px-3 text-center text-xs font-medium text-gray-300">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string) => (
              <tr key={row} className="border-t border-white/10">
                <td className="py-3 pr-4 font-medium text-white">{row}</td>
                {cols.map((col: string) => {
                  const count = results.matrixData?.[row]?.[col] || 0;
                  const rowTotal = Object.values(results.matrixData?.[row] || {}).reduce((a: any, b: any) => a + b, 0) || 1;
                  const pct = Math.round((count / rowTotal) * 100);
                  return (
                    <td key={col} className="py-3 px-3 text-center">
                      <div className="text-sm font-bold text-terracotta">{count}</div>
                      <div className="text-xs text-gray-400">{pct}%</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Heatmap
  if (type === 'heatmap') {
    const points = results.heatmapPoints || [];
    return (
      <div className="relative w-full max-w-2xl" style={{ paddingBottom: '50%' }}>
        <div className="absolute inset-0 bg-white/5 rounded-2xl overflow-hidden">
          {points.map((pt, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 rounded-full"
              style={{
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(224,122,95,0.6) 0%, transparent 70%)',
              }}
            />
          ))}
          {!points.length && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">Waiting for clicks…</div>
          )}
        </div>
      </div>
    );
  }

  // Quiz
  if (type === 'quiz') {
    const qResults = results.quizResults || [];
    return (
      <div className="w-full max-w-lg">
        {qResults.map((q, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4 mb-3">
            <div className="flex justify-between mb-2 text-sm">
              <span>Question {q.questionIdx + 1}</span>
              <span className="text-green-400">{q.correctPct.toFixed(0)}% correct</span>
            </div>
            <div className="bg-white/10 rounded-full h-3">
              <div className="bg-green-500 h-full rounded-full" style={{ width: `${q.correctPct}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg time: {q.avgTime.toFixed(1)}s</div>
          </div>
        ))}
        {!qResults.length && <p className="text-center text-gray-400">Waiting for quiz results…</p>}
      </div>
    );
  }

  // Live Matching
  if (type === 'live_matching') {
    const matchData = results.matchingData || {};
    const left = poll.matchLeft || [];
    const right = poll.matchRight || [];
    return (
      <div className="w-full max-w-xl space-y-3">
        {left.map((item: string) => {
          const matches = matchData[item] || {};
          const topMatch = Object.entries(matches).sort(([, a], [, b]) => (b as number) - (a as number))[0];
          return (
            <div key={item} className="flex items-center gap-4">
              <span className="flex-1 text-right text-sm font-medium bg-white/10 rounded-lg px-3 py-2">{item}</span>
              <div className="text-terracotta font-bold">→</div>
              <span className="flex-1 text-sm bg-terracotta/20 text-terracotta rounded-lg px-3 py-2">
                {topMatch ? `${topMatch[0]} (${topMatch[1]})` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="text-center text-gray-400">
      <p>Results visualization loading…</p>
      <p className="text-sm mt-2">{results.total} responses received</p>
    </div>
  );
}
