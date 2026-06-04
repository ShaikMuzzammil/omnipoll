import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2, Settings,
  Eye, Sparkles, Clock, Shield, GripVertical, ArrowRight
} from "lucide-react";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { useCreatePoll } from "../hooks/usePolls";
import { uid } from "../lib/utils";
import { POLL_TYPE_CONFIG, PLAN_LIMITS } from "../types";
import { useAuthStore } from "../store/authStore";
import type { PollType, PollOption, QuizQuestion } from "../types";

const ALL_TYPES = Object.entries(POLL_TYPE_CONFIG).map(([id, cfg]) => ({
  id: id as PollType, ...cfg
}));

const DOMAIN_FILTERS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
];

function PollTypeCard({ type, selected, onClick, planLimit }: {
  type: typeof ALL_TYPES[0]; selected: boolean; onClick: () => void; planLimit: boolean;
}) {
  const planBadge = { free: "Free", starter: "Starter", pro: "Pro", enterprise: "Enterprise" };
  const planColor = { free: "bg-green-100 text-green-700", starter: "bg-blue-100 text-blue-700", pro: "bg-purple-100 text-purple-700", enterprise: "bg-gray-100 text-gray-700" };
  return (
    <button onClick={onClick} className={`poll-type-card text-left ${selected ? "selected" : ""} ${planLimit ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{type.icon}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${planColor[type.plan]}`}>{planBadge[type.plan]}</span>
      </div>
      <h3 className="font-semibold text-sm text-charcoal dark:text-white mb-1">{type.label}</h3>
      <p className="text-xs text-slate dark:text-gray-400 leading-relaxed">{type.description}</p>
      {selected && <div className="absolute top-2 right-2"><CheckCircle2 size={16} className="text-terracotta" /></div>}
      {planLimit && <div className="absolute inset-0 bg-white/30 dark:bg-black/30 rounded-2xl flex items-center justify-center"><span className="text-xs font-bold text-slate bg-white/90 dark:bg-black/70 px-2 py-1 rounded-lg">Upgrade</span></div>}
    </button>
  );
}

function OptionEditor({ options, onChange, showImage = false }: {
  options: PollOption[]; onChange: (opts: PollOption[]) => void; showImage?: boolean;
}) {
  const add = () => onChange([...options, { id: uid(), text: "", order: options.length }]);
  const remove = (id: string) => onChange(options.filter(o => o.id !== id));
  const update = (id: string, field: keyof PollOption, value: string) =>
    onChange(options.map(o => o.id === id ? { ...o, [field]: value } : o));

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <GripVertical size={16} className="text-slate/40 shrink-0" />
          <span className="text-xs font-mono text-slate/60 w-5">{i + 1}</span>
          {showImage && (
            <input type="url" value={opt.imageUrl || ""} onChange={(e) => update(opt.id, "imageUrl", e.target.value)}
              className="input-field text-sm w-40 shrink-0" placeholder="Image URL" />
          )}
          <input type="text" value={opt.text} onChange={(e) => update(opt.id, "text", e.target.value)}
            className="input-field text-sm flex-1" placeholder={`Option ${i + 1}`} />
          {options.length > 2 && (
            <button onClick={() => remove(opt.id)} className="text-slate hover:text-crimson transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {options.length < 20 && (
        <button onClick={add} className="flex items-center gap-2 text-sm text-terracotta hover:text-terracotta-dark transition-colors py-1">
          <Plus size={14} /> Add option
        </button>
      )}
    </div>
  );
}

