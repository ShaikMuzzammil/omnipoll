import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Cloud, MessageSquare, Star, Zap, Plus, Trash2,
  Clock, Shield, Eye, ArrowLeft, Check, Copy, Info, Tag,
  Type, Settings2, Sparkles, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { createPoll, participantUrl } from "@/lib/api";
import type { Poll, PollType } from "@/lib/types";

const pollTypes = [
  { id: "multiple_choice", label: "Multiple Choice", icon: BarChart3, desc: "Single or multiple selection from options", color: "bg-terracotta/10 text-terracotta" },
  { id: "word_cloud", label: "Word Cloud", icon: Cloud, desc: "Open text responses clustered live", color: "bg-sage/10 text-sage" },
  { id: "qa", label: "Q&A Session", icon: MessageSquare, desc: "Audience questions with upvotes", color: "bg-[#D4A574]/10 text-[#D4A574]" },
  { id: "quiz", label: "Live Quiz", icon: Zap, desc: "Timed questions, scoring, leaderboard", color: "bg-[#7B9EA8]/10 text-[#7B9EA8]" },
  { id: "rating", label: "Rating Scale", icon: Star, desc: "Custom numeric scale and labels", color: "bg-[#9B8AA5]/10 text-[#9B8AA5]" },
] as const;

const categories = ["Business", "Education", "Events", "Feedback", "Healthcare", "Research", "Team", "Other"];

interface QuizDraft {
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
}

const emptyQuizQuestion = (): QuizDraft => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 10,
  timeLimit: 30,
});

