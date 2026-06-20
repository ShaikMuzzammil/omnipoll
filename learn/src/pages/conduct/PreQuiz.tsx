import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Clock, Monitor, CheckCircle, ArrowRight, Shield, Wifi } from 'lucide-react';
import type { Poll } from '@/lib/types';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';

interface Props {
  poll: Poll;
  guestName?: string;
  onJoin: () => void;
}

export default function PreQuiz({ poll, guestName, onJoin }: Props) {
  const settings = poll.settings ?? {};
  const isQuiz   = ['quiz','multiple_choice','true_false'].includes(poll.type);

  const warnings = [
    settings.preventTabSwitch && {
      icon: Eye, color: 'text-red-600', bg: 'bg-red-50 border-red-200',
      title: 'Tab switching is monitored',
      desc: 'Switching to another tab or window will be detected and reported to your teacher immediately.',
    },
    settings.timeLimit && {
      icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',
      title: `Time limit: ${settings.timeLimit}s per question`,
      desc: 'Each question has a time limit. Unanswered questions will be auto-submitted when time runs out.',
    },
    settings.shuffleQuestions && {
      icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200',
      title: 'Questions are shuffled',
      desc: 'The order of questions is randomized for each participant.',
    },
    settings.shuffleOptions && {
      icon: Monitor, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',
      title: 'Options are shuffled',
      desc: 'Answer choices appear in different orders for each participant.',
    },
  ].filter(Boolean) as { icon: typeof Eye; color: string; bg: string; title: string; desc: string }[];

  const guides = [
    { icon: Wifi,      text: 'Stay connected — use a stable internet connection' },
    { icon: Monitor,   text: 'Use a desktop or laptop for the best experience' },
    { icon: Shield,    text: 'Make sure you are ready before clicking Join' },
    { icon: CheckCircle, text: isQuiz ? 'Read each question carefully before answering' : 'Your response will be submitted immediately' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="bg-white border border-cream-300 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pollTypeIcon(poll.type)}</span>
              <div>
                <p className="text-terracotta-200 text-xs font-semibold uppercase tracking-wide">{pollTypeLabel(poll.type)}</p>
                <h1 className="font-display text-xl font-bold">{poll.title}</h1>
              </div>
            </div>
            {poll.description && <p className="text-terracotta-100 text-sm">{poll.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-terracotta-200 text-xs">
              {guestName && <span>Joining as <strong className="text-white">{guestName}</strong></span>}
              <span className="flex items-center gap-1"><CheckCircle size={11}/> {poll.uniqueParticipants} joined</span>
              <span className="font-mono font-bold text-white tracking-widest">#{poll.code}</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500"/> Important Notices
                </h3>
                {warnings.map((w, i) => (
                  <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${w.bg}`}>
                    <w.icon size={16} className={`${w.color} flex-shrink-0 mt-0.5`}/>
                    <div>
                      <p className={`text-sm font-semibold ${w.color}`}>{w.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{w.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Guide */}
            <div>
              <h3 className="font-display font-semibold text-slate-700 text-sm mb-2">Before you start</h3>
              <div className="space-y-2">
                {guides.map((g, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <g.icon size={12} className="text-green-600"/>
                    </div>
                    {g.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings summary */}
            {isQuiz && (
              <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 mb-2">Quiz settings</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Tab monitoring', settings.preventTabSwitch ? '✅ Active' : '❌ Off'],
                    ['Time per Q',     settings.timeLimit ? `${settings.timeLimit}s` : 'Unlimited'],
                    ['Shuffle Q',      settings.shuffleQuestions ? '✅ Yes' : 'No'],
                    ['Allow review',   settings.allowReview ? '✅ Yes' : 'No'],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-medium text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button onClick={onJoin}
              whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg">
              Join {isQuiz ? 'Quiz' : 'Poll'} <ArrowRight size={18}/>
            </motion.button>

            <p className="text-center text-xs text-slate-400">
              By joining you agree to attempt this {isQuiz ? 'quiz' : 'poll'} fairly without external assistance.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
