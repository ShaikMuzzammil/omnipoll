import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2, Star, TrendingUp, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface LeaderEntry {
  rank:number; name:string; attempts:number;
  avgScore:number; bestScore:number; totalScore:number; isMe?:boolean;
}

export default function Leaderboard() {
  const { user } = useApp();

  const { data: entries=[], isLoading } = useQuery<LeaderEntry[]>({
    queryKey: ['leaderboard', user?.role],
    queryFn: async () => {
      const ep = user?.role === 'student' ? '/api/leaderboard/student' : '/api/leaderboard';
      const res = await fetch(ep, {
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const rankIcon = (r:number) => r===1?'🥇':r===2?'🥈':r===3?'🥉':`#${r}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-enter">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Trophy size={32} className="text-yellow-500"/>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.role === 'teacher' ? 'Top performers across your polls' : 'Top performers across all quizzes'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-terracotta-400"/>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
          <Medal size={40} className="mx-auto mb-3 text-slate-300"/>
          <p className="text-slate-500 font-medium">No data yet</p>
          <p className="text-sm text-slate-400 mt-1">Complete some quizzes to appear here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[entries[1], entries[0], entries[2]].map((e, i) => e && (
                <motion.div key={e.name}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
                  className={`op-card p-4 text-center ${i===1 ? 'ring-2 ring-yellow-400 shadow-lg -mt-2' : ''} ${e.isMe ? 'border-terracotta-300' : ''}`}>
                  <div className="text-3xl mb-2">{i===1?'🥇':i===0?'🥈':'🥉'}</div>
                  <p className="font-display font-bold text-slate-800 text-sm truncate">{e.name}</p>
                  {e.isMe && <span className="text-[10px] bg-terracotta-100 text-terracotta-700 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                  <p className="text-xl font-black text-terracotta-600 mt-1">{e.avgScore}%</p>
                  <p className="text-xs text-slate-400">{e.attempts} quiz{e.attempts!==1?'zes':''}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Full ranked list */}
          {entries.map((e, i) => (
            <motion.div key={e.name}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.03 }}
              className={`op-card p-4 flex items-center gap-4 ${e.isMe ? 'border-terracotta-300 bg-terracotta-50/30' : ''}`}>
              <span className="text-lg font-black w-10 text-center text-terracotta-500">{rankIcon(e.rank)}</span>
              <div className="w-9 h-9 bg-terracotta-100 rounded-full flex items-center justify-center text-sm font-bold text-terracotta-700 flex-shrink-0">
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 truncate">{e.name}</p>
                  {e.isMe && <span className="text-[10px] bg-terracotta-100 text-terracotta-700 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                </div>
                <p className="text-xs text-slate-400">{e.attempts} attempt{e.attempts!==1?'s':''}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black text-terracotta-600">{e.avgScore}%</p>
                <p className="text-xs text-slate-400">avg · best {e.bestScore}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
