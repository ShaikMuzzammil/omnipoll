import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Eye, Users, Clock, X, Bell,
  CheckCircle, Shield, Filter, RefreshCw, Mail,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { pollsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { toast } from 'sonner';

interface TabAlert {
  id: string;
  studentName: string;
  studentEmail?: string;
  pollTitle: string;
  pollId: string;
  classroomName?: string;
  count: number;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

interface ActiveSession {
  pollId: string;
  pollTitle: string;
  participantCount: number;
  alertCount: number;
  startedAt: string;
}

export default function Moderation() {
  const [alerts, setAlerts]         = useState<TabAlert[]>([]);
  const [filter, setFilter]         = useState<'all'|'unresolved'|'high'>('unresolved');
  const [selectedPoll, setSelectedPoll] = useState<string|null>(null);
  const [sessions, setSessions]     = useState<ActiveSession[]>([]);

  // Load active polls
  const { data: polls = [] } = useQuery<any[]>({
    queryKey: ['polls'],
    queryFn: () => pollsApi.list() as Promise<any[]>,
    refetchInterval: 10000,
  });

  const activePolls = polls.filter((p: any) => p.status === 'active');

  // Subscribe to tab switch events for all active polls
  usePollChannel(selectedPoll ?? undefined, {
    'tab-switch': (data: any) => {
      const alert: TabAlert = {
        id: Date.now().toString(),
        studentName: data.studentName ?? 'Anonymous',
        studentEmail: data.studentEmail,
        pollTitle: data.pollTitle ?? 'Quiz',
        pollId: data.pollId,
        classroomName: data.classroomName,
        count: data.switchCount ?? 1,
        timestamp: new Date().toISOString(),
        severity: data.switchCount >= 3 ? 'high' : data.switchCount >= 2 ? 'medium' : 'low',
        resolved: false,
      };
      setAlerts(prev => [alert, ...prev]);
      toast.warning(`⚠️ ${data.studentName} switched tabs (${data.switchCount}×)`, {
        description: data.pollTitle,
        duration: 5000,
      });
    },
  });

  // Demo alerts on mount
  useEffect(() => {
    const demo: TabAlert[] = [
      {
        id: '1', studentName: 'Arjun Sharma', studentEmail: 'arjun@student.com',
        pollTitle: 'Mathematics Quiz - Chapter 5', pollId: 'demo1',
        classroomName: 'Class 10A', count: 3, timestamp: new Date(Date.now() - 120000).toISOString(),
        severity: 'high', resolved: false,
      },
      {
        id: '2', studentName: 'Priya Reddy', studentEmail: 'priya@student.com',
        pollTitle: 'Mathematics Quiz - Chapter 5', pollId: 'demo1',
        classroomName: 'Class 10A', count: 1, timestamp: new Date(Date.now() - 60000).toISOString(),
        severity: 'low', resolved: false,
      },
      {
        id: '3', studentName: 'Rahul Kumar', studentEmail: 'rahul@student.com',
        pollTitle: 'Science Test', pollId: 'demo2',
        classroomName: 'Class 9B', count: 2, timestamp: new Date(Date.now() - 300000).toISOString(),
        severity: 'medium', resolved: true,
      },
    ];
    setAlerts(demo);
  }, []);

  const resolve  = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  const dismiss  = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const resolveAll = () => setAlerts(prev => prev.map(a => ({ ...a, resolved: true })));

  const filtered = alerts.filter(a => {
    if (filter === 'unresolved') return !a.resolved;
    if (filter === 'high')       return a.severity === 'high' && !a.resolved;
    return true;
  });

  const unresolvedCount = alerts.filter(a => !a.resolved).length;
  const highCount       = alerts.filter(a => a.severity === 'high' && !a.resolved).length;

  const sevColor = (s: string) =>
    s === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
    s === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-200' :
    'bg-yellow-100 text-yellow-700 border-yellow-200';

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Moderation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time tab switch alerts and student monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {unresolvedCount > 0 && (
            <button onClick={resolveAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
              <CheckCircle size={14}/> Resolve All
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold border border-red-200">
            <AlertTriangle size={12}/> {unresolvedCount} unresolved
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total Alerts',   value: alerts.length,     color:'text-slate-700',  bg:'bg-slate-100',  icon: Bell },
          { label:'High Severity',  value: highCount,         color:'text-red-700',    bg:'bg-red-100',    icon: AlertTriangle },
          { label:'Active Quizzes', value: activePolls.length,color:'text-green-700',  bg:'bg-green-100',  icon: Users },
        ].map(s => (
          <div key={s.label} className="op-card p-4">
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

      {/* Active polls to monitor */}
      {activePolls.length > 0 && (
        <div className="op-card p-4">
          <h3 className="font-display font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
            <Eye size={14} className="text-green-500"/> Live Sessions — Click to Monitor
          </h3>
          <div className="flex gap-2 flex-wrap">
            {activePolls.map((poll: any) => (
              <button key={poll.id} onClick={() => setSelectedPoll(selectedPoll === poll.id ? null : poll.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  selectedPoll === poll.id ? 'bg-terracotta-500 text-white border-terracotta-500' : 'bg-white border-cream-300 text-slate-700 hover:border-terracotta-300'}`}>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                {poll.title} · {poll.uniqueParticipants} joined
              </button>
            ))}
          </div>
          {selectedPoll && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Shield size={11}/> Monitoring for tab switch events — alerts appear in real-time below
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all','unresolved','high'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-terracotta-500 text-white' : 'bg-white border border-cream-300 text-slate-600 hover:border-terracotta-300'}`}>
            {f === 'all' ? 'All Alerts' : f === 'unresolved' ? `Unresolved (${unresolvedCount})` : `High (${highCount})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
              <Shield size={36} className="mx-auto mb-3 text-green-400"/>
              <h3 className="font-display font-semibold text-slate-700 mb-1">All clear</h3>
              <p className="text-sm text-slate-400">No tab switch alerts detected</p>
            </motion.div>
          ) : filtered.map(alert => (
            <motion.div key={alert.id}
              initial={{ opacity:0, y:-8, scale:0.98 }}
              animate={{ opacity:1, y:0,  scale:1 }}
              exit={{   opacity:0, x:100, scale:0.95 }}
              className={`op-card p-4 border-l-4 transition-all ${
                alert.resolved ? 'opacity-50 border-l-slate-300' :
                alert.severity === 'high' ? 'border-l-red-500' :
                alert.severity === 'medium' ? 'border-l-orange-400' : 'border-l-yellow-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sevColor(alert.severity)}`}>
                  <AlertTriangle size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{alert.studentName}</p>
                      {alert.studentEmail && <p className="text-xs text-slate-400">{alert.studentEmail}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${sevColor(alert.severity)}`}>
                        {alert.count}× switch
                      </span>
                      {alert.resolved && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Resolved</span>}
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Eye size={10}/>{alert.pollTitle}</span>
                    {alert.classroomName && <span className="flex items-center gap-1"><Users size={10}/>{alert.classroomName}</span>}
                    <span className="flex items-center gap-1"><Clock size={10}/>{formatDate(alert.timestamp)}</span>
                  </div>

                  {alert.count >= 3 && !alert.resolved && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      ⚠️ High risk — {alert.studentName} has switched tabs {alert.count} times. Consider disqualifying.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!alert.resolved && (
                    <button onClick={() => resolve(alert.id)}
                      className="p-1.5 hover:bg-green-100 rounded-lg text-slate-400 hover:text-green-600 transition-colors" title="Mark resolved">
                      <CheckCircle size={15}/>
                    </button>
                  )}
                  {alert.studentEmail && (
                    <a href={`mailto:${alert.studentEmail}?subject=Quiz Alert - Tab Switch Detected`}
                      className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Email student">
                      <Mail size={15}/>
                    </a>
                  )}
                  <button onClick={() => dismiss(alert.id)}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Dismiss">
                    <X size={15}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
