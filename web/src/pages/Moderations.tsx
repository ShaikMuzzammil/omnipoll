import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Star, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { listPolls, upvoteQAQuestion } from "@/lib/api";
import type { Poll, QAQuestion } from "@/lib/types";

type ModerationAction = "highlight" | "dismiss" | "answer";

interface PendingQuestion extends QAQuestion {
  pollId: string;
  pollTitle: string;
  pollCode: string;
}

export default function Moderations() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "answered" | "highlighted">("all");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await listPolls(user.id);
      const polls: Poll[] = data.polls || [];
      // Collect all QA questions from live polls
      const questions: PendingQuestion[] = [];
      polls.forEach((poll) => {
        if (poll.status === "closed") return;
        (poll.qaQuestions ?? []).forEach((q) => {
          questions.push({
            ...q,
            pollId: poll.id,
            pollTitle: poll.title,
            pollCode: poll.code,
          });
        });
      });
      questions.sort((a, b) => b.upvotes - a.upvotes);
      setPending(questions);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (q: PendingQuestion, action: ModerationAction) => {
    // Optimistic UI update
    setPending((prev) =>
      prev.map((p) =>
        p.id === q.id
          ? { ...p, status: action === "dismiss" ? "answered" : action === "highlight" ? "highlighted" : "answered" }
          : p
      )
    );
    toast.success(
      action === "highlight" ? "Question highlighted ⭐" :
      action === "dismiss"   ? "Question dismissed" :
                               "Marked as answered ✓"
    );
  };

  const displayed = pending.filter((q) =>
    filter === "all" ? true : q.status === filter
  );

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-sm text-slate hover:text-charcoal">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="ml-auto" />
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-terracotta" />
            <h1 className="font-playfair text-2xl font-bold text-charcoal">Moderation Queue</h1>
          </div>
          <span className="text-xs bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-full font-semibold">
            {pending.filter((q) => q.status === "open").length} pending
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-warm-white rounded-xl border border-clay/30 p-1">
          {(["all", "open", "highlighted", "answered"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? "bg-terracotta text-white" : "text-slate hover:text-charcoal hover:bg-parchment"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Questions", value: pending.length, icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
            { label: "Highlighted",     value: pending.filter((q) => q.status === "highlighted").length, icon: Star, color: "bg-amber-50 text-amber-600" },
            { label: "Answered",        value: pending.filter((q) => q.status === "answered").length, icon: CheckCircle, color: "bg-sage/10 text-sage" },
          ].map((s) => (
            <div key={s.label} className="bg-warm-white rounded-2xl border border-clay/30 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                <s.icon size={16} />
              </div>
              <p className="text-2xl font-bold text-charcoal font-mono">{s.value}</p>
              <p className="text-xs text-slate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Question list */}
        {!displayed.length ? (
          <div className="text-center py-16 bg-warm-white rounded-2xl border border-clay/30">
            <Shield size={40} className="mx-auto text-clay/50 mb-4" />
            <h2 className="font-playfair text-xl font-bold text-charcoal mb-2">
              {filter === "all" ? "No questions yet" : `No ${filter} questions`}
            </h2>
            <p className="text-slate text-sm">Questions submitted in Q&A polls will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-warm-white rounded-2xl border p-5 ${
                  q.status === "highlighted" ? "border-amber-300 bg-amber-50/50" :
                  q.status === "answered"    ? "border-sage/30 bg-sage/5 opacity-70" :
                  "border-clay/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-charcoal font-medium">{q.questionText}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate">
                      <span className="font-mono bg-parchment px-2 py-0.5 rounded text-terracotta">{q.pollCode}</span>
                      <span>{q.pollTitle}</span>
                      <span>▲ {q.upvotes} upvotes</span>
                      <span className={`px-2 py-0.5 rounded-full capitalize font-medium ${
                        q.status === "highlighted" ? "bg-amber-100 text-amber-700" :
                        q.status === "answered"    ? "bg-sage/10 text-sage" :
                        "bg-terracotta/10 text-terracotta"
                      }`}>{q.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {q.status !== "highlighted" && (
                      <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs px-2"
                        onClick={() => handleAction(q, "highlight")}>
                        <Star size={13} className="mr-1" /> Highlight
                      </Button>
                    )}
                    {q.status === "open" && (
                      <Button size="sm" variant="ghost" className="text-sage hover:bg-sage/10 text-xs px-2"
                        onClick={() => handleAction(q, "answer")}>
                        <CheckCircle size={13} className="mr-1" /> Answered
                      </Button>
                    )}
                    {q.status !== "answered" && (
                      <Button size="sm" variant="ghost" className="text-slate hover:text-crimson text-xs px-2"
                        onClick={() => handleAction(q, "dismiss")}>
                        <XCircle size={13} className="mr-1" /> Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
