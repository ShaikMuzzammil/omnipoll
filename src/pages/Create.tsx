import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import { createPoll } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { PollType } from '@/lib/types';

const STEPS = ['Type','Question','Options','Settings','Review'];

function genId() {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

interface Opt { id: string; text: string; }
interface QQ { id:string; questionText:string; options:Opt[]; correctAnswer:string; points:number; timeLimit:number; }
interface MR { id:string; label:string; }
interface MP { id:string; left:string; right:string; }

const TYPE_GROUPS = [
  { label:'Free',    types:['multiple_choice','word_cloud','qa','quiz','rating'] as PollType[] },
  { label:'Starter', types:['true_false','emoji_reaction','open_text','nps','matrix','image_choice','ranking'] as PollType[] },
  { label:'Pro',     types:['slider','fill_blank','bracket','prioritization','heatmap','live_matching','poll_series','countdown_vote'] as PollType[] },
];

export default function Create() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<PollType>('multiple_choice');
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Opt[]>([{ id:genId(), text:'Option A' },{ id:genId(), text:'Option B' }]);
  const [quizQs, setQuizQs] = useState<QQ[]>([{
    id:genId(), questionText:'Question 1',
    options:[{id:genId(),text:'A'},{id:genId(),text:'B'},{id:genId(),text:'C'},{id:genId(),text:'D'}],
    correctAnswer:'', points:10, timeLimit:20
  }]);
  const [matrixRows, setMatrixRows] = useState<MR[]>([{id:genId(),label:'Row 1'},{id:genId(),label:'Row 2'}]);
  const [matrixCols, setMatrixCols] = useState<MR[]>([{id:genId(),label:'Agree'},{id:genId(),label:'Neutral'},{id:genId(),label:'Disagree'}]);
  const [matchPairs, setMatchPairs] = useState<MP[]>([{id:genId(),left:'Item 1',right:'Match 1'},{id:genId(),left:'Item 2',right:'Match 2'}]);
  const [sentence, setSentence] = useState('The best way to learn is ___.');
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [heatmapUrl, setHeatmapUrl] = useState('https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80');
  const [duration, setDuration] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [oneVote, setOneVote] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const meta = POLL_TYPE_META[type];
  const needsOptions = !['word_cloud','open_text','qa','rating','nps','slider','fill_blank','heatmap','matrix','live_matching','emoji_reaction','quiz'].includes(type);

  const addOpt = () => setOptions(o => [...o, { id:genId(), text:`Option ${String.fromCharCode(65+o.length)}` }]);
  const removeOpt = (id:string) => setOptions(o => o.filter(x => x.id !== id));
  const updateOpt = (id:string, text:string) => setOptions(o => o.map(x => x.id===id ? {...x,text} : x));

  const handleCreate = async () => {
    if (!question.trim()) { toast.error('Question is required'); return; }
    setSaving(true);
    try {
      const body = {
        title: question, question, description, type,
        creatorId: user?.id || '',
        options: needsOptions ? options : [],
        quizQuestions: type === 'quiz' ? quizQs : [],
        settings: {
          duration: duration ? Number(duration) : null,
          multiSelect, showResults, oneVote,
          min: sliderMin, max: sliderMax,
          sentence,
          matrixRows: type==='matrix' ? matrixRows : [],
          matrixColumns: type==='matrix' ? matrixCols : [],
          matchingPairs: type==='live_matching' ? matchPairs : [],
          imageUrl: type==='heatmap' ? heatmapUrl : undefined,
        },
      };
      const data = await createPoll(body) as { poll: { id:string } };
      toast.success('Poll created! 🎉');
      navigate(`/present/${data.poll.id}`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed to create'); }
    finally { setSaving(false); }
  };

  // ── Step 0: Type ──
  const TypeStep = () => (
    <div className="space-y-5">
      <div><h2 className="font-playfair text-xl font-bold mb-1">Choose poll type</h2>
        <p className="text-sm text-muted-foreground">Select the interaction style for your audience</p></div>
      {TYPE_GROUPS.map(({ label, types }) => (
        <div key={label}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {types.map(t => {
              const m = POLL_TYPE_META[t], active = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    active ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta' : 'border-border hover:border-terracotta/40 hover:bg-accent'
                  }`}>
                  <span className="text-xl">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-terracotta flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 1: Question ──
  const QuestionStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl">
        <span className="text-3xl">{meta.icon}</span>
        <div><div className="font-semibold">{meta.label}</div><div className="text-xs text-muted-foreground">{meta.desc}</div></div>
      </div>
      <div className="space-y-1.5">
        <Label>Question / Title *</Label>
        <Textarea placeholder="What do you want to ask your audience?" value={question} onChange={e => setQuestion(e.target.value)} className="min-h-[80px]" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Description (optional)</Label>
        <Input placeholder="Add context or instructions…" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
    </div>
  );

  // ── Step 2: Options ──
  const OptionsStep = () => {
    if (['word_cloud','open_text','qa','rating','nps','heatmap'].includes(type))
      return <p className="text-sm text-muted-foreground italic py-4">No options needed — participants enter free-form responses.</p>;

    if (type === 'slider') return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Min value</Label><Input type="number" value={sliderMin} onChange={e=>setSliderMin(Number(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Max value</Label><Input type="number" value={sliderMax} onChange={e=>setSliderMax(Number(e.target.value))} /></div>
      </div>
    );

    if (type === 'fill_blank') return (
      <div className="space-y-1.5">
        <Label>Sentence with blank (use ___ for the gap)</Label>
        <Input value={sentence} onChange={e=>setSentence(e.target.value)} placeholder="The best way to learn is ___." />
      </div>
    );

    if (type === 'heatmap') return (
      <div className="space-y-1.5">
        <Label>Image URL</Label>
        <Input value={heatmapUrl} onChange={e=>setHeatmapUrl(e.target.value)} />
        {heatmapUrl && <img src={heatmapUrl} alt="" className="rounded-lg max-h-48 object-cover w-full" />}
      </div>
    );

    if (type === 'matrix') return (
      <div className="space-y-4">
        <div><Label className="mb-2 block">Rows</Label>
          {matrixRows.map((r,i) => (
            <div key={r.id} className="flex gap-2 mb-2">
              <Input value={r.label} onChange={e=>setMatrixRows(rows=>rows.map(x=>x.id===r.id?{...x,label:e.target.value}:x))} placeholder={`Row ${i+1}`} />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setMatrixRows(rows=>rows.filter(x=>x.id!==r.id))}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={()=>setMatrixRows(r=>[...r,{id:genId(),label:`Row ${r.length+1}`}])}>+ Row</Button>
        </div>
        <div><Label className="mb-2 block">Columns</Label>
          {matrixCols.map((c,i) => (
            <div key={c.id} className="flex gap-2 mb-2">
              <Input value={c.label} onChange={e=>setMatrixCols(cols=>cols.map(x=>x.id===c.id?{...x,label:e.target.value}:x))} placeholder={`Col ${i+1}`} />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setMatrixCols(cols=>cols.filter(x=>x.id!==c.id))}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={()=>setMatrixCols(c=>[...c,{id:genId(),label:`Col ${c.length+1}`}])}>+ Column</Button>
        </div>
      </div>
    );

    if (type === 'live_matching') return (
      <div className="space-y-3">
        <Label>Matching Pairs</Label>
        {matchPairs.map((p,i) => (
          <div key={p.id} className="flex gap-2 items-center">
            <Input value={p.left} onChange={e=>setMatchPairs(ps=>ps.map(x=>x.id===p.id?{...x,left:e.target.value}:x))} placeholder={`Left ${i+1}`} />
            <span className="text-muted-foreground">→</span>
            <Input value={p.right} onChange={e=>setMatchPairs(ps=>ps.map(x=>x.id===p.id?{...x,right:e.target.value}:x))} placeholder={`Right ${i+1}`} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setMatchPairs(ps=>ps.filter(x=>x.id!==p.id))}><Trash2 className="w-4 h-4"/></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={()=>setMatchPairs(p=>[...p,{id:genId(),left:`Item ${p.length+1}`,right:`Match ${p.length+1}`}])}>+ Pair</Button>
      </div>
    );

    if (type === 'emoji_reaction') return (
      <div><p className="text-sm text-muted-foreground mb-3">Participants choose from these emojis:</p>
        <div className="flex flex-wrap gap-3">
          {['😄','😂','❤️','👏','🔥','😮','😢','👍','🚀','🎉'].map(e=>(
            <div key={e} className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-2xl">{e}</div>
          ))}
        </div>
      </div>
    );

    if (type === 'quiz') return (
      <div className="space-y-4">
        {quizQs.map((q,qi) => (
          <div key={q.id} className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Q{qi+1}</span>
              <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={()=>setQuizQs(qs=>qs.filter(x=>x.id!==q.id))}><Trash2 className="w-3.5 h-3.5"/></Button>
            </div>
            <Input value={q.questionText} onChange={e=>setQuizQs(qs=>qs.map(x=>x.id===q.id?{...x,questionText:e.target.value}:x))} placeholder="Quiz question…" />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map(o => (
                <div key={o.id} className={`flex gap-1.5 items-center p-2 rounded-lg border cursor-pointer ${q.correctAnswer===o.id?'border-green-500 bg-green-50 dark:bg-green-950/30':'border-border'}`}
                  onClick={()=>setQuizQs(qs=>qs.map(x=>x.id===q.id?{...x,correctAnswer:o.id}:x))}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${q.correctAnswer===o.id?'border-green-500 bg-green-500':'border-muted-foreground'}`}/>
                  <Input value={o.text} className="border-0 p-0 h-auto bg-transparent text-xs focus-visible:ring-0"
                    onChange={e=>setQuizQs(qs=>qs.map(x=>x.id===q.id?{...x,options:x.options.map(op=>op.id===o.id?{...op,text:e.target.value}:op)}:x))} />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1"><Label className="text-xs">Points</Label><Input type="number" value={q.points} onChange={e=>setQuizQs(qs=>qs.map(x=>x.id===q.id?{...x,points:Number(e.target.value)}:x))}/></div>
              <div className="flex-1 space-y-1"><Label className="text-xs">Time (s)</Label><Input type="number" value={q.timeLimit} onChange={e=>setQuizQs(qs=>qs.map(x=>x.id===q.id?{...x,timeLimit:Number(e.target.value)}:x))}/></div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={()=>setQuizQs(qs=>[...qs,{id:genId(),questionText:`Q${qs.length+1}`,options:['A','B','C','D'].map(l=>({id:genId(),text:`Answer ${l}`})),correctAnswer:'',points:10,timeLimit:20}])}>+ Question</Button>
      </div>
    );

    return (
      <div className="space-y-3">
        <Label>Options</Label>
        {options.map((opt,i) => (
          <div key={opt.id} className="flex gap-2 items-center">
            <Input value={opt.text} onChange={e=>updateOpt(opt.id,e.target.value)} placeholder={`Option ${i+1}`} />
            {options.length > 2 && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>removeOpt(opt.id)}><Trash2 className="w-4 h-4 text-muted-foreground"/></Button>}
          </div>
        ))}
        {options.length < 10 && <Button variant="outline" size="sm" onClick={addOpt} className="gap-1.5"><Plus className="w-4 h-4"/>Add option</Button>}
      </div>
    );
  };

  // ── Step 3: Settings ──
  const SettingsStep = () => (
    <div className="space-y-4">
      {[
        { label:'Show live results', desc:'Participants see results while voting', val:showResults, set:setShowResults },
        { label:'One vote per person', desc:'Prevent duplicate submissions', val:oneVote, set:setOneVote },
      ].map(({ label, desc, val, set }) => (
        <div key={label} className="flex items-center justify-between py-3 border-b border-border">
          <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
          <Switch checked={val} onCheckedChange={set} />
        </div>
      ))}
      {['multiple_choice','image_choice'].includes(type) && (
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div><div className="text-sm font-medium">Allow multiple selections</div><div className="text-xs text-muted-foreground">Pick more than one option</div></div>
          <Switch checked={multiSelect} onCheckedChange={setMultiSelect} />
        </div>
      )}
      <div className="space-y-1.5 py-3">
        <Label>Auto-close after (seconds, optional)</Label>
        <Input type="number" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 60" className="max-w-[160px]" />
      </div>
    </div>
  );

  // ── Step 4: Review ──
  const ReviewStep = () => (
    <div className="space-y-4">
      <div className="p-4 bg-accent/50 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{meta.icon}</span>
          <div><div className="font-semibold">{meta.label}</div>
            <div className="font-playfair text-lg font-bold mt-0.5">{question}</div></div>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {needsOptions && options.length > 0 && (
        <div className="space-y-1">
          {options.map(o => <div key={o.id} className="text-sm py-1.5 px-3 bg-card border border-border rounded-lg">{o.text}</div>)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-card border border-border rounded-lg"><div className="text-xs text-muted-foreground mb-0.5">Show results</div><div className="font-medium">{showResults?'Yes':'No'}</div></div>
        <div className="p-3 bg-card border border-border rounded-lg"><div className="text-xs text-muted-foreground mb-0.5">One vote</div><div className="font-medium">{oneVote?'Yes':'No'}</div></div>
        {duration && <div className="p-3 bg-card border border-border rounded-lg"><div className="text-xs text-muted-foreground mb-0.5">Duration</div><div className="font-medium">{duration}s</div></div>}
      </div>
    </div>
  );

  const STEP_CONTENT = [TypeStep, QuestionStep, OptionsStep, SettingsStep, ReviewStep];
  const CurrentStep = STEP_CONTENT[step];

  return (
    <DashboardLayout title="Create Poll">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s,i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i<step?'bg-terracotta text-white':i===step?'bg-terracotta text-white ring-4 ring-terracotta/20':'bg-muted text-muted-foreground'
                }`}>
                  {i<step?<Check className="w-4 h-4"/>:i+1}
                </div>
                {i<STEPS.length-1 && <div className={`h-0.5 mx-1 transition-all ${i<step?'bg-terracotta':'bg-border'}`} style={{width:'40px'}}/>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">{STEPS.map(s=><span key={s}>{s}</span>)}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:0.15}}
            className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm min-h-[300px]">
            <CurrentStep />
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="gap-2">
            <ChevronLeft className="w-4 h-4"/>Back
          </Button>
          {step < STEPS.length-1 ? (
            <Button onClick={()=>setStep(s=>s+1)} disabled={step===1 && !question.trim()} className="gap-2">
              Next<ChevronRight className="w-4 h-4"/>
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Sparkles className="w-4 h-4"/>{saving?'Creating…':'Create Poll'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
