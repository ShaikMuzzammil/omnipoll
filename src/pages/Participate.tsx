import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { Send, ThumbsUp, CheckCircle, ArrowUp, ArrowDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";
import { joinByCode, vote, addQAQuestion, upvoteQAQuestion } from "@/lib/api";
import type { Poll, QAQuestion } from "@/lib/types";
import { toast } from "sonner";

const PARTICIPANT_ID = (() => {
  let id = localStorage.getItem("omnipoll_pid");
  if (!id) { id = nanoid(); localStorage.setItem("omnipoll_pid", id); }
  return id;
})();

const EMOJIS = ["😄","😂","❤️","👏","🔥","😮","😢","👍","🚀","🎉"];

export default function Participate() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [status, setStatus] = useState<string>("live");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [ranking, setRanking] = useState<string[]>([]);
  const [sliderVal, setSliderVal] = useState(50);
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string,string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string,string>>({});
  const [priorityPoints, setPriorityPoints] = useState<Record<string,number>>({});
  const [heatmapPoint, setHeatmapPoint] = useState<{x:number;y:number}|null>(null);
  const [qaText, setQaText] = useState("");
  const [qaList, setQaList] = useState<QAQuestion[]>([]);
  const [participantName, setParticipantName] = useState(() => localStorage.getItem("omnipoll_name")||"");
  const [nameSet, setNameSet] = useState(!!localStorage.getItem("omnipoll_name"));
  const imgRef = useRef<HTMLImageElement>(null);

  const { socket, connected, emitVote, emitQA, emitQAUpvote } = useSocket(poll?.id || null, participantName);

  useEffect(() => {
    if (!code) return;
    joinByCode(code.toUpperCase())
      .then(d => {
        setPoll(d.poll);
        setStatus(d.poll.status);
        setRanking((d.poll.options||[]).map((o:{id:string}) => o.id));
        const pts: Record<string,number> = {};
        (d.poll.options||[]).forEach((o:{id:string}) => { pts[o.id] = 0; });
        setPriorityPoints(pts);
        setQaList((d.poll.qaQuestions||[]).sort((a:{upvotes:number},b:{upvotes:number}) => b.upvotes - a.upvotes));
      })
      .catch(() => setError("Poll not found. Check your code."))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (!socket) return;
    socket.on("status-changed", ({ status: s }) => setStatus(s));
    socket.on("qa-update", ({ questions }) => setQaList(questions));
    return () => { socket.off("status-changed"); socket.off("qa-update"); };
  }, [socket]);

  const setName = () => {
    if (!participantName.trim()) { toast.error("Enter your name"); return; }
    localStorage.setItem("omnipoll_name", participantName.trim());
    setNameSet(true);
  };

  const getAnswer = (): unknown => {
    if (!poll) return null;
    const t = poll.type;
    if (["multiple_choice","image_choice","true_false","countdown_vote"].includes(t)) return selected[0];
    if (t === "emoji_reaction") return selected[0];
    if (t === "bracket") return selected[0];
    if (["word_cloud","open_text","fill_blank"].includes(t)) return textAnswer;
    if (["rating","nps"].includes(t)) return Number(selected[0]);
    if (t === "slider") return sliderVal;
    if (t === "ranking") return ranking;
    if (t === "matrix") return matrixAnswers;
    if (t === "live_matching") return matchingAnswers;
    if (t === "prioritization") return priorityPoints;
    if (t === "heatmap") return heatmapPoint;
    return null;
  };

  const handleSubmit = async () => {
    const answer = getAnswer();
    if (answer === null || answer === undefined || (Array.isArray(answer) && answer.length === 0)) { toast.error("Please select or enter an answer"); return; }
    try {
      if (socket) socket.emit("vote:submit", { pollId: poll!.id, participantId: PARTICIPANT_ID, participantName, answer });
      else await vote(poll!.id, { participantId: PARTICIPANT_ID, participantName, answer });
      setSubmitted(true);
      toast.success("Response submitted! 🎉");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Already voted"); }
  };

  const submitQA = async () => {
    if (!qaText.trim()) return;
    try {
      if (socket) socket.emit("submit-qa", { pollId: poll!.id, text: qaText.trim(), author: participantName || 'Anonymous' });
      else await addQAQuestion(poll!.id, { text: qaText.trim(), author: participantName || 'Anonymous' });
      setQaText(""); toast.success("Question submitted!");
    } catch { toast.error("Failed to submit question"); }
  };

  const upvote = async (questionId: string) => {
    try {
      if (socket) socket.emit("qa:upvote", { pollId: poll!.id, questionId });
      else await upvoteQAQuestion(poll!.id, questionId);
    } catch { toast.error("Failed to upvote"); }
  };

  if (loading) return <Screen><div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" /></Screen>;
  if (error) return <Screen><div className="text-center p-6"><p className="text-2xl mb-2">😕</p><p className="text-foreground font-semibold">{error}</p><Button className="mt-4" onClick={() => navigate("/join")}>Try again</Button></div></Screen>;
  if (!poll) return null;

  if (!nameSet && poll.type !== "qa") return (
    <Screen>
      <div className="max-w-xs w-full space-y-4 p-6">
        <div className="text-center"><span className="text-4xl">👋</span><h1 className="text-xl font-playfair font-bold text-foreground mt-2">What's your name?</h1></div>
        <Input value={participantName} onChange={e => setParticipantName(e.target.value)} placeholder="Enter your name" onKeyDown={e => e.key === "Enter" && setName()} autoFocus />
        <Button onClick={setName} className="w-full bg-terracotta hover:bg-terracotta/90">Join Poll</Button>
      </div>
    </Screen>
  );

  if (status === "closed") return (
    <Screen><div className="text-center p-6"><p className="text-5xl mb-3">🏁</p><h2 className="text-xl font-playfair font-bold text-foreground">Poll has ended</h2><p className="text-muted-foreground mt-2">Thanks for participating!</p></div></Screen>
  );

  if (status === "paused") return (
    <Screen><div className="text-center p-6"><p className="text-5xl mb-3">⏸️</p><h2 className="text-xl font-playfair font-bold text-foreground">Poll is paused</h2><p className="text-muted-foreground mt-2">Please wait for the host to resume.</p></div></Screen>
  );

  if (submitted && poll.type !== "qa") return (
    <Screen>
      <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="text-center p-8">
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.2,type:"spring"}}>
          <CheckCircle className="w-20 h-20 text-terracotta mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-playfair font-bold text-foreground mt-4">Response submitted!</h2>
        <p className="text-muted-foreground mt-2">Thanks{participantName ? `, ${participantName}` : ""}! Your answer has been recorded.</p>
      </motion.div>
    </Screen>
  );

  const totalPts = Object.values(priorityPoints).reduce((a, b) => a + b, 0);

  return (
    <Screen>
      <div className="w-full max-w-lg px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-mono bg-muted text-muted-foreground px-3 py-1 rounded-full inline-block mb-3">{poll.code}</div>
          <h1 className="text-2xl font-playfair font-bold text-foreground leading-snug">{poll.question}</h1>
          {poll.description && <p className="text-muted-foreground text-sm mt-2">{poll.description}</p>}
        </div>

        {/* Poll UI per type */}
        <AnimatePresence mode="wait">
          <motion.div key={poll.type} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>

            {/* Multiple choice / Image choice / True-False / Countdown */}
            {["multiple_choice","image_choice","true_false","countdown_vote"].includes(poll.type) && (
              <div className="space-y-2">
                {poll.options.map(opt => (
                  <button key={opt.id} onClick={() => setSelected([opt.id])}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium text-foreground ${selected[0]===opt.id ? "border-terracotta bg-terracotta/5 shadow-sm" : "border-border hover:border-terracotta/40 bg-card hover:bg-accent/30"}`}>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Reaction */}
            {poll.type === "emoji_reaction" && (
              <div className="flex flex-wrap gap-3 justify-center">
                {(poll.options.length > 0 ? poll.options.map(o => o.text) : EMOJIS).map(emoji => (
                  <button key={emoji} onClick={() => setSelected([emoji])}
                    className={`text-4xl p-3 rounded-2xl border-2 transition-all ${selected[0]===emoji ? "border-terracotta bg-terracotta/5 scale-110 shadow-md" : "border-border hover:border-terracotta/40 hover:scale-105"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Rating */}
            {poll.type === "rating" && (
              <div className="space-y-3">
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setSelected([String(n)])}
                      className={`w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all ${selected[0]===String(n) ? "border-terracotta bg-terracotta text-white shadow-md" : "border-border hover:border-terracotta/40 bg-card text-foreground"}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>😐 Poor</span><span>😊 Average</span><span>🤩 Excellent</span>
                </div>
              </div>
            )}

            {/* NPS */}
            {poll.type === "nps" && (
              <div className="space-y-3">
                <div className="flex gap-1 flex-wrap justify-center">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setSelected([String(n)])}
                      className={`w-11 h-11 rounded-lg border-2 font-bold text-sm transition-all ${selected[0]===String(n) ? "border-terracotta bg-terracotta text-white" : `border-border bg-card text-foreground hover:border-terracotta/40 ${n<=6?"hover:bg-red-50":n<=8?"hover:bg-yellow-50":"hover:bg-green-50"}`}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Not at all likely</span><span>Extremely likely</span>
                </div>
              </div>
            )}

            {/* Slider */}
            {poll.type === "slider" && (
              <div className="space-y-4 px-2">
                <div className="text-center text-4xl font-bold text-terracotta">{sliderVal}</div>
                <input type="range" min={poll.settings?.min??0} max={poll.settings?.max??100} step={poll.settings?.step??1}
                  value={sliderVal} onChange={e => setSliderVal(Number(e.target.value))}
                  className="w-full accent-terracotta" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{poll.settings?.min ?? 0}</span>
                  {poll.settings?.labelLeft && <span>{poll.settings.labelLeft}</span>}
                  <span>{poll.settings?.max ?? 100}</span>
                </div>
              </div>
            )}

            {/* Word Cloud / Open Text */}
            {["word_cloud","open_text"].includes(poll.type) && (
              <div>
                <Input value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                  placeholder={poll.type==="word_cloud" ? "Type a word or short phrase..." : "Type your answer..."}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} autoFocus className="h-12 text-base" />
              </div>
            )}

            {/* Fill in the blank */}
            {poll.type === "fill_blank" && (
              <div className="space-y-3">
                <div className="text-foreground font-medium bg-muted/50 rounded-xl p-4 text-center leading-relaxed">
                  {(poll.settings?.sentence||"___").split("___").map((part, i, arr) => (
                    <span key={i}>{part}{i < arr.length-1 && <span className="inline-block border-b-2 border-terracotta min-w-[80px] mx-1 text-terracotta">{textAnswer||"…"}</span>}</span>
                  ))}
                </div>
                <Input value={textAnswer} onChange={e => setTextAnswer(e.target.value)} placeholder="Fill in the blank..." autoFocus className="h-12" />
              </div>
            )}

            {/* Ranking */}
            {poll.type === "ranking" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">Drag to reorder (use arrows)</p>
                {ranking.map((id, idx) => {
                  const opt = poll.options.find(o => o.id === id);
                  return opt ? (
                    <div key={id} className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
                      <span className="w-7 h-7 rounded-full bg-terracotta/10 text-terracotta font-bold text-sm flex items-center justify-center">{idx+1}</span>
                      <span className="flex-1 text-foreground font-medium">{opt.text}</span>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => { if(idx===0)return; const r=[...ranking];[r[idx-1],r[idx]]=[r[idx],r[idx-1]];setRanking(r); }} disabled={idx===0} className="p-1 rounded hover:bg-accent disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => { if(idx===ranking.length-1)return; const r=[...ranking];[r[idx],r[idx+1]]=[r[idx+1],r[idx]];setRanking(r); }} disabled={idx===ranking.length-1} className="p-1 rounded hover:bg-accent disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Matrix */}
            {poll.type === "matrix" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left pb-3 text-muted-foreground text-xs font-medium"></th>
                    {(poll.settings?.matrixColumns||[]).map(col => <th key={col.id} className="pb-3 text-center text-xs font-medium text-muted-foreground px-2">{col.label}</th>)}
                  </tr></thead>
                  <tbody>
                    {(poll.settings?.matrixRows||[]).map(row => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="py-3 pr-4 text-foreground text-sm font-medium">{row.label}</td>
                        {(poll.settings?.matrixColumns||[]).map(col => (
                          <td key={col.id} className="text-center py-3 px-2">
                            <button onClick={() => setMatrixAnswers(a => ({...a,[row.id]:col.id}))}
                              className={`w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${matrixAnswers[row.id]===col.id ? "border-terracotta bg-terracotta" : "border-muted-foreground hover:border-terracotta"}`}>
                              {matrixAnswers[row.id]===col.id && <div className="w-2 h-2 rounded-full bg-white" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Live Matching */}
            {poll.type === "live_matching" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">Match each item on the left with the correct item on the right</p>
                {(poll.settings?.matchingPairs||[]).map(pair => (
                  <div key={pair.id} className="grid grid-cols-2 gap-2 items-center">
                    <div className="bg-muted rounded-lg p-3 text-sm font-medium text-foreground text-center">{pair.left}</div>
                    <select value={matchingAnswers[pair.left]||""} onChange={e => setMatchingAnswers(a => ({...a,[pair.left]:e.target.value}))}
                      className="rounded-lg border border-border p-2 text-sm bg-card text-foreground focus:border-terracotta focus:outline-none">
                      <option value="">Select...</option>
                      {(poll.settings?.matchingPairs||[]).map(p => <option key={p.id} value={p.right}>{p.right}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Prioritization */}
            {poll.type === "prioritization" && (
              <div className="space-y-3">
                <div className="text-center">
                  <span className={`text-2xl font-bold ${totalPts>100?"text-red-500":totalPts===100?"text-green-500":"text-terracotta"}`}>{100-totalPts}</span>
                  <span className="text-sm text-muted-foreground"> points remaining</span>
                </div>
                {poll.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <span className="text-sm text-foreground font-medium flex-1">{opt.text}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPriorityPoints(p => ({...p,[opt.id]:Math.max(0,(p[opt.id]||0)-10)}))}>
                        <ArrowDown className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <span className="w-10 text-center font-bold text-foreground">{priorityPoints[opt.id]||0}</span>
                      <button onClick={() => { if(totalPts>=100)return; setPriorityPoints(p => ({...p,[opt.id]:(p[opt.id]||0)+10})); }}>
                        <ArrowUp className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Heatmap */}
            {poll.type === "heatmap" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">Click on the image to mark your answer</p>
                <div className="relative rounded-xl overflow-hidden border border-border cursor-crosshair">
                  <img ref={imgRef} src={poll.settings?.imageUrl||"https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"} alt="heatmap"
                    className="w-full object-cover max-h-64"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHeatmapPoint({ x: Math.round(((e.clientX-rect.left)/rect.width)*100), y: Math.round(((e.clientY-rect.top)/rect.height)*100) });
                    }} />
                  {heatmapPoint && (
                    <div className="absolute w-6 h-6 bg-terracotta rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ left:`${heatmapPoint.x}%`, top:`${heatmapPoint.y}%` }} />
                  )}
                </div>
                {heatmapPoint && <p className="text-xs text-center text-muted-foreground">Marked at ({heatmapPoint.x}%, {heatmapPoint.y}%)</p>}
              </div>
            )}

            {/* Bracket */}
            {poll.type === "bracket" && (
              <div className="space-y-2">
                {poll.options.filter(o => !o.eliminated).map(opt => (
                  <button key={opt.id} onClick={() => setSelected([opt.id])}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${selected[0]===opt.id ? "border-terracotta bg-terracotta/5 shadow-sm" : "border-border hover:border-terracotta/40 bg-card"}`}>
                    🥊 {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* Q&A */}
            {poll.type === "qa" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={qaText} onChange={e => setQaText(e.target.value)} placeholder="Ask a question..."
                    onKeyDown={e => e.key==="Enter" && submitQA()} className="flex-1" />
                  <Button onClick={submitQA} className="bg-terracotta hover:bg-terracotta/90 px-3"><Send className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {qaList.filter(q => q.status !== "dismissed").map(q => (
                    <div key={q.id} className={`p-3 rounded-xl border ${q.status==="highlighted" ? "border-yellow-300 bg-yellow-50/50" : "border-border bg-card"}`}>
                      <p className="text-sm text-foreground">{q.questionText}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => upvote(q.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-terracotta transition-colors">
                          <ThumbsUp className="w-3 h-3" />{q.upvotes}
                        </button>
                        {q.status==="highlighted" && <Star className="w-3 h-3 text-yellow-500" />}
                        {q.status==="answered" && <span className="text-xs text-green-600 font-medium">Answered</span>}
                      </div>
                    </div>
                  ))}
                  {qaList.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No questions yet. Be the first!</p>}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Submit */}
        {poll.type !== "qa" && (
          <Button onClick={handleSubmit} className="w-full bg-terracotta hover:bg-terracotta/90 h-12 text-base font-semibold gap-2">
            <Send className="w-4 h-4" />Submit Answer
          </Button>
        )}
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-white dark:bg-background flex flex-col items-center justify-center">
      {children}
    </div>
  );
}
