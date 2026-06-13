import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Send, ThumbsUp, CheckCircle, Clock, ArrowRight, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { joinByCode, vote, addQAQuestion, upvoteQA, getResults, getParticipantId } from '@/lib/api';
import { usePusher } from '@/hooks/usePusher';
import { POLL_TYPE_META, EMOJIS } from '@/lib/types';
import { toast } from 'sonner';
import type { Poll, PollResults, QAQuestion } from '@/lib/types';

export default function Participate() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [pid] = useState(() => getParticipantId());
  const [name, setName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [qaList, setQaList] = useState<QAQuestion[]>([]);
  // vote state
  const [selOpt, setSelOpt] = useState('');
  const [selOpts, setSelOpts] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [slider, setSlider] = useState(50);
  const [ranking, setRanking] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string,string>>({});
  const [priority, setPriority] = useState<Record<string,number>>({});
  const [heatPt, setHeatPt] = useState<{x:number;y:number}|null>(null);
  const [qaText, setQaText] = useState('');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string,string>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [timer, setTimer] = useState<number|null>(null);
  const [matching, setMatching] = useState<Record<string,string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  usePusher(poll?.id||null, {
    'results-update': d => setResults(d as PollResults),
    'status-changed': d => { if(d&&typeof d==='object'&&'status' in d) setPoll(p=>p?{...p,status:(d as {status:Poll['status']}).status}:p); },
    'participant-joined': d => { if(d&&typeof d==='object'&&'count' in d) setParticipants((d as {count:number}).count); },
    'qa-update': d => { if(d&&typeof d==='object'&&'questions' in d) setQaList((d as {questions:QAQuestion[]}).questions); },
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await joinByCode(code!) as { poll: Poll };
        setPoll(data.poll);
        setParticipants(data.poll.participants?.length||0);
        setQaList(data.poll.qaQuestions||[]);
        if(data.poll.type==='ranking') setRanking(data.poll.options.map(o=>o.id));
        if(data.poll.type==='prioritization') {
          const ev = Math.floor(100/(data.poll.options.length||1));
          const init: Record<string,number> = {};
          data.poll.options.forEach(o=>{ init[o.id]=ev; });
          setPriority(init);
        }
        if(data.poll.settings?.min!=null) setSlider(data.poll.settings.min);
        if(localStorage.getItem(`voted_${data.poll.id}`)) setVoted(true);
        const r = await getResults(data.poll.id) as { results: PollResults };
        setResults(r.results);
      } catch { toast.error('Poll not found'); navigate('/join'); }
      finally { setLoading(false); }
    })();
  }, [code, navigate]);

  useEffect(() => {
    if(poll?.type!=='quiz'||quizDone||!nameSet) return;
    const q = poll.quizQuestions?.[quizStep]; if(!q) return;
    setTimer(q.timeLimit);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if(t==null||t<=1) { clearInterval(timerRef.current!); advanceQuiz(quizStep,null); return null; }
        return t-1;
      });
    },1000);
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [quizStep, poll?.type, nameSet, quizDone]);

  const advanceQuiz = (step: number, selected: string|null) => {
    if(!poll?.quizQuestions) return;
    const q = poll.quizQuestions[step];
    const correct = selected===q.correctAnswer;
    const pts = correct?q.points:0;
    const newAnswers = {...quizAnswers,[q.id]:selected||''};
    setQuizAnswers(newAnswers);
    setQuizScore(s=>s+pts);
    if(correct) setQuizCorrect(c=>c+1);
    if(step+1>=poll.quizQuestions.length) {
      setQuizDone(true);
      vote(poll.id,{ participantId:pid, participantName:name||'Anonymous', answer:selected,
        quizSubmission:{ score:quizScore+pts, correct:quizCorrect+(correct?1:0), answered:step+1,
          answers:Object.entries(newAnswers).map(([qId,ans])=>({ questionId:qId, selected:ans, isCorrect:ans===poll.quizQuestions.find(x=>x.id===qId)?.correctAnswer, points:ans===poll.quizQuestions.find(x=>x.id===qId)?.correctAnswer?(poll.quizQuestions.find(x=>x.id===qId)?.points||0):0 }))
        }}).catch(console.error);
    } else { setQuizStep(step+1); }
  };

  const submitVote = async () => {
    if(!poll) return;
    setSubmitting(true);
    try {
      let answer: unknown;
      if(poll.type==='multiple_choice'&&poll.settings?.multiSelect) answer=selOpts;
      else if(['multiple_choice','true_false','image_choice','emoji_reaction','bracket','countdown_vote','poll_series'].includes(poll.type)) answer=selOpt;
      else if(['open_text','word_cloud','fill_blank'].includes(poll.type)) answer=text;
      else if(poll.type==='rating'||poll.type==='nps') answer=rating;
      else if(poll.type==='slider') answer=slider;
      else if(poll.type==='ranking') answer=ranking;
      else if(poll.type==='matrix') answer=matrix;
      else if(poll.type==='prioritization') answer=priority;
      else if(poll.type==='heatmap') answer=heatPt;
      else if(poll.type==='live_matching') answer=matching;
      else answer=text||selOpt;

      await vote(poll.id,{ participantId:pid, participantName:name||'Anonymous', answer });
      localStorage.setItem(`voted_${poll.id}`,'1');
      setVoted(true);
      setParticipants(p=>p+1);
      const r = await getResults(poll.id) as { results:PollResults };
      setResults(r.results);
      toast.success('Vote submitted! ✓');
    } catch(e:unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      if(msg==='Already voted') { setVoted(true); toast.info('Already voted!'); }
      else toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center" style={{background:'hsl(42,33%,93%)'}}><div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"/></div>;
  if(!poll) return <div className="min-h-screen flex items-center justify-center" style={{background:'hsl(42,33%,93%)'}}><div className="text-center"><p className="text-muted-foreground mb-4">Poll not found</p><Button asChild><Link to="/join">Back</Link></Button></div></div>;

  const meta = POLL_TYPE_META[poll.type]||POLL_TYPE_META.multiple_choice;

  // Name entry
  if(!nameSet&&poll.type!=='qa') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'hsl(42,33%,93%)'}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-sm">
        <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4">{meta.icon}</div>
          <h1 className="font-playfair text-xl font-bold mb-1">{poll.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{meta.label}</p>
          <div className="space-y-3">
            <Input placeholder="Your name (optional)" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setNameSet(true)} autoFocus className="text-center" />
            <Button className="w-full gap-2" onClick={()=>setNameSet(true)}>Join Poll <ArrowRight className="w-4 h-4"/></Button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5"/>{participants} joined</div>
        </div>
      </motion.div>
    </div>
  );

  // Poll closed
  if(poll.status==='closed') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'hsl(42,33%,93%)'}}>
      <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="font-playfair text-xl font-bold mb-2">Poll closed</h2>
        <p className="text-sm text-muted-foreground">This poll is no longer accepting responses.</p>
        {poll.settings?.showResults!==false&&results&&<MiniResults results={results}/>}
      </div>
    </div>
  );

  // Poll paused
  if(poll.status==='paused') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'hsl(42,33%,93%)'}}>
      <div className="text-center"><div className="text-4xl mb-3">⏸️</div><h2 className="font-playfair text-xl font-bold mb-2">Poll paused</h2><p className="text-sm text-muted-foreground">Please wait for the host to resume…</p></div>
    </div>
  );

  // Already voted
  if(voted&&poll.type!=='quiz'&&poll.type!=='qa') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'hsl(42,33%,93%)'}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="w-full max-w-md">
        <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-6 h-6 text-green-600"/></div>
            <h2 className="font-playfair text-xl font-bold">Response recorded!</h2>
            <p className="text-sm text-muted-foreground mt-1">Thank you for participating</p>
          </div>
          {poll.settings?.showResults!==false&&results&&<MiniResults results={results}/>}
        </div>
      </motion.div>
    </div>
  );

  // Q&A
  if(poll.type==='qa') return (
    <div className="min-h-screen p-4" style={{background:'hsl(42,33%,93%)'}}>
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">❓</div>
          <h1 className="font-playfair text-2xl font-bold">{poll.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask a question or upvote existing ones</p>
        </div>
        <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex gap-2">
            <Input placeholder="Type your question…" value={qaText} onChange={e=>setQaText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitQAQ()} />
            <Button onClick={submitQAQ} disabled={!qaText.trim()} size="icon"><Send className="w-4 h-4"/></Button>
          </div>
        </div>
        <div className="space-y-2">
          {[...qaList].sort((a,b)=>b.upvotes-a.upvotes).map(q => (
            <motion.div key={q.id} layout className={`bg-warm-white dark:bg-card border rounded-xl p-4 flex items-start gap-3 shadow-sm ${q.status==='highlighted'?'border-terracotta bg-terracotta/5':'border-clay/30'}`}>
              <button onClick={()=>upvoteQ(q.id)} className="flex flex-col items-center gap-0.5 flex-shrink-0 hover:text-terracotta transition-colors">
                <ThumbsUp className="w-4 h-4"/><span className="text-xs font-bold">{q.upvotes}</span>
              </button>
              <p className="text-sm flex-1">{q.questionText}</p>
              {q.status==='answered'&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Answered</span>}
            </motion.div>
          ))}
          {qaList.length===0&&<div className="text-center py-8 text-muted-foreground text-sm">No questions yet — be the first!</div>}
        </div>
      </div>
    </div>
  );

  // Quiz done
  if(poll.type==='quiz'&&quizDone) {
    const total = poll.quizQuestions?.reduce((a,q)=>a+q.points,0)||1;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'hsl(42,33%,93%)'}}>
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="w-full max-w-sm text-center">
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-playfair text-2xl font-bold mb-2">Quiz complete!</h2>
            <div className="text-4xl font-bold text-terracotta mb-1">{quizScore}</div>
            <p className="text-sm text-muted-foreground">out of {total} points</p>
            <p className="text-sm text-muted-foreground mt-1">{quizCorrect}/{poll.quizQuestions?.length} correct</p>
            <Progress value={(quizScore/total)*100} className="mt-4"/>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active quiz question
  if(poll.type==='quiz') {
    const q = poll.quizQuestions?.[quizStep]; if(!q) return null;
    return (
      <div className="min-h-screen p-4" style={{background:'hsl(42,33%,93%)'}}>
        <div className="max-w-md mx-auto pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{quizStep+1}/{poll.quizQuestions?.length}</span>
            {timer!=null&&<div className={`flex items-center gap-1.5 text-sm font-bold ${timer<=5?'text-red-500':'text-terracotta'}`}><Clock className="w-4 h-4"/>{timer}s</div>}
          </div>
          <Progress value={(quizStep/(poll.quizQuestions?.length||1))*100} className="mb-5"/>
          <motion.div key={q.id} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
            <div className="text-sm font-semibold text-terracotta mb-3">{q.points} pts · {q.timeLimit}s</div>
            <h2 className="font-playfair text-xl font-bold mb-6">{q.questionText}</h2>
            <div className="grid gap-3">
              {q.options.map(opt => (
                <button key={opt.id} onClick={()=>{ if(timerRef.current) clearInterval(timerRef.current); advanceQuiz(quizStep,opt.id); }}
                  className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-terracotta hover:bg-terracotta/5 transition-all font-medium text-sm">
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main vote UI
  const canSubmit = () => {
    if(['multiple_choice','image_choice'].includes(poll.type)) return poll.settings?.multiSelect ? selOpts.length>0 : !!selOpt;
    if(['true_false','emoji_reaction','bracket','countdown_vote','poll_series'].includes(poll.type)) return !!selOpt;
    if(['open_text','word_cloud','fill_blank'].includes(poll.type)) return !!text.trim();
    if(poll.type==='heatmap') return !!heatPt;
    if(poll.type==='rating'||poll.type==='nps') return rating>0;
    return true;
  };

  async function submitQAQ() {
    if(!qaText.trim()||!poll) return;
    await addQAQuestion(poll.id,{questionText:qaText,participantId:pid});
    setQaText(''); toast.success('Question submitted!');
  }
  async function upvoteQ(qid:string) {
    if(!poll) return;
    await upvoteQA(poll.id,qid);
    setQaList(qs=>qs.map(q=>q.id===qid?{...q,upvotes:q.upvotes+1}:q));
  }
  function moveRank(id:string,dir:-1|1) {
    setRanking(r=>{ const idx=r.indexOf(id),next=idx+dir; if(next<0||next>=r.length) return r; const a=[...r]; [a[idx],a[next]]=[a[next],a[idx]]; return a; });
  }

  const allocLeft = 100-Object.values(priority).reduce((a,b)=>a+b,0);

  return (
    <div className="min-h-screen p-4" style={{background:'hsl(42,33%,93%)'}}>
      <div className="max-w-lg mx-auto pt-6">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{meta.icon}</div>
            <h1 className="font-playfair text-2xl font-bold text-foreground">{poll.title}</h1>
            {poll.description&&<p className="text-sm text-muted-foreground mt-1">{poll.description}</p>}
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5"/>{participants} joined</div>
          </div>

          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-6">
            <p className="font-semibold text-foreground mb-5">{poll.question}</p>

            {/* Multiple choice / image_choice */}
            {['multiple_choice','image_choice'].includes(poll.type)&&(
              <div className="space-y-2">
                {poll.options.map(opt=>{
                  const isSel = poll.settings?.multiSelect?selOpts.includes(opt.id):selOpt===opt.id;
                  return (
                    <button key={opt.id} onClick={()=>{
                      if(poll.settings?.multiSelect) setSelOpts(s=>s.includes(opt.id)?s.filter(x=>x!==opt.id):[...s,opt.id]);
                      else setSelOpt(opt.id);
                    }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${isSel?'border-terracotta bg-terracotta/5':'border-border hover:border-terracotta/40'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSel?'border-terracotta bg-terracotta':'border-muted-foreground'}`}>
                        {isSel&&<div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      {opt.imageUrl&&<img src={opt.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0"/>}
                      <span className="text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {poll.type==='true_false'&&(
              <div className="grid grid-cols-2 gap-3">
                {[{id:'true',label:'✅ True',c:'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700'},{id:'false',label:'❌ False',c:'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700'}].map(({id,label,c})=>(
                  <button key={id} onClick={()=>setSelOpt(id)} className={`p-5 rounded-2xl border-2 font-bold text-lg transition-all ${selOpt===id?c+' ring-2 ring-offset-1 ring-current':'border-border hover:border-muted-foreground'}`}>{label}</button>
                ))}
              </div>
            )}

            {/* Word cloud / Open text / Fill blank */}
            {['word_cloud','open_text'].includes(poll.type)&&<Textarea placeholder={poll.type==='word_cloud'?'Type a word or phrase…':'Share your thoughts…'} value={text} onChange={e=>setText(e.target.value)} className="min-h-[100px]" autoFocus/>}
            {poll.type==='fill_blank'&&(
              <div className="space-y-3">
                {poll.settings?.sentence&&<p className="text-sm text-muted-foreground font-medium">{poll.settings.sentence.replace('___','________')}</p>}
                <Input placeholder="Fill in the blank…" value={text} onChange={e=>setText(e.target.value)} autoFocus/>
              </div>
            )}

            {/* Rating */}
            {poll.type==='rating'&&(
              <div className="space-y-4">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setRating(n)} className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${rating===n?'bg-terracotta text-white scale-110 shadow-md':rating>0&&n<=rating?'bg-terracotta/20 text-terracotta':'bg-muted text-muted-foreground hover:bg-terracotta/10'}`}>{n}</button>
                  ))}
                </div>
                {rating>0&&<p className="text-center text-sm font-semibold text-terracotta">Selected: {rating}/10</p>}
              </div>
            )}

            {/* NPS */}
            {poll.type==='nps'&&(
              <div className="space-y-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Not likely</span><span>Extremely likely</span></div>
                <div className="flex gap-1">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setRating(n)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${rating===n?'bg-terracotta text-white shadow-md scale-105':n<=6?'bg-red-100 text-red-600 hover:opacity-80':n<=8?'bg-yellow-100 text-yellow-700 hover:opacity-80':'bg-green-100 text-green-700 hover:opacity-80'}`}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Slider */}
            {poll.type==='slider'&&(
              <div className="space-y-5">
                <Slider min={poll.settings?.min??0} max={poll.settings?.max??100} step={poll.settings?.step??1} value={[slider]} onValueChange={([v])=>setSlider(v)} className="py-4"/>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{poll.settings?.labelLeft??(poll.settings?.min??0)}</span>
                  <span className="text-terracotta font-bold text-lg">{slider}</span>
                  <span>{poll.settings?.labelRight??(poll.settings?.max??100)}</span>
                </div>
              </div>
            )}

            {/* Ranking */}
            {poll.type==='ranking'&&(
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Use arrows to rank (1=top choice)</p>
                {ranking.map((id,idx)=>{
                  const opt=poll.options.find(o=>o.id===id);
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl border border-border">
                      <span className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center flex-shrink-0">{idx+1}</span>
                      <span className="flex-1 text-sm font-medium">{opt?.text}</span>
                      <div className="flex gap-1">
                        <button onClick={()=>moveRank(id,-1)} disabled={idx===0} className="w-7 h-7 rounded-lg border hover:bg-accent transition-colors disabled:opacity-30 text-sm">↑</button>
                        <button onClick={()=>moveRank(id,1)} disabled={idx===ranking.length-1} className="w-7 h-7 rounded-lg border hover:bg-accent transition-colors disabled:opacity-30 text-sm">↓</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Matrix */}
            {poll.type==='matrix'&&(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left py-2 pr-4 text-muted-foreground w-1/3"></th>
                    {poll.settings?.matrixColumns?.map(col=><th key={col.id} className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">{col.label}</th>)}</tr></thead>
                  <tbody>
                    {poll.settings?.matrixRows?.map(row=>(
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="py-3 pr-4 text-sm font-medium">{row.label}</td>
                        {poll.settings?.matrixColumns?.map(col=>(
                          <td key={col.id} className="text-center py-3 px-2">
                            <button onClick={()=>setMatrix(m=>({...m,[row.id]:col.id}))} className={`w-5 h-5 rounded-full border-2 transition-all mx-auto ${matrix[row.id]===col.id?'border-terracotta bg-terracotta':'border-muted-foreground hover:border-terracotta'}`}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Emoji */}
            {poll.type==='emoji_reaction'&&(
              <div className="flex flex-wrap gap-3 justify-center">
                {EMOJIS.map(e=>(
                  <button key={e} onClick={()=>setSelOpt(e)} className={`w-14 h-14 rounded-2xl text-3xl transition-all border-2 ${selOpt===e?'border-terracotta bg-terracotta/10 scale-110 shadow-md':'border-border hover:border-terracotta/50 hover:scale-105'}`}>{e}</button>
                ))}
              </div>
            )}

            {/* Heatmap */}
            {poll.type==='heatmap'&&poll.settings?.imageUrl&&(
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Click on the image to place your vote</p>
                <div className="relative cursor-crosshair rounded-xl overflow-hidden border border-border"
                  onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setHeatPt({x:Math.round(((e.clientX-r.left)/r.width)*100),y:Math.round(((e.clientY-r.top)/r.height)*100)});}}>
                  <img src={poll.settings.imageUrl} alt="" className="w-full object-cover max-h-64"/>
                  {heatPt&&<div className="absolute w-6 h-6 rounded-full bg-terracotta/70 border-2 border-white -translate-x-3 -translate-y-3 pointer-events-none" style={{left:`${heatPt.x}%`,top:`${heatPt.y}%`}}/>}
                </div>
                {heatPt&&<p className="text-xs text-center text-muted-foreground">Placed at ({heatPt.x}%, {heatPt.y}%)</p>}
              </div>
            )}

            {/* Bracket / Countdown / Poll series */}
            {['bracket','countdown_vote','poll_series'].includes(poll.type)&&(
              <div className="space-y-2">
                {poll.options.filter(o=>!o.eliminated).slice(0,poll.type==='bracket'?2:undefined).map(opt=>(
                  <button key={opt.id} onClick={()=>setSelOpt(opt.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${selOpt===opt.id?'border-terracotta bg-terracotta/5':'border-border hover:border-terracotta/40'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selOpt===opt.id?'border-terracotta bg-terracotta':'border-muted-foreground'}`}>{selOpt===opt.id&&<div className="w-2 h-2 rounded-full bg-white m-auto"/>}</div>
                    <span className="text-sm font-medium">{opt.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Prioritization */}
            {poll.type==='prioritization'&&(
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Allocate 100 points</span><span className={`font-bold ${allocLeft<0?'text-red-500':allocLeft===0?'text-green-600':'text-terracotta'}`}>{allocLeft} left</span></div>
                {poll.options.map(opt=>(
                  <div key={opt.id} className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-sm font-medium">{opt.text}</span><span className="text-sm font-bold text-terracotta">{priority[opt.id]??0}</span></div>
                    <input type="range" min={0} max={100} value={priority[opt.id]??0} onChange={e=>setPriority(a=>({...a,[opt.id]:Number(e.target.value)}))} className="w-full accent-terracotta"/>
                  </div>
                ))}
              </div>
            )}

            {/* Live matching */}
            {poll.type==='live_matching'&&(
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Match each left item to the right</p>
                {poll.settings?.matchingPairs?.map(pair=>{
                  const allRight = poll.settings?.matchingPairs?.map(p=>p.right)||[];
                  return (
                    <div key={pair.id} className="flex items-center gap-3">
                      <div className="flex-1 p-3 bg-accent/50 rounded-xl border border-border text-sm font-medium">{pair.left}</div>
                      <span className="text-muted-foreground">→</span>
                      <select value={matching[pair.id]||''} onChange={e=>setMatching(m=>({...m,[pair.id]:e.target.value}))} className="flex-1 p-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select…</option>
                        {allRight.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            <Button className="w-full mt-6 gap-2" size="lg" disabled={submitting||!canSubmit()} onClick={submitVote}>
              <Send className="w-4 h-4"/>{submitting?'Submitting…':'Submit Vote'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MiniResults({ results }: { results: PollResults }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 mb-2"><BarChart2 className="w-4 h-4 text-terracotta"/><span className="text-sm font-semibold">Live Results</span><span className="text-xs text-muted-foreground ml-auto">{results.participants} votes</span></div>
      {results.options?.map(opt=>(
        <div key={opt.id}>
          <div className="flex justify-between text-xs mb-1"><span className="font-medium">{opt.text}</span><span>{opt.pct}%</span></div>
          <Progress value={opt.pct} className="h-2"/>
        </div>
      ))}
      {results.average!=null&&<div className="text-center p-3 bg-accent/50 rounded-xl"><div className="text-2xl font-bold text-terracotta">{results.average}</div><div className="text-xs text-muted-foreground">Average</div></div>}
    </div>
  );
}
