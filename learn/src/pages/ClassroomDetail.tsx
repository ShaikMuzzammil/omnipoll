import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, BookOpen, BarChart3, Trash2, UserMinus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import { formatDate, scoreColor } from '@/lib/utils';
import type { Classroom, User, Poll, Attempt } from '@/lib/types';

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'students'|'polls'|'results'>('students');

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: ['classroom', id],
    queryFn: () => classroomsApi.get(id!) as Promise<Classroom>,
  });
  const { data: students = [] } = useQuery<User[]>({
    queryKey: ['classroom-students', id],
    queryFn: () => classroomsApi.students(id!) as Promise<User[]>,
    enabled: tab === 'students',
  });
  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: ['classroom-polls', id],
    queryFn: () => classroomsApi.polls(id!) as Promise<Poll[]>,
    enabled: tab === 'polls',
  });
  const { data: results = [] } = useQuery<Attempt[]>({
    queryKey: ['classroom-results', id],
    queryFn: () => classroomsApi.results(id!) as Promise<Attempt[]>,
    enabled: tab === 'results',
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => classroomsApi.remove(id!, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['classroom-students', id] }); toast.success('Student removed'); },
    onError: (e:Error) => toast.error(e.message),
  });

  if (isLoading || !classroom) return (
    <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
  );

  return (
    <div className="space-y-6 page-enter">
      <div>
        <Link to="/classrooms" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-terracotta-600 mb-3 transition-colors">
          <ArrowLeft size={14}/> Back to Classrooms
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">{classroom.name}</h1>
            {classroom.description && <p className="text-sm text-slate-500 mt-0.5">{classroom.description}</p>}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
              <Users size={13}/> {classroom.studentCount} students
            </span>
            <span className="flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
              <BookOpen size={13}/> {classroom.pollCount} polls
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-cream-200 p-1 rounded-xl w-fit">
        {(['students','polls','results'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500'}`}>
            {t === 'students' ? `👥 Students (${students.length || classroom.studentCount})` : t === 'polls' ? `📊 Polls` : '🏆 Results'}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="op-card overflow-hidden">
          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-40"/>
              <p>No students yet. Share code <strong className="text-terracotta-600">{classroom.code}</strong></p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-cream-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-terracotta-100 rounded-full flex items-center justify-center text-xs font-bold text-terracotta-700">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.email}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeMut.mutate(s.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <UserMinus size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-3">
          {polls.length === 0 ? (
            <div className="text-center py-12 bg-white/60 border border-cream-300 rounded-2xl text-slate-400">
              <BookOpen size={32} className="mx-auto mb-3 opacity-40"/>
              <p>No polls in this classroom yet</p>
              <Link to="/create" className="mt-3 inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium">Create a poll →</Link>
            </div>
          ) : polls.map((poll, i) => (
            <div key={poll.id} className="op-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{poll.title}</p>
                <p className="text-xs text-slate-500">{poll.uniqueParticipants} participants · {formatDate(poll.createdAt)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${poll.status === 'active' ? 'badge-live' : 'badge-closed'}`}>
                {poll.status}
              </span>
              <Link to={`/results/${poll.id}`} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1">
                <BarChart3 size={12}/> Results
              </Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'results' && (
        <div className="op-card overflow-hidden">
          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No results yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-cream-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Poll</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.user?.name ?? a.guestName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">{a.poll?.title ?? '—'}</td>
                    <td className="px-4 py-3">
                      {a.percentage !== undefined
                        ? <span className={`font-bold ${scoreColor(a.percentage)}`}>{a.percentage.toFixed(0)}%</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.submittedAt ? formatDate(a.submittedAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <Link to={`/attempt/${a.id}/keysheet`} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">Key Sheet</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
