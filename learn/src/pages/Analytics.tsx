import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Award, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { scoreColor, pollTypeLabel } from '@/lib/utils';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E'];

interface Overview {
  totalPolls: number; totalAttempts: number; totalParticipants: number; avgScore: number;
  pollsByType: {type:string; count:number}[];
  activityByDay: {day:string; attempts:number}[];
  topPolls: {title:string; attempts:number; avgScore:number}[];
  scoreDistribution: {range:string; count:number}[];
}

export default function Analytics() {
  const { data: ov, isLoading } = useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview() as Promise<Overview>,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-terracotta-400"/>
    </div>
  );

  const overview = ov ?? {
    totalPolls:0, totalAttempts:0, totalParticipants:0, avgScore:0,
    pollsByType:[], activityByDay:[], topPolls:[], scoreDistribution:[],
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Analytics Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aggregated insights across all your polls</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total Polls',    value: overview.totalPolls,        icon: BarChart3,  color:'text-terracotta-600' },
          { label:'Total Attempts', value: overview.totalAttempts,     icon: TrendingUp, color:'text-blue-600' },
          { label:'Participants',   value: overview.totalParticipants, icon: Users,      color:'text-green-600' },
          { label:'Avg Score',      value: `${(overview.avgScore ?? 0).toFixed(0)}%`, icon: Award, color:scoreColor(overview.avgScore ?? 0) },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className="stat-card">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{s.label}</span><s.icon size={15} className={s.color}/></div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Activity chart */}
        <div className="op-card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Activity (Last 7 Days)</h3>
          {overview.activityByDay.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No activity yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={overview.activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6C8"/>
                <XAxis dataKey="day" tick={{ fontSize:11, fill:'#64748b' }}/>
                <YAxis tick={{ fontSize:11, fill:'#64748b' }}/>
                <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
                <Line type="monotone" dataKey="attempts" stroke="#D96C4A" strokeWidth={2.5} dot={{ fill:'#D96C4A', r:4 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Poll types pie */}
        <div className="op-card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Polls by Type</h3>
          {overview.pollsByType.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No polls yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={overview.pollsByType.map(p => ({ name: pollTypeLabel(p.type as Parameters<typeof pollTypeLabel>[0]), value: p.count }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {overview.pollsByType.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score distribution */}
        <div className="op-card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Score Distribution</h3>
          {overview.scoreDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No quiz data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overview.scoreDistribution} margin={{ left:-20 }}>
                <XAxis dataKey="range" tick={{ fontSize:11, fill:'#64748b' }}/>
                <YAxis tick={{ fontSize:11, fill:'#64748b' }}/>
                <Tooltip contentStyle={{ background:'#FEFAF5', border:'1px solid #E4CC94', borderRadius:'8px', fontSize:'12px' }}/>
                <Bar dataKey="count" fill="#D96C4A" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top polls */}
        <div className="op-card p-5">
          <h3 className="font-display font-semibold text-slate-700 mb-4">Top Performing Polls</h3>
          {overview.topPolls.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {overview.topPolls.slice(0,5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-terracotta-100 text-terracotta-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.attempts} attempts</p>
                  </div>
                  {p.avgScore > 0 && (
                    <span className={`text-sm font-bold ${scoreColor(p.avgScore)}`}>{(p.avgScore ?? 0).toFixed(0)}%</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
