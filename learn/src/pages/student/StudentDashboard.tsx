import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2, BookOpen, Trophy, Clock, ArrowRight,
  Play, CheckCircle, GraduationCap, BarChart3, Star,
  Zap, TrendingUp, Hash,
} from 'lucide-react';
import { attemptsApi, classroomsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate, formatDuration, scoreColor, scoreLabel } from '@/lib/utils';
import type { Attempt, Classroom } from '@/lib/types';

export default function StudentDashboard() {
  const { user } = useApp();
  const navigate  = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const { data: attempts = [], isLoading: attLoading } = useQuery<Attempt[]>({
    queryKey: ['my-attempts'],
    queryFn: () => attemptsApi.mine() as Promise<Attempt[]>,
    refetchInterval: 10000,
  });

  const { data: classrooms = [] } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.list() as Promise<Classroom[]>,
  });

  const submitted   = attempts.filter(a => a.status === 'submitted');
  const inProgress  = attempts.filter(a => a.status === 'in_progress');
  const avgScore    = submitted.length && submitted.some(a=>a.percentage!=null)
    ? submitted.reduce((s,a)=>s+(a.percentage??0),0)/submitted.filter(a=>a.percentage!=null).length
    : null;
  const best = submitted.reduce<Attempt|null>((b,a)=>(!b||((a.percentage??0)>(b.percentage??0)))?a:b, null);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    navigate(`/join/${code}`);
  };

  const statCards = [
    { label:'Quizzes Done',  value: submitted.length,  icon:CheckCircle, color:'text-green-600',      bg:'bg-green-100' },
    { label:'In Progress',   value: inProgress.length, icon:Play,        color:'text-blue-600',        bg:'bg-blue-100'  },
    { label:'Avg Score',     value: avgScore!=null?`${Number(avgScore).toFixed(0)}%`:'—', icon:TrendingUp, color:'text-purple-600', bg:'bg-purple-100' },
    { label:'Best Score',    value: best?.percentage!=null?`${Number(best.percentage).toFixed(0)}%`:'—', icon:Star, color:'text-amber-600', bg:'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Ready to learn something new today?</p>
        </div>
      </div>

      {/* Quick Join */}
      <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm font-semibold mb-1 opacity-80">Got a poll code?</p>
        <h2 className="font-display text-xl font-bold mb-4">Join Live Poll</h2>
        <div className="flex gap-2">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key==='Enter' && handleJoin()}
            placeholder="Enter code (e.g. FXDWMA)"
            maxLength={8}
            className="flex-1 px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder:text-white/60 font-mono tracking-widest text-center focus:outline-none focus:bg-white/30 transition-all text-sm"/>
          <button onClick={handleJoin} disabled={joinCode.trim().length < 4}
            className="px-5 py-2.5 bg-white text-terracotta-700 font-bold rounded-xl hover:bg-cream-100 disabled:opacity-50 transition-all text-sm flex items-center gap-1.5">
            <Zap size={14}/> Join
          </button>
        </div>
        <p className="text-xs mt-2.5 opacity-60 text-center">Or use the QR code your teacher shows on screen</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s,i) => (
          <motion.div key={s.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={13} className={s.color}/>
              </div>
            </div>
            <span className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Classrooms + Recent attempts (2-col) */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* My Classrooms */}
        <div className="bg-white border border-cream-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap size={16} className="text-terracotta-500"/> My Classrooms
            </h2>
            <Link to="/classrooms" className="text-xs text-terracotta-600 hover:text-terracotta-700 font-semibold">
              View all →
            </Link>
          </div>
          {classrooms.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap size={28} className="mx-auto mb-2 text-slate-300"/>
              <p className="text-sm text-slate-400">No classrooms yet</p>
              <Link to="/classrooms" className="text-xs text-terracotta-500 hover:underline mt-1 block">Join a classroom →</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {classrooms.slice(0,4).map((cls,i) => (
                <motion.div key={cls.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}>
                  <Link to={`/classrooms/${cls.id}`}
                    className="flex items-center gap-3 p-3 bg-cream-50 hover:bg-cream-100 border border-cream-200 rounded-xl transition-all group">
                    <div className="w-9 h-9 bg-terracotta-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={16} className="text-terracotta-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{cls.name}</p>
                      <p className="text-xs text-slate-400">{cls.studentCount ?? '—'} students · {(cls as any).pollCount ?? 0} polls</p>
                    </div>
                    <ArrowRight size={13} className="text-slate-300 group-hover:text-terracotta-500 transition-colors flex-shrink-0"/>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white border border-cream-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500"/> Recent Results
            </h2>
            <Link to="/student/results" className="text-xs text-terracotta-600 hover:text-terracotta-700 font-semibold">
              View all →
            </Link>
          </div>
          {attLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-terracotta-400"/>
            </div>
          ) : submitted.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={28} className="mx-auto mb-2 text-slate-300"/>
              <p className="text-sm text-slate-400">No completed quizzes yet</p>
              <p className="text-xs text-slate-400 mt-1">Join a poll to see your results here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {submitted.slice(0,5).map((a,i) => {
                const pct = Number(a.percentage ?? 0);
                return (
                  <motion.div key={a.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                    className="flex items-center gap-3 p-3 bg-cream-50 border border-cream-200 rounded-xl hover:bg-cream-100 transition-all group">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{(a as any).poll?.title ?? (a as any).pollTitle ?? 'Quiz'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.submittedAt ? formatDate(a.submittedAt) : '—'}
                        {a.timeTaken ? ` · ${formatDuration(a.timeTaken)}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-base font-display font-bold ${scoreColor(pct)}`}>{pct.toFixed(0)}%</span>
                      <p className="text-[10px] text-slate-400">{scoreLabel(pct)}</p>
                    </div>
                    {a.status === 'submitted' && (
                      <Link to={`/attempt/${a.id}/keysheet`}
                        className="text-xs text-terracotta-600 font-semibold px-2.5 py-1.5 bg-terracotta-50 rounded-xl hover:bg-terracotta-100 opacity-0 group-hover:opacity-100 transition-all">
                        Key Sheet
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
