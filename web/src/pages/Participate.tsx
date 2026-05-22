import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ThumbsUp, Send, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinByCode, vote, addQAQuestion, upvoteQAQuestion, submitQuizAnswer } from "@/lib/api";
import { useSocketByCode } from "@/hooks/useSocket";
import { getParticipantId } from "@/hooks/useAuth";
import type { Poll, PollResults, PollOption, QAQuestion } from "@/lib/types";

const VOTED_KEY = "omnipoll_voted";
function hasVoted(pollId: string) {
  try { return !!(JSON.parse(localStorage.getItem(VOTED_KEY) || "{}")[pollId]); } catch { return false; }
}
function markVoted(pollId: string) {
  try {
    const v = JSON.parse(localStorage.getItem(VOTED_KEY) || "{}");
    v[pollId] = Date.now(); localStorage.setItem(VOTED_KEY, JSON.stringify(v));
  } catch {}
}

export default function Participate() {
  const { code } = useParams<{ code: string }>();
  const pid = getParticipantId();
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = useCallback(
    ({ poll, results }: { poll: Poll; results: PollResults }) => {
      setPoll(poll); setResults(results);
    },
    []
  );

  useSocketByCode(joined ? code : null, handleUpdate, (msg) => setError(msg));

  const join = async () => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const data = await joinByCode(code);
      if (data.poll.status === "closed") { setError("This poll is closed."); return; }
      if (data.poll.status === "paused") { setError("This poll is currently paused. Please wait."); return; }
      setPoll(data.poll); setResults(data.results);
      setVoted(hasVoted(data.poll.id) && data.poll.settings?.oneVote !== false);
      setJoined(true);
    } catch { setError("Poll not found. Check your code."); }
    finally { setLoading(false); }
  };

  if (!joined) return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-playfair text-2xl font-bold text-charcoal">
            <span className="text-terracotta">Omni</span>Poll
          </span>
        </div>
        <div className="bg-warm-white rounded-2xl border border-clay/30 p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="font-playfair text-2xl font-bold text-charcoal">Join Poll</h1>
            <p className="text-slate text-sm mt-1">
              Code: <code className="font-mono text-terracotta">{code}</code>
            </p>
          </div>
          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm mb-4">{error}</div>}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal">Your Name (optional)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                onKeyDown={(e) => e.key === "Enter" && join()}
                className="bg-warm-white border-clay/40 focus:border-terracotta"
              />
            </div>
            <Button onClick={join} disabled={loading} className="w-full bg-terracotta hover:bg-orange-600 text-white">
              {loading ? "Joining…" : "Join Poll →"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (!poll) return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
    </div>
  );

  const participantName = name || "Anonymous";

  return (
    <div className="min-h-screen bg-warm-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <span className="font-playfair text-xl font-bold text-charcoal">
            <span className="text-terracotta">Omni</span>Poll
          </span>
          <div className="text-xs text-slate font-mono mt-0.5">{code}</div>
        </div>

        {poll.type === "multiple_choice" && (
          <MultipleChoice poll={poll} results={results} voted={voted} pid={pid}
            participantName={participantName}
            onVoted={() => { setVoted(true); markVoted(poll.id); }}
            onUpdate={(p, r) => { setPoll(p); setResults(r); }}
          />
        )}
        {poll.type === "word_cloud" && (
          <WordCloud poll={poll} results={results} voted={voted} pid={pid}
            participantName={participantName}
            onVoted={() => { setVoted(true); markVoted(poll.id); }}
            onUpdate={(p, r) => { setPoll(p); setResults(r); }}
          />
        )}
        {poll.type === "qa" && (
          <QAView poll={poll} results={results} pid={pid}
            participantName={participantName}
            onUpdate={(p, r) => { setPoll(p); setResults(r); }}
          />
        )}
        {poll.type === "quiz" && (
          <QuizView poll={poll} results={results} pid={pid}
            participantName={participantName}
            onUpdate={(p, r) => { setPoll(p); setResults(r); }}
          />
        )}
        {poll.type === "rating" && (
          <RatingView poll={poll} results={results} voted={voted} pid={pid}
            participantName={participantName}
            onVoted={() => { setVoted(true); markVoted(poll.id); }}
            onUpdate={(p, r) => { setPoll(p); setResults(r); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Shared interfaces ─────────────────────────────────────────────────────
interface PollProps {
  poll: Poll;
  results: PollResults | null;
  voted?: boolean;
  pid: string;
  participantName: string;
  onVoted?: () => void;
  onUpdate: (p: Poll, r: PollResults) => void;
}

// ─── Thank-you banner ──────────────────────────────────────────────────────
function ThankYou({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6 bg-sage/10 rounded-2xl p-4">
      <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center text-sage text-xl">✓</div>
      <div>
        <h3 className="font-semibold text-charcoal">Thank you!</h3>
        <p className="text-sm text-slate">{children || "Your response was recorded."}</p>
      </div>
    </div>
  );
}

// ─── Result bar ────────────────────────────────────────────────────────────
function ResultBar({ text, votes, pct, index }: { text: string; votes: number; pct: number; index: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-charcoal">{text}</span>
        <span className="font-mono text-slate">{votes} ({pct}%)</span>
      </div>
      <div className="h-5 bg-parchment rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-terracotta rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.05 }}
        />
      </div>
    </div>
  );
}

// ─── Multiple Choice ───────────────────────────────────────────────────────
function MultipleChoice({ poll, results, voted, pid, participantName, onVoted, onUpdate }: PollProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const isMulti = poll.settings?.multiSelect;

  const submit = async () => {
    if (!selected.size) { toast.error("Select an option"); return; }
    setSubmitting(true);
    try {
      const answer = isMulti ? [...selected] : [...selected][0];
      const data = await vote(poll.id, { participantId: pid, participantName, answer });
      onVoted?.();
      onUpdate(poll, data.results);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const showResults = voted && poll.settings?.showResults !== false;

  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">{poll.question}</h2>
      {isMulti && <p className="text-slate text-sm mb-4">Select all that apply</p>}
      {voted && <ThankYou>Vote recorded!</ThankYou>}
      {!voted && (
        <div className="space-y-3 mb-6">
          {poll.options.map((opt: PollOption) => (
            <button
              key={opt.id}
              onClick={() => {
                setSelected((prev) => {
                  const next = new Set(isMulti ? prev : new Set<string>());
                  prev.has(opt.id) ? next.delete(opt.id) : next.add(opt.id);
                  return next;
                });
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                selected.has(opt.id)
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-clay/30 bg-parchment text-charcoal hover:border-terracotta/40"
              }`}
            >
              {opt.text}
            </button>
          ))}
          <Button
            onClick={submit} disabled={submitting || !selected.size}
            className="w-full bg-terracotta hover:bg-orange-600 text-white mt-2"
          >
            {submitting ? "Submitting…" : "Submit Vote"}
          </Button>
        </div>
      )}
      {showResults && results?.options && (
        <div className="space-y-4 border-t border-clay/20 pt-4">
          <p className="text-sm font-medium text-slate">Live Results</p>
          {results.options.map((r, i) => (
            <ResultBar key={r.id} text={r.text} votes={r.votes} pct={r.pct} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Word Cloud ────────────────────────────────────────────────────────────
function WordCloud({ poll, results, voted, pid, participantName, onVoted, onUpdate }: PollProps) {
  const [word, setWord] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!word.trim()) { toast.error("Enter a word or phrase"); return; }
    setSubmitting(true);
    try {
      const data = await vote(poll.id, { participantId: pid, participantName, answer: word.trim() });
      onVoted?.(); onUpdate(poll, data.results);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">{poll.question}</h2>
      <p className="text-slate text-sm mb-6">Submit a word or phrase to contribute to the live word cloud</p>
      {voted ? (
        <ThankYou>Your word was added!</ThankYou>
      ) : (
        <div className="flex gap-2 mb-6">
          <Input
            value={word} onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word…"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 bg-warm-white border-clay/40 focus:border-terracotta"
          />
          <Button onClick={submit} disabled={submitting} className="bg-terracotta hover:bg-orange-600 text-white">
            <Send size={14} />
          </Button>
        </div>
      )}
      {poll.settings?.showResults !== false && results?.words && (
        <div className="min-h-40 bg-parchment rounded-xl p-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {results.words.length
            ? results.words.map((w) => (
                <span
                  key={w.text}
                  className="font-bold text-terracotta"
                  style={{ fontSize: `${Math.min(48, 14 + w.count * 8)}px` }}
                >
                  {w.text}
                </span>
              ))
            : <span className="text-slate text-sm">Words will appear here…</span>}
        </div>
      )}
    </div>
  );
}

// ─── Q&A ───────────────────────────────────────────────────────────────────
function QAView({
  poll, results, pid, participantName, onUpdate,
}: Omit<PollProps, "voted" | "onVoted">) {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState<Set<string>>(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem(`omnipoll_upvoted_${poll.id}`) || "[]")
      );
    } catch { return new Set(); }
  });

  const submitQ = async () => {
    if (!question.trim()) { toast.error("Enter a question"); return; }
    setSubmitting(true);
    try {
      await addQAQuestion(poll.id, { questionText: question.trim(), participantId: pid });
      setQuestion(""); toast.success("Question added!");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const upvote = async (q: QAQuestion) => {
    if (upvoted.has(q.id)) return;
    try {
      await upvoteQAQuestion(poll.id, q.id);
      const next = new Set(upvoted); next.add(q.id);
      setUpvoted(next);
      localStorage.setItem(`omnipoll_upvoted_${poll.id}`, JSON.stringify([...next]));
    } catch {}
  };

  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-2xl font-bold text-charcoal mb-5">{poll.question}</h2>
      <div className="space-y-3 max-h-80 overflow-y-auto mb-5">
        {results?.questions?.length ? (
          results.questions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 bg-parchment rounded-xl p-3">
              <p className="flex-1 text-sm text-charcoal">{q.questionText}</p>
              <button
                onClick={() => upvote(q)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  upvoted.has(q.id)
                    ? "bg-terracotta text-white"
                    : "bg-cream text-slate hover:bg-terracotta/10 hover:text-terracotta"
                }`}
              >
                <ThumbsUp size={12} /> {q.upvotes}
              </button>
            </div>
          ))
        ) : (
          <p className="text-slate text-sm">No questions yet. Be the first!</p>
        )}
      </div>
      <div className="border-t border-clay/20 pt-4">
        <p className="text-sm font-medium text-charcoal mb-2">Ask a question</p>
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question…"
            onKeyDown={(e) => e.key === "Enter" && submitQ()}
            className="flex-1 bg-warm-white border-clay/40 focus:border-terracotta"
          />
          <Button onClick={submitQ} disabled={submitting} className="bg-terracotta hover:bg-orange-600 text-white">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz ──────────────────────────────────────────────────────────────────
function QuizView({ poll, results, pid, participantName, onUpdate }: Omit<PollProps, "voted" | "onVoted">) {
  const questions = poll.quizQuestions || [];
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 20);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qq = questions[qIndex];

  useEffect(() => {
    if (!qq || answered || done) return;
    setTimeLeft(qq.timeLimit || 20);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleAnswer(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [qIndex, answered]);

  const handleAnswer = async (optId: string | null) => {
    if (answered) return;
    setAnswered(true);
    clearInterval(timerRef.current!);
    try {
      const data = await submitQuizAnswer(poll.id, {
        participantId: pid, participantName, questionId: qq.id,
        selectedAnswer: optId, timeLeft,
      });
      setIsCorrect(data.isCorrect);
      setEarnedPoints(data.points);
      if (data.isCorrect) setScore((s) => s + data.points);
    } catch {}
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) setDone(true);
    else { setQIndex((i) => i + 1); setAnswered(false); }
  };

  if (!questions.length) return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <p className="text-slate">No quiz questions configured.</p>
    </div>
  );

  if (done) return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="font-playfair text-3xl font-bold text-charcoal mb-2">Quiz Complete!</h2>
      <div className="flex items-center justify-center gap-2 text-5xl font-bold text-terracotta font-playfair mb-8">
        <Trophy size={36} /> {score}
      </div>
      {results?.leaderboard && (
        <div className="space-y-2 text-left max-w-xs mx-auto">
          <p className="text-sm font-medium text-charcoal mb-3">Leaderboard</p>
          {results.leaderboard.slice(0, 5).map((r, i) => (
            <div key={r.participantId} className="flex justify-between bg-parchment rounded-xl px-4 py-2">
              <span className="text-sm text-charcoal">{i + 1}. {r.name}</span>
              <span className="text-sm font-bold text-terracotta">{r.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const pct = (timeLeft / (qq.timeLimit || 20)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate">
        <span>Question {qIndex + 1} of {questions.length}</span>
        <div className="flex items-center gap-1 font-semibold text-terracotta">
          <Trophy size={14} /> {score}
        </div>
      </div>
      <div className="h-1.5 bg-parchment rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          style={{ background: pct < 30 ? "#C94040" : pct < 60 ? "#D4A574" : "#D96C4A" }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-playfair text-xl font-bold text-charcoal flex-1 pr-4">
            {qq.questionText || `Question ${qIndex + 1}`}
          </h2>
          <div className="flex items-center gap-1 text-2xl font-bold font-mono text-terracotta">
            <Clock size={18} /> {timeLeft}s
          </div>
        </div>
        {!answered ? (
          <div className="space-y-3">
            {qq.options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-clay/30 bg-parchment hover:border-terracotta/50 transition-all text-sm font-medium text-charcoal"
              >
                <span className="font-mono text-slate mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-5xl">{isCorrect ? "🎉" : "❌"}</div>
            <p className={`font-semibold text-lg ${isCorrect ? "text-sage" : "text-crimson"}`}>
              {isCorrect ? `Correct! +${earnedPoints} pts` : "Wrong!"}
            </p>
            {!isCorrect && (
              <p className="text-sm text-slate">
                Correct answer:{" "}
                <span className="font-medium text-charcoal">
                  {qq.options.find((o) => o.id === qq.correctAnswer)?.text}
                </span>
              </p>
            )}
            <p className="text-charcoal font-bold">Total score: {score}</p>
            <Button onClick={next} className="bg-terracotta hover:bg-orange-600 text-white">
              {qIndex + 1 < questions.length ? "Next Question →" : "See Final Results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rating ────────────────────────────────────────────────────────────────
function RatingView({ poll, results, voted, pid, participantName, onVoted, onUpdate }: PollProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const min = poll.settings?.min ?? 1;
  const max = poll.settings?.max ?? 5;

  const submit = async () => {
    if (selected === null) { toast.error("Select a rating"); return; }
    setSubmitting(true);
    try {
      const data = await vote(poll.id, { participantId: pid, participantName, answer: selected });
      onVoted?.(); onUpdate(poll, data.results);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-warm-white rounded-2xl border border-clay/30 p-6">
      <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">{poll.question}</h2>
      {voted ? (
        <ThankYou>Rating submitted!</ThankYou>
      ) : (
        <>
          <div className="flex justify-between text-xs text-slate mb-3">
            <span>{poll.settings?.labelLeft || String(min)}</span>
            <span>{poll.settings?.labelRight || String(max)}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
              <button
                key={v}
                onClick={() => setSelected(v)}
                className={`w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all ${
                  selected === v
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-clay/40 bg-parchment text-charcoal hover:border-terracotta/50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button
            onClick={submit} disabled={submitting || selected === null}
            className="w-full bg-terracotta hover:bg-orange-600 text-white"
          >
            {submitting ? "Submitting…" : "Submit Rating"}
          </Button>
        </>
      )}
      {poll.settings?.showResults !== false && results?.average !== undefined && (
        <div className="mt-6 border-t border-clay/20 pt-4 text-center">
          <p className="text-4xl font-bold text-charcoal font-playfair">{(results.average || 0).toFixed(1)}</p>
          <p className="text-sm text-slate">Average · {results.totalResponses} responses</p>
          <div className="mt-4 space-y-2">
            {Object.entries(results.distribution || {}).reverse().map(([val, count]) => {
              const total = results.totalResponses || 0;
              const pct = total ? Math.round((count as number) / total * 100) : 0;
              return (
                <div key={val} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-mono text-right text-charcoal">{val}</span>
                  <div className="flex-1 h-3 bg-parchment rounded-full overflow-hidden">
                    <motion.div className="h-full bg-terracotta rounded-full" animate={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate w-6">{count as number}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
