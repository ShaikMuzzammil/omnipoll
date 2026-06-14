import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusCircle, BarChart3, Users, TrendingUp,
  Search, Filter, LayoutGrid, List, Loader2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import PollCard from '@/components/PollCard';
import type { Poll } from '@/lib/types';

const FILTERS = ['All','Draft','Active','Closed','Released'] as const;
type Filter = typeof FILTERS[number];

const filterToStatus: Record<Filter, string|undefined> = {
  All: undefined, Draft: 'draft', Active: 'active',
  Closed: 'closed', Released: 'results_released',
};

export default function Dashboard() {
  const { user }      = useApp();
  const qc            = useQueryClient();
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [view,   setView]   = useState<'grid'|'list'>('grid');

  const { data: polls = [], isLoading } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: () => pollsApi.list() as Promise<Poll[]>,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => pollsApi.status(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polls'] }); toast.success('Poll updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const releaseMut = useMutation({
    mutationFn: (id: string) => pollsApi.release(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polls'] }); toast.success('Results released to students!'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const dupMut = useMutation({
    mutationFn: (id: string) => pollsApi.duplicate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polls'] }); toast.success('Poll duplicated'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => pollsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polls'] }); toast.success('Poll deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = polls.filter(p => {
    const statusOk  = !filterToStatus[filter] || p.status === filterToStatus[filter];
    const searchOk  = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search.toUpperCase());
    return statusOk && searchOk;
  });

  const stats = {
    total:   polls.length,
    live:    polls.filter(p => p.status === 'active').length,
    votes:   polls.reduce((a, p) => a + p.totalVotes, 0),
    parts:   polls.reduce((a, p) => a + p.uniqueParticipants, 0),
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your polls and track engagement</p>
        </div>
        <Link to="/create" className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <PlusCircle size={16} /> New Poll
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total Polls',    value: stats.total, icon: FileText,   color:'text-terracotta-600' },
          { label:'Live Now',       value: stats.live,  icon: TrendingUp, color:'text-green-600' },
          { label:'Total Votes',    value: stats.votes, icon: BarChart3,  color:'text-blue-600' },
          { label:'Participants',   value: stats.parts, icon: Users,      color:'text-purple-600' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <s.icon size={16} className={s.color} />
            </div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:'Multiple Choice', href:'/create?type=multiple_choice', emoji:'☑️' },
          { label:'Quiz',            href:'/create?type=quiz',            emoji:'🧠' },
          { label:'Word Cloud',      href:'/create?type=word_cloud',      emoji:'☁️' },
          { label:'Q&A Session',     href:'/create?type=qa',             emoji:'💬' },
        ].map(a => (
          <Link key={a.label} to={a.href}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-cream-300 rounded-xl hover:border-terracotta-300 hover:bg-terracotta-50 text-sm font-medium text-slate-700 transition-all">
            <span>{a.emoji}</span> {a.label}
          </Link>
        ))}
      </div>

      {/* Poll list */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <h2 className="font-display font-semibold text-slate-800 text-lg flex-1">Your Polls</h2>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search polls or code…"
              className="w-full pl-8 pr-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-terracotta-500 text-white' : 'bg-white border border-cream-300 text-slate-600 hover:border-terracotta-300'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-cream-200 p-0.5 rounded-lg">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid size={14}/></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={14}/></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-terracotta-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-display font-semibold text-slate-700 mb-2">
              {search || filter !== 'All' ? 'No polls match your filter' : 'No polls yet'}
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              {search || filter !== 'All' ? 'Try a different filter' : 'Create your first poll to get started'}
            </p>
            {!search && filter === 'All' && (
              <Link to="/create" className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-terracotta-600 transition-colors">
                <PlusCircle size={15} /> Create your first poll
              </Link>
            )}
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filtered.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                onDelete={id => delMut.mutate(id)}
                onDuplicate={id => dupMut.mutate(id)}
                onStatusChange={(id, status) => statusMut.mutate({ id, status })}
                onRelease={id => releaseMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
