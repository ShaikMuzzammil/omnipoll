import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Users, BookOpen, BarChart3, Trash2, UserMinus, ArrowLeft,
  Mail, Copy, CheckCircle, Play, Square, Send, Trophy,
  PlusCircle, Eye, Clock, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi, pollsApi } from '@/lib/api';
import { formatDate, formatDuration, scoreColor, pollTypeIcon, pollTypeLabel } from '@/lib/utils';
import type { Classroom, User, Poll, Attempt } from '@/lib/types';

export default function ClassroomDetail() {
  const { id }  = useParams<{ id: string }>();
  const qc      = useQueryClient();
  const [tab,   setTab]       = useState<'students'|'polls'|'results'>('students');
  const [assign, setAssign]   = useState(false);

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: ['classroom', id],
    queryFn: () => classroomsApi.get(id!) as Promise<Classroom>,
  });
  const { data: students = [] } = useQuery<User[]>({
    queryKey: ['classroom-students', id],
    queryFn: () => classroomsApi.students(id!) as Promise<User[]>,
  });
  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: ['classroom-polls', id],
    queryFn: () => classroomsApi.polls(id!) as Promise<Poll[]>,
    refetchInterval: 10000,
  });
  const { data: results = [] } = useQuery<Attempt[]>({
    queryKey: ['classroom-results', id],
    queryFn: () => classroomsApi.results(id!) as Promise<Attempt[]>,
    enabled: tab === 'results',
    refetchInterval: 8000,
  });
  // All teacher's polls for assigning
  const { data: allPolls = [] } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: () => pollsApi.list() as Promise<Poll[]>,
    enabled: assign,
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => classroomsApi.remove(id!, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['classroom-students',id] }); toast.success('Student removed'); },
    onError: (e:Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ pollId, status }: { pollId:string; status:string }) => pollsApi.status(pollId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['classroom-polls',id] }); toast.success('Poll status updated'); },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(classroom?.inviteCode ?? '');
    toast.success('Invite code copied!');
  };

  if (isLoading || !classroom) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-terracotta-400"/>
    </div>
  );

  const activePolls  = polls.filter(p => p.status === 'active');
  const avgScore = results.length && results.some(r=>r.percentage!=null)
    ? results.reduce((s,r)=>s+(r.percentage??0),0)/results.filter(r=>r.percentage!=null).length : null;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <Link to="/classrooms" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-terracotta-600 mb-3 transition-colors">
          <ArrowLeft size={14}/> Classrooms
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">{classroom.name}</h1>
            {classroom.description && <p className="text-sm text-slate-500 mt-0.5">{classroom.description}</p>}
          </div>
          {/* Invite code badge */}
          <button onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-50 border border-terracotta-200 rounded-2xl hover:bg-terracotta-100 transition-all group">
            <span className="text-xs text-slate-500 font-medium">Invite Code</span>
            <span className="font-display font-black text-terracotta-700 text-lg tracking-widest">{classroom.inviteCode}</span>
            <Copy size={13} className="text-terracotta-400 group-hover:text-terracotta-600 transition-colors"/>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Students',     value: students.length,            icon:Users,       color:'text-terracotta-600', bg:'bg-terracotta-100' },
          { label:'Assigned Polls',value: polls.length,             icon:BookOpen,    color:'text-blue-600',       bg:'bg-blue-100'       },
          { label:'Live Now',     value: activePolls.length,         icon:Play,        color:'text-green-600',      bg:'bg-green-100'      },
          { label:'Avg Score',    value: avgScore!=null?`${avgScore.toFixed(0)}%`:'—', icon:Trophy, color:'text-purple-600', bg:'bg-purple-100' },
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
        {([['students','👥 Students'],['polls','📊 Polls'],['results','🏆 Results']] as const).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l} {t==='students'?`(${students.length})`:t==='polls'?`(${polls.length})`:''}
          </button>
        ))}
      </div>

      {/* ── Students Tab ── */}
      {tab === 'students' && (
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-semibold text-slate-600 mb-1">No students yet</p>
              <p className="text-sm text-slate-400 mb-3">Share the invite code above with your class</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display font-black text-terracotta-600 text-2xl tracking-widest">{classroom.inviteCode}</span>
                <button onClick={copyCode} className="p-2 bg-terracotta-50 rounded-xl text-terracotta-500 hover:bg-terracotta-100"><Copy size={14}/></button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 border-b border-cream-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Attempts</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {students.map((s, i) => (
                      <motion.tr key={s.id}
                        initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                        className={`border-b border-cream-100 hover:bg-cream-50/60 transition-colors ${i%2===0?'':'bg-cream-50/30'}`}>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{i+1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{s.name}</p>
                              {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">
                          {(s as any).joinedAt ? formatDate((s as any).joinedAt) : '—'}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-medium">
                            {(s as any).attemptCount ?? 0} attempts
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {s.email && (
                              <a href={`mailto:${s.email}`}
                                className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Email student">
                                <Mail size={13}/>
                              </a>
                            )}
                            <button onClick={() => removeMut.mutate(s.id)}
                              disabled={removeMut.isPending}
                              className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                              <UserMinus size={13}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Polls Tab ── */}
      {tab === 'polls' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{polls.length} polls assigned to this classroom</p>
            <Link to={`/create?classroomId=${id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              <PlusCircle size={14}/> New Poll for Class
            </Link>
          </div>

          {polls.length === 0 ? (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-semibold text-slate-600 mb-1">No polls yet</p>
              <p className="text-sm text-slate-400 mb-4">Create a poll specifically for this classroom</p>
              <Link to={`/create?classroomId=${id}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-terracotta-500 text-white rounded-xl font-semibold text-sm hover:bg-terracotta-600 transition-all">
                <PlusCircle size={14}/> Create First Poll
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {polls.map((p, i) => (
                <motion.div key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-sm ${
                    p.status==='active' ? 'border-green-200 bg-green-50/30' : 'border-cream-200'}`}>
                  <div className="w-11 h-11 bg-terracotta-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {pollTypeIcon(p.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        p.status==='active' ? 'bg-green-100 text-green-700 border-green-200' :
                        p.status==='closed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        p.status==='results_released' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        {p.status==='active'?'● LIVE':p.status==='results_released'?'🔓 RELEASED':p.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">{pollTypeLabel(p.type)}</span>
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Code: <span className="font-mono font-bold text-slate-600">{p.code}</span>
                      {' · '}{p.totalVotes ?? 0} responses
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status === 'draft' && (
                      <button onClick={() => statusMut.mutate({ pollId:p.id, status:'active' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all">
                        <Play size={11}/> Launch
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button onClick={() => statusMut.mutate({ pollId:p.id, status:'closed' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all">
                        <Square size={11}/> Stop
                      </button>
                    )}
                    <Link to={`/results/${p.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta-50 text-terracotta-600 rounded-xl text-xs font-semibold hover:bg-terracotta-100 transition-all">
                      <Eye size={11}/> Results
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-semibold text-slate-600 mb-1">No results yet</p>
              <p className="text-sm text-slate-400">Students need to submit a quiz first</p>
            </div>
          ) : (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 border-b border-cream-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Poll</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Time</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Key Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {results.map((a, i) => {
                      const name = (a.user as any)?.name ?? a.guestName ?? 'Anonymous';
                      return (
                        <motion.tr key={a.id}
                          initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                          className={`border-b border-cream-100 hover:bg-cream-50/60 transition-colors ${i%2===0?'':'bg-cream-50/30'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{name}</p>
                                {(a.user as any)?.email && <p className="text-xs text-slate-400">{(a.user as any).email}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{(a as any).pollTitle ?? '—'}</td>
                          <td className="px-4 py-3">
                            {a.percentage!=null ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${scoreColor(a.percentage).replace('text-','bg-')}`}
                                    style={{width:`${a.percentage}%`}}/>
                                </div>
                                <span className={`font-bold text-sm ${scoreColor(a.percentage)}`}>{a.percentage.toFixed(0)}%</span>
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">
                            {a.timeTaken ? formatDuration(a.timeTaken) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {a.status === 'submitted' && (
                              <Link to={`/attempt/${a.id}/keysheet`}
                                className="text-xs text-terracotta-600 font-semibold px-3 py-1.5 bg-terracotta-50 rounded-xl hover:bg-terracotta-100 transition-colors">
                                View →
                              </Link>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
