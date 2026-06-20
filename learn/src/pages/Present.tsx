import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, QrCode, X, Maximize2, Wifi,
  BarChart3, Trophy, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { pollsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { Poll } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E','#EEDBB0','#C55A38','#83372  3'];

interface Results {
  optionStats?: { id:string; text:string; count:number; percentage:number }[];
  words?: { text:string; count:number }[];
  questions?: { text:string; author:string; upvotes:number; answered:boolean }[];
  leaderboard?: { name:string; score:number; rank:number; timeTaken:number }[];
  average?: number;
  distribution?: Record<string,number>;
}

export default function Present() {
  const { pollId } = useParams<{ pollId:string }>();
  const qc = useQueryClient();
  const [showQr, setShowQr] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const { data: poll } = useQuery<Poll>({
    queryKey: ['poll', pollId],
    queryFn: () => pollsApi.get(pollId!) as Promise<Poll>,
  });

  const { data: results } = useQuery<Results>({
    queryKey: ['poll-results', pollId],
    queryFn: () => pollsApi.results(pollId!) as Promise<Results>,
    refetchInterval: 3000,
    enabled: !!pollId,
  });

  usePollChannel(pollId, {
    'new-vote':    () => qc.invalidateQueries({ queryKey: ['poll-results', pollId] }),
    'new-attempt': () => { qc.invalidateQueries({ queryKey: ['poll-results', pollId] }); setLiveCount(c => c+1); },
    'participant-count': (data: unknown) => setLiveCount((data as {count:number}).count),
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  if (!poll) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const joinUrl = `${window.location.origin}/join/${poll.code}`;
  const optionStats = results?.optionStats ?? [];
  const words = results?.words ?? [];
  const leaderboard = results?.leaderboard ?? [];

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
            <BarChart3 size={16}/>
          </div>
          <div>
            <p className="text-xs text-slate-400">{pollTypeLabel(poll.type)}</p>
            <p className="font-display font-semibold text-sm">{poll.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-700 px-3 py-1.5 rounded-lg">
            <Users size={14} className="text-terracotta-400"/>
            {poll.uniqueParticipants + liveCount}
            <span className="text-slate-500 text-xs">participants</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-green-400 bg-slate-700 px-3 py-1.5 rounded-lg">
            <Wifi size={13}/>
            <span>Live</span>
          </div>
          <button onClick={() => setShowQr(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
            <QrCode size={14}/> QR
          </button>
          <button onClick={toggleFullscreen} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <Maximize2 size={14}/>
          </button>
          <Link to={`/results/${pollId}`} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <X size={14}/>
          </Link>
        </div>
      </div>

      {/* Join code hero */}
      <div className="flex items-center justify-center gap-6 py-4 bg-slate-800/40 border-b border-slate-700/50">
        <span className="text-slate-400 text-sm">Join at <span className="text-white font-medium">omnipoll.vercel.app/join</span></span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Code:</span>
          <span className="font-mono text-2xl font-black text-terracotta-400 tracking-[0.3em]">{poll.code}</span>
        </div>
      </div>

      {/* QR overlay */}
      <AnimatePresence>
        {showQr && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            onClick={() => setShowQr(false)}>
            <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} exit={{ scale:0.8 }}
              className="bg-white p-8 rounded-2xl text-center" onClick={e => e.stopPropagation()}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(joinUrl)}`} alt="QR" className="w-56 h-56 mx-auto mb-4"/>
              <p className="font-mono text-2xl font-black text-terracotta-600 tracking-widest">{poll.code}</p>
              <p className="text-sm text-slate-500 mt-1">Scan to join</p>
              <button onClick={() => setShowQr(false)} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main results */}
      <div className="flex-1 p-8">

        {/* MULTIPLE CHOICE / QUIZ / TRUE_FALSE */}
        {['multiple_choice','quiz','true_false','image_choice'].includes(poll.type) && (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            {optionStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-xl">Waiting for responses…</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {optionStats.map((opt, i) => (
                  <motion.div key={opt.id ?? i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white/80 text-sm font-medium w-48 truncate">{opt.text}</span>
                      <span className="ml-auto text-white/60 text-sm">{opt.count} ({opt.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-10 bg-slate-700 rounded-xl overflow-hidden">
                      <motion.div
                        className="h-full rounded-xl flex items-center px-3"
                        style={{ width: `${Math.max(opt.percentage, 2)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        initial={{ width:0 }} animate={{ width:`${Math.max(opt.percentage,2)}%` }}
                        transition={{ duration:0.6, ease:'easeOut' }}
                      >
                        {opt.percentage > 15 && <span className="text-white font-bold text-sm">{opt.percentage.toFixed(0)}%</span>}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORD CLOUD */}
        {poll.type === 'word_cloud' && (
          <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-10">{poll.title}</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <AnimatePresence>
                {words.map((w, i) => (
                  <motion.span key={w.text} initial={{ opacity:0, scale:0 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.03 }}
                    className="rounded-2xl px-4 py-2 font-bold text-white"
                    style={{
                      fontSize: `${Math.max(14, Math.min(48, 14 + w.count * 6))}px`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}>
                    {w.text}
                  </motion.span>
                ))}
              </AnimatePresence>
              {words.length === 0 && <p className="text-slate-500 text-xl">Waiting for words…</p>}
            </div>
          </div>
        )}

        {/* NPS */}
        {poll.type === 'nps' && (
          <div className="h-full flex flex-col max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            <div className="text-center mb-8">
              <div className="text-7xl font-display font-black text-terracotta-400">
                {results?.average?.toFixed(1) ?? '—'}
              </div>
              <p className="text-slate-400 mt-2">Average NPS Score</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(results?.distribution ?? {}).map(([k,v])=>({score:k,count:v}))}>
                <XAxis dataKey="score" tick={{ fill:'#94a3b8', fontSize:12 }}/>
                <YAxis tick={{ fill:'#94a3b8', fontSize:12 }}/>
                <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #475569', borderRadius:'8px' }}/>
                <Bar dataKey="count" fill="#D96C4A" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RATING */}
        {poll.type === 'rating' && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold mb-8">{poll.title}</h2>
            <div className="text-8xl font-display font-black text-yellow-400 mb-2">{results?.average?.toFixed(1) ?? '—'}</div>
            <div className="flex gap-2 justify-center mb-6">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-4xl ${(results?.average ?? 0) >= s ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
              ))}
            </div>
            <p className="text-slate-400">{poll.uniqueParticipants} ratings</p>
          </div>
        )}

        {/* QUIZ LEADERBOARD */}
        {poll.type === 'quiz' && leaderboard.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400"/> Live Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.slice(0,10).map((entry, i) => (
                <motion.div key={entry.name} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${i===0 ? 'bg-yellow-500/20 border-yellow-500/40' : i===1 ? 'bg-slate-400/10 border-slate-400/30' : i===2 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800 border-slate-700'}`}>
                  <span className="text-2xl w-8 text-center">{i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `#${i+1}`}</span>
                  <span className="flex-1 font-semibold text-lg">{entry.name}</span>
                  <span className="font-bold text-xl text-terracotta-400">{entry.score}</span>
                  <span className="text-slate-400 text-sm flex items-center gap-1"><Clock size={12}/>{entry.timeTaken}s</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* EMOJI */}
        {poll.type === 'emoji' && (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="font-display text-3xl font-bold text-center mb-10">{poll.title}</h2>
            <div className="flex flex-wrap gap-6 justify-center">
              {optionStats.map((opt, i) => (
                <motion.div key={i} className="text-center" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.05 }}>
                  <div className="mb-2" style={{ fontSize:`${Math.max(40, Math.min(120, 40 + opt.count * 8))}px` }}>{opt.text}</div>
                  <p className="text-slate-400 font-bold">{opt.count}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* RANKING */}
        {poll.type === 'ranking' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            <div className="space-y-3">
              {optionStats.sort((a,b) => b.count - a.count).map((opt, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-800 rounded-2xl border border-slate-700">
                  <span className="text-2xl font-black text-terracotta-400 w-8">#{i+1}</span>
                  <span className="flex-1 font-semibold">{opt.text}</span>
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-terracotta-500" style={{ width:`${opt.percentage}%` }}
                      initial={{ width:0 }} animate={{ width:`${opt.percentage}%` }} transition={{ duration:0.6 }}/>
                  </div>
                  <span className="text-slate-400 text-sm w-12 text-right">{opt.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q&A */}
        {poll.type === 'qa' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            <div className="space-y-3">
              {(results?.questions ?? []).slice(0,8).map((q, i) => (
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-2xl">
                  <p className="text-white font-medium mb-2">"{q.text}"</p>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{q.author}</span>
                    <span className="flex items-center gap-1">👍 {q.upvotes}</span>
                  </div>
                </motion.div>
              ))}
              {(results?.questions ?? []).length === 0 && <p className="text-center text-slate-500 py-12">No questions yet…</p>}
            </div>
          </div>
        )}

        {/* DEFAULT FALLBACK: bar chart */}
        {!['multiple_choice','quiz','word_cloud','nps','rating','true_false','image_choice','emoji','ranking','qa'].includes(poll.type) && (
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={optionStats} margin={{ left:-10 }}>
                <XAxis dataKey="text" tick={{ fill:'#94a3b8', fontSize:12 }}/>
                <YAxis tick={{ fill:'#94a3b8', fontSize:12 }}/>
                <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #475569', borderRadius:'8px', fontSize:'12px' }}/>
                <Bar dataKey="count" radius={[8,8,0,0]}>
                  {optionStats.map((_:unknown, i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-2 bg-slate-800/60 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>Live</span>
        <span>{pollTypeIcon(poll.type)} {pollTypeLabel(poll.type)}</span>
        <span>{poll.totalVotes} votes · {poll.uniqueParticipants} participants</span>
      </div>
    </div>
  );
}
