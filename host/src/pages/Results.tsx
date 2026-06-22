import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Clock, Copy, ExternalLink,
  Download, Loader2, CheckCircle, Share2, Play, Square,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { toast } from 'sonner';
import { pollsApi, attemptsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel, pollTypeIcon, formatDate, formatDuration, scoreColor } from '@/lib/utils';
import type { Poll, Attempt } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E','#EEDBB0'];
const STUDENT_APP_URL = import.meta.env.VITE_STUDENT_APP_URL ?? 'https://omnipoll-learn.vercel.app';

export default function Results() {
  const { pollId } = useParams<{ pollId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'results'|'attempts'>('results');

  const { data: poll, isLoading: pollLoading } = useQuery<Poll>({
    queryKey: ['poll', pollId],
    queryFn: () => pollsApi.get(pollId!) as Promise<Poll>,
    refetchInterval: 5000,
  });

  const { data: results } = useQuery({
    queryKey: ['poll-results', pollId],
    queryFn: () => pollsApi.results(pollId!),
    refetchInterval: 5000,
    enabled: !!pollId,
  });

  const { data: attempts = [] } = useQuery<Attempt[]>({
    queryKey: ['poll-attempts', pollId],
    queryFn: () => attemptsApi.forPoll(pollId!) as Promise<Attempt[]>,
    enabled: tab === 'attempts' && !!pollId,
    refetchInterval: 8000,
  });

  // Realtime vote updates
  usePollChannel(pollId, {
    'new-vote': () => { qc.invalidateQueries({ queryKey: ['poll-results', pollId] }); },
    'new-attempt': () => { qc.invalidateQueries({ queryKey: ['poll-attempts', pollId] }); },
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => pollsApi.status(pollId!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['poll', pollId] }); toast.success('Poll updated'); },
  });
  const releaseMut = useMutation({
    mutationFn: () => pollsApi.release(pollId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['poll', pollId] }); toast.success('Results released to all students!'); },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(`${STUDENT_APP_URL}/join/${poll?.code}`);
    toast.success('Student join link copied!');
  };

  if (pollLoading || !poll) return (
    <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
  );

  const chartData = (results as { optionStats?: {text:string; count:number; percentage:number}[] })?.optionStats ?? [];

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{pollTypeIcon(poll.type)}</span>
            <span className="text-xs text-slate-500 font-medium">{pollTypeLabel(poll.type)}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              poll.status === 'active' ? 'badge-live' :
              poll.status === 'results_released' ? 'bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium' : 'badge-closed'
            }`}>
              {poll.status === 'active' ? '● Live' : poll.status === 'results_released' ? '🔓 Released' : 'Closed'}
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-slate-800">{poll.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
            <span className="font-mono text-sm font-bold text-terracotta-700 tracking-widest">{poll.code}</span>
            <button onClick={copyLink} className="p-1 hover:bg-cream-300 rounded"><Copy size={12}/></button>
          </div>
          <button
            onClick={() => window.open(`/present/${pollId}`, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-cream-300 hover:border-terracotta-300 rounded-xl text-sm font-medium text-slate-700 transition-all">
            <ExternalLink size={14}/> Present
          </button>
          <Link to={`/analyse/${pollId}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-cream-300 hover:border-terracotta-300 rounded-xl text-sm font-medium text-slate-700 transition-all">
            <BarChart3 size={14}/> Deep Analysis
          </Link>
          {poll.status === 'active' && (
            <button onClick={() => statusMut.mutate('closed')} className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-all">
              <Square size={14}/> Close Poll
            </button>
          )}
          {poll.status === 'draft' && (
            <button onClick={() => statusMut.mutate('active')} className="flex items-center gap-1.5 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-sm font-medium transition-all">
              <Play size={14}/> Launch
            </button>
          )}
          {poll.status === 'closed' && (
            <button onClick={() => releaseMut.mutate()} disabled={releaseMut.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-all">
              {releaseMut.isPending ? <Loader2 size={14} className="animate-spin"/> : '🔓'} Release Results
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Participants', value: poll.uniqueParticipants, icon: Users, color:'text-terracotta-600' },
          { label:'Total Votes',  value: poll.totalVotes, icon: BarChart3, color:'text-blue-600' },
          { label:'Created',      value: formatDate(poll.createdAt), icon: Clock, color:'text-slate-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{s.label}</span><s.icon size={14} className={s.color}/></div>
            <span className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 p-1 rounded-xl w-fit">
        {(['results','attempts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'results' ? '📊 Results' : `👥 Attempts (${attempts.length})`}
          </button>
        ))}
      </div>

      {tab === 'results' && (
        <div className="op-card p-5">
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📊</div>
              <p>No responses yet. Share the code <strong className="text-terracotta-600">{poll.code}</strong></p>
            </div>
          ) : (
            <div>
              <h3 className="font-display font-semibold text-slate-700 mb-4">Response Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ left:-20 }}>
                  <XAxis dataKey="text" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {chartData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {chartData.map((d: {text:string; count:number; percentage:number}, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-32 truncate">{d.text}</span>
                    <div className="flex-1 bg-cream-200 rounded-full h-2 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ width:`${d.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        initial={{ width:0 }} animate={{ width:`${d.percentage}%` }} transition={{ duration:0.6 }}/>
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-16 text-right">{d.count} ({d.percentage.toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'attempts' && (
        <div className="op-card overflow-hidden">
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-40"/>
              <p>No attempts yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-cream-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {a.user?.name ?? a.guestName ?? 'Anonymous'}
                      {a.guestEmail && <span className="block text-xs text-slate-400">{a.guestEmail}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {a.percentage !== undefined ? (
                        <span className={`font-bold ${scoreColor(a.percentage)}`}>
                          {a.score}/{a.maxScore} ({a.percentage.toFixed(0)}%)
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.timeTaken ? formatDuration(a.timeTaken) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={a.status === 'submitted' ? 'badge-conduct' : a.status === 'in_progress' ? 'badge-live' : 'badge-closed'}>
                        {a.status === 'submitted' ? '✓ Done' : a.status === 'in_progress' ? '● In Progress' : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/attempt/${a.id}/keysheet`} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">
                        Key Sheet →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
