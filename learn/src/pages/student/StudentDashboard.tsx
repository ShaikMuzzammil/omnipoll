import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Clock, TrendingUp, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import { attemptsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate, formatDuration, scoreColor, scoreLabel } from '@/lib/utils';
import type { Attempt } from '@/lib/types';

export default function StudentDashboard() {
  const { user } = useApp();
  const { data: attempts = [], isLoading } = useQuery<Attempt[]>({
    queryKey: ['my-attempts'],
    queryFn: () => attemptsApi.mine() as Promise<Attempt[]>,
  });

  const completed  = attempts.filter(a => a.status === 'submitted');
  const avgScore   = completed.length > 0
    ? completed.reduce((s, a) => s + (a.percentage ?? 0), 0) / completed.length
    : 0;
  const best       = completed.reduce((b, a) => (a.percentage ?? 0) > (b?.percentage ?? 0) ? a : b, completed[0]);
  const totalTime  = completed.reduce((s, a) => s + (a.timeTaken ?? 0), 0);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Welcome, {user?.name?.split(' ')[0]}! 📚</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your learning dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Quizzes Taken',  value: completed.length, icon: BookOpen,   color:'text-terracotta-600' },
          { label:'Average Score',  value: `${avgScore.toFixed(0)}%`, icon: BarChart3, color: scoreColor(avgScore) },
          { label:'Best Score',     value: best ? `${(best.percentage??0).toFixed(0)}%` : '—', icon: Trophy, color:'text-yellow-600' },
          { label:'Total Time',     value: totalTime > 0 ? formatDuration(totalTime) : '—', icon: Clock, color:'text-blue-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className="stat-card">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{s.label}</span><s.icon size={15} className={s.color}/></div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Quick action */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link to="/join" className="op-card p-5 flex items-center gap-4 hover:border-terracotta-300 group">
          <div className="w-12 h-12 bg-terracotta-100 rounded-2xl flex items-center justify-center group-hover:bg-terracotta-200 transition-colors">
            <ArrowRight size={22} className="text-terracotta-600"/>
          </div>
          <div>
            <p className="font-display font-semibold text-slate-800">Join a Poll</p>
            <p className="text-xs text-slate-500">Enter a 6-char code to participate</p>
          </div>
        </Link>
        <Link to="/student/results" className="op-card p-5 flex items-center gap-4 hover:border-terracotta-300 group">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <TrendingUp size={22} className="text-blue-600"/>
          </div>
          <div>
            <p className="font-display font-semibold text-slate-800">My Results</p>
            <p className="text-xs text-slate-500">View all attempts and key sheets</p>
          </div>
        </Link>
      </div>

      {/* Recent attempts */}
      <div>
        <h2 className="font-display font-semibold text-slate-800 mb-3">Recent Activity</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-terracotta-400"/></div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 bg-white/60 border border-cream-300 rounded-2xl">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-slate-500 mb-3">No polls taken yet</p>
            <Link to="/join" className="text-sm text-terracotta-600 font-medium">Join your first poll →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.slice(0, 8).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                className="op-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{a.poll?.title ?? 'Untitled'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.submittedAt ? formatDate(a.submittedAt) : 'In progress'}
                    {a.timeTaken ? ` · ${formatDuration(a.timeTaken)}` : ''}
                  </p>
                </div>
                {a.percentage !== undefined ? (
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${scoreColor(a.percentage)}`}>{a.percentage.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">{scoreLabel(a.percentage)}</p>
                  </div>
                ) : (
                  <span className="badge-live text-xs">In Progress</span>
                )}
                {a.status === 'submitted' && (
                  <Link to={`/attempt/${a.id}/keysheet`} className="flex-shrink-0 text-xs text-terracotta-600 hover:text-terracotta-700 font-medium px-2 py-1 bg-terracotta-50 rounded-lg">
                    Key Sheet
                  </Link>
                )}
              </motion.div>
            ))}
            {attempts.length > 8 && (
              <Link to="/student/results" className="block text-center text-sm text-terracotta-600 font-medium py-2">
                View all {attempts.length} results →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
