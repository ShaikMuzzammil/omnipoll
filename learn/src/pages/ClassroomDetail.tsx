import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2, Users, BookOpen, BarChart3, ArrowLeft, ArrowRight,
  Trophy, Clock, CheckCircle, Play, Lock, ExternalLink,
} from 'lucide-react';
import { classroomsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate, formatDuration, scoreColor, scoreLabel, pollTypeIcon, pollTypeLabel } from '@/lib/utils';
import type { Classroom, Poll, Attempt } from '@/lib/types';

const LEARN = import.meta.env.VITE_HOST_APP_URL ?? '';

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const [tab, setTab] = useState<'polls'|'results'>('polls');

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: ['classroom', id],
    queryFn: () => classroomsApi.get(id!) as Promise<Classroom>,
  });

  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: ['classroom-polls', id],
    queryFn: () => classroomsApi.polls(id!) as Promise<Poll[]>,
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: results = [] } = useQuery<Attempt[]>({
    queryKey: ['classroom-results', id],
    queryFn: () => classroomsApi.results(id!) as Promise<Attempt[]>,
    enabled: tab === 'results' && !!id,
  });

  if (isLoading || !classroom) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-terracotta-400"/>
    </div>
  );

  const myResults = results.filter(r => (r as any).userId === user?.id || (r as any).user_id === user?.id);
  const activePolls = polls.filter(p => p.status === 'active');
  const donePolls   = polls.filter(p => p.status === 'closed' || p.status === 'results_released');
  const draftPolls  = polls.filter(p => p.status === 'draft');

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <Link to="/classrooms" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-terracotta-600 mb-3 transition-colors">
          <ArrowLeft size={14}/> My Classrooms
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">{classroom.name}</h1>
            {classroom.description && <p className="text-sm text-slate-500 mt-0.5">{classroom.description}</p>}
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl text-slate-600 font-medium">
              <Users size={12}/> {classroom.studentCount ?? '—'} students
            </span>
            <span className="flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl text-slate-600 font-medium">
              <BookOpen size={12}/> {polls.length} polls
            </span>
            {activePolls.length > 0 && (
              <span className="flex items-center gap-1.5 bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl text-green-700 font-bold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                {activePolls.length} Live Now
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Polls',  value: polls.length, icon: BookOpen, color: 'text-terracotta-600', bg: 'bg-terracotta-100' },
          { label: 'My Attempts', value: myResults.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Avg Score',   value: myResults.length ? `${Math.round(myResults.reduce((s,r)=>s+(r.percentage??0),0)/myResults.length)}%` : '—', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={13} className={s.color}/>
              </div>
            </div>
            <span className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 p-1 rounded-xl w-fit">
        {([['polls','📊 Polls'],['results','🏆 My Results']] as const).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Polls tab */}
      {tab === 'polls' && (
        <div className="space-y-4">
          {/* Live polls first */}
          {activePolls.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-green-700 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Live Now
              </h3>
              <div className="space-y-2.5">
                {activePolls.map((p, i) => (
                  <motion.div key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    className="op-card p-4 flex items-center gap-4 border-green-200 bg-gradient-to-r from-green-50/60 to-white hover:border-green-300 transition-all">
                    <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {pollTypeIcon(p.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">● LIVE</span>
                        <span className="text-xs text-slate-400">{pollTypeLabel(p.type)}</span>
                      </div>
                      <p className="font-display font-semibold text-slate-800 truncate">{p.title}</p>
                      {p.description && <p className="text-xs text-slate-400 truncate mt-0.5">{p.description}</p>}
                    </div>
                    <Link to={`/join/${p.code}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex-shrink-0">
                      <Play size={13}/> Join Now
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming/draft polls */}
          {draftPolls.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                <Clock size={13}/> Upcoming
              </h3>
              <div className="space-y-2">
                {draftPolls.map((p, i) => (
                  <motion.div key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    className="op-card p-4 flex items-center gap-4 opacity-70">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {pollTypeIcon(p.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-400 font-medium">Not started yet</span>
                      <p className="font-semibold text-slate-700 truncate">{p.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-sm font-medium flex-shrink-0 cursor-not-allowed">
                      <Lock size={12}/> Pending
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Completed polls */}
          {donePolls.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                <CheckCircle size={13}/> Completed
              </h3>
              <div className="space-y-2">
                {donePolls.map((p, i) => {
                  const myAttempt = myResults.find(r => (r as any).pollId === p.id || (r as any).poll_id === p.id);
                  return (
                    <motion.div key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                      className="op-card p-4 flex items-center gap-4">
                      <div className="w-11 h-11 bg-terracotta-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {pollTypeIcon(p.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-slate-400">{pollTypeLabel(p.type)}</span>
                          {p.status === 'results_released' && <span className="text-xs text-purple-600 font-bold">🔓 Results Released</span>}
                        </div>
                        <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {myAttempt ? (
                          <div className="text-right">
                            <p className={`font-bold text-lg ${scoreColor(myAttempt.percentage??0)}`}>{(myAttempt.percentage??0).toFixed(0)}%</p>
                            <p className="text-xs text-slate-400">{scoreLabel(myAttempt.percentage??0)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-xl">Not attempted</span>
                        )}
                        {myAttempt && (
                          <Link to={`/attempt/${myAttempt.id}/keysheet`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-terracotta-50 text-terracotta-600 rounded-xl text-xs font-semibold hover:bg-terracotta-100 transition-colors">
                            <ExternalLink size={11}/> Key Sheet
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {polls.length === 0 && (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-slate-600 mb-1">No polls yet</p>
              <p className="text-sm text-slate-400">Your teacher hasn't added any polls to this classroom yet.</p>
            </div>
          )}
        </div>
      )}

      {/* My Results tab */}
      {tab === 'results' && (
        <div className="space-y-3">
          {myResults.length === 0 ? (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-semibold text-slate-600 mb-1">No results yet</p>
              <p className="text-sm text-slate-400">Join a live poll to see your results here.</p>
            </div>
          ) : (
            myResults.map((r, i) => (
              <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="op-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{(r as any).poll?.title ?? 'Quiz'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.submittedAt ? formatDate(r.submittedAt) : 'In progress'}
                    {r.timeTaken ? ` · ${formatDuration(r.timeTaken)}` : ''}
                  </p>
                </div>
                {r.percentage != null && (
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-xl ${scoreColor(r.percentage)}`}>{r.percentage.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">{r.score}/{r.maxScore} pts</p>
                  </div>
                )}
                {r.status === 'submitted' && (
                  <Link to={`/attempt/${r.id}/keysheet`}
                    className="flex-shrink-0 text-xs text-terracotta-600 font-semibold px-3 py-1.5 bg-terracotta-50 rounded-xl hover:bg-terracotta-100 transition-colors">
                    Key Sheet →
                  </Link>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
