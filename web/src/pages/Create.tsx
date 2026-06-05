import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { createPoll } from "@/lib/api";
import { POLL_TYPE_META } from "@/lib/types";
import type { PollType } from "@/lib/types";
import { toast } from "sonner";

const STEPS = ["Type", "Question", "Options", "Settings", "Review"];

const FREE_TYPES: PollType[] = ["multiple_choice","word_cloud","qa","quiz","rating"];
const STARTER_TYPES: PollType[] = ["ranking","open_text","image_choice","nps","matrix","true_false","emoji_reaction"];
const PRO_TYPES: PollType[] = ["slider","fill_blank","bracket","prioritization","heatmap","poll_series","countdown_vote","live_matching"];

export default function Create() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<PollType>("multiple_choice");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([
    { id: nanoid(), text: "Option A" },
    { id: nanoid(), text: "Option B" },
  ]);
  const [matrixRows, setMatrixRows] = useState([{ id: nanoid(), label: "Row 1" }, { id: nanoid(), label: "Row 2" }]);
  const [matrixCols, setMatrixCols] = useState([{ id: nanoid(), label: "Agree" }, { id: nanoid(), label: "Neutral" }, { id: nanoid(), label: "Disagree" }]);
  const [matchingPairs, setMatchingPairs] = useState([{ id: nanoid(), left: "Item 1", right: "Match 1" }, { id: nanoid(), left: "Item 2", right: "Match 2" }]);
  const [sentence, setSentence] = useState("The best way to learn is ___.");
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [sliderLabel, setSliderLabel] = useState("");
  const [duration, setDuration] = useState("");
  const [multiSelect, setMultiSelect] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [oneVote, setOneVote] = useState(true);
  const [heatmapUrl, setHeatmapUrl] = useState("https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80");
  const [quizQuestions, setQuizQuestions] = useState([{
    id: nanoid(), questionText: "Question 1", options: [
      { id: nanoid(), text: "Answer A" }, { id: nanoid(), text: "Answer B" },
      { id: nanoid(), text: "Answer C" }, { id: nanoid(), text: "Answer D" },
    ], correctAnswer: "", points: 10, timeLimit: 20
  }]);

  const meta = POLL_TYPE_META[type];

  const addOption = () => setOptions(o => [...o, { id: nanoid(), text: `Option ${String.fromCharCode(65 + o.length)}` }]);
  const removeOption = (id: string) => setOptions(o => o.filter(x => x.id !== id));
  const updateOption = (id: string, text: string) => setOptions(o => o.map(x => x.id === id ? { ...x, text } : x));

  const addQuizQ = () => setQuizQuestions(q => [...q, {
    id: nanoid(), questionText: `Question ${q.length + 1}`,
    options: ["A","B","C","D"].map(l => ({ id: nanoid(), text: `Answer ${l}` })),
    correctAnswer: "", points: 10, timeLimit: 20
  }]);

  const canProceed = () => {
    if (step === 1 && !question.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!question.trim()) { toast.error("Question is required"); return; }
    setLoading(true);
    try {
      const userId = (() => { try { return JSON.parse(localStorage.getItem("omnipoll_auth") || "null")?.user?.id || ""; } catch { return ""; } })();
      const body = {
        title: question,
        question,
        description,
        type,
        creatorId: userId,
        options: ["multiple_choice","image_choice","true_false","ranking","emoji_reaction","bracket","prioritization","countdown_vote"].includes(type) ? options : [],
        quizQuestions: type === "quiz" ? quizQuestions : [],
        settings: {
          duration: duration ? Number(duration) : null,
          multiSelect, showResults, oneVote,
          min: sliderMin, max: sliderMax, labelLeft: sliderLabel,
          sentence,
          matrixRows: type === "matrix" ? matrixRows : [],
          matrixColumns: type === "matrix" ? matrixCols : [],
          matchingPairs: type === "live_matching" ? matchingPairs : [],
          imageUrl: type === "heatmap" ? heatmapUrl : undefined,
        },
      };
      const data = await createPoll(body);
      toast.success("Poll created! 🎉");
      navigate(`/poll/${data.poll.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create poll");
    } finally { setLoading(false); }
  };

  const TypeGrid = ({ types, planLabel }: { types: PollType[]; planLabel: string }) => (
    <div className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${planLabel === "FREE" ? "bg-green-100 text-green-700" : planLabel === "STARTER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{planLabel}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {types.map(t => {
          const m = POLL_TYPE_META[t];
          const active = type === t;
          return (
            <button key={t} onClick={() => setType(t)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${active ? "border-terracotta bg-terracotta/5 shadow-sm" : "border-border hover:border-terracotta/40 hover:bg-accent/50"}`}>
              {active && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-terracotta flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-xs font-semibold text-foreground leading-snug">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderOptions = () => {
    if (["word_cloud","open_text","qa","rating","nps","slider","fill_blank","heatmap"].includes(type)) {
      return (
        <div className="space-y-4">
          {type === "fill_blank" && (
            <div>
              <Label>Sentence with blank (use ___ for blank)</Label>
              <Input value={sentence} onChange={e => setSentence(e.target.value)} className="mt-1" placeholder="The best way to learn is ___." />
            </div>
          )}
          {type === "slider" && (
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Min</Label><Input type="number" value={sliderMin} onChange={e => setSliderMin(Number(e.target.value))} className="mt-1" /></div>
              <div><Label>Max</Label><Input type="number" value={sliderMax} onChange={e => setSliderMax(Number(e.target.value))} className="mt-1" /></div>
              <div><Label>Label (optional)</Label><Input value={sliderLabel} onChange={e => setSliderLabel(e.target.value)} className="mt-1" placeholder="0 = Low, 100 = High" /></div>
            </div>
          )}
          {type === "heatmap" && (
            <div><Label>Image URL for heatmap</Label>
              <Input value={heatmapUrl} onChange={e => setHeatmapUrl(e.target.value)} className="mt-1" placeholder="https://..." />
              {heatmapUrl && <img src={heatmapUrl} alt="preview" className="mt-2 rounded-lg max-h-40 object-cover border border-border" />}
            </div>
          )}
          {["word_cloud","open_text","qa","rating","nps"].includes(type) && (
            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/40 rounded-xl border border-dashed border-border">
              <span className="text-3xl block mb-2">{meta.icon}</span>
              <strong>{meta.label}</strong> — no fixed options needed.<br />Participants respond freely.
            </div>
          )}
        </div>
      );
    }

    if (type === "matrix") {
      return (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Rows (statements)</Label>
            {matrixRows.map((row, i) => (
              <div key={row.id} className="flex gap-2 mb-2">
                <Input value={row.label} onChange={e => setMatrixRows(r => r.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder={`Row ${i+1}`} />
                <Button variant="ghost" size="icon" onClick={() => setMatrixRows(r => r.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMatrixRows(r => [...r, { id: nanoid(), label: `Row ${r.length+1}` }])} className="gap-1.5"><Plus className="w-3 h-3" />Add Row</Button>
          </div>
          <div>
            <Label className="mb-2 block">Columns (scale points)</Label>
            {matrixCols.map((col, i) => (
              <div key={col.id} className="flex gap-2 mb-2">
                <Input value={col.label} onChange={e => setMatrixCols(c => c.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder={`Column ${i+1}`} />
                <Button variant="ghost" size="icon" onClick={() => setMatrixCols(c => c.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMatrixCols(c => [...c, { id: nanoid(), label: `Col ${c.length+1}` }])} className="gap-1.5"><Plus className="w-3 h-3" />Add Column</Button>
          </div>
        </div>
      );
    }

    if (type === "live_matching") {
      return (
        <div>
          <Label className="mb-2 block">Matching Pairs</Label>
          {matchingPairs.map((pair, i) => (
            <div key={pair.id} className="flex gap-2 mb-2 items-center">
              <Input value={pair.left} onChange={e => setMatchingPairs(p => p.map((x, j) => j === i ? { ...x, left: e.target.value } : x))} placeholder="Left item" />
              <span className="text-muted-foreground font-bold">↔</span>
              <Input value={pair.right} onChange={e => setMatchingPairs(p => p.map((x, j) => j === i ? { ...x, right: e.target.value } : x))} placeholder="Right match" />
              <Button variant="ghost" size="icon" onClick={() => setMatchingPairs(p => p.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setMatchingPairs(p => [...p, { id: nanoid(), left: `Item ${p.length+1}`, right: `Match ${p.length+1}` }])} className="gap-1.5"><Plus className="w-3 h-3" />Add Pair</Button>
        </div>
      );
    }

    if (type === "quiz") {
      return (
        <div className="space-y-4">
          {quizQuestions.map((q, qi) => (
            <div key={q.id} className="border border-border rounded-xl p-4 bg-accent/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Question {qi+1}</span>
                <Button variant="ghost" size="sm" onClick={() => setQuizQuestions(prev => prev.filter((_, i) => i !== qi))} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
              <Input value={q.questionText} onChange={e => setQuizQuestions(prev => prev.map((x, i) => i === qi ? { ...x, questionText: e.target.value } : x))} placeholder="Question text" className="mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={opt.id} className={`flex gap-1 items-center p-2 rounded-lg border-2 cursor-pointer transition-all ${q.correctAnswer === opt.id ? "border-green-500 bg-green-50" : "border-border"}`}
                    onClick={() => setQuizQuestions(prev => prev.map((x, i) => i === qi ? { ...x, correctAnswer: opt.id } : x))}>
                    <span className="text-xs font-bold text-muted-foreground mr-1">{String.fromCharCode(65+oi)}</span>
                    <Input value={opt.text} onChange={e => {
                      const newOpts = q.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o);
                      setQuizQuestions(prev => prev.map((x, i) => i === qi ? { ...x, options: newOpts } : x));
                    }} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" onClick={e => e.stopPropagation()} placeholder="Answer..." />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>⏱ Time limit: <Input type="number" value={q.timeLimit} onChange={e => setQuizQuestions(prev => prev.map((x, i) => i === qi ? { ...x, timeLimit: Number(e.target.value) } : x))} className="inline w-16 h-6 text-xs px-1" />s</span>
                <span>🏆 Points: <Input type="number" value={q.points} onChange={e => setQuizQuestions(prev => prev.map((x, i) => i === qi ? { ...x, points: Number(e.target.value) } : x))} className="inline w-16 h-6 text-xs px-1" /></span>
              </div>
              {q.correctAnswer && <div className="mt-2 text-xs text-green-600 font-medium">✓ Correct answer selected</div>}
            </div>
          ))}
          <Button variant="outline" onClick={addQuizQ} className="gap-1.5 w-full"><Plus className="w-3.5 h-3.5" />Add Question</Button>
        </div>
      );
    }

    // Default: options list
    return (
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex gap-2 items-center group">
            <div className="w-7 h-7 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center flex-shrink-0">{String.fromCharCode(65+i)}</div>
            <Input value={opt.text} onChange={e => updateOption(opt.id, e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`} />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(opt.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        ))}
        {type !== "true_false" && (
          <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5 mt-2 w-full border-dashed">
            <Plus className="w-3.5 h-3.5" />Add Option
          </Button>
        )}
      </div>
    );
  };

  const steps = [
    // Step 0: Type
    <div className="space-y-2">
      <h2 className="text-2xl font-playfair font-bold text-foreground">Choose poll type</h2>
      <p className="text-muted-foreground text-sm mb-6">Select the interaction style that fits your audience.</p>
      <TypeGrid types={FREE_TYPES} planLabel="FREE" />
      <TypeGrid types={STARTER_TYPES} planLabel="STARTER" />
      <TypeGrid types={PRO_TYPES} planLabel="PRO" />
    </div>,

    // Step 1: Question
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{meta.icon}</span>
        <div>
          <h2 className="text-2xl font-playfair font-bold text-foreground">Your question</h2>
          <p className="text-sm text-muted-foreground">{meta.label} — {meta.desc}</p>
        </div>
      </div>
      <div>
        <Label htmlFor="question">Question *</Label>
        <Input id="question" value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="What would you like to ask?" className="mt-1 text-base h-12" autoFocus />
      </div>
      <div>
        <Label htmlFor="desc">Description (optional)</Label>
        <Input id="desc" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Add context for participants..." className="mt-1" />
      </div>
    </div>,

    // Step 2: Options
    <div className="max-w-xl">
      <h2 className="text-2xl font-playfair font-bold text-foreground mb-1">
        {type === "quiz" ? "Quiz questions" : "Answer options"}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {type === "quiz" ? "Add questions and mark correct answers." : "Define what participants can choose from."}
      </p>
      {renderOptions()}
    </div>,

    // Step 3: Settings
    <div className="space-y-5 max-w-xl">
      <h2 className="text-2xl font-playfair font-bold text-foreground">Poll settings</h2>
      <div>
        <Label>Duration (minutes, optional)</Label>
        <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Leave blank = no limit" className="mt-1 w-48" />
      </div>
      {["multiple_choice","ranking","image_choice"].includes(type) && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-5 rounded-full transition-colors ${multiSelect ? "bg-terracotta" : "bg-muted"}`}
            onClick={() => setMultiSelect(m => !m)}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${multiSelect ? "left-5" : "left-0.5"}`} />
          </div>
          <span className="text-sm text-foreground">Allow multiple selections</span>
        </label>
      )}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className={`relative w-10 h-5 rounded-full transition-colors ${showResults ? "bg-terracotta" : "bg-muted"}`}
          onClick={() => setShowResults(s => !s)}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showResults ? "left-5" : "left-0.5"}`} />
        </div>
        <span className="text-sm text-foreground">Show results to participants</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className={`relative w-10 h-5 rounded-full transition-colors ${oneVote ? "bg-terracotta" : "bg-muted"}`}
          onClick={() => setOneVote(v => !v)}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${oneVote ? "left-5" : "left-0.5"}`} />
        </div>
        <span className="text-sm text-foreground">One response per participant</span>
      </label>
    </div>,

    // Step 4: Review
    <div className="max-w-xl space-y-4">
      <h2 className="text-2xl font-playfair font-bold text-foreground">Review & launch</h2>
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <span className="font-semibold text-foreground">{meta.label}</span>
        </div>
        <div className="text-lg font-semibold text-foreground border-l-4 border-terracotta pl-3">{question || <span className="text-muted-foreground italic">No question set</span>}</div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {options.length > 0 && !["word_cloud","open_text","qa","rating","nps","slider","fill_blank","heatmap","matrix","live_matching"].includes(type) && (
          <div className="space-y-1">
            {options.slice(0, 4).map((o, i) => (
              <div key={o.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center">{String.fromCharCode(65+i)}</span>
                <span className="text-foreground">{o.text}</span>
              </div>
            ))}
            {options.length > 4 && <div className="text-xs text-muted-foreground">+{options.length-4} more options</div>}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs pt-1">
          {duration && <span className="bg-muted px-2 py-1 rounded-md">⏱ {duration}min</span>}
          {multiSelect && <span className="bg-muted px-2 py-1 rounded-md">✓ Multi-select</span>}
          <span className={`px-2 py-1 rounded-md ${showResults ? "bg-green-100 text-green-700" : "bg-muted"}`}>{showResults ? "👁 Results visible" : "🔒 Results hidden"}</span>
          <span className={`px-2 py-1 rounded-md ${oneVote ? "bg-blue-100 text-blue-700" : "bg-muted"}`}>{oneVote ? "1️⃣ One vote" : "♾️ Multi-vote"}</span>
        </div>
      </div>
    </div>,
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-0 mb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? "bg-terracotta text-white" : i === step ? "bg-terracotta text-white ring-4 ring-terracotta/20" : "bg-muted text-muted-foreground"}`}>
                    {i < step ? <Check className="w-4 h-4" /> : i+1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${i === step ? "text-terracotta font-medium" : "text-muted-foreground"}`}>{s}</span>
                </div>
                {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${i < step ? "bg-terracotta" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => setStep(s => s-1)} disabled={step === 0} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" />Back
          </Button>
          {step < STEPS.length-1 ? (
            <Button onClick={() => { if (!canProceed()) { toast.error("Please fill in the question first"); return; } setStep(s => s+1); }} className="bg-terracotta hover:bg-terracotta/90 gap-1.5">
              Continue<ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-terracotta hover:bg-terracotta/90 gap-1.5 min-w-[140px]">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" />Launch Poll</>}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
