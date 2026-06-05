import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoll, moderateQAQuestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { ThumbsUp, CheckCircle, Star, XCircle, MessageSquare } from "lucide-react";
import type { QAQuestion } from "@/lib/types";
import { toast } from "sonner";

export default function Moderation() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["poll", id], queryFn: () => getPoll(id!), enabled: !!id, refetchInterval: 5000 });
  const poll = data?.poll;
  const questions: QAQuestion[] = [...(poll?.qaQuestions || [])].sort((a, b) => b.upvotes - a.upvotes);
  const [filter, setFilter] = useState<"all"|"open"|"highlighted"|"answered">("all");

  const moderate = useMutation({
    mutationFn: ({ questionId, action }: { questionId: string; action: "answer"|"highlight"|"dismiss" }) =>
      moderateQAQuestion(id!, questionId, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["poll", id] }); toast.success("Updated"); },
  });

  const filtered = filter === "all" ? questions : questions.filter(q => q.status === filter);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-foreground">Q&A Moderation</h1>
          <p className="text-muted-foreground text-sm">{poll?.title} — {questions.length} questions</p>
        </div>

        <div className="flex gap-2">
          {(["all","open","highlighted","answered"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter===f ? "bg-terracotta text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No questions yet. Share the poll link to start collecting questions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => (
              <div key={q.id} className={`bg-card border rounded-xl p-4 shadow-sm ${q.status==="highlighted" ? "border-yellow-300 bg-yellow-50/50" : q.status==="answered" ? "border-green-300 bg-green-50/50" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{q.questionText}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{q.upvotes} upvotes</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${q.status==="open" ? "bg-blue-100 text-blue-700" : q.status==="highlighted" ? "bg-yellow-100 text-yellow-700" : q.status==="answered" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{q.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                      onClick={() => moderate.mutate({ questionId: q.id, action: "highlight" })}>
                      <Star className="w-3 h-3" />Star
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => moderate.mutate({ questionId: q.id, action: "answer" })}>
                      <CheckCircle className="w-3 h-3" />Answer
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => moderate.mutate({ questionId: q.id, action: "dismiss" })}>
                      <XCircle className="w-3 h-3" />Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
