import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, X, Maximize2, Wifi, BarChart3, Trophy, Clock, Minimize2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { pollsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { Poll } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E','#EEDBB0','#C55A38'];
const STUDENT_APP_URL = import.meta.env.VITE_STUDENT_APP_URL || window.location.origin;

export default function Present() {
  const { pollId } = useParams<{ pollId:string }>();
  const qc = useQueryClient();
  const [showQr,     setShowQr]     = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [liveCount,  setLiveCount]  = useState(0);

  const { data: poll } = useQuery<Poll>({
    queryKey: ['poll', pollId],
    queryFn: () => pollsApi.get(pollId!) as Promise<Poll>,
  });
  const { data: results } = useQuery<any>({
    queryKey: ['poll-results', pollId],
    queryFn: () => pollsApi.results(pollId!) as Promise<any>,
    refetchInterval: 3000,
    enabled: !!pollId,
  });

  usePollChannel(pollId, {
    'new-vote':    () => qc.invalidateQueries({ queryKey: ['poll-results', pollId] }),
    'new-attempt': () => { qc.invalidateQueries({ queryKey: ['poll-results', pollId] }); setLiveCount(c => c+1); },
  });

  const toggleFS = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  if (!poll) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"/></div>;

  // The join URL points to the LEARN/STUDENT app, not the host app
  const joinUrl = `${STUDENT_APP_URL}/join/${poll.code}`;
  const optionStats = results?.optionStats ?? [];
  const leaderboard = results?.leaderboard ?? [];
  const words       = results?.words ?? [];

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
            <BarChart3 size={16}/>
          </div>
          <div>
            <p className="text-xs text-slate-400">{pollTypeLabel(poll.type)}</p>
            <p className="font-display font-semibold text-sm">{poll.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-700 px-3 py-1.5 rounded-lg">
            <Users size={14} className="text-terracotta-400"/>
            {poll.uniqueParticipants + liveCount}
            <span className="text-slate-500 text-xs">joined</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-green-400 bg-slate-700 px-3 py-1.5 rounded-lg">
            <Wifi size={13}/> Live
          </div>
          <button onClick={() => setShowQr(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
            <QrCode size={14}/> QR
          </button>
          <button onClick={toggleFS} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            {fullscreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
          </button>
          <Link to={`/results/${pollId}`} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <X size={14}/>
          </Link>
        </div>
      </div>

      {/* Join URL bar */}
      <div className="flex items-center justify-center gap-6 py-3.5 bg-slate-800/50 border-b border-slate-700/50">
        <div className="text-slate-400 text-sm">
          Join at <span className="text-white font-semibold">{STUDENT_APP_URL.replace('https://','').replace('http://','')+'/join'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Code:</span>
          <span className="font-mono text-2xl font-black text-terracotta-400 tracking-[0.35em]">{poll.code}</span>
        </div>
      </div>

      {/* QR Overlay */}
      <AnimatePresence>
        {showQr && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            onClick={() => setShowQr(false)}>
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }} exit={{ scale:0.85 }}
              className="bg-white p-8 rounded-2xl text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Use Google Charts API for reliable QR without auth */}
              <img
                src={`https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(joinUrl)}&choe=UTF-8`}
                alt="QR Code"
                className="w-56 h-56 mx-auto mb-4 rounded-xl"
                onError={e => {
                  // Fallback to qrserver
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(joinUrl)}`;
                }}
              />
              <p className="font-mono text-3xl font-black text-terracotta-600 tracking-[0.3em] mb-2">{poll.code}</p>
              <p className="text-sm text-slate-500 mb-1">Scan to join the poll</p>
              <p className="text-xs text-slate-400 break-all max-w-[220px] mx-auto">{joinUrl}</p>
              <button onClick={() => setShowQr(false)}
                className="mt-4 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="flex-1 p-8">
        {/* MULTIPLE CHOICE / QUIZ */}
        {['multiple_choice','quiz','true_false','image_choice','nps','rating'].includes(poll.type) && (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-8">{poll.title}</h2>
            {optionStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-xl">Waiting for responses…</p>
                  <p className="text-sm text-slate-600 mt-2">Share code <span className="text-terracotta-400 font-bold font-mono tracking-wider">{poll.code}</span></p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {optionStats.map((opt: any, i: number) => (
                  <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white/80 text-sm font-medium w-48 truncate">{opt.text}</span>
                      <span className="ml-auto text-white/60 text-sm font-semibold">{opt.count} ({opt.percentage?.toFixed(0)}%)</span>
                    </div>
                    <div className="h-10 bg-slate-700 rounded-xl overflow-hidden">
                      <motion.div className="h-full rounded-xl flex items-center px-3"
                        style={{ width:`${Math.max(opt.percentage??0, 2)}%`, backgroundColor: COLORS[i%COLORS.length] }}
                        initial={{ width:0 }} animate={{ width:`${Math.max(opt.percentage??0,2)}%` }}
                        transition={{ duration:0.6, ease:'easeOut' }}>
                        {(opt.percentage??0) > 15 && <span className="text-white font-bold text-sm">{opt.percentage?.toFixed(0)}%</span>}
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
                {words.map((w: any, i: number) => (
                  <motion.span key={w.text} initial={{ opacity:0, scale:0 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.03 }}
                    className="rounded-2xl px-4 py-2 font-bold text-white"
                    style={{ fontSize:`${Math.max(14, Math.min(48, 14 + w.count*6))}px`, backgroundColor:COLORS[i%COLORS.length] }}>
                    {w.text}
                  </motion.span>
                ))}
              </AnimatePresence>
              {words.length === 0 && <p className="text-slate-500 text-xl">Waiting for words…</p>}
            </div>
          </div>
        )}

        {/* LEADERBOARD for Quiz */}
        {poll.type === 'quiz' && leaderboard.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8">
            <h3 className="font-display text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400"/> Live Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.slice(0,10).map((e: any, i: number) => (
                <motion.div key={e.name} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${i===0?'bg-yellow-500/20 border-yellow-500/40':i===1?'bg-slate-400/10 border-slate-400/30':i===2?'bg-orange-500/10 border-orange-500/30':'bg-slate-800 border-slate-700'}`}>
                  <span className="text-2xl w-8 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                  <span className="flex-1 font-semibold text-lg">{e.name}</span>
                  <span className="font-bold text-xl text-terracotta-400">{e.score}</span>
                  <span className="text-slate-400 text-sm flex items-center gap-1"><Clock size={12}/>{e.timeTaken}s</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 bg-slate-800/60 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>Live</span>
        <span>{pollTypeIcon(poll.type)} {pollTypeLabel(poll.type)}</span>
        <span>{poll.totalVotes} votes · {poll.uniqueParticipants + liveCount} participants</span>
      </div>
    </div>
  );
}
