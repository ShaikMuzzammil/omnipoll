import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Trophy, Clock, Loader2, CheckCircle, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie,
} from 'recharts';
import { attemptsApi } from '@/lib/api';
import { scoreColor, scoreLabel, formatDuration, pollTypeLabel } from '@/lib/utils';
import type { Attempt } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E'];

export default function StudentAnalytics() {
  const { data: attempts = [], isLoading } = useQuery<Attempt[]>({
    queryKey: ['my-attempts'],
    queryFn: () => attemptsApi.mine() as Promise<Attempt[]>,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-terracotta-400"/>
    </div>
  );

  const submitted = attempts.filter(a => a.status === 'submitted');
  const avgScore  = submitted.length && submitted.some(a=>a.percentage!=null)
    ? submitted.reduce((s,a)=>s+Number(a.percentage??0),0)/submitted.filter(a=>a.percentage!=null).length : 0;
  const best      = Math.max(...submitted.map(a=>Number(a.percentage??0)), 0);
  const passed    = submitted.filter(a=>Number(a.percentage??0)>=60).length;

  // Score distribution
  const distrib = [
    { range:'0–40',   count: submitted.filter(a=>Number(a.percentage??0)<40).length,              color:'#EF4444' },
    { range:'40–60',  count: submitted.filter(a=>Number(a.percentage??0)>=40&&Number(a.percentage??0)<60).length, color:'#F59E0B' },
    { range:'60–80',  count: submitted.filter(a=>Number(a.percentage??0)>=60&&Number(a.percentage??0)<80).length, color:'#3B82F6' },
    { range:'80–100', count: submitted.filter(a=>Number(a.percentage??0)>=80).length,             color:'#10B981' },
  ];

  // Activity by type
  const byType: Record<string,number> = {};
  submitted.forEach(a => {
    const t = (a as any).pollType ?? 'quiz';
    byType[t] = (byType[t]||0)+1;
  });
  const typeData = Object.entries(byType).map(([type,count])=>({ type:pollTypeLabel(type as any), count }));

  // Recent timeline (last 10)
  const timeline = submitted.slice(-10).map(a=>({
    name: new Date(a.submittedAt??'').toLocaleDateString('en',{month:'short',day:'numeric'}),
    score: Math.round(a.percentage??0),
  }));

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={22} className="text-terracotta-500"/> My Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Your personal performance insights</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Quizzes Done',  value:submitted.length,          icon:CheckCircle, color:'text-green-600',      bg:'bg-green-100' },
          { label:'Avg Score',     value:`${Number(avgScore).toFixed(0)}%`, icon:TrendingUp,  color:'text-blue-600',        bg:'bg-blue-100'  },
          { label:'Best Score',    value:`${Number(best).toFixed(0)}%`,     icon:Trophy,      color:'text-amber-600',       bg:'bg-amber-100' },
          { label:'Pass Rate',     value:submitted.length?`${Math.round(passed/submitted.length*100)}%`:'—', icon:Target, color:'text-purple-600', bg:'bg-purple-100' },
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={13} className={s.color}/>
              </div>
            </div>
            <span className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {submitted.length === 0 ? (
        <div className="text-center py-20 bg-white border border-cream-200 rounded-2xl">
          <BarChart3 size={40} className="mx-auto mb-4 text-slate-300"/>
          <p className="font-semibold text-slate-600 mb-1">No data yet</p>
          <p className="text-sm text-slate-400">Complete some quizzes to see your analytics here</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Score over time */}
          {timeline.length > 1 && (
            <div className="bg-white border border-cream-200 rounded-2xl p-5">
              <h2 className="font-display font-semibold text-slate-800 mb-4">Score Trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EFE0"/>
                  <XAxis dataKey="name" tick={{fontSize:11}} />
                  <YAxis domain={[0,100]} tick={{fontSize:11}} />
                  <Tooltip formatter={(v:number)=>`${v}%`} contentStyle={{borderRadius:'12px',border:'1px solid #E4CC94'}}/>
                  <Line type="monotone" dataKey="score" stroke="#D96C4A" strokeWidth={2.5} dot={{fill:'#D96C4A',r:4}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score distribution */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5">
            <h2 className="font-display font-semibold text-slate-800 mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distrib} barCategoryGap="30%">
                <XAxis dataKey="range" tick={{fontSize:11}} />
                <YAxis allowDecimals={false} tick={{fontSize:11}} />
                <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E4CC94'}}/>
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {distrib.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By quiz type */}
          {typeData.length > 0 && (
            <div className="bg-white border border-cream-200 rounded-2xl p-5">
              <h2 className="font-display font-semibold text-slate-800 mb-4">Attempts by Type</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{fontSize:11}}/>
                  <YAxis type="category" dataKey="type" width={110} tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E4CC94'}}/>
                  <Bar dataKey="count" radius={[0,6,6,0]}>
                    {typeData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent attempts */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5">
            <h2 className="font-display font-semibold text-slate-800 mb-4">Recent Attempts</h2>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {submitted.slice(0,8).map((a,i)=>{
                const pct = Number(a.percentage ?? 0);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 bg-cream-50 border border-cream-200 rounded-xl">
                    <div className={`w-2 h-8 rounded-full flex-shrink-0 ${pct>=80?'bg-green-400':pct>=60?'bg-blue-400':pct>=40?'bg-amber-400':'bg-red-400'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{(a as any).poll?.title ?? (a as any).pollTitle ?? 'Quiz'}</p>
                      <p className="text-xs text-slate-400">{a.timeTaken?formatDuration(a.timeTaken):''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-base font-bold ${scoreColor(pct)}`}>{pct.toFixed(0)}%</span>
                      <p className="text-[10px] text-slate-400">{scoreLabel(pct)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
