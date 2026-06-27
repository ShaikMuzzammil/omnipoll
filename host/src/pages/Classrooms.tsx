import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, BookOpen, Copy, Loader2, X, GraduationCap,
  ArrowRight, Trash2, Settings2, QrCode, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import type { Classroom } from '@/lib/types';

export default function Classrooms() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName]   = useState('');
  const [desc, setDesc]   = useState('');
  const [subj, setSubj]   = useState('');

  const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.list() as Promise<Classroom[]>,
  });

  const createMut = useMutation({
    mutationFn: () => classroomsApi.create({ name, description: desc, subject: subj }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['classrooms'] });
      toast.success('Classroom created! 🎉');
      setShowCreate(false); setName(''); setDesc(''); setSubj('');
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id:string) => classroomsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['classrooms'] }); toast.success('Classroom deleted'); },
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={22} className="text-terracotta-500"/> Classrooms
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage your student groups</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
          <Plus size={15}/> New Classroom
        </motion.button>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-slate-800 text-lg">Create Classroom</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-cream-100 rounded-lg text-slate-400"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">Class Name *</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Physics Grade 10 — Section A"
                    className="w-full px-3.5 py-2.5 border-2 border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">Subject</label>
                  <input value={subj} onChange={e=>setSubj(e.target.value)} placeholder="e.g. Physics, Mathematics, Biology"
                    className="w-full px-3.5 py-2.5 border-2 border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">Description</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} placeholder="Optional — notes for students"
                    className="w-full px-3.5 py-2.5 border-2 border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white resize-none"/>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-colors">
                  Cancel
                </button>
                <button onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                  {createMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <><Plus size={14}/> Create</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>
      ) : classrooms.length === 0 ? (
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          className="text-center py-20 bg-white/60 border-2 border-dashed border-cream-400 rounded-2xl">
          <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-terracotta-500"/>
          </div>
          <h3 className="font-display font-semibold text-slate-700 mb-2">No classrooms yet</h3>
          <p className="text-sm text-slate-400 mb-5">Create a classroom to organise students and assign polls</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
            <Plus size={14}/> Create First Classroom
          </button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls, i) => (
            <motion.div key={cls.id}
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              whileHover={{y:-2}}
              className="op-card p-5 group relative overflow-hidden">
              {/* Colour stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta-400 to-terracotta-600 rounded-t-2xl"/>
              <div className="mt-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <GraduationCap size={22} className="text-white"/>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-slate-800 truncate">{cls.name}</h3>
                      {(cls as any).subject && <p className="text-xs text-terracotta-500 font-medium">{(cls as any).subject}</p>}
                      {cls.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cls.description}</p>}
                    </div>
                  </div>
                  <button onClick={() => { if(confirm('Delete this classroom and all its data?')) deleteMut.mutate(cls.id); }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg text-slate-300 hover:text-red-500 transition-all flex-shrink-0">
                    <Trash2 size={13}/>
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon:Users,    val: cls.studentCount ?? 0,     label:'Students' },
                    { icon:BookOpen, val: (cls as any).pollCount ?? 0, label:'Polls' },
                    { icon:BarChart3,val: (cls as any).avgScore != null ? `${Math.round((cls as any).avgScore)}%` : '—', label:'Avg' },
                  ].map(s => (
                    <div key={s.label} className="bg-cream-50 border border-cream-200 rounded-xl p-2.5 text-center">
                      <s.icon size={12} className="text-terracotta-500 mx-auto mb-1"/>
                      <p className="text-sm font-bold text-slate-700">{s.val}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Invite code */}
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-terracotta-50 border border-terracotta-200 rounded-xl">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">INVITE CODE</p>
                    <p className="font-mono font-black text-terracotta-700 tracking-[0.25em] text-base">{cls.inviteCode ?? cls.code}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(cls.inviteCode ?? cls.code); toast.success('Code copied!'); }}
                    className="p-1.5 hover:bg-terracotta-100 rounded-lg text-terracotta-400 hover:text-terracotta-600 transition-colors">
                    <Copy size={14}/>
                  </button>
                </div>

                {/* Actions */}
                <Link to={`/classrooms/${cls.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-bold transition-all">
                  Manage Classroom <ArrowRight size={14}/>
                </Link>
              </div>
            </motion.div>
          ))}

          {/* Add card */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:classrooms.length*0.05}}>
            <button onClick={() => setShowCreate(true)}
              className="w-full h-full min-h-[200px] border-2 border-dashed border-cream-400 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-terracotta-300 hover:bg-terracotta-50/50 transition-all group">
              <div className="w-12 h-12 bg-cream-200 group-hover:bg-terracotta-100 rounded-xl flex items-center justify-center transition-colors">
                <Plus size={22} className="text-slate-400 group-hover:text-terracotta-600 transition-colors"/>
              </div>
              <p className="text-sm font-semibold text-slate-500 group-hover:text-terracotta-600 transition-colors">New Classroom</p>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
