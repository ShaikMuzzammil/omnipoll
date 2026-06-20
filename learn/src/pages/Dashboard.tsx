import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusCircle, BarChart3, Users, TrendingUp, FileText,
  Search, LayoutGrid, List, Loader2, ExternalLink,
  Play, Square, Copy, Trash2, MoreHorizontal, Activity,
  ArrowUpRight, Zap, Clock, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { pollTypeIcon, pollTypeLabel, truncate } from '@/lib/utils';
import type { Poll } from '@/lib/types';

const QUICK_ACTIONS = [
  { label:'Create Poll',     href:'/create',     icon:PlusCircle,  color:'bg-terracotta-500 text-white',        desc:'New poll wizard' },
  { label:'View Analytics',  href:'/analytics',  icon:BarChart3,   color:'bg-cream-100 text-slate-700 border border-cream-300', desc:'Deep insights' },
  { label:'Join Test',       href:'/join',        icon:ExternalLink,color:'bg-cream-100 text-slate-700 border border-cream-300', desc:'Test as student' },
  { label:'My Polls',        href:'/dashboard',   icon:FileText,    color:'bg-cream-100 text-slate-700 border border-cream-300', desc:'All your polls' },
];

export default function Dashboard() {
  const { user }  = useApp();
  const qc        = useQueryClient();
  const navigate  = useNavigate();
  const [search,  setSearch]  = useState('');
  const [view,    setView]    = useState<'grid'|'list'>('grid');
  const [filter,  setFilter]  = useState<'all'|'draft'|'active'|'closed'>('all');

  const { data: polls = [], isLoading } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: () => pollsApi.list() as Promise<Poll[]>,
    refetchInterval: 15000,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id:string; status:string }) => pollsApi.status(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['polls'] }); toast.success('Poll updated'); },
    onError:   (e:Error) => toast.error(e.message),
  });
  const releaseMut = useMutation({
    mutationFn: (id:string) => pollsApi.release(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['polls'] }); toast.success('Results released to students!'); },
    onError:   (e:Error) => toast.error(e.message),
  });
  const dupMut = useMutation({
    mutationFn: (id:string) => pollsApi.duplicate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['polls'] }); toast.success('Poll duplicated'); },
    onError:   (e:Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id:string) => pollsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['polls'] }); toast.success('Deleted'); },
    onError:   (e:Error) => toast.error(e.message),
  });

  const stats = {
    total: polls.length,
    live:  polls.filter(p => p.status === 'active').length,
    votes: polls.reduce((a,p) => a + p.totalVotes, 0),
    parts: polls.reduce((a,p) => a + p.uniqueParticipants, 0),
  };

  const filtered = polls.filter(p => {
    const sOk = filter === 'all' || p.status === filter;
    const qOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search.toUpperCase());
    return sOk && qOk;
  });

  const livePolls = polls.filter(p => p.status === 'active');

  return (
    <div className="space-y-5 page-enter">
      {/* Page title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>
          </p>
        </div>
        <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
          <Link to="/create"
            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md">
            <PlusCircle size={16}/> + Create Poll
          </Link>
        </motion.div>
      </div>

      {/* Quick action tiles (matching image 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div key={a.label}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
            whileHover={{ y:-2, scale:1.01 }}>
            <Link to={a.href}
              className={`flex items-center gap-3 p-4 rounded-2xl hover:shadow-md transition-all cursor-pointer ${a.color}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                a.color.includes('terracotta') ? 'bg-white/20' : 'bg-terracotta-100'
              }`}>
                <a.icon size={18} className={a.color.includes('terracotta') ? 'text-white' : 'text-terracotta-600'}/>
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm leading-tight ${a.color.includes('terracotta') ? 'text-white' : 'text-slate-800'}`}>
                  {a.label}
                </p>
                <p className={`text-xs mt-0.5 ${a.color.includes('terracotta') ? 'text-white/70' : 'text-slate-400'}`}>
                  {a.desc}
                </p>
              </div>
              <ArrowUpRight size={14} className={`ml-auto flex-shrink-0 ${a.color.includes('terracotta') ? 'text-white/60' : 'text-slate-300'}`}/>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats row (matching image 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total Polls',    value: stats.total, sub:`${stats.live} live now`,           icon:FileText,   iconColor:'text-terracotta-500', bgColor:'bg-terracotta-100', color:'text-terracotta-600' },
          { label:'Participants',   value: stats.parts, sub:'Unique devices',                   icon:Users,      iconColor:'text-blue-500',       bgColor:'bg-blue-100',       color:'text-blue-600' },
          { label:'Responses',      value: stats.votes, sub:'All poll types',                   icon:BarChart3,  iconColor:'text-purple-500',     bgColor:'bg-purple-100',     color:'text-purple-600' },
          { label:'Avg Engagement', value: stats.total > 0 ? `${Math.round((stats.votes / Math.max(stats.total,1)))}` : '0%',
            sub:'Responses per participant', icon:TrendingUp, iconColor:'text-green-500', bgColor:'bg-green-100', color:'text-green-600' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 + i*0.07 }}
            whileHover={{ y:-2 }}
            className="bg-white border border-cream-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 ${s.bgColor} rounded-xl flex items-center justify-center`}>
                <s.icon size={17} className={s.iconColor}/>
              </div>
              <ArrowUpRight size={14} className="text-slate-300"/>
            </div>
            <p className={`text-3xl font-display font-bold ${s.color} mb-0.5`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-600">{s.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main content: polls + activity sidebar */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent Polls (takes 2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-800">
              Recent Polls
              {filter !== 'all' && <span className="ml-2 text-xs text-terracotta-600 font-normal capitalize">({filter})</span>}
            </h2>
            <Link to="/dashboard" className="flex items-center gap-1 text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">
              View all <ArrowUpRight size={12}/>
            </Link>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search polls or code…"
                className="w-full pl-8 pr-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
            </div>
            <div className="flex gap-1">
              {(['all','active','draft','closed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter===f ? 'bg-terracotta-500 text-white' : 'bg-white border border-cream-300 text-slate-500 hover:border-terracotta-300'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-cream-200 p-0.5 rounded-lg">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view==='grid'?'bg-white shadow-sm':''}`}><LayoutGrid size={13}/></button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view==='list'?'bg-white shadow-sm':''}`}><List size={13}/></button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-cream-200">
              <Loader2 size={24} className="animate-spin text-terracotta-400"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-300">
              <div className="w-16 h-16 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} className="text-cream-400"/>
              </div>
              <h3 className="font-display font-semibold text-slate-600 mb-1">No polls yet</h3>
              <p className="text-sm text-slate-400 mb-4">Create your first live poll to see it here.</p>
              <Link to="/create" className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-600 transition-colors">
                <PlusCircle size={14}/> Create your first poll
              </Link>
            </div>
          ) : view === 'grid' ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.slice(0,6).map((poll, i) => (
                <PollMiniCard key={poll.id} poll={poll} delay={i*0.04}
                  onStatusChange={(id,s) => statusMut.mutate({id,status:s})}
                  onRelease={id => releaseMut.mutate(id)}
                  onDuplicate={id => dupMut.mutate(id)}
                  onDelete={id => delMut.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 border-b border-cream-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Poll</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Participants</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((poll, i) => (
                    <tr key={poll.id} className={`border-b border-cream-100 hover:bg-cream-50 transition-colors ${i%2===0?'':'bg-cream-50/30'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pollTypeIcon(poll.type)}</span>
                          <div>
                            <p className="font-medium text-slate-800 text-xs">{truncate(poll.title, 32)}</p>
                            <p className="font-mono text-terracotta-600 text-[11px] font-bold">{poll.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-slate-500">{pollTypeLabel(poll.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={poll.status}/>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Users size={11}/> {poll.uniqueParticipants}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/results/${poll.id}`} className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-terracotta-600 transition-colors"><BarChart3 size={13}/></Link>
                          <button onClick={() => dupMut.mutate(poll.id)} className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Copy size={13}/></button>
                          <button onClick={() => delMut.mutate(poll.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity sidebar (1/3) */}
        <div className="space-y-4">
          {/* Live indicator */}
          {livePolls.length > 0 && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <p className="text-sm font-semibold text-green-700">{livePolls.length} Poll{livePolls.length>1?'s':''} Live Now</p>
              </div>
              {livePolls.slice(0,2).map(p => (
                <Link key={p.id} to={`/results/${p.id}`}
                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-green-100 hover:border-green-300 transition-colors mb-1.5 last:mb-0">
                  <span className="text-base">{pollTypeIcon(p.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-400">{p.uniqueParticipants} joined</p>
                  </div>
                  <Link to={`/present/${p.id}`} target="_blank"
                    className="px-2 py-1 bg-green-500 text-white text-[11px] font-bold rounded-lg hover:bg-green-600 transition-colors">
                    Present
                  </Link>
                </Link>
              ))}
            </motion.div>
          )}

          {/* Activity feed */}
          <div className="bg-white border border-cream-200 rounded-2xl p-4">
            <h3 className="font-display font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Activity size={15} className="text-terracotta-500"/>
              Activity
            </h3>
            {polls.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No activity yet.</p>
                <Link to="/analytics" className="mt-2 inline-flex items-center gap-1 text-xs text-terracotta-600 font-medium hover:text-terracotta-700">
                  View Analytics <ArrowUpRight size={11}/>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {polls.slice(0, 5).map((poll, i) => (
                  <motion.div key={poll.id}
                    initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                    className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      poll.status==='active' ? 'bg-green-100' : poll.status==='closed' ? 'bg-slate-100' : 'bg-cream-200'
                    }`}>
                      <span className="text-xs">{pollTypeIcon(poll.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{poll.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9}/> {new Date(poll.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        {poll.totalVotes > 0 && <span className="ml-1">· {poll.totalVotes} votes</span>}
                      </p>
                    </div>
                    <StatusBadge status={poll.status} tiny />
                  </motion.div>
                ))}
                <Link to="/analytics" className="flex items-center justify-center gap-1 text-xs text-terracotta-600 font-medium pt-2 border-t border-cream-100 hover:text-terracotta-700 transition-colors">
                  View Analytics <ArrowUpRight size={11}/>
                </Link>
              </div>
            )}
          </div>

          {/* AI insights card */}
          <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-terracotta-200"/>
              <p className="text-xs font-bold text-terracotta-100 uppercase tracking-wide">AI-Powered Insights</p>
            </div>
            <p className="text-sm font-medium mb-3 leading-relaxed">
              Word Cloud and Q&A polls now produce local sentiment and theme clustering without requiring an external API key.
            </p>
            <Link to="/analytics"
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <BarChart3 size={12}/> View Insights
            </Link>
          </div>

          {/* Quick stats */}
          <div className="bg-white border border-cream-200 rounded-2xl p-4">
            <h3 className="font-display font-semibold text-slate-700 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label:'Create from template', href:'/templates', icon:Layers2 },
                { label:'View classrooms',       href:'/classrooms', icon:GraduationCap },
                { label:'Check leaderboard',     href:'/leaderboard', icon:Trophy },
              ].map(a => (
                <Link key={a.label} to={a.href}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-cream-50 rounded-xl transition-colors group">
                  <div className="w-7 h-7 bg-cream-100 group-hover:bg-terracotta-100 rounded-lg flex items-center justify-center transition-colors">
                    <a.icon size={14} className="text-slate-500 group-hover:text-terracotta-600 transition-colors"/>
                  </div>
                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors">{a.label}</span>
                  <ArrowUpRight size={11} className="ml-auto text-slate-300 group-hover:text-terracotta-400 transition-colors"/>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */
import { GraduationCap, Trophy } from 'lucide-react';

function Layers2(props: React.ComponentProps<typeof LayoutGrid>) {
  return <LayoutGrid {...props} />;
}

function StatusBadge({ status, tiny = false }: { status: string; tiny?: boolean }) {
  const map: Record<string, string> = {
    draft:            'bg-amber-100 text-amber-700',
    active:           'bg-green-100 text-green-700',
    paused:           'bg-blue-100 text-blue-700',
    closed:           'bg-slate-100 text-slate-600',
    results_released: 'bg-purple-100 text-purple-700',
  };
  const labels: Record<string, string> = {
    draft:'Draft', active:'● Live', paused:'Paused', closed:'Closed', results_released:'Released',
  };
  return (
    <span className={`${tiny ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full font-medium whitespace-nowrap ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PollMiniCard({ poll, delay, onStatusChange, onRelease, onDuplicate, onDelete }: {
  poll: Poll; delay: number;
  onStatusChange:(id:string,s:string)=>void;
  onRelease:(id:string)=>void;
  onDuplicate:(id:string)=>void;
  onDelete:(id:string)=>void;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      whileHover={{ y:-2 }}
      className="bg-white border border-cream-200 rounded-2xl p-4 hover:shadow-md transition-all group relative"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{pollTypeIcon(poll.type)}</span>
          <StatusBadge status={poll.status} tiny/>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(v=>!v)}
            className="p-1.5 hover:bg-cream-100 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal size={14}/>
          </button>
          {menu && (
            <div className="absolute right-0 top-7 bg-white border border-cream-200 rounded-xl shadow-lg z-20 py-1 w-36 text-xs"
              onMouseLeave={() => setMenu(false)}>
              <Link to={`/results/${poll.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-cream-50 text-slate-700"><BarChart3 size={12}/> Results</Link>
              <Link to={`/present/${poll.id}`} target="_blank" className="flex items-center gap-2 px-3 py-2 hover:bg-cream-50 text-slate-700"><ExternalLink size={12}/> Present</Link>
              <button onClick={() => { onDuplicate(poll.id); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-cream-50 text-slate-700 w-full"><Copy size={12}/> Duplicate</button>
              {poll.status==='draft' && <button onClick={() => { onStatusChange(poll.id,'active'); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-green-50 text-green-700 w-full"><Play size={12}/> Launch</button>}
              {poll.status==='active' && <button onClick={() => { onStatusChange(poll.id,'closed'); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 w-full"><Square size={12}/> Close</button>}
              {poll.status==='closed' && <button onClick={() => { onRelease(poll.id); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 text-purple-700 w-full">🔓 Release</button>}
              <div className="border-t border-cream-100 my-1"/>
              <button onClick={() => { onDelete(poll.id); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 w-full"><Trash2 size={12}/> Delete</button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-display font-semibold text-slate-800 text-sm mb-1 leading-tight">{truncate(poll.title, 44)}</h3>
      <p className="text-xs text-slate-400 mb-3">{pollTypeLabel(poll.type)}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users size={10}/> {poll.uniqueParticipants}</span>
          <span className="flex items-center gap-1"><BarChart3 size={10}/> {poll.totalVotes}</span>
        </div>
        <div className="font-mono text-xs font-bold text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded-lg tracking-wider">
          {poll.code}
        </div>
      </div>

      <Link to={`/results/${poll.id}`}
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-cream-100 hover:bg-terracotta-50 hover:text-terracotta-700 text-slate-600 rounded-xl text-xs font-medium transition-all border border-cream-200 hover:border-terracotta-200">
        <BarChart3 size={12}/> View Results
      </Link>
    </motion.div>
  );
}

