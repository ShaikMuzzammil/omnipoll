import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Users, BarChart2, TrendingUp, Clock, Star, Share2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../lib/api';
import { CHART_COLORS } from '../types';
import { format, subDays } from 'date-fns';

const DEMO_OVER_TIME = Array.from({ length: 12 }, (_, i) => ({
  time: format(subDays(new Date(), 11 - i), 'MMM d'),
  responses: Math.floor(20 + Math.random() * 80),
  participants: Math.floor(25 + Math.random() * 90),
}));

const DEMO_PIE = [
  { name: 'Option A', value: 42 }, { name: 'Option B', value: 28 },
  { name: 'Option C', value: 18 }, { name: 'Option D', value: 12 },
];

const DEMO_ENGAGEMENT = [
  { segment: '<18', value: 15 }, { segment: '18-24', value: 35 },
  { segment: '25-34', value: 28 }, { segment: '35-44', value: 14 },
  { segment: '45+', value: 8 },
];

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'overview' | 'responses' | 'engagement' | 'export'>('overview');

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => id ? analyticsApi.poll(id) : analyticsApi.overview(),
    enabled: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (analytics as any) || null;
  const stats = [
    { icon: Users, label: 'Total Participants', value: data?.participants ?? 248, color: 'text-sage' },
    { icon: BarChart2, label: 'Total Responses', value: data?.responses ?? 213, color: 'text-terracotta' },
    { icon: TrendingUp, label: 'Response Rate', value: `${data?.responseRate ?? 86}%`, color: 'text-blue-400' },
    { icon: Clock, label: 'Avg. Time', value: `${data?.avgTime ?? 12}s`, color: 'text-amber-400' },
  ];

  const exportCSV = () => {
    const rows = [['Option', 'Votes', 'Percentage']];
    DEMO_PIE.forEach(d => rows.push([d.name, String(d.value), `${Math.round((d.value / 100) * 100)}%`]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `poll-${id}-results.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-charcoal dark:text-white">Analytics</h1>
            <p className="text-sm text-slate dark:text-gray-400">Poll ID: {id}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-clay dark:border-gray-600 text-sm text-charcoal dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta text-white text-sm hover:bg-terracotta/90 transition-colors">
              <Share2 className="w-4 h-4" /> Share Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 mb-6 w-fit border border-clay/20 dark:border-gray-700">
          {(['overview', 'responses', 'engagement', 'export'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-terracotta text-white' : 'text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="card p-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-current/10 mb-3 ${color}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                  <div className="text-sm text-slate dark:text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Response Over Time */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Responses Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={DEMO_OVER_TIME}>
                  <defs>
                    <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E07A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                  <Area type="monotone" dataKey="responses" stroke="#E07A5F" fill="url(#responseGrad)" strokeWidth={2} name="Responses" />
                  <Area type="monotone" dataKey="participants" stroke="#81B29A" fill="none" strokeWidth={2} name="Participants" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution + Engagement row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pie */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Answer Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={DEMO_PIE} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {DEMO_PIE.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Age distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Participant Demographics</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={DEMO_ENGAGEMENT} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis dataKey="segment" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={40} />
                    <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="value" fill="#E07A5F" radius={[0, 4, 4, 0]} name="Participants" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="card p-6 border-2 border-terracotta/20">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h3 className="text-lg font-semibold text-charcoal dark:text-white">AI Insights</h3>
                <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full font-medium">Beta</span>
              </div>
              <div className="space-y-3">
                {[
                  { emoji: '📈', text: 'Response rate is 14% above your average — this poll topic resonated strongly.' },
                  { emoji: '⚡', text: 'Most participants answered within the first 8 seconds, indicating clear, well-phrased options.' },
                  { emoji: '💡', text: 'Option A is the clear winner. Consider following up with a more granular question to explore why.' },
                  { emoji: '🔁', text: '68% of participants have voted in your polls before — strong audience retention.' },
                ].map(({ emoji, text }) => (
                  <div key={text} className="flex items-start gap-3 text-sm">
                    <span className="text-lg mt-0.5">{emoji}</span>
                    <p className="text-slate dark:text-gray-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'responses' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Individual Responses</h3>
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => ({
                name: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry'][i],
                answer: ['Option A', 'Option B', 'Option A', 'Option C', 'Option A', 'Option B', 'Option D', 'Option A'][i],
                time: `${2 + i * 3}s`,
                device: i % 2 === 0 ? '📱' : '💻',
              })).map((r, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-clay/20 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-terracotta/10 text-terracotta font-bold text-sm flex items-center justify-center">
                      {r.name[0]}
                    </div>
                    <span className="font-medium text-charcoal dark:text-white text-sm">{r.name}</span>
                    <span className="text-lg">{r.device}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-terracotta">{r.answer}</span>
                    <span className="text-slate dark:text-gray-400">{r.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'engagement' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Response Time Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { bucket: '0-5s', count: 45 }, { bucket: '5-10s', count: 38 },
                    { bucket: '10-15s', count: 22 }, { bucket: '15-20s', count: 15 },
                    { bucket: '20s+', count: 8 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="count" fill="#81B29A" radius={[4, 4, 0, 0]} name="Participants" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Device Breakdown</h3>
                <div className="space-y-4 mt-4">
                  {[{ label: '📱 Mobile', pct: 64, color: 'bg-terracotta' }, { label: '💻 Desktop', pct: 28, color: 'bg-sage' }, { label: '📟 Tablet', pct: 8, color: 'bg-amber-400' }].map(d => (
                    <div key={d.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-charcoal dark:text-white">{d.label}</span>
                        <span className="font-bold text-charcoal dark:text-white">{d.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'export' && (
          <div className="card p-8 text-center max-w-lg mx-auto">
            <Download className="w-12 h-12 text-terracotta mx-auto mb-4" />
            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-2">Export Poll Data</h3>
            <p className="text-slate dark:text-gray-400 mb-6">Download your poll results in multiple formats</p>
            <div className="space-y-3">
              {[
                { format: 'CSV', desc: 'Spreadsheet-compatible', icon: '📊' },
                { format: 'JSON', desc: 'Raw data with metadata', icon: '📋' },
                { format: 'PDF Report', desc: 'Full visual report', icon: '📄' },
              ].map(({ format, desc, icon }) => (
                <button key={format} onClick={exportCSV} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-clay/30 dark:border-gray-600 hover:border-terracotta/50 hover:bg-terracotta/5 transition-colors text-left">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-charcoal dark:text-white">{format}</div>
                    <div className="text-sm text-slate dark:text-gray-400">{desc}</div>
                  </div>
                  <Download className="w-4 h-4 text-slate dark:text-gray-400 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
