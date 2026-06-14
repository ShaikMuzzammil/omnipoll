import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2, Star } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { scoreColor } from '@/lib/utils';

interface LeaderEntry { rank:number; name:string; score:number; attempts:number; avgScore:number; streak?:number }

export default function Leaderboard() {
  const { data: entries = [], isLoading } = useQuery<LeaderEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => analyticsApi.overview().then((d: unknown) => (d as { leaderboard?: LeaderEntry[] }).leaderboard ?? []),
  });

  const rankIcon = (r:number) => r===1?'🥇':r===2?'🥈':r===3?'🥉':`#${r}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div className="text-center">
        <Trophy size={40} className="mx-auto mb-3 text-yellow-500"/>
        <h1 className="font-display text-2xl font-bold text-slate-800">Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">Top performers across all polls</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
          <Medal size={40} className="mx-auto mb-3 text-slate-300"/>
          <p className="text-slate-500">No data yet. Complete some quizzes to appear here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[entries[1], entries[0], entries[2]].map((e, i) => e && (
                <motion.div key={e.name}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
                  className={`op-card p-4 text-center ${i===1 ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
                  <div className="text-3xl mb-2">{i===1?'🥇':i===0?'🥈':'🥉'}</div>
                  <p className="font-display font-bold text-slate-800 text-sm truncate">{e.name}</p>
                  <p className={`text-lg font-black ${scoreColor(e.avgScore)}`}>{e.avgScore.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">{e.attempts} attempts</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Full list */}
          {entries.map((e, i) => (
            <motion.div key={e.name} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
              className={`op-card p-4 flex items-center gap-4 ${i < 3 ? 'border-terracotta-200' : ''}`}>
              <span className="text-lg font-black w-10 text-center text-terracotta-500">{rankIcon(e.rank)}</span>
              <div className="w-9 h-9 bg-terracotta-100 rounded-full flex items-center justify-center text-sm font-bold text-terracotta-700 flex-shrink-0">
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{e.name}</p>
                <p className="text-xs text-slate-400">{e.attempts} polls completed</p>
              </div>
              {e.streak && e.streak > 1 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                  🔥 {e.streak}
                </span>
              )}
              <div className="text-right flex-shrink-0">
                <p className={`text-xl font-black ${scoreColor(e.avgScore)}`}>{e.avgScore.toFixed(0)}%</p>
                <p className="text-xs text-slate-400">avg score</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
