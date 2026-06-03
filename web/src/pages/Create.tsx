import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { createPoll } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { PollType } from "@/lib/types";

const POLL_TYPES: { id: PollType; icon: string; label: string; desc: string }[] = [
  { id: "multiple_choice", icon: "📊", label: "Multiple Choice", desc: "Predefined options, real-time vote bars" },
  { id: "word_cloud", icon: "☁️", label: "Word Cloud", desc: "Open text → live word cloud" },
  { id: "qa", icon: "❓", label: "Q&A Session", desc: "Submit & upvote questions" },
  { id: "quiz", icon: "🏆", label: "Live Quiz", desc: "Timed scoring & leaderboard" },
  { id: "rating", icon: "⭐", label: "Rating Scale", desc: "Numeric scale with distribution" },
];

function uid() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [pollType, setPollType] = useState<PollType>("multiple_choice");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ id: uid(), text: "Option A" }, { id: uid(), text: "Option B" }]);
  const [quizQuestions, setQuizQuestions] = useState([{
    id: uid(), questionText: "", correctAnswer: "", points: 100, timeLimit: 20,
    options: [{ id: uid(), text: "A" }, { id: uid(), text: "B" }, { id: uid(), text: "C" }, { id: uid(), text: "D" }]
  }]);
  const [settings, setSettings] = useState({
    duration: null as number | null, showResults: true, oneVote: true,
    multiSelect: false, min: 1, max: 5, step: 1, labelLeft: "", labelRight: "", maxResponses: 0
  });
  const [publishing, setPublishing] = useState(false);

  const steps = ["Poll Type", "Question", "Settings"];

  const addOption = () => setOptions(o => [...o, { id: uid(), text: "" }]);
  const removeOption = (id: string) => setOptions(o => o.filter(x => x.id !== id));
  const updateOption = (id: string, text: string) => setOptions(o => o.map(x => x.id === id ? { ...x, text } : x));

  const addQuizQ = () => setQuizQuestions(q => [...q, {
    id: uid(), questionText: "", correctAnswer: "", points: 100, timeLimit: 20,
    options: [{ id: uid(), text: "A" }, { id: uid(), text: "B" }, { id: uid(), text: "C" }, { id: uid(), text: "D" }]
  }]);
  const removeQuizQ = (id: string) => setQuizQuestions(q => q.filter(x => x.id !== id));
  const updateQuizQ = (id: string, field: string, value: unknown) =>
    setQuizQuestions(q => q.map(x => x.id === id ? { ...x, [field]: value } : x));
  const updateQuizOpt = (qId: string, oId: string, text: string) =>
    setQuizQuestions(q => q.map(x => x.id === qId ? { ...x, options: x.options.map(o => o.id === oId ? { ...o, text } : o) } : x));

  const publish = async () => {
    setPublishing(true);
    try {
      const body = { title, type: pollType, question, settings, options, quizQuestions, creatorId: user?.id };
      const { poll } = await createPoll(body);
      toast.success(`Poll published! Join code: ${poll.code}`);
      navigate(`/dashboard/${poll.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create poll");
    } finally { setPublishing(false); }
  };

  const fieldClass = "bg-warm-white border-clay/40 focus:border-terracotta text-charcoal";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-playfair text-3xl font-bold text-charcoal">Create Poll</h1>
            <span className="text-sm text-slate">Step {step} of {steps.length}</span>
          </div>
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${i < step ? "bg-terracotta" : "bg-parchment"}`} />
                <p className={`text-xs mt-1.5 ${i < step ? "text-terracotta font-medium" : "text-slate"}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1 – Type */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {POLL_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPollType(t.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${pollType === t.id ? "border-terracotta bg-terracotta/5" : "border-clay/30 bg-warm-white"}`}
                  >
                    <div className="text-3xl mb-2">{t.icon}</div>
                    <div className="font-semibold text-charcoal">{t.label}</div>
                    <div className="text-sm text-slate mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="bg-terracotta hover:bg-orange-600 text-white">
                  Next: Question <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 – Details */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-charcoal">Poll Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product Feedback Survey" className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-charcoal">Question / Prompt</Label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to ask?"
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border border-clay/40 text-sm resize-none ${fieldClass}`}
                  />
                </div>

                {/* Multiple Choice options */}
                {pollType === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-charcoal">Options ({options.length})</Label>
                    {options.map((opt, i) => (
                      <div key={opt.id} className="flex gap-2">
                        <Input
                          value={opt.text}
                          onChange={(e) => updateOption(opt.id, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className={`flex-1 ${fieldClass}`}
                        />
                        {options.length > 2 && (
                          <Button variant="ghost" size="sm" onClick={() => removeOption(opt.id)} className="text-slate hover:text-crimson">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                    {options.length < 8 && (
                      <Button variant="ghost" size="sm" onClick={addOption} className="text-terracotta">
                        <Plus size={14} className="mr-1" /> Add Option
                      </Button>
                    )}
                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={settings.multiSelect} onChange={(e) => setSettings(s => ({ ...s, multiSelect: e.target.checked }))} className="accent-terracotta" />
                      <span className="text-sm text-charcoal">Allow multiple selections</span>
                    </label>
                  </div>
                )}

                {/* Rating */}
                {pollType === "rating" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-charcoal">Scale Configuration</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1"><Label className="text-xs text-slate">Min</Label><Input type="number" value={settings.min} onChange={(e) => setSettings(s => ({ ...s, min: Number(e.target.value) }))} className={fieldClass} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate">Max</Label><Input type="number" value={settings.max} onChange={(e) => setSettings(s => ({ ...s, max: Number(e.target.value) }))} className={fieldClass} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate">Step</Label><Input type="number" value={settings.step} onChange={(e) => setSettings(s => ({ ...s, step: Number(e.target.value) }))} className={fieldClass} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs text-slate">Left Label</Label><Input value={settings.labelLeft} onChange={(e) => setSettings(s => ({ ...s, labelLeft: e.target.value }))} placeholder="Very Poor" className={fieldClass} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate">Right Label</Label><Input value={settings.labelRight} onChange={(e) => setSettings(s => ({ ...s, labelRight: e.target.value }))} placeholder="Excellent" className={fieldClass} /></div>
                    </div>
                  </div>
                )}

                {/* Word Cloud */}
                {pollType === "word_cloud" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-charcoal">Max Responses (0 = unlimited)</Label>
                    <Input type="number" min={0} value={settings.maxResponses} onChange={(e) => setSettings(s => ({ ...s, maxResponses: Number(e.target.value) }))} className={fieldClass} />
                  </div>
                )}

                {/* Quiz */}
                {pollType === "quiz" && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-charcoal">Quiz Questions ({quizQuestions.length})</Label>
                    {quizQuestions.map((qq, qi) => (
                      <div key={qq.id} className="bg-parchment rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-charcoal">Question {qi + 1}</span>
                          {quizQuestions.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeQuizQ(qq.id)} className="text-slate hover:text-crimson"><Trash2 size={14} /></Button>
                          )}
                        </div>
                        <Input value={qq.questionText} onChange={(e) => updateQuizQ(qq.id, "questionText", e.target.value)} placeholder="Question text" className={fieldClass} />
                        <div className="grid grid-cols-2 gap-2">
                          {qq.options.map((opt, oi) => (
                            <Input key={opt.id} value={opt.text} onChange={(e) => updateQuizOpt(qq.id, opt.id, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className={fieldClass} />
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate">Correct Answer</Label>
                            <select value={qq.correctAnswer} onChange={(e) => updateQuizQ(qq.id, "correctAnswer", e.target.value)} className={`w-full px-3 py-2 rounded-xl border border-clay/40 text-sm ${fieldClass}`}>
                              <option value="">Select…</option>
                              {qq.options.map(o => <option key={o.id} value={o.id}>{o.text || o.id}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1"><Label className="text-xs text-slate">Points</Label><Input type="number" value={qq.points} onChange={(e) => updateQuizQ(qq.id, "points", Number(e.target.value))} className={fieldClass} /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate">Time (sec)</Label><Input type="number" value={qq.timeLimit} onChange={(e) => updateQuizQ(qq.id, "timeLimit", Number(e.target.value))} className={fieldClass} /></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addQuizQ} className="text-terracotta"><Plus size={14} className="mr-1" /> Add Question</Button>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="border-clay/50 text-slate">Back</Button>
                <Button onClick={() => {
                  if (!title.trim()) { toast.error("Add a title"); return; }
                  if (!question.trim()) { toast.error("Add a question"); return; }
                  setStep(3);
                }} className="bg-terracotta hover:bg-orange-600 text-white">
                  Next: Settings <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 – Settings */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-charcoal">Duration</Label>
                  <select
                    value={settings.duration ?? ""}
                    onChange={(e) => setSettings(s => ({ ...s, duration: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-clay/40 bg-warm-white text-sm text-charcoal focus:border-terracotta"
                  >
                    <option value="">Open (no time limit)</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={settings.showResults} onChange={(e) => setSettings(s => ({ ...s, showResults: e.target.checked }))} className="w-4 h-4 accent-terracotta" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Show results to participants</p>
                    <p className="text-xs text-slate">Participants see live results after voting</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={settings.oneVote} onChange={(e) => setSettings(s => ({ ...s, oneVote: e.target.checked }))} className="w-4 h-4 accent-terracotta" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">One response per device</p>
                    <p className="text-xs text-slate">Prevents duplicate voting from the same device</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="border-clay/50 text-slate">Back</Button>
                <Button onClick={publish} disabled={publishing} className="bg-terracotta hover:bg-orange-600 text-white px-8">
                  {publishing ? "Publishing…" : "🚀 Publish Poll"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
