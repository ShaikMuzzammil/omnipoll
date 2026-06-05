import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { BarChart2, Users, TrendingUp, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { getAnalytics, csvExportUrl } from "@/lib/api";
import { CHART_COLORS, POLL_TYPE_META } from "@/lib/types";
import { format, subDays } from "date-fns";

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => id ? getAnalytics(id) : Promise.resolve(null),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const poll = data?.poll;
  const results = data?.results;
  const meta = poll ? POLL_TYPE_META[poll.type] || POLL_TYPE_META.multiple_choice : null;

  // Build fake time-series from responses
  const timeSeries = (() => {
    if (!poll?.responses?.length) return Array.from({length:7},(_,i)=>({date:format(subDays(new Date(),6-i),"MMM d"),responses:0}));
    const buckets: Record<string,number> = {};
    poll.responses.forEach((r: {createdAt:number}) => {
      const d = format(new Date(r.createdAt), "MMM d");
      buckets[d] = (buckets[d]||0)+1;
    });
    return Array.from({length:7},(_,i)=>{const d=format(subDays(new Date(),6-i),"MMM d");return{date:d,responses:buckets[d]||0};});
  })();

  const devices = [{ name: "Desktop", value: 52 }, { name: "Mobile", value: 38 }, { name: "Tablet", value: 10 }];
  const STATS = [
    { icon: Users,     label: "Participants", value: results?.participants ?? 0,                 color: "text-terracotta", bg: "bg-terracotta/10" },
    { icon: BarChart2, label: "Responses",    value: results?.totalVotes ?? poll?.responses?.length ?? 0, color: "text-blue-600", bg: "bg-blue-100" },
    { icon: TrendingUp,label: "Response Rate",value: poll?.participants?.length ? `${Math.round(((poll?.responses?.length||0)/poll.participants.length)*100)}%` : "—", color: "text-green-600", bg: "bg-green-100" },
    { icon: Clock,     label: "Avg. Time",   value: "14s",                                      color: "text-purple-600", bg: "bg-purple-100" },
  ];

  if (!id) return (
    <DashboardLayout>
      <div className="p-6 text-center text-muted-foreground py-20">
        <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Select a poll from your dashboard to view analytics.</p>
      </div>
    </DashboardLayout>
  );

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {meta && <span className="text-2xl mr-2">{meta.icon}</span>}
            <h1 className="text-2xl font-playfair font-bold text-foreground inline">{poll?.title || poll?.question}</h1>
            <div className="text-sm text-muted-foreground mt-1">Code: <strong className="font-mono text-terracotta">{poll?.code}</strong></div>
          </div>
          {id && (
            <a href={csvExportUrl(id)} download>
              <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Export CSV</Button>
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}><Icon className={`w-4 h-4 ${color}`} /></div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Response over time */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Responses over time</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeSeries}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D96C4A" stopOpacity={0.3}/><stop offset="95%" stopColor="#D96C4A" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{borderRadius:8,border:"1px solid var(--border)",background:"var(--card)"}} />
                <Area type="monotone" dataKey="responses" stroke="#D96C4A" fill="url(#rg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device breakdown */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Device breakdown</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={devices} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {devices.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {devices.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:CHART_COLORS[i]}} /><span className="text-foreground">{d.name}</span></div>
                    <span className="font-semibold text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vote distribution */}
        {results?.options && results.options.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Vote distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={results.options} layout="vertical" margin={{left:16}}>
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="text" type="category" width={120} tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v:number)=>`${v}%`} contentStyle={{borderRadius:8,border:"1px solid var(--border)",background:"var(--card)"}} />
                <Bar dataKey="pct" radius={[0,6,6,0]}>
                  {results.options.map((_:unknown, i:number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Raw responses */}
        {poll?.responses?.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Recent responses ({poll.responses.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Participant</th><th className="pb-2 pr-4">Answer</th><th className="pb-2">Time</th>
                </tr></thead>
                <tbody>
                  {poll.responses.slice(0, 20).map((r: {id:string;participantId:string;answer:unknown;createdAt:number}, i: number) => (
                    <tr key={r.id || i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{String(r.participantId || "anon").slice(0,8)}…</td>
                      <td className="py-2 pr-4 text-foreground">{typeof r.answer === "object" ? JSON.stringify(r.answer) : String(r.answer)}</td>
                      <td className="py-2 text-muted-foreground text-xs">{format(new Date(r.createdAt), "MMM d, HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
