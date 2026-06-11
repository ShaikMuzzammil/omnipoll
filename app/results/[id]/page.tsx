'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2, Users, ExternalLink, Copy, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { getPoll, getResults } from '@/lib/api';
import { POLL_TYPE_META, CHART_COLORS } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import type { Poll, PollResults } from '@/lib/types';

export default function ResultsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pd, rd] = await Promise.all([
          getPoll(id) as Promise<{ poll: Poll }>,
          getResults(id) as Promise<{ results: PollResults }>,
        ]);
        setPoll(pd.poll);
        setResults(rd.results);
      } catch { toast.error('Failed to load results'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const copyLink = () => {
    if (!poll) return;
    navigator.clipboard.writeText(`${window.location.origin}/participate/${poll.code}`);
    toast.success('Join link copied!');
  };

  const exportCSV = () => {
    if (!poll || !results) return;
    let csv = 'Option,Votes,Percentage\n';
    results.options?.forEach((o) => { csv += `"${o.text}",${o.votes},${o.pct}%\n`; });
    results.words?.forEach((w) => { csv += `"${w.text}",${w.count},\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${poll.code}-results.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <DashboardLayout title="Results">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!poll || !results) return <DashboardLayout title="Results"><div className="p-6 text-muted-foreground">Poll not found</div></DashboardLayout>;

  const meta = POLL_TYPE_META[poll.type];

  return (
    <DashboardLayout title="Results">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 mb-4 -ml-1">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <h1 className="font-playfair text-xl font-bold text-foreground">{poll.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={poll.status as 'live' | 'paused' | 'closed'}>{poll.status}</Badge>
                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">· {timeAgo(poll.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 text-xs"><Copy className="w-3.5 h-3.5" />Copy link</Button>
                <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                  <Link href={`/present/${poll.id}`}><ExternalLink className="w-3.5 h-3.5" />Present</Link>
                </Button>
                {results.options && (
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Export CSV</Button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-terracotta">{results.participants}</div>
                <div className="text-xs text-muted-foreground">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{results.totalVotes ?? 0}</div>
                <div className="text-xs text-muted-foreground">Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground font-mono">{poll.code}</div>
                <div className="text-xs text-muted-foreground">Join code</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-playfair font-semibold text-lg text-foreground mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-terracotta" />Results
          </h2>

          {results.totalVotes === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No responses yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bar chart for choice-based types */}
              {results.options && results.options.length > 0 && (
                <>
                  <div className="space-y-3">
                    {results.options.map((opt, i) => (
                      <div key={opt.id}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-foreground">{opt.text}</span>
                          <span className="text-muted-foreground">{opt.votes} · <strong className="text-foreground">{opt.pct}%</strong></span>
                        </div>
                        <div className="h-8 bg-muted rounded-xl overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${opt.pct}%` }} transition={{ duration: 0.6, delay: i * 0.07 }}
                            className="h-full rounded-xl" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {results.options.length > 2 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={results.options.map((o) => ({ name: o.text, value: o.votes }))} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                          {results.options.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Legend formatter={(v) => <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>{v}</span>} />
                        <Tooltip formatter={(val, name) => [`${val} votes`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}

              {/* Word cloud */}
              {results.words && results.words.length > 0 && (
                <div className="flex flex-wrap gap-2.5 py-4">
                  {results.words.slice(0, 40).map((w, i) => (
                    <span key={w.text} className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ fontSize: `${0.7 + w.count * 0.1}rem`, background: `${CHART_COLORS[i % CHART_COLORS.length]}22`, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                      {w.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Open text answers */}
              {(poll.type === 'open_text' || poll.type === 'fill_blank') && results.answers && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.answers.map((a, i) => (
                    <div key={i} className="p-3 bg-accent/50 rounded-xl text-sm text-foreground">{a}</div>
                  ))}
                </div>
              )}

              {/* Rating / Slider average */}
              {results.average !== undefined && (
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-terracotta font-playfair">{results.average}</div>
                  <div className="text-sm text-muted-foreground mt-1">{poll.type === 'nps' ? 'Net Promoter Score' : 'Average'}</div>
                  {results.distribution && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={Object.entries(results.distribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => ({ name: k, value: v }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <Bar dataKey="value" fill="#D96C4A" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz leaderboard */}
              {results.leaderboard && results.leaderboard.length > 0 && (
                <div className="space-y-2">
                  {results.leaderboard.slice(0, 10).map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                      <span className="text-lg">{['🥇','🥈','🥉'][i] || `${i+1}`}</span>
                      <span className="flex-1 font-medium text-sm text-foreground">{e.name}</span>
                      <span className="text-xs text-muted-foreground">{e.correct}/{e.answered} correct</span>
                      <span className="font-bold text-terracotta">{e.score} pts</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Q&A */}
              {results.questions && results.questions.length > 0 && (
                <div className="space-y-2">
                  {results.questions.map((q) => (
                    <div key={q.id} className="flex items-start gap-3 p-3 bg-accent/50 rounded-xl">
                      <span className="text-sm font-bold text-terracotta w-8 text-center flex-shrink-0">↑{q.upvotes}</span>
                      <p className="text-sm text-foreground flex-1">{q.questionText}</p>
                      {q.status !== 'open' && <Badge variant="outline" className="text-xs flex-shrink-0">{q.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}

              {/* Ranking */}
              {results.rankingResults && results.rankingResults.length > 0 && (
                <div className="space-y-2">
                  {results.rankingResults.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                      <span className="text-terracotta font-black text-lg w-6">{i+1}</span>
                      <span className="flex-1 text-sm font-medium">{r.text}</span>
                      <span className="text-xs text-muted-foreground">{r.points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
