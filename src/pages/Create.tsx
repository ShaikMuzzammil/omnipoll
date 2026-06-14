import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Loader2, GripVertical } from 'lucide-react';
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

const DEFAULT_SETTINGS: PollSettings = {
  allowAnonymous: true, requireLogin: false, oneResponsePerUser: true,
  showResultsLive: true, showCorrectAnswers: false, showKeySheetAfter: true,
  shuffleOptions: false, shuffleQuestions: false,
  preventTabSwitch: false, showProgressBar: true, allowReview: true,
};

const STEPS = ['Type', 'Content', 'Settings', 'Preview'];

export default function Create({ editMode = false }: { editMode?: boolean }) {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const { pollId }     = useParams();
  const [step, setStep]= useState(0);
  const [loading, setLoading] = useState(false);

  const [type,     setType]     = useState<PollType>((params.get('type') as PollType) ?? 'multiple_choice');
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [options,  setOptions]  = useState<PollOption[]>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false },
  ]);
  const [matrixRows, setMatrixRows] = useState([{ id:'r1', text:'' },{ id:'r2', text:'' }]);
  const [matrixCols, setMatrixCols] = useState([{ id:'c1', text:'' },{ id:'c2', text:'' }]);
  const [settings, setSettings] = useState<PollSettings>(DEFAULT_SETTINGS);
  const [classroomId, setClassroomId] = useState('');

  // Load for edit mode
  useEffect(() => {
    if (editMode && pollId) {
      pollsApi.get(pollId).then((p: unknown) => {
        const poll = p as { title:string; description?:string; type:PollType; options:PollOption[]; matrixRows?:{id:string;text:string}[]; matrixCols?:{id:string;text:string}[]; settings:PollSettings; classroomId?:string };
        setTitle(poll.title); setDesc(poll.description ?? '');
        setType(poll.type); setOptions(poll.options);
        if (poll.matrixRows) setMatrixRows(poll.matrixRows);
        if (poll.matrixCols) setMatrixCols(poll.matrixCols);
        setSettings(poll.settings);
        if (poll.classroomId) setClassroomId(poll.classroomId);
      }).catch(() => toast.error('Failed to load poll'));
    }
  }, [editMode, pollId]);

  const addOption = () => setOptions(prev => [...prev, { id: Date.now().toString(), text: '', isCorrect: false }]);
  const removeOption = (id: string) => setOptions(prev => prev.filter(o => o.id !== id));
  const updateOption = (id: string, field: keyof PollOption, value: unknown) =>
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  const setCorrect = (id: string) => {
    if (['multiple_choice','quiz','true_false','image_choice'].includes(type)) {
      setOptions(prev => prev.map(o => ({ ...o, isCorrect: o.id === id })));
    }
  };

  const needsOptions = !['word_cloud','qa','nps','slider','heatmap','countdown','open_ended'].includes(type);
  const isQuizLike   = ['quiz','multiple_choice','true_false'].includes(type);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please add a title'); return; }
    setLoading(true);
    try {
      const payload = {
        title, description: desc, type,
        options: needsOptions ? options.filter(o => o.text.trim()) : [],
        matrixRows: type === 'matrix' ? matrixRows : undefined,
        matrixCols: type === 'matrix' ? matrixCols : undefined,
        settings, classroomId: classroomId || undefined,
      };
      if (editMode && pollId) {
        await pollsApi.update(pollId, payload);
        toast.success('Poll updated!');
        navigate(`/results/${pollId}`);
      } else {
        const res = await pollsApi.create(payload) as { id: string };
        toast.success('Poll created!');
        navigate(`/results/${res.id}`);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-800">
          {editMode ? 'Edit Poll' : 'Create a new poll'}
        </h1>
        {/* Progress */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white cursor-pointer' :
                  i === step ? 'bg-terracotta-500 text-white' :
                  'bg-cream-300 text-slate-500'
                }`}
              >
                {i < step ? <Check size={13}/> : i + 1}
              </button>
              <span className={`text-xs font-medium ${i === step ? 'text-terracotta-700' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-green-300' : 'bg-cream-300'}`}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="op-card p-6">
        <AnimatePresence mode="wait">
          {/* STEP 0: Poll type selection */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <h2 className="font-display font-semibold text-slate-800 mb-4">Choose a poll type</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ALL_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`type-tile ${type === t ? 'selected' : ''}`}>
                    <span className="text-2xl block mb-1">{pollTypeIcon(t)}</span>
                    <span className="text-xs font-medium text-slate-600 leading-tight">{pollTypeLabel(t)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1: Content */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-cream-100 px-3 py-2 rounded-lg">
                <span className="text-xl">{pollTypeIcon(type)}</span>
                <span className="font-medium text-terracotta-700">{pollTypeLabel(type)}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's your question?"
                  className="w-full px-3.5 py-2.5 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 bg-white"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Additional context or instructions…"
                  className="w-full px-3.5 py-2.5 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 bg-white resize-none"/>
              </div>

              {/* Options */}
              {needsOptions && type !== 'matrix' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Options {isQuizLike && <span className="text-xs text-slate-400 font-normal ml-1">— click the circle to mark correct</span>}
                    </label>
                  </div>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                        {isQuizLike && (
                          <button onClick={() => setCorrect(opt.id)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                            {opt.isCorrect && <Check size={10} className="text-white m-auto"/>}
                          </button>
                        )}
                        <input value={opt.text} onChange={e => updateOption(opt.id, 'text', e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white"/>
                        {type === 'quiz' && (
                          <input type="number" min={0} placeholder="pts" value={opt.points ?? ''}
                            onChange={e => updateOption(opt.id, 'points', Number(e.target.value))}
                            className="w-16 px-2 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none bg-white text-center"/>
                        )}
                        {options.length > 2 && (
                          <button onClick={() => removeOption(opt.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-sm text-terracotta-600 hover:text-terracotta-700 font-medium">
                    <Plus size={15}/> Add option
                  </button>
                </div>
              )}

              {/* Matrix builder */}
              {type === 'matrix' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Rows (statements)</label>
                    <div className="space-y-1.5">
                      {matrixRows.map((r, i) => (
                        <input key={r.id} value={r.text} onChange={e => setMatrixRows(prev => prev.map(x => x.id === r.id ? {...x, text:e.target.value} : x))}
                          placeholder={`Row ${i+1}`} className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white"/>
                      ))}
                      <button onClick={() => setMatrixRows(prev => [...prev, {id:Date.now().toString(), text:''}])}
                        className="text-xs text-terracotta-600 font-medium flex items-center gap-1"><Plus size={12}/>Add row</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Columns (options)</label>
                    <div className="space-y-1.5">
                      {matrixCols.map((c, i) => (
                        <input key={c.id} value={c.text} onChange={e => setMatrixCols(prev => prev.map(x => x.id === c.id ? {...x, text:e.target.value} : x))}
                          placeholder={`Col ${i+1}`} className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-200 bg-white"/>
                      ))}
                      <button onClick={() => setMatrixCols(prev => [...prev, {id:Date.now().toString(), text:''}])}
                        className="text-xs text-terracotta-600 font-medium flex items-center gap-1"><Plus size={12}/>Add column</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Slider / NPS type hints */}
              {type === 'slider' && (
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Min value</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Max value</label><input type="number" placeholder="100" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Step</label><input type="number" placeholder="1" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/></div>
                </div>
              )}
              {type === 'fill_blank' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  💡 In the title, use <strong>___</strong> (three underscores) to mark the blank. E.g. "The capital of France is ___"
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Settings */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <h2 className="font-display font-semibold text-slate-800 mb-4">Poll settings</h2>

              {/* Timing */}
              <div className="p-4 bg-cream-100 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">⏱ Timing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Time limit (seconds)</label>
                    <input type="number" min={0} value={settings.timeLimit ?? ''} onChange={e => setSettings(s => ({...s, timeLimit: Number(e.target.value) || undefined}))}
                      placeholder="No limit" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Passing score (%)</label>
                    <input type="number" min={0} max={100} value={settings.passingScore ?? ''} onChange={e => setSettings(s => ({...s, passingScore: Number(e.target.value) || undefined}))}
                      placeholder="e.g. 60" className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { key: 'allowAnonymous' as const,    label: 'Allow anonymous responses',     desc: 'Participants can respond without logging in' },
                  { key: 'oneResponsePerUser' as const, label: 'One response per user',         desc: 'Prevent duplicate submissions from same account' },
                  { key: 'showResultsLive' as const,   label: 'Show live results',             desc: 'Participants see results as votes come in' },
                  { key: 'showCorrectAnswers' as const, label: 'Show correct answers',          desc: 'Display correct answers after submission (quiz)' },
                  { key: 'showKeySheetAfter' as const,  label: 'Release key sheet to students', desc: 'Students get detailed answer breakdown after results released' },
                  { key: 'shuffleOptions' as const,    label: 'Shuffle options',               desc: 'Randomise option order for each participant' },
                  { key: 'preventTabSwitch' as const,  label: 'Detect tab switching',          desc: 'Warn when participant switches browser tab (quiz)' },
                  { key: 'showProgressBar' as const,   label: 'Show progress bar',             desc: 'Display progress through multi-question polls' },
                  { key: 'allowReview' as const,       label: 'Allow answer review',           desc: 'Let participants review before final submission' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b border-cream-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings(s => ({...s, [key]: !s[key]}))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${settings[key] ? 'bg-terracotta-500' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`}/>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <h2 className="font-display font-semibold text-slate-800 mb-5">Preview & publish</h2>
              <div className="space-y-4">
                <div className="p-4 bg-cream-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{pollTypeIcon(type)}</span>
                    <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-medium">{pollTypeLabel(type)}</span>
                  </div>
                  <h3 className="font-display font-semibold text-slate-800 text-lg">{title || 'Untitled Poll'}</h3>
                  {desc && <p className="text-sm text-slate-500 mt-1">{desc}</p>}
                </div>
                {options.filter(o => o.text).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Options</p>
                    <div className="space-y-1.5">
                      {options.filter(o => o.text).map(opt => (
                        <div key={opt.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${opt.isCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-white border border-cream-300 text-slate-700'}`}>
                          {opt.isCorrect && <Check size={13} className="text-green-600"/>}
                          {opt.text}
                          {opt.points !== undefined && opt.points > 0 && <span className="ml-auto text-xs text-slate-400">{opt.points}pts</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Anonymous', settings.allowAnonymous ? '✅ Allowed' : '❌ Disabled'],
                    ['Time limit', settings.timeLimit ? `${settings.timeLimit}s` : 'No limit'],
                    ['Live results', settings.showResultsLive ? '✅ On' : '❌ Off'],
                    ['Key sheet', settings.showKeySheetAfter ? '✅ On' : '❌ Off'],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between p-2 bg-cream-100 rounded-lg">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-medium text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-cream-200">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-cream-300 text-sm font-medium text-slate-600 hover:bg-cream-100 disabled:opacity-40 transition-all">
            <ChevronLeft size={16}/> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (step === 1 && !title.trim()) { toast.error('Add a title'); return; } setStep(s => s+1); }}
              className="flex items-center gap-1.5 px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              Continue <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              {loading ? <><Loader2 size={15} className="animate-spin"/> Publishing…</> : <><Check size={15}/> Publish Poll</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
