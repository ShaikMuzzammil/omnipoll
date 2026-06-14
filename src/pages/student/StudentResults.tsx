import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Search, Trophy, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { attemptsApi } from '@/lib/api';
import { formatDate, formatDuration, scoreColor, scoreLabel, pollTypeLabel } from '@/lib/utils';
import type { Attempt } from '@/lib/types';

export default function StudentResults() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'pass'|'fail'>('all');

  const { data: attempts = [], isLoading } = useQuery<Attempt[]>({
    queryKey: ['my-attempts'],
    queryFn: () => attemptsApi.mine() as Promise<Attempt[]>,
  });

  const filtered = attempts.filter(a => {
    const matchSearch = !search || (a.poll?.title ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'pass' ? a.passed === true : a.passed === false);
    return matchSearch && matchFilter && a.status === 'submitted';
  });

  const avgScore = attempts.filter(a => a.percentage !== undefined).reduce((s, a) => s + (a.percentage ?? 0), 0)
    / Math.max(1, attempts.filter(a => a.percentage !== undefined).length);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">My Results</h1>
        <p className="text-sm text-slate-500 mt-0.5">All your quiz and poll attempts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total Attempts', value: attempts.filter(a=>a.status==='submitted').length, color:'text-terracotta-600' },
          { label:'Average Score',  value: `${avgScore.toFixed(0)}%`, color: scoreColor(avgScore) },
          { label:'Passed',         value: attempts.filter(a=>a.passed===true).length, color:'text-green-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by poll title…"
            className="w-full pl-8 pr-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
        </div>
        <div className="flex gap-1">
          {(['all','pass','fail'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-terracotta-500 text-white' : 'bg-white border border-cream-300 text-slate-600 hover:border-terracotta-300'}`}>
              {f === 'all' ? 'All' : f === 'pass' ? '✓ Passed' : '✗ Failed'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500">{search ? 'No matching results' : 'No completed attempts yet'}</p>
          <Link to="/join" className="mt-3 inline-block text-sm text-terracotta-600 font-medium">Join a poll →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              className="op-card p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.passed === true ? 'bg-green-100' : a.passed === false ? 'bg-red-100' : 'bg-cream-200'}`}>
                  {a.passed === true
                    ? <CheckCircle size={20} className="text-green-600"/>
                    : a.passed === false
                    ? <XCircle size={20} className="text-red-500"/>
                    : <Trophy size={20} className="text-slate-400"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-slate-800">{a.poll?.title ?? 'Untitled'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                    {a.poll?.type && <span>{pollTypeLabel(a.poll.type)}</span>}
                    {a.submittedAt && <span className="flex items-center gap-0.5"><Clock size={10}/>{formatDate(a.submittedAt)}</span>}
                    {a.timeTaken && <span>{formatDuration(a.timeTaken)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {a.percentage !== undefined ? (
                    <>
                      <p className={`text-2xl font-display font-bold ${scoreColor(a.percentage)}`}>{a.percentage.toFixed(0)}%</p>
                      <p className="text-xs text-slate-400">{a.score}/{a.maxScore} pts</p>
                      <p className={`text-xs font-medium mt-0.5 ${scoreColor(a.percentage)}`}>{scoreLabel(a.percentage)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {a.percentage !== undefined && (
                <div className="mt-3 pt-3 border-t border-cream-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${a.percentage >= 60 ? 'bg-green-500' : a.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        initial={{ width:0 }} animate={{ width:`${a.percentage}%` }} transition={{ duration:0.6, delay:i*0.04 }}
                      />
                    </div>
                    <Link to={`/attempt/${a.id}/keysheet`}
                      className="flex items-center gap-1 text-xs text-terracotta-600 hover:text-terracotta-700 font-semibold px-2.5 py-1 bg-terracotta-50 hover:bg-terracotta-100 rounded-lg transition-colors flex-shrink-0">
                      Key Sheet <ArrowRight size={11}/>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
