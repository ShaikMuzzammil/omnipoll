import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, Plus, Users, Activity, TrendingUp, Copy, ExternalLink, Play, Pause, X, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { listPolls, updatePollStatus, deletePoll } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { Poll } from '@/lib/types';

function timeAgo(ts: number) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS = ['all','live','paused','closed'] as const;
type Tab = typeof TABS[number];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useApp();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await listPolls(user.id) as { polls: Poll[] };
      setPolls(data.polls || []);
    } catch { toast.error('Failed to load polls'); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) fetchPolls();
  }, [user, authLoading, fetchPolls, navigate]);

  const filtered = tab === 'all' ? polls : polls.filter(p => p.status === tab);
  const liveCount = polls.filter(p => p.status === 'live').length;
  const totalParts = polls.reduce((a, p) => a + (p.participants?.length || 0), 0);

  const STATS = [
    { icon: BarChart2, label:'Total Polls',    value: polls.length,  color:'text-terracotta', bg:'bg-terracotta/10' },
    { icon: Activity,  label:'Live Now',       value: liveCount,     color:'text-green-600',  bg:'bg-green-100 dark:bg-green-900/30' },
    { icon: Users,     label:'Participants',   value: totalParts,    color:'text-blue-600',   bg:'bg-blue-100 dark:bg-blue-900/30' },
    { icon: TrendingUp,label:'Responses',      value: polls.reduce((a,p)=>a+(p.responses?.length||0),0), color:'text-purple-600', bg:'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const setStatus = async (id: string, status: string) => {
    try {
      await updatePollStatus(id, status);
      setPolls(prev => prev.map(p => p.id === id ? { ...p, status: status as Poll['status'] } : p));
      toast.success(`Poll ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this poll? Cannot be undone.')) return;
    try {
      await deletePoll(id);
      setPolls(prev => prev.filter(p => p.id !== id));
      toast.success('Poll deleted');
    } catch { toast.error('Failed to delete poll'); }
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/participate/${code}`);
    toast.success('Join link copied!');
  };

  if (loading || authLoading) return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs + New Poll */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t}{t !== 'all' && polls.filter(p => p.status === t).length > 0 &&
                  <span className="ml-1 opacity-60">({polls.filter(p => p.status === t).length})</span>}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto">
            <Button asChild size="sm" className="gap-2">
              <Link to="/create"><Plus className="w-4 h-4" />New Poll</Link>
            </Button>
          </div>
        </div>

        {/* Poll list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-playfair text-lg mb-2">{tab === 'all' ? 'No polls yet' : `No ${tab} polls`}</p>
            <p className="text-sm mb-4">Create your first poll to get started</p>
            <Button asChild size="sm"><Link to="/create">Create Poll</Link></Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((poll, i) => {
              const meta = POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice;
              return (
                <motion.div key={poll.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm truncate">{poll.title}</h3>
                        <Badge variant={poll.status === 'live' ? 'live' : poll.status === 'paused' ? 'paused' : 'closed'} className="flex-shrink-0 text-xs">
                          {poll.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block" />}
                          {poll.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{meta.label}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{poll.participants?.length || 0}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(poll.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={() => copyLink(poll.code)}>
                      <Copy className="w-3 h-3" />Copy link
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" asChild>
                      <Link to={`/present/${poll.id}`}><ExternalLink className="w-3 h-3" />Present</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" asChild>
                      <Link to={`/results/${poll.id}`}><BarChart2 className="w-3 h-3" />Results</Link>
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                      {poll.status === 'live' && <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-yellow-600" onClick={() => setStatus(poll.id,'paused')}><Pause className="w-3 h-3"/>Pause</Button>}
                      {poll.status === 'paused' && <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-green-600" onClick={() => setStatus(poll.id,'live')}><Play className="w-3 h-3"/>Resume</Button>}
                      {poll.status !== 'closed' && <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setStatus(poll.id,'closed')}><X className="w-3 h-3"/>Close</Button>}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(poll.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
