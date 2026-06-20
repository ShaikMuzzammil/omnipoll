import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Loader2,
  GripVertical, Copy, ChevronDown, ChevronUp, Shuffle,
  Timer, AlertTriangle, Maximize2, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { pollsApi } from '@/lib/api';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType, PollOption, PollSettings } from '@/lib/types';

const ALL_TYPES: PollType[] = [
  'multiple_choice','quiz','word_cloud','qa','nps','rating',
  'slider','ranking','matrix','priority','heatmap','emoji',
  'bracket','fill_blank','matching','true_false','image_choice',
  'countdown','series','open_ended',
];

interface Question {
  id: string;
  title: string;
  description?: string;
  type: PollType;
  options: PollOption[];
  timeLimit?: number;
  points?: number;
  required: boolean;
  shuffleOptions: boolean;
  explanation?: string;
}

const newOption = (i: number): PollOption => ({
  id: `${Date.now()}-${i}`,
  text: '',
  isCorrect: false,
  points: 0,
});

const newQuestion = (type: PollType = 'multiple_choice'): Question => ({
  id: Date.now().toString(),
  title: '',
  type,
  options: [newOption(0), newOption(1), newOption(2), newOption(3)],
  points: 1,
  required: true,
  shuffleOptions: false,
});

const DEFAULT_SETTINGS: PollSettings = {
  allowAnonymous: true, requireLogin: false, oneResponsePerUser: true,
  showResultsLive: true, showCorrectAnswers: true, showKeySheetAfter: true,
  shuffleOptions: false, shuffleQuestions: false, preventTabSwitch: true,
  showProgressBar: true, allowReview: true, pointsPerQuestion: 1,
};

const STEPS = ['Type', 'Questions', 'Settings', 'Preview'];

