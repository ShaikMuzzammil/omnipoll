import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import {
  BarChart3, Send, ThumbsUp, Clock, Users, Check,
  AlertTriangle, Trophy, ArrowRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addQuestion, getPollByCode, submitQuizAnswer, submitVote,
  upvoteQuestion
} from "@/lib/api";
import { useSocket, type PollSocketPayload } from "@/hooks/useSocket";
import type { Poll, PollResults, QuizQuestion } from "@/lib/types";

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Participate() {
  const { code } = useParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [wordText, setWordText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [participantName, setParticipantName] = useState(localStorage.getItem("omnipoll_participant_name") || "");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set());

  const handlePollUpdate = useCallback((payload: PollSocketPayload) => {
    setPoll(payload.poll);
    setResults(payload.results);
  }, []);

  const { connected } = useSocket(poll?.id, handlePollUpdate, code);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    getPollByCode(code)
      .then((payload) => {
        setPoll(payload.poll);
        setResults(payload.results);
        const stored = localStorage.getItem(`omnipoll_submitted_${payload.poll.id}`);
        if (stored) setSubmittedKeys(new Set(JSON.parse(stored)));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Poll not found."))
      .finally(() => setLoading(false));
  }, [code]);

  const currentQuizQuestion = useMemo<QuizQuestion | null>(() => {
    if (!poll?.quizQuestions?.length) return null;
    return poll.quizQuestions[Math.min(quizIndex, poll.quizQuestions.length - 1)];
  }, [poll, quizIndex]);

  useEffect(() => {
    if (!currentQuizQuestion) return;
    setTimeLeft(currentQuizQuestion.timeLimit || 30);
    const timer = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuizQuestion?.id]);

  useEffect(() => {
    if (!poll || !currentQuizQuestion || timeLeft !== 0) return;
    if (submittedKeys.has(currentQuizQuestion.id)) return;
    if (quizIndex < (poll.quizQuestions?.length || 1) - 1) {
      const advance = setTimeout(() => {
        setQuizIndex((index) => index + 1);
        setSelectedQuizAnswer("");
        setQuizFeedback("Time expired. Moving to the next question.");
      }, 900);
      return () => clearTimeout(advance);
    }
  }, [currentQuizQuestion, poll, quizIndex, submittedKeys, timeLeft]);

  const markSubmitted = (key: string) => {
    if (!poll) return;
    const next = new Set(submittedKeys);
    next.add(key);
    setSubmittedKeys(next);
    localStorage.setItem(`omnipoll_submitted_${poll.id}`, JSON.stringify(Array.from(next)));
  };

  const canParticipate = poll?.status === "live";
  const showResults = poll?.settings?.showResults !== false || submittedKeys.size > 0 || poll?.status === "closed";

  const submitMultipleChoice = async () => {
    if (!poll || selectedOptionIds.length === 0) return;
    setError("");
    try {
      const payload = await submitVote(poll.id, { optionIds: selectedOptionIds });
      setPoll(payload.poll);
      setResults(payload.results);
      markSubmitted("multiple_choice");
      setSuccess("Vote recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to vote.");
    }
  };

  const submitWord = async () => {
    if (!poll || !wordText.trim()) return;
    setError("");
    try {
      const payload = await submitVote(poll.id, { text: wordText.trim() });
      setPoll(payload.poll);
      setResults(payload.results);
      setWordText("");
      markSubmitted(`word_${Date.now()}`);
      setSuccess("Response added to the word cloud.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit response.");
    }
  };

  const submitQuestion = async () => {
    if (!poll || !questionText.trim()) return;
    setError("");
    try {
      const payload = await addQuestion(poll.id, questionText.trim());
      setPoll(payload.poll);
      setResults(payload.results);
      setQuestionText("");
      setSuccess("Question submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit question.");
    }
  };

  const voteQuestion = async (questionId: string) => {
    if (!poll) return;
    setError("");
    try {
      const payload = await upvoteQuestion(poll.id, questionId);
      setPoll(payload.poll);
      setResults(payload.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upvote.");
    }
  };

  const submitRating = async () => {
    if (!poll || rating === null) return;
    setError("");
    try {
      const payload = await submitVote(poll.id, { rating });
      setPoll(payload.poll);
      setResults(payload.results);
      markSubmitted("rating");
      setSuccess("Rating recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit rating.");
    }
  };

  const submitQuiz = async () => {
    if (!poll || !currentQuizQuestion || !selectedQuizAnswer) return;
    const name = participantName.trim() || "Participant";
    localStorage.setItem("omnipoll_participant_name", name);
    setError("");
    try {
      const payload = await submitQuizAnswer(poll.id, {
        questionId: currentQuizQuestion.id,
        selectedAnswer: selectedQuizAnswer,
        participantName: name,
      });
      setPoll(payload.poll);
      setResults(payload.results);
      const correct = selectedQuizAnswer.toLowerCase() === currentQuizQuestion.correctAnswer.toLowerCase();
      setQuizFeedback(correct ? `Correct. +${currentQuizQuestion.points} points` : `Correct answer: ${currentQuizQuestion.correctAnswer}`);
      markSubmitted(currentQuizQuestion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer.");
    }
  };

  const toggleOption = (optionId: string) => {
    if (!poll?.settings?.allowMultiple) {
      setSelectedOptionIds([optionId]);
      return;
    }
    setSelectedOptionIds((prev) => prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]);
  };

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-slate">Loading poll...</div>;
  }

  if (!poll || !results) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-warm-white rounded-xl border border-clay/30 p-8 text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 text-crimson mx-auto mb-3" />
          <h1 className="font-playfair text-2xl font-bold text-charcoal">Poll not found</h1>
          <p className="text-slate text-sm mt-2">{error || "Check the join code and try again."}</p>
          <Button asChild className="mt-5 bg-terracotta hover:bg-terracotta/90 text-white"><Link to="/join">Join another poll</Link></Button>
        </div>
      </div>
    );
  }

  const totalVotes = results.totalVotes || results.totalResponses || 0;
  const ratingMin = poll.settings?.ratingMin ?? 1;
  const ratingMax = poll.settings?.ratingMax ?? 5;
  const ratingValues = Array.from({ length: ratingMax - ratingMin + 1 }, (_, index) => ratingMin + index);

  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-40 glass border-b border-clay/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-playfair text-sm font-bold text-charcoal">OmniPoll</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate">
            <span className="flex items-center gap-1"><Users size={10} /> {results.participants}</span>
            {currentQuizQuestion && <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(timeLeft)}</span>}
            <span className={`px-2 py-0.5 rounded-full ${poll.status === "live" ? "bg-sage/10 text-sage" : "bg-[#D4A574]/10 text-[#D4A574]"}`}>{poll.status}</span>
            {connected && <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-slate uppercase tracking-wide mb-2">Code {poll.code}</p>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-charcoal mb-2">{poll.question || poll.title}</h1>
          {poll.description && <p className="text-slate text-sm">{poll.description}</p>}
        </motion.div>

        {!canParticipate && (
          <div className="mt-6 bg-[#D4A574]/10 text-[#946B37] border border-[#D4A574]/30 rounded-xl p-4 text-sm">
            This poll is {poll.status}. Voting is currently unavailable.
          </div>
        )}
        {error && <div className="mt-6 bg-crimson/10 text-crimson border border-crimson/20 rounded-xl p-4 text-sm">{error}</div>}
        {success && (
          <AnimatePresence>
            <motion.div className="mt-6 bg-sage/10 text-sage rounded-xl p-4 flex items-center justify-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Check size={18} />
              <span className="font-medium">{success}</span>
            </motion.div>
          </AnimatePresence>
        )}

        {poll.type === "multiple_choice" && (
          <section className="mt-8 space-y-3">
            {poll.options?.map((opt, i) => {
              const selected = selectedOptionIds.includes(opt.id);
              return (
                <motion.button key={opt.id} className={`w-full p-4 rounded-xl border text-left transition-all ${selected ? "border-terracotta bg-terracotta/10 shadow-md" : "border-clay/40 bg-warm-white hover:border-terracotta/30 hover:shadow-sm"}`} onClick={() => toggleOption(opt.id)} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.98 }} disabled={!canParticipate || submittedKeys.has("multiple_choice")}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? "border-terracotta bg-terracotta" : "border-clay"}`}>{selected && <Check size={14} className="text-white" />}</div>
                    <span className={`font-medium ${selected ? "text-terracotta" : "text-charcoal"}`}>{opt.text}</span>
                  </div>
                </motion.button>
              );
            })}
            <Button onClick={submitMultipleChoice} disabled={!canParticipate || submittedKeys.has("multiple_choice") || selectedOptionIds.length === 0} className="w-full bg-terracotta hover:bg-terracotta/90 text-white py-6">
              {submittedKeys.has("multiple_choice") ? "Vote Recorded" : "Submit Vote"} <ArrowRight size={16} className="ml-2" />
            </Button>
          </section>
        )}

        {poll.type === "word_cloud" && (
          <section className="mt-8">
            <div className="flex gap-2">
              <Input value={wordText} onChange={(e) => setWordText(e.target.value)} placeholder="Type a word or short phrase..." className="bg-warm-white border-clay/40 focus:border-terracotta" disabled={!canParticipate} />
              <Button onClick={submitWord} className="bg-terracotta hover:bg-terracotta/90 text-white px-4" disabled={!canParticipate}><Send size={16} /></Button>
            </div>
          </section>
        )}

        {poll.type === "qa" && (
          <section className="mt-8">
            <div className="flex gap-2">
              <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ask a question..." className="bg-warm-white border-clay/40 focus:border-terracotta" disabled={!canParticipate} />
              <Button onClick={submitQuestion} className="bg-terracotta hover:bg-terracotta/90 text-white px-4" disabled={!canParticipate}><Send size={16} /></Button>
            </div>
          </section>
        )}

        {poll.type === "rating" && (
          <section className="mt-8">
            <div className="flex flex-wrap gap-2">
              {ratingValues.map((value) => (
                <button key={value} onClick={() => setRating(value)} disabled={!canParticipate || submittedKeys.has("rating")} className={`w-14 h-14 rounded-xl border text-lg font-bold transition-all ${rating === value ? "bg-terracotta text-white border-terracotta" : "bg-warm-white text-charcoal border-clay/40 hover:border-terracotta/40"}`}>
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate mt-2">
              <span>{poll.settings?.ratingLowLabel}</span>
              <span>{poll.settings?.ratingHighLabel}</span>
            </div>
            <Button onClick={submitRating} disabled={!canParticipate || submittedKeys.has("rating") || rating === null} className="w-full mt-5 bg-terracotta hover:bg-terracotta/90 text-white py-6">
              {submittedKeys.has("rating") ? "Rating Recorded" : "Submit Rating"}
            </Button>
          </section>
        )}

        {poll.type === "quiz" && currentQuizQuestion && (
          <section className="mt-8 space-y-4">
            <Input value={participantName} onChange={(e) => setParticipantName(e.target.value)} placeholder="Your display name for leaderboard" className="bg-warm-white border-clay/40" />
            <div className="bg-warm-white rounded-xl border border-clay/30 p-5">
              <div className="flex items-center justify-between text-xs text-slate mb-3">
                <span>Question {quizIndex + 1} of {poll.quizQuestions?.length}</span>
                <span>{currentQuizQuestion.points} points</span>
              </div>
              <h2 className="font-playfair text-xl font-bold text-charcoal mb-4">{currentQuizQuestion.questionText}</h2>
              <div className="grid gap-2">
                {currentQuizQuestion.options.map((option) => (
                  <button key={option} onClick={() => setSelectedQuizAnswer(option)} disabled={submittedKeys.has(currentQuizQuestion.id) || !canParticipate} className={`p-3 rounded-xl border text-left transition-all ${selectedQuizAnswer === option ? "border-terracotta bg-terracotta/10 text-terracotta" : "border-clay/40 bg-cream text-charcoal hover:border-terracotta/30"}`}>
                    {option}
                  </button>
                ))}
              </div>
              <Button onClick={submitQuiz} disabled={!canParticipate || !selectedQuizAnswer || submittedKeys.has(currentQuizQuestion.id)} className="w-full mt-4 bg-terracotta hover:bg-terracotta/90 text-white">
                {submittedKeys.has(currentQuizQuestion.id) ? "Answer Submitted" : "Submit Answer"}
              </Button>
              {quizFeedback && <p className="text-sm text-slate mt-3">{quizFeedback}</p>}
              {submittedKeys.has(currentQuizQuestion.id) && quizIndex < (poll.quizQuestions?.length || 1) - 1 && (
                <Button variant="outline" onClick={() => { setQuizIndex((i) => i + 1); setSelectedQuizAnswer(""); setQuizFeedback(""); }} className="w-full mt-3 border-clay/60 text-slate">Next Question</Button>
              )}
            </div>
          </section>
        )}

        {showResults && (
          <section className="mt-10 pt-8 border-t border-clay/30">
            <h3 className="font-playfair text-xl font-bold text-charcoal mb-4">Live Results</h3>

            {poll.type === "multiple_choice" && (
              <div className="space-y-4">
                {results.options?.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-charcoal">{option.text}</span>
                      <span className="font-mono text-slate">{option.votes} ({option.pct}%)</span>
                    </div>
                    <div className="h-3 bg-warm-white rounded-full overflow-hidden border border-clay/30">
                      <motion.div className="h-full rounded-full bg-terracotta" animate={{ width: `${option.pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate">{totalVotes} total votes</p>
              </div>
            )}

            {poll.type === "word_cloud" && (
              <div>
                <div className="bg-warm-white rounded-xl border border-clay/30 min-h-[220px] p-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
                  {results.words?.length ? results.words.map((word) => (
                    <span key={word.text} className="font-semibold text-terracotta" style={{ fontSize: `${Math.min(36, 14 + word.count * 5)}px` }}>{word.text}</span>
                  )) : <span className="text-slate text-sm">Words appear here live.</span>}
                </div>
                <InsightStrip results={results} />
              </div>
            )}

            {poll.type === "qa" && (
              <div className="space-y-3">
                {results.questions?.length ? results.questions.map((question) => (
                  <div key={question.id} className="bg-warm-white rounded-xl border border-clay/30 p-4 flex items-start justify-between gap-4">
                    <p className="text-charcoal text-sm">{question.questionText}</p>
                    <button onClick={() => voteQuestion(question.id)} disabled={!canParticipate} className="flex items-center gap-1 text-xs bg-cream hover:bg-terracotta/10 text-slate hover:text-terracotta rounded-lg px-2 py-1">
                      <ThumbsUp size={12} /> {question.upvotes}
                    </button>
                  </div>
                )) : <p className="text-slate text-sm">Questions appear here live.</p>}
                <InsightStrip results={results} />
              </div>
            )}

            {poll.type === "rating" && (
              <div className="space-y-3">
                <div className="bg-warm-white rounded-xl border border-clay/30 p-5 text-center">
                  <Star className="w-7 h-7 text-terracotta mx-auto mb-2" />
                  <p className="text-3xl font-bold text-charcoal">{(results.average || 0).toFixed(1)}</p>
                  <p className="text-xs text-slate">Average rating from {results.totalResponses} responses</p>
                </div>
                {Object.entries(results.distribution || {}).map(([value, count]) => {
                  const pct = results.totalResponses ? (Number(count) / results.totalResponses) * 100 : 0;
                  return (
                    <div key={value} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-mono text-charcoal">{value}</span>
                      <div className="flex-1 h-3 bg-warm-white rounded-full overflow-hidden border border-clay/30">
                        <motion.div className="h-full rounded-full bg-terracotta" animate={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-xs text-slate text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {poll.type === "quiz" && (
              <div className="space-y-3">
                {results.leaderboard?.length ? results.leaderboard.map((row, index) => (
                  <div key={row.participantId} className="bg-warm-white rounded-xl border border-clay/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold">{index + 1}</div>
                      <div>
                        <p className="font-medium text-charcoal">{row.name}</p>
                        <p className="text-xs text-slate">{row.correct}/{row.answered} correct</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-charcoal"><Trophy size={14} className="text-terracotta" /> {row.score}</div>
                  </div>
                )) : <p className="text-slate text-sm">Leaderboard appears after answers are submitted.</p>}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function InsightStrip({ results }: { results: PollResults }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-4">
      <div className="bg-warm-white rounded-xl border border-clay/30 p-4">
        <p className="text-xs text-slate uppercase tracking-wide mb-1">Sentiment</p>
        <p className="text-2xl font-bold text-charcoal">{results.sentiment?.score ?? 50}%</p>
        <p className="text-xs text-slate capitalize">{results.sentiment?.label || "neutral"}</p>
      </div>
      <div className="bg-warm-white rounded-xl border border-clay/30 p-4">
        <p className="text-xs text-slate uppercase tracking-wide mb-2">Top Themes</p>
        <div className="flex flex-wrap gap-1">
          {results.themes?.length ? results.themes.slice(0, 3).map((theme) => (
            <span key={theme.label} className="text-xs bg-cream rounded-md px-2 py-1 text-slate">{theme.label}</span>
          )) : <span className="text-xs text-slate">Waiting for text responses</span>}
        </div>
      </div>
    </div>
  );
}
