import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, MinusCircle, ArrowLeft, Download, Trophy, Clock, BarChart3 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { attemptsApi } from '@/lib/api';
import { formatDate, formatDuration, scoreColor, scoreLabel } from '@/lib/utils';

interface KeySheetData {
  attempt: {
    id: string; status: string; score: number; maxScore: number;
    percentage: number; passed: boolean; timeTaken: number;
    submittedAt: string; guestName?: string;
    user?: { name: string; email: string };
    poll: { title: string; description?: string; settings: { passingScore?: number } };
  };
  answers: {
    questionId: string; questionTitle: string; questionType: string;
    yourAnswer: string; correctAnswer: string;
    isCorrect: boolean; isPartial: boolean;
    pointsEarned: number; maxPoints: number;
    timeTaken?: number; explanation?: string;
  }[];
}

export default function KeySheet() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<KeySheetData>({
    queryKey: ['keysheet', id],
    queryFn: () => attemptsApi.keySheet(id!) as Promise<KeySheetData>,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-terracotta-400"/>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 mb-3">Key sheet not available yet.</p>
        <p className="text-sm text-slate-400 mb-5">Your teacher hasn't released results yet.</p>
        <Link to="/student/results" className="text-terracotta-600 font-medium hover:text-terracotta-700">← My Results</Link>
      </div>
    </div>
  );

  const { attempt, answers } = data;
  const pct = attempt.percentage ?? 0;

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link to="/student/results" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-terracotta-600 mb-5 transition-colors">
          <ArrowLeft size={14}/> My Results
        </Link>

        {/* Score card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="op-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-slate-800 mb-1">{attempt.poll.title}</h1>
              {attempt.poll.description && <p className="text-sm text-slate-500">{attempt.poll.description}</p>}
              <p className="text-xs text-slate-400 mt-2">
                Submitted {attempt.submittedAt ? formatDate(attempt.submittedAt) : '—'}
                {attempt.timeTaken && ` · ${formatDuration(attempt.timeTaken)}`}
              </p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className={`text-4xl font-display font-black ${scoreColor(pct)}`}>{pct.toFixed(0)}%</div>
              <div className="text-xs text-slate-500 mt-0.5">{attempt.score}/{attempt.maxScore} pts</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-cream-200">
            <div className="text-center">
              <div className={`text-lg font-bold ${scoreColor(pct)}`}>{scoreLabel(pct)}</div>
              <div className="text-xs text-slate-400">Performance</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${attempt.passed ? 'text-green-600' : 'text-red-500'}`}>
                {attempt.passed ? '✓ Pass' : '✗ Fail'}
              </div>
              <div className="text-xs text-slate-400">
                {attempt.poll.settings.passingScore ? `Passing: ${attempt.poll.settings.passingScore}%` : 'No cut-off'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-700 flex items-center justify-center gap-1">
                <Clock size={14}/>{attempt.timeTaken ? formatDuration(attempt.timeTaken) : '—'}
              </div>
              <div className="text-xs text-slate-400">Time taken</div>
            </div>
          </div>

          {/* Visual score bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Score</span><span>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, ease:'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Answer breakdown */}
        <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-terracotta-500"/> Detailed Answer Sheet
        </h2>

        <div className="space-y-3">
          {answers.map((ans, i) => (
            <motion.div
              key={ans.questionId}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              className={`op-card p-4 ${ans.isCorrect ? 'border-l-4 border-l-green-500' : ans.isPartial ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-red-400'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {ans.isCorrect
                    ? <CheckCircle size={18} className="text-green-500"/>
                    : ans.isPartial
                    ? <MinusCircle size={18} className="text-yellow-500"/>
                    : <XCircle size={18} className="text-red-500"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">Q{i+1}. {ans.questionTitle}</p>
                    <span className={`text-xs font-bold flex-shrink-0 ${ans.isCorrect ? 'text-green-600' : ans.isPartial ? 'text-yellow-600' : 'text-red-500'}`}>
                      {ans.pointsEarned}/{ans.maxPoints} pts
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className={`text-xs px-3 py-2 rounded-lg ${ans.isCorrect ? 'answer-correct' : 'answer-wrong'}`}>
                      <span className="font-medium">Your answer: </span>
                      <span>{ans.yourAnswer || '(no answer)'}</span>
                    </div>
                    {!ans.isCorrect && ans.correctAnswer && (
                      <div className="answer-correct text-xs">
                        <span className="font-medium">Correct answer: </span>
                        <span className="text-green-700">{ans.correctAnswer}</span>
                      </div>
                    )}
                    {ans.explanation && (
                      <div className="text-xs px-3 py-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-blue-700">
                        <span className="font-medium">💡 Explanation: </span>{ans.explanation}
                      </div>
                    )}
                  </div>

                  {ans.timeTaken && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={10}/> {ans.timeTaken}s
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary footer */}
        <div className="mt-6 p-4 bg-cream-200/60 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              <CheckCircle size={14}/> {answers.filter(a => a.isCorrect).length} Correct
            </span>
            <span className="flex items-center gap-1.5 text-yellow-600 font-medium">
              <MinusCircle size={14}/> {answers.filter(a => a.isPartial && !a.isCorrect).length} Partial
            </span>
            <span className="flex items-center gap-1.5 text-red-500 font-medium">
              <XCircle size={14}/> {answers.filter(a => !a.isCorrect && !a.isPartial).length} Wrong
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
