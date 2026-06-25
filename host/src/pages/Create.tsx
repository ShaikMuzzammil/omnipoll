import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Loader2,
  Copy, ChevronDown, ChevronUp, Shuffle, Timer, AlertTriangle,
  GripVertical, Star, BarChart3, MessageSquare, Users, Zap,
  Image, List, Hash, Type, Sliders, Grid3x3, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi } from '@/lib/api';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType, PollSettings } from '@/lib/types';

/* ── Types & constants ──────────────────────────────────────────────────────── */
const ALL_TYPES: { type: PollType; icon: string; label: string; category: string; description: string }[] = [
  { type:'multiple_choice', icon:'☑️',  label:'Multiple Choice',    category:'Quiz',    description:'Single correct answer with options A-D' },
  { type:'quiz',            icon:'🧠',  label:'Quiz',               category:'Quiz',    description:'Scored quiz with timer and negative marking' },
  { type:'true_false',      icon:'✅',  label:'True / False',       category:'Quiz',    description:'Binary choice — yes/no or true/false' },
  { type:'fill_blank',      icon:'✏️',  label:'Fill in Blank',      category:'Quiz',    description:'Complete the sentence with the correct word' },
  { type:'matching',        icon:'🔗',  label:'Live Matching',      category:'Quiz',    description:'Match pairs from two columns' },
  { type:'image_choice',    icon:'🖼️',  label:'Image Choice',       category:'Quiz',    description:'Pick from image-based answer options' },
  { type:'word_cloud',      icon:'☁️',  label:'Word Cloud',         category:'Engage',  description:'Free text — visualised as live word cloud' },
  { type:'qa',              icon:'💬',  label:'Q&A Session',        category:'Engage',  description:'Audience questions with upvoting' },
  { type:'open_ended',      icon:'📝',  label:'Open Ended',         category:'Engage',  description:'Free text response' },
  { type:'emoji',           icon:'😍',  label:'Emoji Reactions',    category:'Engage',  description:'Express mood or opinion with emojis' },
  { type:'nps',             icon:'📊',  label:'NPS Score',          category:'Survey',  description:'Net Promoter Score 0-10 scale' },
  { type:'rating',          icon:'⭐',  label:'Star Rating',        category:'Survey',  description:'1-5 star satisfaction rating' },
  { type:'slider',          icon:'🎚️',  label:'Slider',             category:'Survey',  description:'Numeric range input on a slider' },
  { type:'ranking',         icon:'🏆',  label:'Ranking',            category:'Survey',  description:'Drag to rank options from best to worst' },
  { type:'matrix',          icon:'🔲',  label:'Matrix Grid',        category:'Survey',  description:'Rate multiple items across multiple dimensions' },
  { type:'priority',        icon:'💯',  label:'100-Point Priority', category:'Survey',  description:'Allocate 100 points across competing options' },
  { type:'heatmap',         icon:'🎯',  label:'Heatmap Click',      category:'Visual',  description:'Click on a specific area of an image' },
  { type:'bracket',         icon:'🏅',  label:'Bracket Vote',       category:'Visual',  description:'Tournament-style elimination voting' },
  { type:'countdown',       icon:'⏱️',  label:'Countdown Timer',    category:'Visual',  description:'Timed announcement or event countdown' },
  { type:'series',          icon:'📋',  label:'Poll Series',        category:'Visual',  description:'Multiple questions in sequence' },
];

const CATEGORIES = ['All', 'Quiz', 'Engage', 'Survey', 'Visual'];

interface Option { id:string; text:string; isCorrect:boolean; points:number; imageUrl?:string; explanation?:string }
interface Question {
  id:string; title:string; description?:string; type:PollType;
  options:Option[]; timeLimit?:number; points:number;
  shuffleOptions:boolean; required:boolean; explanation?:string;
  matrixRows?:{id:string;text:string}[]; matrixCols?:{id:string;text:string}[];
  matchPairs?:{id:string;left:string;right:string}[];
  sliderMin?:number; sliderMax?:number; sliderStep?:number;
  fillBlankAnswer?:string;
}