export default function Create({ editMode = false }: { editMode?: boolean }) {
  const navigate = useNavigate();
  const { pollId } = useParams();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [pollType, setPollType] = useState<PollType>('quiz');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc,  setQuizDesc]  = useState('');
  const [questions, setQuestions] = useState<Question[]>([newQuestion('quiz')]);
  const [activeQ,   setActiveQ]   = useState(0);
  const [settings,  setSettings]  = useState<PollSettings>(DEFAULT_SETTINGS);
  const [classroomId, setClassroomId] = useState('');

  const isQuiz = ['quiz','multiple_choice','true_false'].includes(pollType);
  const isMultiQ = ['quiz','series'].includes(pollType);

  /* ── Load for edit ── */
  useEffect(() => {
    if (!editMode || !pollId) return;
    pollsApi.get(pollId).then((p: any) => {
      setQuizTitle(p.title); setQuizDesc(p.description ?? '');
      setPollType(p.type); setSettings(p.settings);
      if (p.questions?.length) setQuestions(p.questions);
      else setQuestions([{ ...newQuestion(p.type), options: p.options }]);
    }).catch(() => toast.error('Failed to load poll'));
  }, [editMode, pollId]);

  /* ── Question helpers ── */
  const addQ    = () => { setQuestions(qs => [...qs, newQuestion(pollType)]); setActiveQ(questions.length); };
  const removeQ = (i: number) => { if (questions.length === 1) return; setQuestions(qs => qs.filter((_,j) => j !== i)); setActiveQ(Math.max(0, i-1)); };
  const dupQ    = (i: number) => { const q = { ...questions[i], id: Date.now().toString() }; setQuestions(qs => [...qs.slice(0,i+1), q, ...qs.slice(i+1)]); };
  const moveQ   = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const qs = [...questions];
    [qs[from], qs[to]] = [qs[to], qs[from]];
    setQuestions(qs);
    setActiveQ(to);
  };

  const updateQ = (i: number, patch: Partial<Question>) =>
    setQuestions(qs => qs.map((q, j) => j === i ? { ...q, ...patch } : q));

  const addOpt = (qi: number) =>
    setQuestions(qs => qs.map((q, j) => j === qi
      ? { ...q, options: [...q.options, newOption(q.options.length)] } : q));

  const removeOpt = (qi: number, oi: number) =>
    setQuestions(qs => qs.map((q, j) => j === qi && q.options.length > 2
      ? { ...q, options: q.options.filter((_,k) => k !== oi) } : q));

  const updateOpt = (qi: number, oi: number, patch: Partial<PollOption>) =>
    setQuestions(qs => qs.map((q, j) => j === qi
      ? { ...q, options: q.options.map((o, k) => k === oi ? { ...o, ...patch } : o) } : q));

  const setCorrect = (qi: number, oi: number) =>
    setQuestions(qs => qs.map((q, j) => j === qi
      ? { ...q, options: q.options.map((o, k) => ({ ...o, isCorrect: k === oi })) } : q));

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!quizTitle.trim()) { toast.error('Add a title'); return; }
    if (questions.some(q => !q.title.trim())) { toast.error('All questions need titles'); return; }
    setLoading(true);
    try {
      const payload = {
        title: quizTitle, description: quizDesc, type: pollType,
        questions: questions.map(q => ({ ...q, options: q.options.filter(o => o.text.trim()) })),
        options: questions[0]?.options?.filter(o => o.text.trim()) ?? [],
        settings, classroomId: classroomId || undefined,
      };
      const res = editMode && pollId
        ? await pollsApi.update(pollId, payload) as any
        : await pollsApi.create(payload) as any;
      toast.success(editMode ? 'Poll updated!' : 'Poll created!');
      navigate(`/results/${res.id || pollId}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const q = questions[activeQ] ?? questions[0];

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-800">
          {editMode ? 'Edit Poll' : 'Create Poll'}
        </h1>
        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <button onClick={() => i < step && setStep(i)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white cursor-pointer' :
                  i === step ? 'bg-terracotta-500 text-white' : 'bg-cream-300 text-slate-500'}`}>
                {i < step ? <Check size={13}/> : i + 1}
              </button>
              <span className={`text-xs font-medium ${i === step ? 'text-terracotta-700' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-green-300' : 'bg-cream-300'}`}/>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── STEP 0: Type ─── */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            className="op-card p-6">
            <h2 className="font-display font-semibold text-slate-800 mb-4">Choose a poll type</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ALL_TYPES.map(t => (
                <button key={t} onClick={() => { setPollType(t); setQuestions([newQuestion(t)]); }}
                  className={`type-tile ${pollType === t ? 'selected' : ''}`}>
                  <span className="text-2xl block mb-1">{pollTypeIcon(t)}</span>
                  <span className="text-xs font-medium text-slate-600 leading-tight">{pollTypeLabel(t)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── STEP 1: Questions ─── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            className="space-y-4">
            {/* Quiz header */}
            <div className="op-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-cream-100 px-3 py-2 rounded-lg">
                <span className="text-xl">{pollTypeIcon(pollType)}</span>
                <span className="font-medium text-terracotta-700">{pollTypeLabel(pollType)}</span>
              </div>
              <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                placeholder="Poll / Quiz title *"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white"/>
              <textarea value={quizDesc} onChange={e => setQuizDesc(e.target.value)}
                placeholder="Description / instructions (optional)" rows={2}
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white resize-none"/>
            </div>

            <div className="grid lg:grid-cols-[200px_1fr] gap-4">
              {/* Question list sidebar */}
              {isMultiQ && (
                <div className="op-card p-3 space-y-1.5 h-fit">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mb-2">
                    Questions ({questions.length})
                  </p>
                  {questions.map((q2, i) => (
                    <div key={q2.id}
                      onClick={() => setActiveQ(i)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all group ${
                        activeQ === i ? 'bg-terracotta-500 text-white' : 'hover:bg-cream-100 text-slate-700'}`}>
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activeQ === i ? 'bg-white/30 text-white' : 'bg-cream-200 text-slate-600'}`}>{i+1}</span>
                      <span className="text-xs truncate flex-1">{q2.title || `Question ${i+1}`}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); moveQ(i, i-1); }} disabled={i===0}
                          className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronUp size={10}/></button>
                        <button onClick={e => { e.stopPropagation(); moveQ(i, i+1); }} disabled={i===questions.length-1}
                          className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronDown size={10}/></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addQ}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-terracotta-600 hover:bg-terracotta-50 border border-dashed border-terracotta-300 rounded-xl py-2 transition-all mt-2">
                    <Plus size={13}/> Add Question
                  </button>
                </div>
              )}

              {/* Active question editor */}
              <div className="op-card p-5 space-y-4">
                {isMultiQ && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Q{activeQ+1} of {questions.length}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => dupQ(activeQ)} className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 text-xs" title="Duplicate">
                        <Copy size={13}/>
                      </button>
                      <button onClick={() => removeQ(activeQ)} disabled={questions.length === 1}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-30" title="Delete">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                )}

                {/* Question title */}
                <input value={q.title} onChange={e => updateQ(activeQ, { title: e.target.value })}
                  placeholder={`Question ${activeQ+1} *`}
                  className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white font-medium"/>

                {/* Question type + per-question settings */}
                <div className="flex gap-3 flex-wrap">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Time limit (s)</label>
                    <input type="number" min={0} value={q.timeLimit ?? ''} onChange={e => updateQ(activeQ, { timeLimit: Number(e.target.value) || undefined })}
                      placeholder="None" className="w-20 px-2 py-1.5 border border-cream-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Points</label>
                    <input type="number" min={0} value={q.points ?? 1} onChange={e => updateQ(activeQ, { points: Number(e.target.value) })}
                      className="w-20 px-2 py-1.5 border border-cream-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => updateQ(activeQ, { shuffleOptions: !q.shuffleOptions })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${q.shuffleOptions ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-700' : 'border-cream-300 text-slate-500 hover:border-terracotta-200'}`}>
                      <Shuffle size={11}/> Shuffle options
                    </button>
                  </div>
                </div>

                {/* Options */}
                {!['word_cloud','qa','nps','slider','heatmap','countdown','open_ended'].includes(q.type) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Options {isQuiz && <span className="text-slate-400 font-normal ml-1">— click ○ to mark correct</span>}
                      </label>
                      <span className="text-xs text-slate-400">{q.options.length} options</span>
                    </div>
                    {q.options.map((opt, oi) => (
                      <div key={opt.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${opt.isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-cream-200'}`}>
                        <span className="text-xs font-bold text-slate-400 w-6 text-center">{String.fromCharCode(65+oi)}</span>
                        {isQuiz && (
                          <button onClick={() => setCorrect(activeQ, oi)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                            {opt.isCorrect && <Check size={10} className="text-white"/>}
                          </button>
                        )}
                        <input value={opt.text} onChange={e => updateOpt(activeQ, oi, { text: e.target.value })}
                          placeholder={`Option ${String.fromCharCode(65+oi)}`}
                          className={`flex-1 px-2 py-1 text-sm focus:outline-none bg-transparent ${opt.isCorrect ? 'font-medium text-green-800' : 'text-slate-700'}`}/>
                        {opt.isCorrect && <span className="text-xs text-green-600 font-semibold">✓ Correct</span>}
                        {q.options.length > 2 && (
                          <button onClick={() => removeOpt(activeQ, oi)} className="p-1 hover:bg-red-100 rounded text-slate-300 hover:text-red-500">
                            <Trash2 size={12}/>
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOpt(activeQ)}
                      className="flex items-center gap-1.5 text-xs text-terracotta-600 hover:text-terracotta-700 font-medium mt-1">
                      <Plus size={13}/> Add option
                    </button>
                  </div>
                )}

                {/* Explanation */}
                {isQuiz && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Explanation (shown in key sheet)</label>
                    <input value={q.explanation ?? ''} onChange={e => updateQ(activeQ, { explanation: e.target.value })}
                      placeholder="Explain why the correct answer is right…"
                      className="w-full px-3 py-2 border border-cream-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200 text-slate-600"/>
                  </div>
                )}

                {/* Next question nav */}
                {isMultiQ && (
                  <div className="flex gap-2 pt-2 border-t border-cream-100">
                    <button onClick={() => setActiveQ(i => Math.max(0, i-1))} disabled={activeQ === 0}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border border-cream-300 rounded-lg disabled:opacity-40 hover:bg-cream-100 transition-colors">
                      <ChevronLeft size={13}/> Prev
                    </button>
                    {activeQ < questions.length - 1 ? (
                      <button onClick={() => setActiveQ(i => i+1)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-terracotta-100 text-terracotta-700 rounded-lg hover:bg-terracotta-200 transition-colors">
                        Next <ChevronRight size={13}/>
                      </button>
                    ) : (
                      <button onClick={addQ}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors">
                        <Plus size={13}/> New Question
                      </button>
                    )}
                    <span className="ml-auto text-xs text-slate-400 self-center">
                      {activeQ+1}/{questions.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: Settings ─── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            className="op-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-slate-800 mb-2">Quiz Settings</h2>

            {/* Timing */}
            <div className="p-4 bg-cream-100 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Timer size={14}/> Timing</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Global time limit (s)</label>
                  <input type="number" min={0} value={settings.globalTimerSecs ?? ''} onChange={e => setSettings(s => ({...s, globalTimerSecs: Number(e.target.value)||undefined}))}
                    placeholder="No limit" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Passing score (%)</label>
                  <input type="number" min={0} max={100} value={settings.passingScore ?? ''} onChange={e => setSettings(s => ({...s, passingScore: Number(e.target.value)||undefined}))}
                    placeholder="e.g. 60" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta-200"/>
                </div>
              </div>
            </div>

            {/* Anti-cheat */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2"><AlertTriangle size={14}/> Anti-Cheat</h3>
              <div className="space-y-2">
                {([
                  { key:'preventTabSwitch' as const, label:'Tab switch detection', desc:'Alert teacher instantly when student switches tab' },
                  { key:'shuffleQuestions' as const, label:'Shuffle question order', desc:'Different order for each participant' },
                  { key:'shuffleOptions' as const,   label:'Shuffle option order',  desc:'Randomise choices for each participant' },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <button onClick={() => setSettings(s => ({...s, [key]: !s[key]}))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${settings[key] ? 'bg-terracotta-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Display options */}
            <div className="space-y-3">
              {([
                { key:'showResultsLive' as const,   label:'Show live results',      desc:'Participants see results as they come in' },
                { key:'showCorrectAnswers' as const, label:'Show correct answers',   desc:'Reveal correct options after submission' },
                { key:'showKeySheetAfter' as const,  label:'Release key sheet',      desc:'Detailed answer breakdown for students' },
                { key:'allowReview' as const,        label:'Allow answer review',    desc:'Let participants review before submitting' },
                { key:'showProgressBar' as const,    label:'Show progress bar',      desc:'Question progress indicator' },
                { key:'allowAnonymous' as const,     label:'Allow anonymous join',   desc:'Students can join without logging in' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <button onClick={() => setSettings(s => ({...s, [key]: !s[key]}))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings[key] ? 'bg-terracotta-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`}/>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3: Preview ─── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            className="op-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-slate-800">Preview &amp; Publish</h2>
            <div className="p-4 bg-cream-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{pollTypeIcon(pollType)}</span>
                <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-medium">{pollTypeLabel(pollType)}</span>
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-lg">{quizTitle || 'Untitled'}</h3>
              {quizDesc && <p className="text-sm text-slate-500 mt-1">{quizDesc}</p>}
              <p className="text-xs text-slate-400 mt-2">{questions.length} question{questions.length !== 1 ? 's' : ''} · {questions.reduce((a,q2) => a + (q2.points??1), 0)} total pts</p>
            </div>
            {/* Questions preview */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {questions.map((q2, i) => (
                <div key={q2.id} className="flex items-start gap-3 p-3 bg-white border border-cream-200 rounded-xl">
                  <span className="w-6 h-6 bg-terracotta-100 text-terracotta-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{q2.title || 'Untitled question'}</p>
                    <p className="text-xs text-slate-400">{q2.options.filter(o=>o.text).length} options · {q2.points ?? 1} pt{(q2.points??1)!==1?'s':''}</p>
                  </div>
                  {q2.options.some(o=>o.isCorrect) && <Check size={14} className="text-green-500 flex-shrink-0"/>}
                </div>
              ))}
            </div>
            {/* Settings summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Tab detection', settings.preventTabSwitch ? '✅ On' : '❌ Off'],
                ['Shuffle Q', settings.shuffleQuestions ? '✅ On' : '❌ Off'],
                ['Passing', settings.passingScore ? `${settings.passingScore}%` : 'No cut-off'],
                ['Key sheet', settings.showKeySheetAfter ? '✅ On' : '❌ Off'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between p-2 bg-cream-100 rounded-lg">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-cream-300 text-sm font-medium text-slate-600 hover:bg-cream-100 disabled:opacity-40 transition-all">
          <ChevronLeft size={16}/> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => { if (step === 1 && !quizTitle.trim()) { toast.error('Add a title'); return; } setStep(s => s+1); }}
            className="flex items-center gap-1.5 px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            Continue <ChevronRight size={16}/>
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            {loading ? <><Loader2 size={15} className="animate-spin"/> Publishing…</> : <><Check size={15}/> Publish</>}
          </button>
        )}
      </div>
    </div>
  );
}
