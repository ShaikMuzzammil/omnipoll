import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Users, BookOpen, Copy, Loader2,
  Plus, X, ArrowRight, LogIn, Star, Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import type { Classroom } from '@/lib/types';

export default function StudentClassrooms() {
  const { user } = useApp();
  const qc = useQueryClient();
  const [showJoin, setShowJoin]   = useState(false);
  const [joinCode, setJoinCode]   = useState('');

  const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.list() as Promise<Classroom[]>,
  });

  const joinMut = useMutation({
    mutationFn: () => classroomsApi.join(joinCode.toUpperCase()),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success(`Joined "${data.classroom?.name ?? 'classroom'}"! 🎉`);
      setShowJoin(false); setJoinCode('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveMut = useMutation({
    mutationFn: (id: string) => classroomsApi.leave(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Left classroom'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">My Classrooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">Classrooms you've joined from your teachers</p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={() => setShowJoin(true)}
          className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
          <Plus size={15}/> Join Classroom
        </motion.button>
      </div>

      {/* Join modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setShowJoin(false)}>
            <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-terracotta-100 rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} className="text-terracotta-600"/>
                  </div>
                  <h3 className="font-display font-bold text-slate-800">Join a Classroom</h3>
                </div>
                <button onClick={() => setShowJoin(false)} className="p-1.5 hover:bg-cream-100 rounded-lg text-slate-400"><X size={16}/></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Enter the classroom code from your teacher</p>
              <input
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. FXDWMA"
                maxLength={8}
                onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && joinMut.mutate()}
                className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl text-center font-mono text-xl font-black text-terracotta-700 tracking-[0.3em] bg-cream-50 focus:outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 uppercase transition-all mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowJoin(false)}
                  className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-colors">
                  Cancel
                </button>
                <button onClick={() => joinMut.mutate()} disabled={joinCode.length < 4 || joinMut.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                  {joinMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <><LogIn size={14}/> Join Now</>}
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3">Ask your teacher for the classroom join code</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
      ) : classrooms.length === 0 ? (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          className="text-center py-20 bg-white/60 border border-cream-300 rounded-2xl">
          <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-terracotta-500"/>
          </div>
          <h3 className="font-display font-semibold text-slate-700 mb-2">No classrooms yet</h3>
          <p className="text-sm text-slate-400 mb-5">Ask your teacher for a classroom code to get started</p>
          <button onClick={() => setShowJoin(true)}
            className="inline-flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
            <Plus size={14}/> Join Your First Classroom
          </button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls, i) => (
            <motion.div key={cls.id}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              whileHover={{ y:-2 }}
              className="op-card p-5 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center shadow-sm">
                    <GraduationCap size={22} className="text-white"/>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">{cls.name}</h3>
                    {cls.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cls.description}</p>}
                  </div>
                </div>
                <button onClick={() => { if (confirm('Leave this classroom?')) leaveMut.mutate(cls.id); }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                  <X size={13}/>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: Users,    val: cls.studentCount, label: 'Students' },
                  { icon: BookOpen, val: cls.pollCount,    label: 'Polls' },
                  { icon: Trophy,   val: '—',              label: 'My Rank' },
                ].map(s => (
                  <div key={s.label} className="bg-cream-50 rounded-xl p-2.5 text-center border border-cream-200">
                    <s.icon size={13} className="text-terracotta-500 mx-auto mb-1"/>
                    <p className="text-sm font-bold text-slate-700">{s.val}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Code + actions */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5">
                  <span className="font-mono text-xs font-bold text-terracotta-700 tracking-widest">{cls.code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(cls.code); toast.success('Code copied!'); }}
                    className="ml-auto p-0.5 hover:text-terracotta-600 text-slate-400 transition-colors">
                    <Copy size={12}/>
                  </button>
                </div>
                <Link to={`/classrooms/${cls.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-xs font-bold transition-colors">
                  Open <ArrowRight size={12}/>
                </Link>
              </div>
            </motion.div>
          ))}

          {/* Add more card */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:classrooms.length*0.05 }}>
            <button onClick={() => setShowJoin(true)}
              className="w-full h-full min-h-[180px] border-2 border-dashed border-cream-400 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-terracotta-300 hover:bg-terracotta-50/50 transition-all group">
              <div className="w-10 h-10 bg-cream-200 group-hover:bg-terracotta-100 rounded-xl flex items-center justify-center transition-colors">
                <Plus size={20} className="text-slate-400 group-hover:text-terracotta-600 transition-colors"/>
              </div>
              <p className="text-sm font-semibold text-slate-500 group-hover:text-terracotta-600 transition-colors">Join another classroom</p>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
