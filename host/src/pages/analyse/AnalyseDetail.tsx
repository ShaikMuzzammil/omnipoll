import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, CartesianGrid,
} from 'recharts';
import { pollsApi } from '@/lib/api';
import { scoreColor } from '@/lib/utils';
import type { PollAnalytics } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E'];

export default function AnalyseDetail() {
  const { pollId } = useParams<{ pollId: string }>();

  const { data: analytics, isLoading } = useQuery<PollAnalytics>({
    queryKey: ['poll-analytics', pollId],
    queryFn: () => pollsApi.analytics(pollId!) as Promise<PollAnalytics>,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
  );
  if (!analytics) return (
    <div className="text-center py-20">
      <AlertTriangle size={32} className="mx-auto mb-3 text-slate-300"/>
      <p className="text-slate-500">No analytics data available yet</p>
    </div>
  );

  return (
    <div className="space-y-6 page-enter">
      <div>
        <Link to={`/results/${pollId}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-terracotta-600 mb-3 transition-colors">
          <ArrowLeft size={14}/> Back to Results
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-800">{analytics.poll?.title} — Deep Analysis</h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label:'Total Attempts',    value: analytics.totalAttempts },
          { label:'Completed',         value: analytics.completedAttempts },
          { label:'Avg Score',         value: analytics.averageScore !== undefined ? `${(analytics.averageScore ?? 0).toFixed(0)}%` : '—' },
          { label:'Pass Rate',         value: analytics.passRate !== undefined ? `${(analytics.passRate ?? 0).toFixed(0)}%` : '—' },
          { label:'Avg Time',          value: analytics.averageTimeSecs ? `${Math.round(analytics.averageTimeSecs)}s` : '—' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-2xl font-display font-bold text-terracotta-600">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Score distribution */}
        {analytics.scoreDistribution && analytics.scoreDistribution.length > 0 && (
          <div className="op-card p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.scoreDistribution} margin={{ left:-20 }}>
                <XAxis dataKey="range" tick={{ fontSize:11, fill:'#64748b' }}/>
                <YAxis tick={{ fontSize:11, fill:'#64748b' }}/>
                <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {analytics.scoreDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hourly activity */}
        {analytics.hourlyActivity && analytics.hourlyActivity.length > 0 && (
          <div className="op-card p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-4">Submission Timeline</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6C8"/>
                <XAxis dataKey="hour" tick={{ fontSize:10, fill:'#64748b' }}/>
                <YAxis tick={{ fontSize:11, fill:'#64748b' }}/>
                <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
                <Line type="monotone" dataKey="count" stroke="#D96C4A" strokeWidth={2.5} dot={{ fill:'#D96C4A', r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Option stats */}
        {analytics.optionStats && analytics.optionStats.length > 0 && (
          <div className="op-card p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-4">Response Distribution</h3>
            <div className="space-y-2">
              {analytics.optionStats.map((opt, i) => (
                <div key={opt.optionId} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28 truncate">{opt.text}</span>
                  <div className="flex-1 h-6 bg-cream-200 rounded-lg overflow-hidden">
                    <motion.div className="h-full rounded-lg flex items-center px-2"
                      style={{ width:`${opt.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      initial={{ width:0 }} animate={{ width:`${opt.percentage}%` }} transition={{ duration:0.6 }}>
                      {opt.percentage > 12 && <span className="text-white text-xs font-bold">{(opt.percentage ?? 0).toFixed(0)}%</span>}
                    </motion.div>
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right">{opt.count} votes</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top students leaderboard */}
        {analytics.topStudents && analytics.topStudents.length > 0 && (
          <div className="op-card p-5">
            <h3 className="font-display font-semibold text-slate-700 mb-4">🏆 Top Scorers</h3>
            <div className="space-y-2">
              {analytics.topStudents.slice(0,8).map((s, i) => (
                <div key={s.name} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${i < 3 ? 'bg-terracotta-50 border border-terracotta-100' : 'bg-cream-50'}`}>
                  <span className="w-6 text-center text-sm font-bold text-terracotta-600">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">{s.name}</span>
                  <span className={`text-sm font-bold ${scoreColor(s.score ?? 0)}`}>{(s.score ?? 0).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-question analysis */}
      {analytics.questionAnalysis && analytics.questionAnalysis.length > 0 && (
        <div className="op-card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Question-Level Analysis</h3>
          <div className="space-y-4">
            {analytics.questionAnalysis.map((q, i) => (
              <div key={q.questionId} className="pb-4 border-b border-cream-200 last:border-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-slate-800">Q{i+1}. {q.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{q.difficulty}</span>
                    <span className={`text-sm font-bold ${scoreColor(q.correctRate ?? 0)}`}>{(q.correctRate ?? 0).toFixed(0)}% correct</span>
                  </div>
                </div>
                <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${q.correctRate >= 60 ? 'bg-green-500' : q.correctRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width:`${q.correctRate}%` }} initial={{ width:0 }} animate={{ width:`${q.correctRate}%` }} transition={{ duration:0.6 }}/>
                </div>
                <p className="text-xs text-slate-400 mt-1">Avg time: {(q.avgTimeSecs ?? 0).toFixed(0)}s</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