export default function CreatePoll() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Business");
  const [type, setType] = useState<PollType>("multiple_choice");
  const [options, setOptions] = useState(["", ""]);
  const [quizQuestions, setQuizQuestions] = useState<QuizDraft[]>([emptyQuizQuestion()]);
  const [anonymity, setAnonymity] = useState(true);
  const [moderation, setModeration] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [restrictOne, setRestrictOne] = useState(true);
  const [timer, setTimer] = useState<number | undefined>(undefined);
  const [ratingMin, setRatingMin] = useState(1);
  const [ratingMax, setRatingMax] = useState(5);
  const [ratingLowLabel, setRatingLowLabel] = useState("Needs work");
  const [ratingHighLabel, setRatingHighLabel] = useState("Excellent");
  const [maxResponses, setMaxResponses] = useState(3);
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions((prev) => prev.map((item, idx) => (idx === i ? val : item)));

  const addQuizQuestion = () => setQuizQuestions((prev) => [...prev, emptyQuizQuestion()]);
  const removeQuizQuestion = (i: number) => setQuizQuestions((prev) => prev.filter((_, idx) => idx !== i));
  const updateQuizQuestion = (i: number, patch: Partial<QuizDraft>) => {
    setQuizQuestions((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };
  const updateQuizOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizQuestions((prev) =>
      prev.map((item, idx) =>
        idx === questionIndex
          ? { ...item, options: item.options.map((option, optIdx) => (optIdx === optionIndex ? value : option)) }
          : item,
      ),
    );
  };

  const validate = () => {
    if (!title.trim()) return "Enter the poll question or prompt.";
    if (type === "multiple_choice" && options.filter((option) => option.trim()).length < 2) return "Add at least two options.";
    if (type === "rating" && ratingMax <= ratingMin) return "Rating max must be greater than min.";
    if (type === "quiz") {
      const completeQuestions = quizQuestions.filter((question) => question.questionText.trim());
      if (!completeQuestions.length) return "Add at least one quiz question.";
      const invalid = completeQuestions.find((question) => question.options.filter((option) => option.trim()).length < 2 || !question.correctAnswer.trim());
      if (invalid) return "Each quiz question needs at least two options and a correct answer.";
    }
    return "";
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!state.user) {
      navigate("/auth/login");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const expiresAt = timer ? new Date(Date.now() + timer * 1000).toISOString() : null;
      const response = await createPoll({
        creatorId: state.user.id,
        title: title.trim(),
        question: title.trim(),
        description,
        category,
        type,
        status: "live",
        expiresAt,
        options: type === "multiple_choice"
          ? options.filter((option) => option.trim()).map((option, index) => ({ id: `option-${index}`, text: option.trim(), order: index, votes: 0 }))
          : [],
        quizQuestions: type === "quiz"
          ? quizQuestions
              .filter((question) => question.questionText.trim())
              .map((question, index) => ({
                id: `quiz-${index}`,
                questionText: question.questionText.trim(),
                options: question.options.filter((option) => option.trim()),
                correctAnswer: question.correctAnswer.trim(),
                points: Number(question.points || 10),
                timeLimit: Number(question.timeLimit || 30),
                order: index,
              }))
          : [],
        settings: {
          anonymity,
          moderation,
          allowMultiple,
          showResults,
          restrictOnePerDevice: restrictOne,
          timer,
          ratingMin,
          ratingMax,
          ratingStep: 1,
          ratingLowLabel,
          ratingHighLabel,
          maxResponses,
        },
      });
      setCreatedPoll(response.poll);
      dispatch({ type: "ADD_POLL", payload: response.poll });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: Date.now().toString(),
          type: "success",
          message: `Poll "${response.poll.title}" is live.`,
          read: false,
        },
      });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create poll.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (kind: "code" | "link") => {
    if (!createdPoll) return;
    const text = kind === "code" ? createdPoll.code : participantUrl(createdPoll.code);
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  };

  const selectedType = pollTypes.find((pt) => pt.id === type);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate hover:text-charcoal mb-4">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="font-playfair text-3xl font-bold text-charcoal mb-1">Create New Poll</h1>
          <p className="text-slate">Build, publish, and share a real-time poll in one flow</p>
        </motion.div>

        <div className="flex items-center gap-2 my-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-terracotta text-white" : "bg-cream text-slate border border-clay"
                }`}
                animate={{ scale: step === s ? 1.08 : 1 }}
              >
                {step > s ? <Check size={14} /> : s}
              </motion.div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-terracotta" : "bg-clay"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-warm-white rounded-xl border border-clay/30 p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-charcoal flex items-center gap-2">
                    <Type size={14} className="text-terracotta" /> Question or prompt
                  </Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., What should we prioritize next quarter?" className="bg-cream border-clay/40 focus:border-terracotta" />
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal flex items-center gap-2">
                    <Info size={14} className="text-terracotta" /> Participant instructions
                  </Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional context shown to participants..." className="bg-cream border-clay/40 focus:border-terracotta min-h-[80px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal flex items-center gap-2">
                    <Tag size={14} className="text-terracotta" /> Category
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === cat ? "bg-terracotta text-white" : "bg-cream text-slate border border-clay/40 hover:bg-cream/80"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-warm-white rounded-xl border border-clay/30 p-6 space-y-3">
                <Label className="text-charcoal flex items-center gap-2">
                  <Settings2 size={14} className="text-terracotta" /> Poll Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pollTypes.map((pt) => (
                    <button key={pt.id} onClick={() => setType(pt.id)} className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${type === pt.id ? "border-terracotta bg-terracotta/5" : "border-clay/40 bg-cream hover:bg-cream/80"}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === pt.id ? pt.color : "bg-warm-white"}`}>
                        <pt.icon size={18} className={type === pt.id ? "" : "text-slate"} />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${type === pt.id ? "text-terracotta" : "text-charcoal"}`}>{pt.label}</p>
                        <p className="text-xs text-slate">{pt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!title.trim()} className="bg-terracotta hover:bg-terracotta/90 text-white">
                  Configure <ArrowLeft size={14} className="ml-2 rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-warm-white rounded-xl border border-clay/30 p-6 space-y-6">
                {type === "multiple_choice" && (
                  <div className="space-y-3">
                    <Label className="text-charcoal flex items-center gap-2"><BarChart3 size={14} className="text-terracotta" /> Answer options</Label>
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate w-6">{String.fromCharCode(65 + i)}</span>
                        <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="bg-cream border-clay/40 focus:border-terracotta flex-1" />
                        {options.length > 2 && <button onClick={() => removeOption(i)} className="text-slate hover:text-crimson transition-colors"><Trash2 size={16} /></button>}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addOption} className="border-clay/60 text-slate"><Plus size={14} className="mr-1" /> Add Option</Button>
                  </div>
                )}

                {type === "word_cloud" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max responses per participant</Label>
                      <Input type="number" min={1} max={10} value={maxResponses} onChange={(e) => setMaxResponses(Number(e.target.value))} className="bg-cream border-clay/40" />
                    </div>
                    <div className="rounded-xl bg-cream p-4 text-sm text-slate">
                      AI insights group similar words and estimate live sentiment with a local keyword model.
                    </div>
                  </div>
                )}

                {type === "qa" && (
                  <div className="rounded-xl bg-cream p-4 text-sm text-slate">
                    Participants can submit questions and upvote. The dashboard shows the live ranked queue, highlight controls, sentiment, and themes.
                  </div>
                )}

                {type === "quiz" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-charcoal flex items-center gap-2"><Zap size={14} className="text-terracotta" /> Quiz questions</Label>
                      <Button variant="outline" onClick={addQuizQuestion} className="border-clay/60 text-slate"><Plus size={14} className="mr-1" /> Add Question</Button>
                    </div>
                    {quizQuestions.map((question, qIndex) => (
                      <div key={qIndex} className="rounded-xl border border-clay/40 bg-cream p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input value={question.questionText} onChange={(e) => updateQuizQuestion(qIndex, { questionText: e.target.value })} placeholder={`Question ${qIndex + 1}`} className="bg-warm-white border-clay/40 flex-1" />
                          {quizQuestions.length > 1 && <button onClick={() => removeQuizQuestion(qIndex)} className="text-slate hover:text-crimson"><Trash2 size={16} /></button>}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {question.options.map((option, optionIndex) => (
                            <Input key={optionIndex} value={option} onChange={(e) => updateQuizOption(qIndex, optionIndex, e.target.value)} placeholder={`Answer ${String.fromCharCode(65 + optionIndex)}`} className="bg-warm-white border-clay/40" />
                          ))}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2">
                          <Input value={question.correctAnswer} onChange={(e) => updateQuizQuestion(qIndex, { correctAnswer: e.target.value })} placeholder="Correct answer text" className="bg-warm-white border-clay/40" />
                          <Input type="number" min={1} value={question.points} onChange={(e) => updateQuizQuestion(qIndex, { points: Number(e.target.value) })} placeholder="Points" className="bg-warm-white border-clay/40" />
                          <Input type="number" min={5} value={question.timeLimit} onChange={(e) => updateQuizQuestion(qIndex, { timeLimit: Number(e.target.value) })} placeholder="Seconds" className="bg-warm-white border-clay/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {type === "rating" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum</Label>
                      <Input type="number" value={ratingMin} onChange={(e) => setRatingMin(Number(e.target.value))} className="bg-cream border-clay/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum</Label>
                      <Input type="number" value={ratingMax} onChange={(e) => setRatingMax(Number(e.target.value))} className="bg-cream border-clay/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>Low label</Label>
                      <Input value={ratingLowLabel} onChange={(e) => setRatingLowLabel(e.target.value)} className="bg-cream border-clay/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>High label</Label>
                      <Input value={ratingHighLabel} onChange={(e) => setRatingHighLabel(e.target.value)} className="bg-cream border-clay/40" />
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-clay/30">
                  <h4 className="font-semibold text-charcoal text-sm flex items-center gap-2"><Settings2 size={14} className="text-terracotta" /> Poll Settings</h4>
                  {[
                    { icon: Eye, title: "Anonymous Responses", desc: "Hide participant identities", checked: anonymity, onChange: setAnonymity },
                    { icon: Shield, title: "Smart Moderation", desc: "Use basic filtering on open text", checked: moderation, onChange: setModeration },
                    { icon: BarChart3, title: "Show Live Results", desc: "Participants see results update live", checked: showResults, onChange: setShowResults },
                    { icon: Shield, title: "One vote per device", desc: "Basic duplicate protection", checked: restrictOne, onChange: setRestrictOne },
                  ].map((setting) => (
                    <div key={setting.title} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <setting.icon size={16} className="text-slate" />
                        <div>
                          <p className="text-sm font-medium text-charcoal">{setting.title}</p>
                          <p className="text-xs text-slate">{setting.desc}</p>
                        </div>
                      </div>
                      <Switch checked={setting.checked} onCheckedChange={setting.onChange} />
                    </div>
                  ))}
                  {type === "multiple_choice" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Plus size={16} className="text-slate" />
                        <div>
                          <p className="text-sm font-medium text-charcoal">Allow Multiple Selections</p>
                          <p className="text-xs text-slate">Participants can choose more than one option</p>
                        </div>
                      </div>
                      <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-slate" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">Duration</p>
                        <p className="text-xs text-slate">Auto-close after the selected time</p>
                      </div>
                    </div>
                    <select value={timer || ""} onChange={(e) => setTimer(e.target.value ? Number(e.target.value) : undefined)} className="bg-cream border border-clay/40 rounded-lg px-3 py-1.5 text-sm text-charcoal focus:border-terracotta focus:outline-none">
                      <option value="">No timer</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                      <option value={1800}>30 minutes</option>
                      <option value={3600}>1 hour</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-xl bg-crimson/10 text-crimson border border-crimson/20 p-3 text-sm">{error}</div>}

              {moderation && (
                <motion.div className="bg-gradient-to-r from-terracotta/10 to-sage/10 rounded-xl border border-terracotta/20 p-4 flex items-start gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Sparkles size={18} className="text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">AI Features Enabled</p>
                    <p className="text-xs text-slate">Open text responses will show local clustering and sentiment insights.</p>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="border-clay/60 text-slate"><ArrowLeft size={14} className="mr-2" /> Back</Button>
                <Button onClick={handleCreate} disabled={saving} className="bg-terracotta hover:bg-terracotta/90 text-white"><Check size={14} className="mr-2" /> {saving ? "Publishing..." : "Publish Poll"}</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && createdPoll && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="bg-warm-white rounded-xl border border-clay/30 p-8">
                <motion.div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <Check size={28} className="text-sage" />
                </motion.div>
                <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">Poll Published</h2>
                <p className="text-slate mb-2">Participants can join now</p>
                {selectedType && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${selectedType.color} mb-6`}>
                    <selectedType.icon size={12} /> {selectedType.label}
                  </span>
                )}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-cream rounded-xl p-5">
                    <p className="text-xs text-slate uppercase tracking-wide mb-2">Join Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-bold text-charcoal tracking-wider">{createdPoll.code}</span>
                      <button onClick={() => copyText("code")} className="w-9 h-9 rounded-lg bg-warm-white border border-clay/40 flex items-center justify-center text-slate hover:text-terracotta transition-colors">
                        {copied === "code" ? <Check size={16} className="text-sage" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-cream rounded-xl p-5">
                    <p className="text-xs text-slate uppercase tracking-wide mb-2">Share Link</p>
                    <button onClick={() => copyText("link")} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-charcoal hover:text-terracotta">
                      {copied === "link" ? <Check size={16} className="text-sage" /> : <LinkIcon size={16} />}
                      Copy participant URL
                    </button>
                    <p className="text-xs text-slate mt-2 break-all">{participantUrl(createdPoll.code)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => navigate(`/dashboard/polls/${createdPoll.id}/results`)} className="bg-terracotta hover:bg-terracotta/90 text-white">Open Live Dashboard</Button>
                  <Button variant="outline" onClick={() => navigate(`/p/${createdPoll.code}`)} className="border-clay/60 text-slate">Preview Participant View</Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard/polls")} className="border-clay/60 text-slate">Go to My Polls</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
