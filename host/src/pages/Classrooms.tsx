import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, Copy, Loader2, X, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { Classroom } from '@/lib/types';

export default function Classrooms() {
  const { user } = useApp();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [joinCode, setJoinCode]     = useState('');

  const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.list() as Promise<Classroom[]>,
  });

  const createMut = useMutation({
    mutationFn: () => classroomsApi.create({ name, description: desc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['classrooms'] });
      toast.success('Classroom created!');
      setShowCreate(false); setName(''); setDesc('');
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const joinMut = useMutation({
    mutationFn: () => classroomsApi.join(joinCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['classrooms'] });
      toast.success('Joined classroom!');
      setShowJoin(false); setJoinCode('');
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id:string) => classroomsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['classrooms'] }); toast.success('Classroom deleted'); },
    onError: (e:Error) => toast.error(e.message),
  });

  const copyCode = (code:string) => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Classrooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.role === 'teacher' ? 'Manage your student groups' : 'Your enrolled classrooms'}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'teacher' ? (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm">
              <Plus size={15}/> New Classroom
            </button>
          ) : (
            <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm">
              <Plus size={15}/> Join Classroom
            </button>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-800 text-lg">Create Classroom</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-cream-200 rounded-lg"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Classroom name *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Description (optional)"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 resize-none"/>
              <button onClick={() => createMut.mutate()} disabled={!name || createMut.isPending}
                className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                {createMut.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => setShowJoin(false)}>
          <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-800 text-lg">Join a Classroom</h3>
              <button onClick={() => setShowJoin(false)} className="p-1.5 hover:bg-cream-200 rounded-lg"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter classroom code"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 uppercase tracking-widest text-center text-lg"/>
              <button onClick={() => joinMut.mutate()} disabled={!joinCode || joinMut.isPending}
                className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                {joinMut.isPending ? <Loader2 size={14} className="animate-spin"/> : null} Join
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white/60 border border-cream-300 rounded-2xl">
          <GraduationCap size={48} className="mx-auto mb-4 text-terracotta-300"/>
          <h3 className="font-display font-semibold text-slate-700 mb-2">No classrooms yet</h3>
          <p className="text-sm text-slate-400 mb-5">
            {user?.role === 'teacher' ? 'Create a classroom to organise your students' : 'Ask your teacher for a classroom code to join'}
          </p>
          {user?.role === 'teacher' && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-5 py-2 rounded-xl text-sm font-semibold">
              <Plus size={14}/> Create First Classroom
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls, i) => (
            <motion.div key={cls.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              className="op-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-terracotta-100 rounded-xl flex items-center justify-center">
                  <GraduationCap size={20} className="text-terracotta-600"/>
                </div>
                {user?.role === 'teacher' && (
                  <button onClick={() => deleteMut.mutate(cls.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <X size={13}/>
                  </button>
                )}
              </div>
              <h3 className="font-display font-semibold text-slate-800 mb-1">{cls.name}</h3>
              {cls.description && <p className="text-xs text-slate-500 mb-3">{cls.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Users size={11}/> {cls.studentCount} students</span>
                <span className="flex items-center gap-1"><BookOpen size={11}/> {cls.pollCount} polls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-cream-200 rounded-lg px-2 py-1 flex-1">
                  <span className="font-mono text-xs font-bold text-terracotta-700 tracking-widest">{cls.code}</span>
                  <button onClick={() => copyCode(cls.code)} className="ml-auto hover:text-terracotta-600 text-slate-400"><Copy size={11}/></button>
                </div>
                <Link to={`/classrooms/${cls.id}`}
                  className="px-3 py-1 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg text-xs font-semibold transition-colors">
                  Open →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
