import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Clock, Copy, ExternalLink, Loader2,
  Play, Square, Mail, Send, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Trophy, Eye, Download, ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { pollsApi, attemptsApi } from '@/lib/api';
import { usePollChannel } from '@/hooks/usePusher';
import { pollTypeLabel, pollTypeIcon, formatDate, formatDuration, scoreColor, truncate } from '@/lib/utils';
import type { Poll, Attempt } from '@/lib/types';

const COLORS = ['#D96C4A','#7A8C6E','#E4CC94','#A6472C','#5A6A4E','#EEDBB0'];
const STUDENT_APP = import.meta.env.VITE_STUDENT_APP_URL ?? 'https://omnipoll-learn.vercel.app';

export default function Results() {
  const { pollId } = useParams<{ pollId:string }>();
  const qc = useQueryClient();
  const [tab, setTab]           = useState<'results'|'participants'>('results');
  const [expandedRow, setExpRow]= useState<string|null>(null);
  const [sending, setSending]   = useState(false);

  const { data: poll, isLoading: pollLoad } = useQuery<Poll>({
    queryKey:['poll',pollId],
    queryFn: ()=>pollsApi.get(pollId!) as Promise<Poll>,
    refetchInterval:8000,
  });

  const { data: results } = useQuery<any>({
    queryKey:['poll-results',pollId],
    queryFn: ()=>pollsApi.results(pollId!),
    refetchInterval:4000, enabled:!!pollId,
  });

  const { data: attempts=[] } = useQuery<Attempt[]>({
    queryKey:['poll-attempts',pollId],
    queryFn: ()=>attemptsApi.forPoll(pollId!) as Promise<Attempt[]>,
    enabled:!!pollId, refetchInterval:8000,
  });

  usePollChannel(pollId, {
    'new-vote':    ()=>qc.invalidateQueries({queryKey:['poll-results',pollId]}),
    'new-attempt': ()=>qc.invalidateQueries({queryKey:['poll-attempts',pollId]}),
  });

  const statusMut = useMutation({
    mutationFn:(s:string)=>pollsApi.status(pollId!,s),
    onSuccess:()=>{qc.invalidateQueries({queryKey:['poll',pollId]});toast.success('Updated');},
  });
  const releaseMut = useMutation({
    mutationFn:()=>pollsApi.release(pollId!),
    onSuccess:()=>{qc.invalidateQueries({queryKey:['poll',pollId]});toast.success('Results released! Students notified. 🎉');},
  });

  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${STUDENT_APP}/join/${poll?.code}`);
    toast.success('Student join link copied!');
  };

  /* ── Send result email to one student ── */
  const sendEmail = async (attemptId:string, name:string) => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/email-result`,{
        method:'POST',
        headers:{Authorization:`Bearer ${localStorage.getItem('op_token')||''}`},
      });
      const data = await res.json();
      if(res.ok) toast.success(`Result emailed to ${name}!`);
      else toast.error(data.error||'No email on record');
    } catch { toast.error('Failed to send email'); }
  };

  /* ── Send to ALL ── */
  const sendToAll = async () => {
    const eligible = attempts.filter(a=>a.status==='submitted');
    if(!eligible.length){toast.error('No submitted attempts');return;}
    setSending(true);
    let ok=0,fail=0;
    for(const a of eligible){
      try{
        const res = await fetch(`/api/attempts/${a.id}/email-result`,{
          method:'POST',
          headers:{Authorization:`Bearer ${localStorage.getItem('op_token')||''}`},
        });
        if(res.ok) ok++;
        else fail++;
      }catch{ fail++; }
    }
    setSending(false);
    toast.success(`Sent to ${ok} student${ok!==1?'s':''}${fail>0?` (${fail} failed — no email)`:''}!`);
  };

  if(pollLoad||!poll) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-terracotta-400"/></div>;

  const chartData = results?.optionStats??[];
  const submitted = attempts.filter(a=>a.status==='submitted');
  const avgScore  = submitted.length && submitted.some(a=>a.percentage!=null)
    ? submitted.reduce((s,a)=>s+(a.percentage??0),0)/submitted.filter(a=>a.percentage!=null).length
    : null;

  const STATUS_MAP: Record<string,{cls:string;label:string}> = {
    draft:            {cls:'badge-draft',          label:'Draft'},
    active:           {cls:'badge-live',           label:'● Live'},
    paused:           {cls:'badge-conduct',        label:'Paused'},
    closed:           {cls:'badge-closed',         label:'Closed'},
    results_released: {cls:'bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium', label:'🔓 Released'},
  };
  const status = STATUS_MAP[poll.status]??{cls:'badge-closed',label:poll.status};

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{pollTypeIcon(poll.type)}</span>
            <span className="text-xs text-slate-500 font-medium">{pollTypeLabel(poll.type)}</span>
            <span className={status.cls}>{status.label}</span>
          </div>
          <h1 className="font-display text-xl font-bold text-slate-800">{poll.title}</h1>
          {poll.description&&<p className="text-sm text-slate-500 mt-0.5">{poll.description}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Code chip */}
          <div className="flex items-center gap-2 bg-cream-100 border border-cream-300 rounded-xl px-3 py-1.5">
            <span className="font-mono text-sm font-black text-terracotta-700 tracking-[0.2em]">{poll.code}</span>
            <button onClick={copyJoinLink} title="Copy student join link" className="p-0.5 hover:bg-cream-200 rounded text-slate-400 hover:text-terracotta-600 transition-colors"><Copy size={13}/></button>
          </div>

          {/* Present */}
          <button onClick={()=>window.open(`/present/${pollId}`,'_blank','noopener,noreferrer')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-cream-300 hover:border-terracotta-300 rounded-xl text-sm font-medium text-slate-700 transition-all">
            <ExternalLink size={14}/> Present
          </button>

          {/* Deep analysis */}
          <Link to={`/analyse/${pollId}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-cream-300 hover:border-terracotta-300 rounded-xl text-sm font-medium text-slate-700 transition-all">
            <BarChart3 size={14}/> Deep Analysis
          </Link>

          {/* Status controls */}
          {poll.status==='draft'&&(
            <button onClick={()=>statusMut.mutate('active')}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-sm font-semibold transition-all">
              <Play size={14}/> Launch
            </button>
          )}
          {poll.status==='active'&&(
            <button onClick={()=>statusMut.mutate('closed')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-semibold transition-all">
              <Square size={14}/> Close Poll
            </button>
          )}
          {poll.status==='closed'&&(
            <button onClick={()=>releaseMut.mutate()} disabled={releaseMut.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
              {releaseMut.isPending?<Loader2 size={14} className="animate-spin"/>:'🔓'} Release Results
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Participants', value:poll.uniqueParticipants, color:'text-terracotta-600', bg:'bg-terracotta-100', icon:Users},
          {label:'Total Votes',  value:poll.totalVotes,         color:'text-blue-600',       bg:'bg-blue-100',       icon:BarChart3},
          {label:'Submitted',    value:submitted.length,        color:'text-green-600',      bg:'bg-green-100',      icon:CheckCircle},
          {label:'Avg Score',    value:avgScore!=null?`${(avgScore??0).toFixed(0)}%`:'—', color:'text-purple-600', bg:'bg-purple-100', icon:Trophy},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-cream-200 rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              <div className={`w-7 h-7 ${s.bg} rounded-xl flex items-center justify-center`}><s.icon size={14} className={s.color}/></div>
            </div>
            <span className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 p-1 rounded-xl w-fit">
        {([['results','📊 Results'],['participants','👥 Participants']] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-white shadow-sm text-terracotta-700':'text-slate-500 hover:text-slate-700'}`}>
            {l} {t==='participants'&&`(${attempts.length})`}
          </button>
        ))}
      </div>

      {/* Results tab */}
      {tab==='results'&&(
        <div className="op-card p-5">
          {chartData.length===0?(
            <div className="text-center py-14 text-slate-400">
              <div className="text-5xl mb-3">📊</div>
              <p className="font-medium">No responses yet</p>
              <p className="text-sm mt-1">Share code <span className="font-mono font-black text-terracotta-500 tracking-wider">{poll.code}</span> with students</p>
              <p className="text-xs mt-1">Student URL: <a href={`${STUDENT_APP}/join/${poll.code}`} target="_blank" rel="noreferrer" className="text-terracotta-600 underline">{STUDENT_APP}/join/{poll.code}</a></p>
            </div>
          ):(
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{left:-20}}>
                  <XAxis dataKey="text" tick={{fontSize:11}} tickFormatter={v=>truncate(String(v),12)}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{background:'#FEFAF5',border:'1px solid #E4CC94',borderRadius:'8px',fontSize:'12px'}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {chartData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {chartData.map((d:any,i:number)=>(
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-36 truncate">{d.text}</span>
                  <div className="flex-1 bg-cream-200 rounded-full h-2.5 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{width:`${d.percentage??0}%`,backgroundColor:COLORS[i%COLORS.length]}}
                      initial={{width:0}} animate={{width:`${d.percentage??0}%`}} transition={{duration:0.7}}/>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-20 text-right">{d.count} ({(d.percentage??0).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants tab */}
      {tab==='participants'&&(
        <div className="space-y-3">
          {/* Actions bar */}
          {submitted.length>0&&(
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-sm text-blue-700">
                <span className="font-bold">{submitted.length}</span> submitted attempt{submitted.length!==1?'s':''} ready
                {poll.status==='results_released'&&<span className="ml-2 text-green-700 font-medium">· Results released ✓</span>}
              </div>
              <div className="flex gap-2">
                {poll.status==='closed'&&(
                  <button onClick={()=>releaseMut.mutate()} disabled={releaseMut.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors">
                    {releaseMut.isPending?<Loader2 size={12} className="animate-spin"/>:'🔓'} Release Results
                  </button>
                )}
                <button onClick={sendToAll} disabled={sending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors">
                  {sending?<Loader2 size={12} className="animate-spin"/>:<Send size={12}/>}
                  {sending?'Sending…':'Email All Results'}
                </button>
              </div>
            </div>
          )}

          {attempts.length===0?(
            <div className="text-center py-14 bg-white/60 border border-cream-300 rounded-2xl">
              <Users size={36} className="mx-auto mb-3 text-slate-300"/>
              <p className="text-slate-500 font-medium">No participants yet</p>
              <p className="text-xs text-slate-400 mt-1">Share the join code to get participants</p>
            </div>
          ):(
            <div className="op-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 border-b border-cream-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {attempts.map((a,i)=>{
                      const name = a.user?.name??a.guestName??'Anonymous';
                      const email = (a.user as any)?.email??a.guestEmail;
                      const isExpanded = expandedRow===a.id;
                      return (
                        <>
                          <motion.tr key={a.id}
                            initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                            className={`border-b border-cream-100 hover:bg-cream-50/50 transition-colors cursor-pointer ${i%2===0?'':'bg-cream-50/30'}`}
                            onClick={()=>setExpRow(isExpanded?null:a.id)}>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{i+1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-terracotta-100 rounded-full flex items-center justify-center text-xs font-bold text-terracotta-700 flex-shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-sm">{name}</p>
                                  {email&&<p className="text-xs text-slate-400">{email}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              {a.percentage!=null?(
                                <div>
                                  <span className={`font-bold text-base ${scoreColor(a.percentage??0)}`}>{(a.percentage??0).toFixed(0)}%</span>
                                  <span className="text-xs text-slate-400 ml-1">{a.score??0}/{a.maxScore??0}pts</span>
                                </div>
                              ):<span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {a.timeTaken?<span className="text-xs text-slate-500">{formatDuration(a.timeTaken)}</span>:<span className="text-xs text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                a.status==='submitted'?'bg-green-100 text-green-700':
                                a.status==='in_progress'?'bg-blue-100 text-blue-700 animate-pulse':'bg-slate-100 text-slate-500'}`}>
                                {a.status==='submitted'?'✓ Done':a.status==='in_progress'?'● Active':a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {a.status==='submitted'&&(
                                  <>
                                    <Link to={`/attempt/${a.id}/keysheet`} onClick={e=>e.stopPropagation()}
                                      className="p-1.5 hover:bg-purple-100 rounded-lg text-slate-400 hover:text-purple-600 transition-colors" title="Key Sheet">
                                      <Eye size={14}/>
                                    </Link>
                                    <button onClick={e=>{e.stopPropagation();sendEmail(a.id,name);}}
                                      className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Email result">
                                      <Mail size={14}/>
                                    </button>
                                  </>
                                )}
                                <button onClick={e=>{e.stopPropagation();setExpRow(isExpanded?null:a.id);}}
                                  className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 transition-colors">
                                  {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                                </button>
                              </div>
                            </td>
                          </motion.tr>

                          {/* Expanded detail row */}
                          {isExpanded&&(
                            <motion.tr key={`${a.id}-detail`}
                              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                              <td colSpan={6} className="px-4 py-3 bg-cream-50/80 border-b border-cream-200">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  <div className="p-2.5 bg-white rounded-xl border border-cream-200">
                                    <p className="text-slate-400 mb-0.5">Score</p>
                                    <p className="font-bold text-slate-800">{a.score??0}/{a.maxScore??0} pts ({(a.percentage??0).toFixed(0)}%)</p>
                                  </div>
                                  <div className="p-2.5 bg-white rounded-xl border border-cream-200">
                                    <p className="text-slate-400 mb-0.5">Result</p>
                                    <p className={`font-bold ${a.passed?'text-green-600':'text-red-500'}`}>{a.passed?'✅ Passed':'❌ Failed'}</p>
                                  </div>
                                  <div className="p-2.5 bg-white rounded-xl border border-cream-200">
                                    <p className="text-slate-400 mb-0.5">Submitted</p>
                                    <p className="font-medium text-slate-700">{a.submittedAt?formatDate(a.submittedAt):'—'}</p>
                                  </div>
                                  <div className="p-2.5 bg-white rounded-xl border border-cream-200">
                                    <p className="text-slate-400 mb-0.5">Time taken</p>
                                    <p className="font-medium text-slate-700">{a.timeTaken?formatDuration(a.timeTaken):'—'}</p>
                                  </div>
                                </div>
                                {email&&(
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-slate-500">📧 {email}</span>
                                    <button onClick={()=>sendEmail(a.id,name)}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1">
                                      <Send size={11}/> Send Result Email
                                    </button>
                                    <Link to={`/attempt/${a.id}/keysheet`}
                                      className="text-xs text-purple-600 font-medium px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1">
                                      <Eye size={11}/> View Key Sheet
                                    </Link>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          )}
                        </>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
