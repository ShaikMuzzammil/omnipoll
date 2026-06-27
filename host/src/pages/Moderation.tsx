import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Eye, Users, Clock, X, Bell,
  CheckCircle, Shield, Filter, RefreshCw, Mail,
  Zap, User, BookOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { pollsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { toast } from 'sonner';

interface TabAlert {
  id: string;
  pollId?: string;
  studentName: string;
  studentEmail?: string;
  pollTitle: string;
  switchCount: number;
  severity: 'low'|'medium'|'high';
  isResolved: boolean;
  createdAt: string;
}

export default function Moderation() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all'|'unresolved'|'high'>('unresolved');
  const [selectedPoll, setSelectedPoll] = useState<string|''>('');
  const [realtimeAlerts, setRealtimeAlerts] = useState<TabAlert[]>([]);

  // Load polls to pick for live monitoring
  const { data: polls = [] } = useQuery<any[]>({
    queryKey: ['polls'],
    queryFn: () => pollsApi.list() as Promise<any[]>,
    refetchInterval: 10000,
  });

  // Load all moderation alerts from API
  const { data: dbAlerts = [], isLoading, refetch } = useQuery<TabAlert[]>({
    queryKey: ['moderation-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/moderation/alerts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    refetchInterval: 15000,
  });

  // Resolve mutation
  const resolveMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tab-alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation-alerts'] });
      toast.success('Alert resolved');
    },
  });

  // Real-time subscription for selected poll
  usePollChannel(selectedPoll || undefined, {
    'tab-switch': (data: any) => {
      const alert: TabAlert = {
        id: `rt-${Date.now()}`,
        pollId: selectedPoll,
        studentName: data.studentName ?? 'Anonymous',
        studentEmail: data.studentEmail,
        pollTitle: data.pollTitle ?? 'Quiz',
        switchCount: data.switchCount ?? 1,
        severity: data.severity ?? 'low',
        isResolved: false,
        createdAt: new Date().toISOString(),
      };
      setRealtimeAlerts(prev => [alert, ...prev]);
      const sev = data.severity;
      if (sev === 'high') {
        toast.error(`🚨 ${data.studentName} — ${data.switchCount} tab switches! Auto-submitting quiz.`, { duration:8000 });
      } else if (sev === 'medium') {
        toast.warning(`⚠️ ${data.studentName} switched tabs (${data.switchCount}/3) in "${data.pollTitle}"`, { duration:6000 });
      } else {
        toast.info(`📋 Tab switch: ${data.studentName} in "${data.pollTitle}"`, { duration:4000 });
      }
      refetch();
    },
  });

  const activePolls = polls.filter((p: any) => p.status === 'active');
  const allAlerts = [...realtimeAlerts, ...dbAlerts].reduce<TabAlert[]>((acc, a) => {
    if (!acc.find(x => x.id === a.id)) acc.push(a);
    return acc;
  }, []);

  const filtered = allAlerts.filter(a => {
    if (filter === 'unresolved') return !a.isResolved;
    if (filter === 'high') return a.severity === 'high' && !a.isResolved;
    return true;
  });

  const sevColor = (s: string) =>
    s === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
    s === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
    'bg-blue-100 text-blue-700 border-blue-200';

  const sevIcon = (s: string) =>
    s === 'high' ? '🚨' : s === 'medium' ? '⚠️' : '📋';

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield size={22} className="text-terracotta-500"/> Moderation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time tab switch alerts and quiz integrity monitoring</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-white border border-cream-300 rounded-xl text-sm text-slate-600 hover:border-terracotta-300 transition-all">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: allAlerts.length, icon: Bell, color: 'text-terracotta-600', bg: 'bg-terracotta-100' },
          { label: 'Unresolved', value: allAlerts.filter(a => !a.isResolved).length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'High Severity', value: allAlerts.filter(a => a.severity === 'high').length, icon: Zap, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Active Polls', value: activePolls.length, icon: Eye, color: 'text-green-600', bg: 'bg-green-100' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={14} className={s.color}/>
              </div>
            </div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Live monitor selector */}
      <div className="bg-white border border-cream-200 rounded-2xl p-4">
        <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Eye size={16} className="text-green-500"/> Live Monitor
        </h2>
        {activePolls.length === 0 ? (
          <p className="text-sm text-slate-400">No active polls right now. Launch a poll to start monitoring.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedPoll('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${!selectedPoll ? 'bg-slate-800 text-white border-slate-700' : 'border-cream-300 text-slate-600 hover:border-slate-400'}`}>
              All Polls
            </button>
            {activePolls.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedPoll(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${selectedPoll===p.id ? 'bg-green-500 text-white border-green-500' : 'border-cream-300 text-slate-600 hover:border-green-300'}`}>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"/>
                {p.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-cream-200 p-1 rounded-xl">
          {([['unresolved','Unresolved'],['high','High Severity'],['all','All']] as const).map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter===f ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500 hover:text-slate-700'}`}>
              {l} {f==='unresolved'?`(${allAlerts.filter(a=>!a.isResolved).length})`:''}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filtered.length} alerts</span>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <RefreshCw size={20} className="animate-spin mr-2"/> Loading alerts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-green-500"/>
          </div>
          <p className="font-display font-semibold text-slate-700 mb-1">All Clear!</p>
          <p className="text-sm text-slate-400">No {filter !== 'all' ? 'unresolved' : ''} alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filtered.map((alert, i) => (
              <motion.div key={alert.id}
                initial={{ opacity:0, y:-8, scale:0.98 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, x:20 }}
                transition={{ delay: i < 10 ? i * 0.03 : 0 }}
                className={`bg-white border rounded-2xl p-4 flex items-start gap-4 ${alert.isResolved ? 'opacity-60' : ''} ${
                  alert.severity==='high' ? 'border-red-200 shadow-sm shadow-red-100' :
                  alert.severity==='medium' ? 'border-amber-200' : 'border-cream-200'
                }`}>
                {/* Severity badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${sevColor(alert.severity)}`}>
                  {sevIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{alert.studentName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${sevColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {alert.isResolved && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-bold">
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Switched tabs <strong className="text-slate-700">{alert.switchCount}×</strong>
                    {' '}in <strong className="text-slate-700">"{alert.pollTitle}"</strong>
                  </p>
                  {alert.studentEmail && (
                    <p className="text-xs text-terracotta-500 mt-0.5 flex items-center gap-1">
                      <Mail size={10}/>{alert.studentEmail}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(alert.createdAt).toLocaleTimeString()} · {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!alert.isResolved && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => resolveMut.mutate(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-semibold transition-all">
                      <CheckCircle size={12}/> Resolve
                    </button>
                    {alert.studentEmail && (
                      <button
                        onClick={() => {
                          window.open(`mailto:${alert.studentEmail}?subject=OmniPoll Alert: Tab Switch Detected&body=Hi ${alert.studentName}, we noticed you switched browser tabs ${alert.switchCount} time(s) during "${alert.pollTitle}".`);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl text-xs font-semibold transition-all">
                        <Mail size={12}/> Email
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
