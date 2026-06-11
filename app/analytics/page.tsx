'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2, Users, Activity, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { getPolls, getDashboardStats } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import type { Poll } from '@/lib/types';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stats, setStats] = useState({ totalPolls: 0, livePolls: 0, closedPolls: 0, totalParticipants: 0, totalResponses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    (async () => {
      try {
        const [pollsData, statsData] = await Promise.all([
          getPolls(user.id) as Promise<{ polls: Poll[] }>,
          getDashboardStats(user.id) as Promise<typeof stats>,
        ]);
        setPolls(pollsData.polls || []);
        setStats(statsData);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  // Build type distribution chart data
  const typeDistData = Object.entries(
    polls.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => ({
    name: POLL_TYPE_META[type as keyof typeof POLL_TYPE_META]?.label || type,
    count,
  }));

  // Build timeline chart (last 14 days)
  const now = Date.now();
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const dayStart = now - (13 - i) * 86400000;
    const dayEnd = dayStart + 86400000;
    return {
      date: new Date(dayStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      polls: polls.filter((p) => p.createdAt >= dayStart && p.createdAt < dayEnd).length,
    };
  });

  // Top polls by participation
  const topPolls = [...polls].sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0)).slice(0, 5);

  const STAT_CARDS = [
    { icon: BarChart2, label: 'Total Polls',      value: stats.totalPolls,       color: 'text-terracotta', bg: 'bg-terracotta/10' },
    { icon: Activity,  label: 'Live Now',          value: stats.livePolls,        color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30' },
    { icon: Users,     label: 'Total Participants',value: stats.totalParticipants,color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { icon: TrendingUp,label: 'Total Responses',   value: stats.totalResponses,   color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  if (loading) return (
    <DashboardLayout title="Analytics">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Analytics">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Polls created over time */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-playfair font-semibold text-foreground mb-4">Polls created (14 days)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="polls" stroke="#D96C4A" strokeWidth={2} dot={{ fill: '#D96C4A', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Poll type distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-playfair font-semibold text-foreground mb-4">Poll type usage</h3>
            {typeDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={typeDistData} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#D96C4A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* Top polls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-playfair font-semibold text-foreground mb-4">Top polls by participation</h3>
          {topPolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No polls yet — <Link href="/create" className="text-terracotta hover:underline">create your first poll</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {topPolls.map((poll, i) => {
                const meta = POLL_TYPE_META[poll.type];
                return (
                  <div key={poll.id} className="flex items-center gap-3 p-3 bg-accent/40 rounded-xl hover:bg-accent/60 transition-colors">
                    <span className="text-muted-foreground font-bold text-sm w-5 text-center">{i + 1}</span>
                    <span className="text-lg">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{poll.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{meta.label}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{timeAgo(poll.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{poll.participants?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">participants</div>
                      </div>
                      <Badge variant={poll.status as 'live' | 'paused' | 'closed'}>{poll.status}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <Link href={`/results/${poll.id}`}><ExternalLink className="w-3.5 h-3.5" /></Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