function QuizEditor({ questions, onChange }: { questions: QuizQuestion[]; onChange: (qs: QuizQuestion[]) => void }) {
  const addQ = () => onChange([...questions, {
    id: uid(), questionText: "", correctAnswer: "", points: 100, timeLimit: 30,
    options: [{ id: uid(), text: "" }, { id: uid(), text: "" }, { id: uid(), text: "" }, { id: uid(), text: "" }]
  }]);
  const removeQ = (id: string) => onChange(questions.filter(q => q.id !== id));
  const updateQ = (id: string, field: keyof QuizQuestion, value: unknown) =>
    onChange(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  const updateOpt = (qId: string, oId: string, text: string) =>
    onChange(questions.map(q => q.id === qId ? { ...q, options: q.options.map(o => o.id === oId ? { ...o, text } : o) } : q));

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="bg-parchment dark:bg-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-charcoal dark:text-white">Question {qi + 1}</span>
            {questions.length > 1 && <button onClick={() => removeQ(q.id)} className="text-slate hover:text-crimson"><Trash2 size={14} /></button>}
          </div>
          <input type="text" value={q.questionText} onChange={(e) => updateQ(q.id, "questionText", e.target.value)}
            className="input-field text-sm" placeholder="What is the question?" />
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={opt.id} className={`flex items-center gap-2 ${q.correctAnswer === opt.id ? "ring-2 ring-sage rounded-xl" : ""}`}>
                <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt.id}
                  onChange={() => updateQ(q.id, "correctAnswer", opt.id)} className="accent-sage shrink-0" />
                <input type="text" value={opt.text} onChange={(e) => updateOpt(q.id, opt.id, e.target.value)}
                  className="input-field text-sm" placeholder={`Option ${oi + 1}`} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5 text-slate dark:text-gray-400">
              <Clock size={13} /> Time:
              <input type="number" value={q.timeLimit} onChange={(e) => updateQ(q.id, "timeLimit", Number(e.target.value))}
                className="input-field text-sm w-20" min={5} max={300} />s
            </label>
            <label className="flex items-center gap-1.5 text-slate dark:text-gray-400">
              Points:
              <input type="number" value={q.points} onChange={(e) => updateQ(q.id, "points", Number(e.target.value))}
                className="input-field text-sm w-20" min={1} max={1000} />
            </label>
          </div>
        </div>
      ))}
      <button onClick={addQ} className="flex items-center gap-2 text-sm text-terracotta hover:text-terracotta-dark transition-colors">
        <Plus size={14} /> Add question
      </button>
    </div>
  );
}

