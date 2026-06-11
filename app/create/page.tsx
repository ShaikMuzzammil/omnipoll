'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Sparkles, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import { createPoll } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { genId } from '@/lib/utils';
import { toast } from 'sonner';
import type { PollType } from '@/lib/types';

const STEPS = ['Type', 'Question', 'Options', 'Settings', 'Review'];
const FREE_TYPES: PollType[] = ['multiple_choice', 'word_cloud', 'qa', 'quiz', 'rating'];
const STARTER_TYPES: PollType[] = ['ranking', 'open_text', 'image_choice', 'nps', 'matrix', 'true_false', 'emoji_reaction'];
const PRO_TYPES: PollType[] = ['slider', 'fill_blank', 'bracket', 'prioritization', 'heatmap', 'poll_series', 'countdown_vote', 'live_matching'];

interface Option { id: string; text: string; }
interface QuizQ { id: string; questionText: string; options: Option[]; correctAnswer: string; points: number; timeLimit: number; }
interface MatrixItem { id: string; label: string; }
interface MatchPair { id: string; left: string; right: string; }

export default function CreatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Type
  const [type, setType] = useState<PollType>('multiple_choice');

  // Question
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');

  // Options
  const [options, setOptions] = useState<Option[]>([
    { id: genId(), text: 'Option A' },
    { id: genId(), text: 'Option B' },
  ]);
  const [quizQs, setQuizQs] = useState<QuizQ[]>([{
    id: genId(), questionText: 'Question 1',
    options: [{ id: genId(), text: 'Answer A' }, { id: genId(), text: 'Answer B' },
              { id: genId(), text: 'Answer C' }, { id: genId(), text: 'Answer D' }],
    correctAnswer: '', points: 10, timeLimit: 20,
  }]);
  const [matrixRows, setMatrixRows] = useState<MatrixItem[]>([{ id: genId(), label: 'Row 1' }, { id: genId(), label: 'Row 2' }]);
  const [matrixCols, setMatrixCols] = useState<MatrixItem[]>([{ id: genId(), label: 'Agree' }, { id: genId(), label: 'Neutral' }, { id: genId(), label: 'Disagree' }]);
  const [matchingPairs, setMatchingPairs] = useState<MatchPair[]>([
    { id: genId(), left: 'Item 1', right: 'Match 1' },
    { id: genId(), left: 'Item 2', right: 'Match 2' },
  ]);
  const [sentence, setSentence] = useState('The best way to learn is ___.');
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [heatmapUrl, setHeatmapUrl] = useState('https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80');
  const [emojis] = useState(['😄','😂','❤️','👏','🔥','😮','😢','👍','🚀','🎉']);

  // Settings
  const [duration, setDuration] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [oneVote, setOneVote] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const meta = POLL_TYPE_META[type];

  const addOption = () => setOptions((o) => [...o, { id: genId(), text: `Option ${String.fromCharCode(65 + o.length)}` }]);
  const removeOption = (id: string) => setOptions((o) => o.filter((x) => x.id !== id));
  const updateOption = (id: string, text: string) => setOptions((o) => o.map((x) => x.id === id ? { ...x, text } : x));

  const canProceed = () => {
    if (step === 1 && !question.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!question.trim()) { toast.error('Question is required'); return; }
    setLoading(true);
    try {
      const body = {
        title: question,
        question,
        description,
        type,
        creatorId: user?.id || '',
        options: ['multiple_choice','image_choice','true_false','ranking','emoji_reaction','bracket','prioritization','countdown_vote'].includes(type) ? options : [],
        quizQuestions: type === 'quiz' ? quizQs : [],
        settings: {
          duration: duration ? Number(duration) : null,
          multiSelect, showResults, oneVote,
          min: sliderMin, max: sliderMax,
          sentence,
          matrixRows: type === 'matrix' ? matrixRows : [],
          matrixColumns: type === 'matrix' ? matrixCols : [],
          matchingPairs: type === 'live_matching' ? matchingPairs : [],
          imageUrl: type === 'heatmap' ? heatmapUrl : undefined,
        },
      };
      const data = await createPoll(body) as { poll: { code: string; id: string } };
      toast.success('Poll created! 🎉');
      router.push(`/present/${data.poll.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create poll');
    } finally { setLoading(false); }
  };

  // ── Step 0: Type selection ──
  const TypeStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-xl font-bold text-foreground mb-1">Choose poll type</h2>
        <p className="text-sm text-muted-foreground">Select the interaction style for your audience</p>
      </div>
      {[
        { label: 'Free', types: FREE_TYPES },
        { label: 'Starter', types: STARTER_TYPES },
        { label: 'Pro', types: PRO_TYPES },
      ].map(({ label, types }) => (
        <div key={label}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {types.map((t) => {
              const m = POLL_TYPE_META[t];
              const active = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta'
                      : 'border-border hover:border-terracotta/40 hover:bg-accent'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{m.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-terracotta ml-auto flex-shrink-0" />}
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
        <div>
          <div className="font-semibold text-foreground">{meta.label}</div>
          <div className="text-xs text-muted-foreground">{meta.desc}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Question / Title *</Label>
        <Textarea
          placeholder="What do you want to ask your audience?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px]" autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label>Description (optional)</Label>
        <Input
          placeholder="Add context or instructions…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );

  // ── Step 2: Options ──
  const OptionsStep = () => {
    if (['word_cloud','open_text','fill_blank','nps','rating','slider','qa','heatmap'].includes(type)) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground italic">No options needed — participants enter free-form responses.</p>
          {type === 'fill_blank' && (
            <div className="space-y-1.5">
              <Label>Sentence with blank (use ___ for the gap)</Label>
              <Input value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="The best way to learn is ___." />
            </div>
          )}
          {type === 'slider' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min value</Label>
                <Input type="number" value={sliderMin} onChange={(e) => setSliderMin(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max value</Label>
                <Input type="number" value={sliderMax} onChange={(e) => setSliderMax(Number(e.target.value))} />
              </div>
            </div>
          )}
          {type === 'heatmap' && (
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={heatmapUrl} onChange={(e) => setHeatmapUrl(e.target.value)} placeholder="https://…" />
              {heatmapUrl && <img src={heatmapUrl} alt="heatmap" className="rounded-lg max-h-48 object-cover" />}
            </div>
          )}
        </div>
      );
    }

    if (type === 'matrix') {
      return (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Rows</Label>
            {matrixRows.map((r, i) => (
              <div key={r.id} className="flex gap-2 mb-2">
                <Input value={r.label} onChange={(e) => setMatrixRows((rows) => rows.map((x) => x.id === r.id ? { ...x, label: e.target.value } : x))} placeholder={`Row ${i+1}`} />
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => setMatrixRows((rows) => rows.filter((x) => x.id !== r.id))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMatrixRows((r) => [...r, { id: genId(), label: `Row ${r.length+1}` }])}>+ Add Row</Button>
          </div>
          <div>
            <Label className="mb-2 block">Columns</Label>
            {matrixCols.map((c, i) => (
              <div key={c.id} className="flex gap-2 mb-2">
                <Input value={c.label} onChange={(e) => setMatrixCols((cols) => cols.map((x) => x.id === c.id ? { ...x, label: e.target.value } : x))} placeholder={`Column ${i+1}`} />
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => setMatrixCols((cols) => cols.filter((x) => x.id !== c.id))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMatrixCols((c) => [...c, { id: genId(), label: `Col ${c.length+1}` }])}>+ Add Column</Button>
          </div>
        </div>
      );
    }

    if (type === 'live_matching') {
      return (
        <div className="space-y-3">
          <Label>Matching Pairs</Label>
          {matchingPairs.map((pair, i) => (
            <div key={pair.id} className="flex gap-2 items-center">
              <Input value={pair.left} onChange={(e) => setMatchingPairs((p) => p.map((x) => x.id === pair.id ? { ...x, left: e.target.value } : x))} placeholder={`Left ${i+1}`} />
              <span className="text-muted-foreground flex-shrink-0">→</span>
              <Input value={pair.right} onChange={(e) => setMatchingPairs((p) => p.map((x) => x.id === pair.id ? { ...x, right: e.target.value } : x))} placeholder={`Right ${i+1}`} />
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => setMatchingPairs((p) => p.filter((x) => x.id !== pair.id))}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setMatchingPairs((p) => [...p, { id: genId(), left: `Item ${p.length+1}`, right: `Match ${p.length+1}` }])}>+ Add Pair</Button>
        </div>
      );
    }

    if (type === 'quiz') {
      return (
        <div className="space-y-4">
          {quizQs.map((q, qi) => (
            <div key={q.id} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Question {qi+1}</span>
                <Button variant="ghost" size="sm" onClick={() => setQuizQs((qs) => qs.filter((x) => x.id !== q.id))} className="h-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
              <Input value={q.questionText} onChange={(e) => setQuizQs((qs) => qs.map((x) => x.id === q.id ? { ...x, questionText: e.target.value } : x))} placeholder="Quiz question…" />
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((o, oi) => (
                  <div key={o.id} className={`flex gap-1.5 items-center p-2 rounded-lg border cursor-pointer ${q.correctAnswer === o.id ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-border'}`}
                    onClick={() => setQuizQs((qs) => qs.map((x) => x.id === q.id ? { ...x, correctAnswer: o.id } : x))}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${q.correctAnswer === o.id ? 'border-green-500 bg-green-500' : 'border-muted-foreground'}`} />
                    <Input value={o.text} className="border-0 p-0 h-auto bg-transparent text-xs focus-visible:ring-0"
                      onChange={(e) => setQuizQs((qs) => qs.map((x) => x.id === q.id ? { ...x, options: x.options.map((op) => op.id === o.id ? { ...op, text: e.target.value } : op) } : x))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1"><Label className="text-xs">Points</Label><Input type="number" value={q.points} onChange={(e) => setQuizQs((qs) => qs.map((x) => x.id === q.id ? { ...x, points: Number(e.target.value) } : x))} /></div>
                <div className="flex-1 space-y-1"><Label className="text-xs">Time limit (s)</Label><Input type="number" value={q.timeLimit} onChange={(e) => setQuizQs((qs) => qs.map((x) => x.id === q.id ? { ...x, timeLimit: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => setQuizQs((qs) => [...qs, { id: genId(), questionText: `Question ${qs.length+1}`, options: ['A','B','C','D'].map((l) => ({ id: genId(), text: `Answer ${l}` })), correctAnswer: '', points: 10, timeLimit: 20 }])}>+ Add Question</Button>
        </div>
      );
    }

    if (type === 'emoji_reaction') {
      return (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Participants choose from these emojis:</p>
          <div className="flex flex-wrap gap-3">
            {emojis.map((e) => <div key={e} className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-2xl">{e}</div>)}
          </div>
        </div>
      );
    }

    // Default: options list
    return (
      <div className="space-y-3">
        <Label>Options</Label>
        {options.map((opt, i) => (
          <div key={opt.id} className="flex gap-2 items-center">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input value={opt.text} onChange={(e) => updateOption(opt.id, e.target.value)} placeholder={`Option ${i+1}`} />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => removeOption(opt.id)}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
            <Plus className="w-4 h-4" />Add option
          </Button>
        )}
      </div>
    );
  };

  // ── Step 3: Settings ──
  const SettingsStep = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <div className="text-sm font-medium text-foreground">Show live results</div>
          <div className="text-xs text-muted-foreground">Participants see results while voting</div>
        </div>
        <Switch checked={showResults} onCheckedChange={setShowResults} />
      </div>
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <div className="text-sm font-medium text-foreground">One vote per person</div>
          <div className="text-xs text-muted-foreground">Prevent duplicate submissions</div>
        </div>
        <Switch checked={oneVote} onCheckedChange={setOneVote} />
      </div>
      {['multiple_choice', 'image_choice'].includes(type) && (
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm font-medium text-foreground">Allow multiple selections</div>
            <div className="text-xs text-muted-foreground">Participants can pick more than one</div>
          </div>
          <Switch checked={multiSelect} onCheckedChange={setMultiSelect} />
        </div>
      )}
      <div className="space-y-1.5 py-3">
        <Label>Auto-close after (seconds, optional)</Label>
        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 60" className="max-w-[160px]" />
      </div>
    </div>
  );

  // ── Step 4: Review ──
  const ReviewStep = () => (
    <div className="space-y-4">
      <div className="p-4 bg-accent/50 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <div className="font-semibold text-foreground">{meta.label}</div>
            <div className="font-playfair text-lg font-bold text-foreground mt-0.5">{question}</div>
          </div>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {options.length > 0 && !['word_cloud','open_text','qa','quiz','rating','slider','fill_blank','nps','matrix','heatmap','live_matching','emoji_reaction'].includes(type) && (
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground uppercase tracking-wide">Options ({options.length})</Label>
          <div className="space-y-1">
            {options.map((o) => <div key={o.id} className="text-sm py-1.5 px-3 bg-card border border-border rounded-lg">{o.text}</div>)}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-card border border-border rounded-lg">
          <div className="text-xs text-muted-foreground mb-0.5">Show results</div>
          <div className="font-medium">{showResults ? 'Yes' : 'No'}</div>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg">
          <div className="text-xs text-muted-foreground mb-0.5">One vote</div>
          <div className="font-medium">{oneVote ? 'Yes' : 'No'}</div>
        </div>
        {duration && (
          <div className="p-3 bg-card border border-border rounded-lg">
            <div className="text-xs text-muted-foreground mb-0.5">Duration</div>
            <div className="font-medium">{duration}s</div>
          </div>
        )}
      </div>
    </div>
  );

  const STEP_CONTENT = [TypeStep, QuestionStep, OptionsStep, SettingsStep, ReviewStep];
  const CurrentStep = STEP_CONTENT[step];

  return (
    <DashboardLayout title="Create Poll">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-terracotta text-white' :
                  i === step ? 'bg-terracotta text-white ring-4 ring-terracotta/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 transition-all ${i < step ? 'bg-terracotta' : 'bg-border'}`} style={{ width: '40px' }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm min-h-[300px]"
          >
            <CurrentStep />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" />Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-2">
              Next<ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {loading ? 'Creating…' : 'Create Poll'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