const newOpt = (i:number): Option => ({ id:`${Date.now()}-${i}`, text:'', isCorrect:false, points:0 });
const newQ = (type:PollType='multiple_choice'): Question => ({
  id:Date.now().toString(), title:'', type, options:[newOpt(0),newOpt(1),newOpt(2),newOpt(3)],
  points:1, shuffleOptions:false, required:true,
  matrixRows:[{id:'r1',text:''},{id:'r2',text:''}],
  matrixCols:[{id:'c1',text:''},{id:'c2',text:''}],
  matchPairs:[{id:'p1',left:'',right:''},{id:'p2',left:'',right:''}],
  sliderMin:0, sliderMax:100, sliderStep:1,
});

const DEFAULT_SETTINGS: PollSettings = {
  allowAnonymous:true, requireLogin:false, oneResponsePerUser:true,
  showResultsLive:true, showCorrectAnswers:true, showKeySheetAfter:true,
  shuffleOptions:false, shuffleQuestions:false, preventTabSwitch:true,
  showProgressBar:true, allowReview:true, pointsPerQuestion:1,
};

const STEPS = ['Type','Questions','Settings','Preview'];

/* ── Type-specific settings config ──────────────────────────────────────────── */
const TYPE_SETTINGS: Record<string, { label:string; fields:string[] }> = {
  quiz:            { label:'Quiz Settings',    fields:['timer','points','negative','shuffle','fullscreen','tabDetect','passingScore'] },
  multiple_choice: { label:'Poll Settings',    fields:['timer','shuffle','anonymous','liveResults'] },
  true_false:      { label:'T/F Settings',     fields:['timer','points','explanation'] },
  fill_blank:      { label:'Fill Blank',       fields:['caseSensitive','timer','points'] },
  word_cloud:      { label:'Word Cloud',       fields:['maxWords','anonymous','liveResults'] },
  qa:              { label:'Q&A Settings',     fields:['moderation','upvoting','anonymous'] },
  nps:             { label:'NPS Settings',     fields:['showAverage','anonymous','required'] },
  rating:          { label:'Rating Settings',  fields:['maxStars','showAverage','anonymous'] },
  slider:          { label:'Slider Settings',  fields:['min','max','step','showAverage'] },
  ranking:         { label:'Ranking Settings', fields:['shuffle','anonymous'] },
  matrix:          { label:'Matrix Settings',  fields:['shuffle','anonymous','required'] },
  heatmap:         { label:'Heatmap',          fields:['imageUrl','gridSize','anonymous'] },
  emoji:           { label:'Emoji Settings',   fields:['customEmojis','anonymous','liveResults'] },
  open_ended:      { label:'Open Ended',       fields:['minLength','maxLength','anonymous'] },
};

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function Create({ editMode=false }: { editMode?:boolean }) {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const { pollId } = useParams();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState('All');

  const [pollType, setPollType] = useState<PollType>((params.get('type') as PollType) ?? 'quiz');
  const [title, setTitle]       = useState('');
  const [desc,  setDesc]        = useState('');
  const [questions, setQuestions] = useState<Question[]>([newQ('quiz')]);
  const [activeQ, setActiveQ]     = useState(0);
  const [settings, setSettings]   = useState<PollSettings>(DEFAULT_SETTINGS);
  const [classroomId, setClassroomId] = useState('');
  const [extraSettings, setExtra] = useState<Record<string,any>>({
    passingScore:60, maxStars:5, minWords:1, maxWords:100,
    caseSensitive:false, moderation:true, upvoting:true,
    imageUrl:'', gridSize:10, fullscreenMode:false,
    negativeMarking:false, penaltyPoints:0.25,
  });

  useEffect(() => {
    if (editMode && pollId) {
      pollsApi.get(pollId).then((p:any) => {
        setTitle(p.title); setDesc(p.description??'');
        setPollType(p.type); setSettings(p.settings??DEFAULT_SETTINGS);
        if (p.questions?.length) setQuestions(p.questions);
        else setQuestions([{...newQ(p.type), options:p.options??[]}]);
      }).catch(()=>toast.error('Failed to load'));
    }
  },[editMode,pollId]);

  /* ── Question helpers ── */
  const addQ    = () => { setQuestions(qs=>[...qs,newQ(pollType)]); setActiveQ(questions.length); };
  const removeQ = (i:number) => { if(questions.length===1)return; setQuestions(qs=>qs.filter((_,j)=>j!==i)); setActiveQ(Math.max(0,i-1)); };
  const dupQ    = (i:number) => { const q={...questions[i],id:Date.now().toString()}; setQuestions(qs=>[...qs.slice(0,i+1),q,...qs.slice(i+1)]); };
  const moveQ   = (from:number,to:number) => { if(to<0||to>=questions.length)return; const qs=[...questions]; [qs[from],qs[to]]=[qs[to],qs[from]]; setQuestions(qs); setActiveQ(to); };
  const updateQ = (i:number,patch:Partial<Question>) => setQuestions(qs=>qs.map((q,j)=>j===i?{...q,...patch}:q));

  const addOpt  = (qi:number) => setQuestions(qs=>qs.map((q,j)=>j===qi?{...q,options:[...q.options,newOpt(q.options.length)]}:q));
  const removeOpt=(qi:number,oi:number)=>setQuestions(qs=>qs.map((q,j)=>j===qi&&q.options.length>2?{...q,options:q.options.filter((_,k)=>k!==oi)}:q));
  const updateOpt=(qi:number,oi:number,patch:Partial<Option>)=>setQuestions(qs=>qs.map((q,j)=>j===qi?{...q,options:q.options.map((o,k)=>k===oi?{...o,...patch}:o)}:q));
  const setCorrect=(qi:number,oi:number)=>setQuestions(qs=>qs.map((q,j)=>j===qi?{...q,options:q.options.map((o,k)=>({...o,isCorrect:k===oi}))}:q));
  const toggleCorrect=(qi:number,oi:number)=>setQuestions(qs=>qs.map((q,j)=>j===qi?{...q,options:q.options.map((o,k)=>k===oi?{...o,isCorrect:!o.isCorrect}:o)}:q));

  const isQuiz    = ['quiz','multiple_choice','true_false','image_choice','fill_blank','matching'].includes(pollType);
  const isMultiQ  = ['quiz','series'].includes(pollType);
  const needsOpts = !['word_cloud','qa','nps','slider','heatmap','countdown','open_ended'].includes(pollType);

  const q = questions[activeQ] ?? questions[0];

  const handleSubmit = async () => {
    if(!title.trim()){toast.error('Add a title');return;}
    if(questions.some(q=>!q.title.trim())){toast.error('All questions need titles');return;}
    setLoading(true);
    try {
      const allOptions = questions[0]?.options?.filter(o=>o.text.trim())??[];
      const payload = {
        title, description:desc, type:pollType,
        questions:isMultiQ?questions.map(q=>({...q,options:q.options.filter(o=>o.text.trim())})):undefined,
        options:allOptions, settings:{...settings,...extraSettings},
        classroomId:classroomId||undefined,
        matrixRows:pollType==='matrix'?q.matrixRows:undefined,
        matrixCols:pollType==='matrix'?q.matrixCols:undefined,
      };
      const res:any = editMode&&pollId ? await pollsApi.update(pollId,payload) : await pollsApi.create(payload);
      toast.success(editMode?'Poll updated!':'Poll created! 🎉');
      navigate(`/results/${res.id||pollId}`);
    } catch(e:any){ toast.error(e.message??'Failed'); }
    finally { setLoading(false); }
  };

  const filteredTypes = ALL_TYPES.filter(t=>catFilter==='All'||t.category===catFilter);

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-800">{editMode?'Edit Poll':'Create Poll'}</h1>
        {/* Steps */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s,i)=>(
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <button onClick={()=>i<step&&setStep(i)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i<step?'bg-green-500 text-white cursor-pointer':i===step?'bg-terracotta-500 text-white':'bg-cream-300 text-slate-500'}`}>
                {i<step?<Check size={13}/>:i+1}
              </button>
              <span className={`text-xs font-medium ${i===step?'text-terracotta-700':'text-slate-400'}`}>{s}</span>
              {i<STEPS.length-1&&<div className={`flex-1 h-0.5 rounded ${i<step?'bg-green-300':'bg-cream-300'}`}/>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 0: Type selection ── */}
        {step===0&&(
          <motion.div key="s0" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="op-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-slate-800">Choose a poll type</h2>
              <div className="flex gap-1">
                {CATEGORIES.map(cat=>(
                  <button key={cat} onClick={()=>setCatFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${catFilter===cat?'bg-terracotta-500 text-white':'bg-cream-100 text-slate-600 hover:bg-cream-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {filteredTypes.map(t=>(
                <motion.button key={t.type} onClick={()=>{setPollType(t.type);setQuestions([newQ(t.type)]);}}
                  whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                    pollType===t.type?'border-terracotta-500 bg-terracotta-50 shadow-md':'border-cream-200 bg-cream-50 hover:border-terracotta-200 hover:bg-white'}`}>
                  {pollType===t.type&&(
                    <motion.div initial={{scale:0}} animate={{scale:1}}
                      className="absolute top-2 right-2 w-4 h-4 bg-terracotta-500 rounded-full flex items-center justify-center">
                      <Check size={9} className="text-white"/>
                    </motion.div>
                  )}
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{t.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{t.description}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    t.category==='Quiz'?'bg-blue-100 text-blue-600':
                    t.category==='Engage'?'bg-green-100 text-green-600':
                    t.category==='Survey'?'bg-purple-100 text-purple-600':'bg-orange-100 text-orange-600'}`}>
                    {t.category}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Questions ── */}
        {step===1&&(
          <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="space-y-4">
            {/* Title + description */}
            <div className="op-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm bg-cream-100 px-3 py-2 rounded-xl">
                <span className="text-xl">{pollTypeIcon(pollType)}</span>
                <span className="font-semibold text-terracotta-700">{pollTypeLabel(pollType)}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  ALL_TYPES.find(t=>t.type===pollType)?.category==='Quiz'?'bg-blue-100 text-blue-600':
                  ALL_TYPES.find(t=>t.type===pollType)?.category==='Survey'?'bg-purple-100 text-purple-600':'bg-green-100 text-green-600'}`}>
                  {ALL_TYPES.find(t=>t.type===pollType)?.category}
                </span>
              </div>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Poll / Quiz title *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white placeholder-slate-400"/>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description / instructions (optional)" rows={2}
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white resize-none placeholder-slate-400"/>
            </div>

            <div className={`grid gap-4 ${isMultiQ?'lg:grid-cols-[220px_1fr]':'grid-cols-1'}`}>
              {/* Question list (multi-Q only) */}
              {isMultiQ&&(
                <div className="op-card p-3 space-y-1 h-fit max-h-[500px] overflow-y-auto">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mb-2">Questions ({questions.length})</p>
                  {questions.map((q2,i)=>(
                    <div key={q2.id} onClick={()=>setActiveQ(i)}
                      className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all group ${activeQ===i?'bg-terracotta-500 text-white':'hover:bg-cream-100 text-slate-700'}`}>
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activeQ===i?'bg-white/30':'bg-cream-200 text-slate-600'}`}>{i+1}</span>
                      <span className="text-xs truncate flex-1">{q2.title||`Question ${i+1}`}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                        <button onClick={e=>{e.stopPropagation();moveQ(i,i-1);}} disabled={i===0} className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronUp size={10}/></button>
                        <button onClick={e=>{e.stopPropagation();moveQ(i,i+1);}} disabled={i===questions.length-1} className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronDown size={10}/></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addQ}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-terracotta-600 hover:bg-terracotta-50 border border-dashed border-terracotta-300 rounded-xl py-2.5 transition-all mt-2">
                    <Plus size={13}/> Add Question
                  </button>
                </div>
              )}

              {/* Question editor */}
              <div className="op-card p-5 space-y-4">
                {isMultiQ&&(
                  <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                    <span className="text-sm font-bold text-slate-600">Q{activeQ+1} of {questions.length}</span>
                    <div className="flex gap-1.5">
                      <button onClick={()=>dupQ(activeQ)} title="Duplicate"
                        className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Copy size={13}/></button>
                      <button onClick={()=>removeQ(activeQ)} disabled={questions.length===1} title="Delete"
                        className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  </div>
                )}

                {/* Question title */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Question {isMultiQ?activeQ+1:''}</label>
                  <input value={q.title} onChange={e=>updateQ(activeQ,{title:e.target.value})}
                    placeholder={pollType==='fill_blank'?'The capital of France is ___ (use ___ for blank)':'Enter your question *'}
                    className="w-full px-3.5 py-2.5 border-2 border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 bg-white font-medium transition-all"/>
                  {pollType==='fill_blank'&&(
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1"><AlertTriangle size={11}/> Use ___ (3 underscores) to mark the blank</p>
                  )}
                </div>

                {/* Per-question settings row */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Time (s)</label>
                    <input type="number" min={0} max={300} value={q.timeLimit??''}
                      onChange={e=>updateQ(activeQ,{timeLimit:Number(e.target.value)||undefined})}
                      placeholder="∞"
                      className="w-20 px-2.5 py-1.5 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200 text-center"/>
                  </div>
                  {isQuiz&&(
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Points</label>
                      <input type="number" min={0} max={100} value={q.points??1}
                        onChange={e=>updateQ(activeQ,{points:Number(e.target.value)})}
                        className="w-20 px-2.5 py-1.5 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200 text-center"/>
                    </div>
                  )}
                  <div className="flex items-end">
                    <button onClick={()=>updateQ(activeQ,{shuffleOptions:!q.shuffleOptions})}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${q.shuffleOptions?'bg-terracotta-50 border-terracotta-300 text-terracotta-700':'border-cream-300 text-slate-500 hover:border-terracotta-200'}`}>
                      <Shuffle size={11}/> Shuffle
                    </button>
                  </div>
                  <div className="flex items-end">
                    <button onClick={()=>updateQ(activeQ,{required:!q.required})}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${q.required?'bg-green-50 border-green-300 text-green-700':'border-cream-300 text-slate-500 hover:border-green-200'}`}>
                      <Check size={11}/> Required
                    </button>
                  </div>
                </div>

                {/* ── Type-specific content ── */}

                {/* MCQ / Quiz / TF / Image */}
                {needsOpts&&pollType!=='matrix'&&pollType!=='matching'&&(
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                        <List size={12}/> Options
                        {isQuiz&&<span className="text-slate-400 font-normal normal-case ml-1">— click ○ to mark correct</span>}
                      </label>
                      <span className="text-xs text-slate-400">{q.options.filter(o=>o.text).length} filled</span>
                    </div>
                    {q.options.map((opt,oi)=>(
                      <motion.div key={opt.id} layout
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${opt.isCorrect?'bg-green-50 border-green-200':'bg-white border-cream-200 hover:border-cream-300'}`}>
                        <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab"/>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${opt.isCorrect?'bg-green-500 text-white':'bg-cream-200 text-slate-600'}`}>
                          {String.fromCharCode(65+oi)}
                        </span>
                        {isQuiz&&(
                          <button onClick={()=>['quiz','true_false'].includes(pollType)?setCorrect(activeQ,oi):toggleCorrect(activeQ,oi)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${opt.isCorrect?'bg-green-500 border-green-500':'border-slate-300 hover:border-green-400'}`}>
                            {opt.isCorrect&&<Check size={10} className="text-white"/>}
                          </button>
                        )}
                        <input value={opt.text} onChange={e=>updateOpt(activeQ,oi,{text:e.target.value})}
                          placeholder={`Option ${String.fromCharCode(65+oi)}`}
                          className={`flex-1 text-sm focus:outline-none bg-transparent ${opt.isCorrect?'font-semibold text-green-800':'text-slate-700'}`}/>
                        {isQuiz&&pollType==='quiz'&&(
                          <input type="number" min={0} value={opt.points??0} onChange={e=>updateOpt(activeQ,oi,{points:Number(e.target.value)})}
                            placeholder="pts" className="w-14 text-xs text-center px-1.5 py-1 border border-cream-200 rounded-lg bg-white focus:outline-none"/>
                        )}
                        {opt.isCorrect&&<span className="text-xs text-green-600 font-bold flex-shrink-0">✓</span>}
                        {q.options.length>2&&(
                          <button onClick={()=>removeOpt(activeQ,oi)} className="p-1 hover:bg-red-100 rounded text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 size={12}/></button>
                        )}
                      </motion.div>
                    ))}
                    <button onClick={()=>addOpt(activeQ)}
                      className="flex items-center gap-1.5 text-xs text-terracotta-600 hover:text-terracotta-700 font-semibold mt-1 px-1 py-1 hover:bg-terracotta-50 rounded-lg transition-colors">
                      <Plus size={13}/> Add Option
                    </button>
                    {isQuiz&&q.options.some(o=>o.isCorrect)&&(
                      <div className="mt-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Explanation (shown in key sheet)</label>
                        <input value={q.explanation??''} onChange={e=>updateQ(activeQ,{explanation:e.target.value})}
                          placeholder="Why is this the correct answer?"
                          className="w-full px-3 py-2 border border-cream-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200 text-slate-600"/>
                      </div>
                    )}
                  </div>
                )}

                {/* Matrix */}
                {pollType==='matrix'&&(
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">Rows (statements)</label>
                      <div className="space-y-1.5">
                        {(q.matrixRows??[]).map((r,i)=>(
                          <div key={r.id} className="flex items-center gap-2">
                            <input value={r.text} onChange={e=>updateQ(activeQ,{matrixRows:(q.matrixRows??[]).map((x,j)=>j===i?{...x,text:e.target.value}:x)})}
                              placeholder={`Row ${i+1}`} className="flex-1 px-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                            {(q.matrixRows??[]).length>2&&<button onClick={()=>updateQ(activeQ,{matrixRows:(q.matrixRows??[]).filter((_,j)=>j!==i)})} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>}
                          </div>
                        ))}
                        <button onClick={()=>updateQ(activeQ,{matrixRows:[...(q.matrixRows??[]),{id:Date.now().toString(),text:''}]})}
                          className="text-xs text-terracotta-600 font-medium flex items-center gap-1"><Plus size={11}/>Add row</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">Columns (options)</label>
                      <div className="space-y-1.5">
                        {(q.matrixCols??[]).map((c,i)=>(
                          <div key={c.id} className="flex items-center gap-2">
                            <input value={c.text} onChange={e=>updateQ(activeQ,{matrixCols:(q.matrixCols??[]).map((x,j)=>j===i?{...x,text:e.target.value}:x)})}
                              placeholder={`Col ${i+1}`} className="flex-1 px-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                            {(q.matrixCols??[]).length>2&&<button onClick={()=>updateQ(activeQ,{matrixCols:(q.matrixCols??[]).filter((_,j)=>j!==i)})} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>}
                          </div>
                        ))}
                        <button onClick={()=>updateQ(activeQ,{matrixCols:[...(q.matrixCols??[]),{id:Date.now().toString(),text:''}]})}
                          className="text-xs text-terracotta-600 font-medium flex items-center gap-1"><Plus size={11}/>Add col</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Matching */}
                {pollType==='matching'&&(
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Match Pairs</label>
                    {(q.matchPairs??[]).map((pair,i)=>(
                      <div key={pair.id} className="flex items-center gap-3">
                        <input value={pair.left} onChange={e=>updateQ(activeQ,{matchPairs:(q.matchPairs??[]).map((p,j)=>j===i?{...p,left:e.target.value}:p)})}
                          placeholder={`Term ${i+1}`} className="flex-1 px-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                        <span className="text-slate-400 font-bold">↔</span>
                        <input value={pair.right} onChange={e=>updateQ(activeQ,{matchPairs:(q.matchPairs??[]).map((p,j)=>j===i?{...p,right:e.target.value}:p)})}
                          placeholder={`Definition ${i+1}`} className="flex-1 px-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                        {(q.matchPairs??[]).length>2&&<button onClick={()=>updateQ(activeQ,{matchPairs:(q.matchPairs??[]).filter((_,j)=>j!==i)})} className="text-red-400"><Trash2 size={12}/></button>}
                      </div>
                    ))}
                    <button onClick={()=>updateQ(activeQ,{matchPairs:[...(q.matchPairs??[]),{id:Date.now().toString(),left:'',right:''}]})}
                      className="text-xs text-terracotta-600 font-medium flex items-center gap-1"><Plus size={11}/>Add pair</button>
                  </div>
                )}

                {/* Slider */}
                {pollType==='slider'&&(
                  <div className="grid grid-cols-3 gap-3">
                    {[['Min',q.sliderMin??0,'sliderMin'],['Max',q.sliderMax??100,'sliderMax'],['Step',q.sliderStep??1,'sliderStep']].map(([label,val,key])=>(
                      <div key={String(key)}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{label}</label>
                        <input type="number" value={Number(val)} onChange={e=>updateQ(activeQ,{[String(key)]:Number(e.target.value)})}
                          className="w-full px-2.5 py-2 border border-cream-300 rounded-xl text-sm text-center bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                      </div>
                    ))}
                  </div>
                )}

                {/* Open / Word Cloud */}
                {['open_ended','word_cloud','qa'].includes(pollType)&&(
                  <div className="p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm text-slate-500 flex items-start gap-2">
                    <MessageSquare size={14} className="text-terracotta-400 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="font-medium text-slate-700">Free-text response</p>
                      <p className="text-xs mt-0.5">Students will type their answer. {pollType==='word_cloud'?'Responses appear in a live word cloud.':pollType==='qa'?'Questions can be upvoted.':'Responses are collected for analysis.'}</p>
                    </div>
                  </div>
                )}

                {/* NPS */}
                {pollType==='nps'&&(
                  <div className="p-3 bg-cream-50 border border-cream-200 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-2">NPS Scale Preview</p>
                    <div className="flex gap-1">
                      {Array.from({length:11},(_,i)=>i).map(n=>(
                        <div key={n} className={`flex-1 h-8 rounded text-xs flex items-center justify-center font-bold ${n<=6?'bg-red-100 text-red-600':n<=8?'bg-yellow-100 text-yellow-600':'bg-green-100 text-green-600'}`}>{n}</div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>Detractors (0-6)</span><span>Passives (7-8)</span><span>Promoters (9-10)</span></div>
                  </div>
                )}

                {/* Navigation between questions */}
                {isMultiQ&&(
                  <div className="flex items-center gap-2 pt-3 border-t border-cream-100">
                    <button onClick={()=>setActiveQ(i=>Math.max(0,i-1))} disabled={activeQ===0}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border border-cream-300 rounded-lg disabled:opacity-40 hover:bg-cream-100 transition-colors">
                      <ChevronLeft size={13}/> Prev
                    </button>
                    {activeQ<questions.length-1
                      ?<button onClick={()=>setActiveQ(i=>i+1)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-terracotta-100 text-terracotta-700 rounded-lg hover:bg-terracotta-200 transition-colors">Next <ChevronRight size={13}/></button>
                      :<button onClick={addQ} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"><Plus size={13}/> New Q</button>
                    }
                    <span className="ml-auto text-xs text-slate-400">{activeQ+1} / {questions.length}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Type-specific settings ── */}
        {step===2&&(
          <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="space-y-4">
            <div className="op-card p-6 space-y-5">
              <h2 className="font-display font-semibold text-slate-800">Settings for {pollTypeLabel(pollType)}</h2>

              {/* Anti-cheat (quiz types) */}
              {isQuiz&&(
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2"><AlertTriangle size={14}/> Anti-Cheat</h3>
                  {[
                    {k:'preventTabSwitch',l:'Tab switch detection',d:'Notify teacher when student switches tab'},
                    {k:'shuffleQuestions',l:'Shuffle question order',d:'Different order per participant'},
                    {k:'shuffleOptions',  l:'Shuffle option order', d:'Randomise choices per participant'},
                  ].map(({k,l,d})=>(
                    <div key={k} className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-slate-700">{l}</p><p className="text-xs text-slate-400">{d}</p></div>
                      <button onClick={()=>setSettings(s=>({...s,[k]:!s[k as keyof PollSettings]}))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${settings[k as keyof PollSettings]?'bg-terracotta-500':'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[k as keyof PollSettings]?'translate-x-5':''}`}/>
                      </button>
                    </div>
                  ))}
                  {/* Fullscreen option */}
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-slate-700">Force fullscreen on student</p><p className="text-xs text-slate-400">Opens quiz in fullscreen mode on student device</p></div>
                    <button onClick={()=>setExtra(e=>({...e,fullscreenMode:!e.fullscreenMode}))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${extraSettings.fullscreenMode?'bg-terracotta-500':'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${extraSettings.fullscreenMode?'translate-x-5':''}`}/>
                    </button>
                  </div>
                  {/* Negative marking */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Negative marking</p>
                      <p className="text-xs text-slate-400">Deduct points for wrong answers</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {extraSettings.negativeMarking&&(
                        <input type="number" min={0} max={1} step={0.25} value={extraSettings.penaltyPoints}
                          onChange={e=>setExtra(ex=>({...ex,penaltyPoints:Number(e.target.value)}))}
                          className="w-16 text-xs text-center px-2 py-1 border border-cream-300 rounded-lg bg-white"/>
                      )}
                      <button onClick={()=>setExtra(e=>({...e,negativeMarking:!e.negativeMarking}))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${extraSettings.negativeMarking?'bg-red-500':'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${extraSettings.negativeMarking?'translate-x-5':''}`}/>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timing */}
              <div className="p-4 bg-cream-100 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Timer size={14}/> Timing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Global time limit (s)</label>
                    <input type="number" min={0} value={settings.globalTimerSecs??''} onChange={e=>setSettings(s=>({...s,globalTimerSecs:Number(e.target.value)||undefined}))}
                      placeholder="No limit" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                  </div>
                  {isQuiz&&(
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Passing score (%)</label>
                      <input type="number" min={0} max={100} value={extraSettings.passingScore??60} onChange={e=>setExtra(ex=>({...ex,passingScore:Number(e.target.value)}))}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                    </div>
                  )}
                </div>
              </div>

              {/* Display settings */}
              <div className="space-y-3">
                {[
                  {k:'showResultsLive',   l:'Show live results',       d:'Participants see results as votes come in'},
                  {k:'showCorrectAnswers',l:'Show correct answers',    d:'Reveal correct options after submission'},
                  {k:'showKeySheetAfter', l:'Release key sheet',       d:'Detailed answer breakdown for students'},
                  {k:'allowReview',       l:'Allow answer review',     d:'Let participants review before submitting'},
                  {k:'showProgressBar',   l:'Show progress bar',       d:'Question progress indicator'},
                  {k:'allowAnonymous',    l:'Allow anonymous join',    d:'Students can join without logging in'},
                  {k:'oneResponsePerUser',l:'One response per user',   d:'Prevent duplicate submissions'},
                ].map(({k,l,d})=>(
                  <div key={k} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                    <div><p className="text-sm font-medium text-slate-700">{l}</p><p className="text-xs text-slate-400">{d}</p></div>
                    <button onClick={()=>setSettings(s=>({...s,[k]:!s[k as keyof PollSettings]}))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${settings[k as keyof PollSettings]?'bg-terracotta-500':'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[k as keyof PollSettings]?'translate-x-5':''}`}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step===3&&(
          <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="op-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-slate-800">Preview &amp; Publish</h2>
            <div className="p-4 bg-gradient-to-r from-terracotta-50 to-cream-100 rounded-xl border border-terracotta-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{pollTypeIcon(pollType)}</span>
                <div>
                  <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-bold">{pollTypeLabel(pollType)}</span>
                  <h3 className="font-display font-bold text-slate-800 text-lg">{title||'Untitled Poll'}</h3>
                </div>
              </div>
              {desc&&<p className="text-sm text-slate-500">{desc}</p>}
              <p className="text-xs text-slate-400 mt-2">{questions.length} question{questions.length!==1?'s':''} · {questions.reduce((a,q)=>a+(q.points??1),0)} total pts</p>
            </div>
            {/* Questions preview */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q2,i)=>(
                <div key={q2.id} className="flex items-start gap-3 p-3 bg-white border border-cream-200 rounded-xl">
                  <span className="w-7 h-7 bg-terracotta-100 text-terracotta-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{q2.title||'Untitled question'}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{q2.options.filter(o=>o.text).length} options</span>
                      <span>{q2.points??1} pt{(q2.points??1)!==1?'s':''}</span>
                      {q2.timeLimit&&<span>⏱ {q2.timeLimit}s</span>}
                    </div>
                  </div>
                  {q2.options.some(o=>o.isCorrect)&&<Check size={14} className="text-green-500 flex-shrink-0 mt-0.5"/>}
                </div>
              ))}
            </div>
            {/* Settings summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                ['Tab detect', settings.preventTabSwitch?'✅ On':'❌ Off'],
                ['Shuffle Q',  settings.shuffleQuestions?'✅ On':'No'],
                ['Passing',    `${extraSettings.passingScore??60}%`],
                ['Key sheet',  settings.showKeySheetAfter?'✅ On':'❌ Off'],
                ['Anonymous',  settings.allowAnonymous?'✅ Yes':'No'],
                ['Live results',settings.showResultsLive?'✅ On':'❌ Off'],
                ['Time limit', settings.globalTimerSecs?`${settings.globalTimerSecs}s`:'None'],
                ['Neg. mark',  extraSettings.negativeMarking?`-${extraSettings.penaltyPoints}pt`:'No'],
              ].map(([k,v])=>(
                <div key={String(k)} className="flex justify-between p-2 bg-cream-100 rounded-lg">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={()=>setStep(s=>s-1)} disabled={step===0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 text-sm font-medium text-slate-600 hover:bg-cream-100 disabled:opacity-40 transition-all">
          <ChevronLeft size={16}/> Back
        </button>
        {step<STEPS.length-1
          ?<button onClick={()=>{if(step===1&&!title.trim()){toast.error('Add a title');return;}setStep(s=>s+1);}}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              Continue <ChevronRight size={16}/>
            </button>
          :<button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              {loading?<><Loader2 size={15} className="animate-spin"/>Publishing…</>:<><Check size={15}/> Publish Poll</>}
            </button>
        }
      </div>
    </div>
  );
}