function MatrixEditor({ rows, columns, onRowsChange, onColumnsChange }: {
  rows: string[]; columns: string[]; onRowsChange: (r: string[]) => void; onColumnsChange: (c: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium text-charcoal dark:text-white mb-2">Rows (items to rate)</p>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={r} onChange={(e) => { const nr = [...rows]; nr[i] = e.target.value; onRowsChange(nr); }}
                className="input-field text-sm" placeholder={`Row ${i + 1}`} />
              {rows.length > 1 && <button onClick={() => onRowsChange(rows.filter((_, j) => j !== i))} className="text-slate hover:text-crimson"><Trash2 size={14} /></button>}
            </div>
          ))}
          {rows.length < 10 && <button onClick={() => onRowsChange([...rows, ""])} className="text-sm text-terracotta"><Plus size={14} className="inline mr-1" />Add row</button>}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-charcoal dark:text-white mb-2">Columns (scale labels)</p>
        <div className="space-y-2">
          {columns.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={c} onChange={(e) => { const nc = [...columns]; nc[i] = e.target.value; onColumnsChange(nc); }}
                className="input-field text-sm" placeholder={`Column ${i + 1}`} />
              {columns.length > 2 && <button onClick={() => onColumnsChange(columns.filter((_, j) => j !== i))} className="text-slate hover:text-crimson"><Trash2 size={14} /></button>}
            </div>
          ))}
          {columns.length < 7 && <button onClick={() => onColumnsChange([...columns, ""])} className="text-sm text-terracotta"><Plus size={14} className="inline mr-1" />Add column</button>}
        </div>
      </div>
    </div>
  );
}

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mutateAsync: createPoll } = useCreatePoll();
  const [step, setStep] = useState(0);
  const [pollType, setPollType] = useState<PollType>("multiple_choice");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: uid(), text: "Option A", order: 0 },
    { id: uid(), text: "Option B", order: 1 },
    { id: uid(), text: "Option C", order: 2 },
  ]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([{
    id: uid(), questionText: "", correctAnswer: "", points: 100, timeLimit: 30,
    options: [{ id: uid(), text: "A" }, { id: uid(), text: "B" }, { id: uid(), text: "C" }, { id: uid(), text: "D" }]
  }]);
  const [matrixRows, setMatrixRows] = useState(["Quality", "Speed", "Price", "Support"]);
  const [matrixCols, setMatrixCols] = useState(["Poor", "Fair", "Good", "Excellent"]);
  const [blankTemplate, setBlankTemplate] = useState("The best part of this event was ___.");
  const [matchPairs, setMatchPairs] = useState([
    { id: uid(), left: "Apple", right: "Fruit" },
    { id: uid(), left: "Python", right: "Language" },
  ]);
  const [settings, setSettings] = useState({
    duration: null as number | null, showResults: true, oneVote: true,
    multiSelect: false, maxSelections: 3, min: 1, max: 5, step: 1,
    labelLeft: "Strongly Disagree", labelRight: "Strongly Agree",
    totalPoints: 100, countdownSeconds: 30,
  });
  const [publishing, setPublishing] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>("all");

  const planLevel = { free: 0, starter: 1, pro: 2, enterprise: 3 };
  const userPlanLevel = planLevel[user?.plan || "free"];
  const canUsePollType = (plan: string) => userPlanLevel >= planLevel[plan as keyof typeof planLevel];

  const STEPS = ["Poll Type", "Question", "Settings", "Review"];

  const handlePublish = async () => {
    if (!title.trim()) { toast.error("Please add a title"); return; }
    if (!question.trim() && !["quiz"].includes(pollType)) { toast.error("Please add a question"); return; }
    setPublishing(true);
    try {
      const body = {
        title, description, type: pollType, question,
        options: ["multiple_choice", "image_choice", "ranking", "emoji_reaction", "countdown_vote", "true_false"].includes(pollType) ? options : [],
        quizQuestions: pollType === "quiz" ? quizQuestions : [],
        settings: {
          ...settings,
          matrixRows: pollType === "matrix" ? matrixRows : undefined,
          matrixColumns: pollType === "matrix" ? matrixCols : undefined,
          blankTemplate: pollType === "fill_blank" ? blankTemplate : undefined,
          matchPairs: pollType === "live_matching" ? matchPairs : undefined,
        },
        status: "live",
        creatorId: user?.id,
      };
      const { poll } = await createPoll(body);
      navigate(`/dashboard/${poll.id}/present`);
    } catch (err: unknown) {
      // Demo mode fallback
      const demoId = uid();
      toast.success("Poll created! (Demo mode)");
      navigate(`/dashboard/${demoId}/present`);
    } finally { setPublishing(false); }
  };

  const renderQuestionSection = () => {
    switch (pollType) {
      case "quiz":
        return <QuizEditor questions={quizQuestions} onChange={setQuizQuestions} />;
      case "matrix":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Matrix question</label>
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="How would you rate the following?" />
            </div>
            <MatrixEditor rows={matrixRows} columns={matrixCols} onRowsChange={setMatrixRows} onColumnsChange={setMatrixCols} />
          </div>
        );
      case "fill_blank":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Sentence template (use ___ for blank)</label>
              <input type="text" value={blankTemplate} onChange={(e) => setBlankTemplate(e.target.value)} className="input-field" placeholder="The ___ is the most important part." />
            </div>
            <p className="text-xs text-slate dark:text-gray-400 bg-parchment dark:bg-white/5 rounded-xl p-3">
              Preview: <em>{blankTemplate.replace("___", "[answer]")}</em>
            </p>
          </div>
        );
      case "nps":
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="How likely are you to recommend us to a friend or colleague?" />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate mb-1 block">Label for 0</label>
                <input type="text" value={settings.labelLeft} onChange={(e) => setSettings(s => ({ ...s, labelLeft: e.target.value }))} className="input-field text-sm" placeholder="Not at all likely" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate mb-1 block">Label for 10</label>
                <input type="text" value={settings.labelRight} onChange={(e) => setSettings(s => ({ ...s, labelRight: e.target.value }))} className="input-field text-sm" placeholder="Extremely likely" />
              </div>
            </div>
          </div>
        );
      case "live_matching":
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="Match the following items:" />
            <div className="space-y-2">
              {matchPairs.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <input type="text" value={p.left} onChange={(e) => setMatchPairs(ps => ps.map(mp => mp.id === p.id ? { ...mp, left: e.target.value } : mp))}
                    className="input-field text-sm flex-1" placeholder={`Left ${i + 1}`} />
                  <span className="text-slate">↔</span>
                  <input type="text" value={p.right} onChange={(e) => setMatchPairs(ps => ps.map(mp => mp.id === p.id ? { ...mp, right: e.target.value } : mp))}
                    className="input-field text-sm flex-1" placeholder={`Right ${i + 1}`} />
                  {matchPairs.length > 2 && <button onClick={() => setMatchPairs(ps => ps.filter(mp => mp.id !== p.id))} className="text-slate hover:text-crimson"><Trash2 size={14} /></button>}
                </div>
              ))}
              <button onClick={() => setMatchPairs(ps => [...ps, { id: uid(), left: "", right: "" }])} className="text-sm text-terracotta"><Plus size={14} className="inline mr-1" />Add pair</button>
            </div>
          </div>
        );
      case "multiple_choice":
      case "ranking":
      case "image_choice":
      case "emoji_reaction":
      case "countdown_vote":
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="Enter your question..." />
            <OptionEditor options={options} onChange={setOptions} showImage={pollType === "image_choice"} />
          </div>
        );
      case "true_false":
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="State a fact or claim..." />
            <div className="flex gap-3">
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700 text-center font-semibold text-green-700 dark:text-green-400">✅ True</div>
              <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700 text-center font-semibold text-red-700 dark:text-red-400">❌ False</div>
            </div>
          </div>
        );
      case "slider":
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="Enter your question..." />
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate mb-1 block">Min</label><input type="number" value={settings.min} onChange={(e) => setSettings(s => ({ ...s, min: Number(e.target.value) }))} className="input-field text-sm" /></div>
              <div><label className="text-xs text-slate mb-1 block">Max</label><input type="number" value={settings.max} onChange={(e) => setSettings(s => ({ ...s, max: Number(e.target.value) }))} className="input-field text-sm" /></div>
              <div><label className="text-xs text-slate mb-1 block">Step</label><input type="number" value={settings.step} onChange={(e) => setSettings(s => ({ ...s, step: Number(e.target.value) }))} className="input-field text-sm" /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-xs text-slate mb-1 block">Left label</label><input type="text" value={settings.labelLeft} onChange={(e) => setSettings(s => ({ ...s, labelLeft: e.target.value }))} className="input-field text-sm" /></div>
              <div className="flex-1"><label className="text-xs text-slate mb-1 block">Right label</label><input type="text" value={settings.labelRight} onChange={(e) => setSettings(s => ({ ...s, labelRight: e.target.value }))} className="input-field text-sm" /></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" placeholder="Enter your question..." />
          </div>
        );
    }
  };

  const config = POLL_TYPE_CONFIG[pollType];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-3xl font-bold text-charcoal dark:text-white">Create Poll</h1>
          <span className="text-sm text-slate dark:text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 flex items-center gap-2`}>
              <button onClick={() => i < step && setStep(i)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? "bg-sage text-white cursor-pointer" : i === step ? "bg-terracotta text-white" : "bg-clay/20 dark:bg-white/10 text-slate cursor-default"}`}>
                {i < step ? "✓" : i + 1}
              </button>
              <span className={`text-sm font-medium ${i <= step ? "text-charcoal dark:text-white" : "text-slate dark:text-gray-500"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-sage" : "bg-clay/20 dark:bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {step === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {DOMAIN_FILTERS.map(f => (
                    <button key={f.id} onClick={() => setPlanFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${planFilter === f.id ? "bg-terracotta text-white" : "bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 text-slate"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ALL_TYPES.filter(t => planFilter === "all" || t.plan === planFilter).map(type => (
                    <PollTypeCard key={type.id} type={type} selected={pollType === type.id}
                      onClick={() => setPollType(type.id)}
                      planLimit={!canUsePollType(type.plan)} />
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-clay/10 dark:border-white/5">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h2 className="font-playfair text-xl font-bold text-charcoal dark:text-white">{config.label}</h2>
                    <p className="text-sm text-slate dark:text-gray-400">{config.description}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal dark:text-white mb-2">Poll title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Give your poll a descriptive title..." autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal dark:text-white mb-2">Description (optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={2} placeholder="Provide context for participants..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal dark:text-white mb-3">
                    {pollType === "quiz" ? "Quiz questions" : "Question & options"}
                  </label>
                  {renderQuestionSection()}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={18} className="text-slate" />
                  <h2 className="font-playfair text-xl font-bold text-charcoal dark:text-white">Poll Settings</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-charcoal dark:text-white flex items-center gap-2"><Clock size={14} /> Timing</h3>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-slate dark:text-gray-400">Duration limit</span>
                      <select value={settings.duration || ""} onChange={(e) => setSettings(s => ({ ...s, duration: e.target.value ? Number(e.target.value) : null }))}
                        className="input-field text-sm w-40">
                        <option value="">Unlimited</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="600">10 minutes</option>
                        <option value="1800">30 minutes</option>
                        <option value="3600">1 hour</option>
                      </select>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-charcoal dark:text-white flex items-center gap-2"><Eye size={14} /> Display</h3>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-slate dark:text-gray-400">Show results to participants</span>
                      <button onClick={() => setSettings(s => ({ ...s, showResults: !s.showResults }))}
                        className={`w-11 h-6 rounded-full transition-colors ${settings.showResults ? "bg-terracotta" : "bg-clay/30 dark:bg-white/20"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${settings.showResults ? "translate-x-5" : ""}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-slate dark:text-gray-400">One vote per participant</span>
                      <button onClick={() => setSettings(s => ({ ...s, oneVote: !s.oneVote }))}
                        className={`w-11 h-6 rounded-full transition-colors ${settings.oneVote ? "bg-terracotta" : "bg-clay/30 dark:bg-white/20"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${settings.oneVote ? "translate-x-5" : ""}`} />
                      </button>
                    </label>
                    {["multiple_choice", "image_choice", "ranking"].includes(pollType) && (
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-slate dark:text-gray-400">Allow multiple selections</span>
                        <button onClick={() => setSettings(s => ({ ...s, multiSelect: !s.multiSelect }))}
                          className={`w-11 h-6 rounded-full transition-colors ${settings.multiSelect ? "bg-terracotta" : "bg-clay/30 dark:bg-white/20"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${settings.multiSelect ? "translate-x-5" : ""}`} />
                        </button>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card p-6 space-y-6">
                <h2 className="font-playfair text-xl font-bold text-charcoal dark:text-white">Review & Publish</h2>
                <div className="bg-parchment dark:bg-white/5 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div>
                      <p className="text-lg font-bold text-charcoal dark:text-white">{title || "Untitled Poll"}</p>
                      <p className="text-sm text-slate dark:text-gray-400">{config.label}</p>
                    </div>
                  </div>
                  {question && <p className="text-sm text-charcoal dark:text-gray-300 border-t border-clay/10 dark:border-white/10 pt-3">{question}</p>}
                  {["multiple_choice", "true_false", "ranking"].includes(pollType) && (
                    <div className="flex flex-wrap gap-2 border-t border-clay/10 dark:border-white/10 pt-3">
                      {options.map(o => <span key={o.id} className="text-xs bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 px-2 py-1 rounded-lg text-slate dark:text-gray-400">{o.text || "Empty"}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700">
                  <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">Ready to go live!</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Your poll will be published immediately and participants can join with the generated code.</p>
                  </div>
                </div>
                <button onClick={handlePublish} disabled={publishing}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50">
                  {publishing ? "Publishing…" : <><Sparkles size={18} /> Publish & Go Live <ArrowRight size={18} /></>}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
            className="btn-outline flex items-center gap-2 disabled:opacity-30">
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 && (
            <button onClick={() => {
              if (step === 1 && !title.trim()) { toast.error("Please add a title"); return; }
              setStep(s => s + 1);
            }} className="btn-primary flex items-center gap-2">
              Continue <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
