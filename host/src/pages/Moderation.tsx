import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Users, Clock, X, Bell,
  CheckCircle, Shield, RefreshCw, Mail,
  Zap, BookOpen,
} from 'lucide-react';
import { pollsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { toast } from 'sonner';

interface TabAlert {
  id: string;
  pollId?: string;
  studentName: string;
  studentEmail?: string;
  pollTitle: string;
  classroomName?: string;
  switchCount: number;
  severity: 'low'|'medium'|'high';
  isResolved: boolean;
  createdAt: string;
}

interface LiveSession {
  id: string;
  title: string;
  code: string;
  activeCount: number;
}

export default function Moderation() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all'|'unresolved'|'high'>('unresolved');
  const [realtimeAlerts, setRealtimeAlerts] = useState<TabAlert[]>([]);

  // Load moderation alerts (with classroom info)
  const { data: dbAlerts = [], isLoading, refetch } = useQuery<TabAlert[]>({
    queryKey: ['moderation-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/moderation/alerts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    refetchInterval: 10000,
  });

  // Load active live sessions
  const { data: liveSessions = [] } = useQuery<LiveSession[]>({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/moderation/active-sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    refetchInterval: 8000,
  });

  // Resolve single alert
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
      // also mark in realtime list
      setRealtimeAlerts(prev => prev.map(a => a.isResolved ? a : { ...a, isResolved: true }));
      toast.success('Alert resolved');
    },
  });

  // Resolve ALL
  const resolveAllMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/moderation/resolve-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('op_token')||''}` },
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation-alerts'] });
      setRealtimeAlerts(prev => prev.map(a => ({ ...a, isResolved: true })));
      toast.success('All alerts resolved ✓');
    },
  });

  // Dismiss (local only)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));

  // Real-time subscription — listen to ALL active sessions
  usePollChannel(undefined, {
    'tab-switch': (data: any) => {
      const alert: TabAlert = {
        id: `rt-${Date.now()}-${Math.random()}`,
        pollId: data.pollId,
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
        toast.error(`🚨 ${data.studentName} — ${data.switchCount} tab switches! High risk.`, { duration: 8000 });
      } else if (sev === 'medium') {
        toast.warning(`⚠️ ${data.studentName} switched tabs (${data.switchCount}/3) in "${data.pollTitle}"`, { duration: 6000 });
      } else {
        toast.info(`📋 Tab switch: ${data.studentName} in "${data.pollTitle}"`, { duration: 4000 });
      }
      refetch();
      qc.invalidateQueries({ queryKey: ['active-sessions'] });
    },
  });

  // Merge realtime + DB, deduplicate
  const allAlerts = [...realtimeAlerts, ...dbAlerts].reduce<TabAlert[]>((acc, a) => {
    if (!acc.find(x => x.id === a.id) && !dismissed.has(a.id)) acc.push(a);
    return acc;
  }, []);

  const filtered = allAlerts.filter(a => {
    if (filter === 'unresolved') return !a.isResolved;
    if (filter === 'high') return a.severity === 'high' && !a.isResolved;
    return true;
  });

  const unresolvedCount = allAlerts.filter(a => !a.isResolved).length;
  const highCount = allAlerts.filter(a => a.severity === 'high' && !a.isResolved).length;

  // Send email to student
  const sendEmail = (alert: TabAlert) => {
    if (!alert.studentEmail) return toast.error('No email on file for this student');
    const sub = encodeURIComponent(`OmniPoll: Tab Switch Warning — ${alert.pollTitle}`);
    const body = encodeURIComponent(
      `Hi ${alert.studentName},\n\nWe noticed you switched browser tabs ${alert.switchCount} time(s) during "${alert.pollTitle}".\n\n` +
      (alert.switchCount >= 3 ? `This has been flagged as high-risk behaviour and your quiz may be subject to review.\n\n` : '') +
      `Please ensure you remain focused on the quiz and do not switch tabs.\n\nBest regards,\nYour OmniPoll Instructor`
    );
    window.open(`mailto:${alert.studentEmail}?subject=${sub}&body=${body}`);
  };

  const borderClass = (sev: string, resolved: boolean) => {
    if (resolved) return 'border-cream-200 opacity-60';
    if (sev === 'high') return 'border-red-300 shadow-sm shadow-red-100';
    if (sev === 'medium') return 'border-amber-200';
    return 'border-cream-200';
  };

  const iconBg = (sev: string) =>
    sev === 'high' ? 'bg-red-100 text-red-500' :
    sev === 'medium' ? 'bg-amber-100 text-amber-500' :
    'bg-blue-100 text-blue-500';

  const badgeBg = (sev: string) =>
    sev === 'high' ? 'bg-red-100 text-red-700' :
    sev === 'medium' ? 'bg-amber-100 text-amber-700' :
    'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-5 page-enter">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Moderation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time tab switch alerts and student monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {unresolvedCount > 0 && (
            <button
              onClick={() => resolveAllMut.mutate()}
              disabled={resolveAllMut.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-green-300 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-50 transition-all"
            >
              <CheckCircle size={14}/> Resolve All
            </button>
          )}
          {unresolvedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
              <AlertTriangle size={14}/> {unresolvedCount} unresolved
            </div>
          )}
          <button onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ['active-sessions'] }); }}
            className="p-2 bg-white border border-cream-300 rounded-xl text-slate-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-all">
            <RefreshCw size={15}/>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Alerts',   value: allAlerts.length,                      icon: Bell,          color: 'text-slate-700',      bg: 'bg-slate-100'    },
          { label: 'High Severity',  value: allAlerts.filter(a=>a.severity==='high').length, icon: AlertTriangle, color: 'text-red-600',        bg: 'bg-red-100'      },
          { label: 'Active Quizzes', value: liveSessions.length,                   icon: Users,         color: 'text-green-600',      bg: 'bg-green-100'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={14} className={s.color}/>
              </div>
            </div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Live Sessions panel */}
      <div className="bg-white border border-cream-200 rounded-2xl p-4">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
          Live Sessions — Click to Monitor
        </h2>
        {liveSessions.length === 0 ? (
          <p className="text-sm text-slate-400">No active quizzes right now. Launch a quiz to start monitoring.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {liveSessions.map((s) => (
              <div key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-cream-50 border border-cream-200 rounded-xl text-xs font-medium text-slate-700">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>
                <span>{s.title || s.code}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{s.activeCount} joined</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          ['all',        'All Alerts',      allAlerts.length],
          ['unresolved', 'Unresolved',      unresolvedCount],
          ['high',       'High',            highCount],
        ] as const).map(([f, label, count]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              filter === f
                ? f === 'high' ? 'bg-red-500 text-white border-red-500'
                : f === 'unresolved' ? 'bg-terracotta-500 text-white border-terracotta-500'
                : 'bg-slate-800 text-white border-slate-800'
                : 'bg-white border-cream-300 text-slate-600 hover:border-slate-400'
            }`}>
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === f ? 'bg-white/20 text-white' : 'bg-cream-200 text-slate-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw size={20} className="animate-spin mr-2"/> Loading alerts…
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="text-center py-16 bg-white border border-cream-200 rounded-2xl">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-green-500"/>
          </div>
          <p className="font-display font-semibold text-slate-700 mb-1">All Clear!</p>
          <p className="text-sm text-slate-400">No {filter !== 'all' ? 'unresolved' : ''} alerts at this time.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((alert, i) => (
              <motion.div key={alert.id}
                initial={{ opacity:0, y:-8, scale:0.98 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, x:40, scale:0.95 }}
                transition={{ delay: i < 10 ? i * 0.03 : 0 }}
                className={`bg-white border-2 rounded-2xl overflow-hidden ${borderClass(alert.severity, alert.isResolved)}`}>

                {/* Main row */}
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg(alert.severity)}`}>
                    <AlertTriangle size={17}/>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-800 text-sm">{alert.studentName}</span>
                      {alert.isResolved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">RESOLVED</span>
                      )}
                    </div>
                    {alert.studentEmail && (
                      <p className="text-xs text-slate-400 mb-1">{alert.studentEmail}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <BookOpen size={10}/> {alert.pollTitle}
                      </span>
                      {alert.classroomName && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1">
                            <Users size={10}/> {alert.classroomName}
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10}/> {new Date(alert.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Right: badge + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badgeBg(alert.severity)}`}>
                      {alert.switchCount}× switch
                    </span>
                    <div className="flex items-center gap-1">
                      {!alert.isResolved && (
                        <button onClick={() => resolveMut.mutate(alert.id)}
                          title="Mark resolved"
                          className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-all">
                          <CheckCircle size={13}/>
                        </button>
                      )}
                      {alert.studentEmail && (
                        <button onClick={() => sendEmail(alert)}
                          title="Send warning email"
                          className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all">
                          <Mail size={13}/>
                        </button>
                      )}
                      <button onClick={() => dismiss(alert.id)}
                        title="Dismiss"
                        className="w-7 h-7 rounded-lg bg-cream-100 hover:bg-cream-200 text-slate-400 flex items-center justify-center transition-all">
                        <X size={13}/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* High-risk warning banner */}
                {alert.severity === 'high' && !alert.isResolved && (
                  <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle size={12} className="flex-shrink-0"/>
                    <span>
                      <strong>High risk</strong> — {alert.studentName} has switched tabs {alert.switchCount} times. Consider disqualifying.
                    </span>
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
