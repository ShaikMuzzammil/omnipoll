import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, Globe, Shield, BarChart3, BookOpen, GraduationCap, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props { open: boolean; onClose: () => void; }

const TIPS = [
  {
    icon: PlusCircle,
    color: 'bg-terracotta-100 text-terracotta-600',
    title: 'Create Your First Poll',
    desc: 'Go to Create New and choose a poll type. Add options and share the join code.',
    href: '/create',
  },
  {
    icon: Globe,
    color: 'bg-blue-100 text-blue-600',
    title: 'Join a Poll',
    desc: 'Use the join code shared by your presenter to participate in live polls.',
    href: '/join',
  },
  {
    icon: Shield,
    color: 'bg-purple-100 text-purple-600',
    title: 'Moderation',
    desc: 'Review flagged responses before they appear in your Q&A sessions.',
    href: '/notifications',
  },
  {
    icon: BarChart3,
    color: 'bg-green-100 text-green-600',
    title: 'Analytics',
    desc: 'Deep-dive into response patterns, score distributions and item analysis.',
    href: '/analytics',
  },
  {
    icon: GraduationCap,
    color: 'bg-amber-100 text-amber-600',
    title: 'Classrooms',
    desc: 'Create student groups, invite with a code and track individual progress.',
    href: '/classrooms',
  },
  {
    icon: BookOpen,
    color: 'bg-pink-100 text-pink-600',
    title: 'Key Sheets',
    desc: 'After closing a quiz, release results. Students see every answer explained.',
    href: '/dashboard',
  },
];

const AI_TIP = {
  icon: Zap,
  title: 'AI-Powered Insights',
  desc: 'Word Cloud and Q&A polls now produce local sentiment and theme clustering without requiring an external API key.',
};

export default function HelpCenterModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={{   scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-cream-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-terracotta-100 rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-terracotta-600" />
                </div>
                <h3 className="font-display font-bold text-slate-800">Help Center</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tips grid */}
            <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
              {TIPS.map((tip) => (
                <Link
                  key={tip.title}
                  to={tip.href}
                  onClick={onClose}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-cream-200 hover:border-terracotta-200 hover:bg-terracotta-50/40 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                    <tip.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">{tip.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-terracotta-400 flex-shrink-0 mt-0.5 transition-colors" />
                </Link>
              ))}

              {/* AI tip card */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-terracotta-50 to-amber-50 border border-terracotta-200">
                <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AI_TIP.icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-terracotta-800 mb-0.5">✨ {AI_TIP.title}</p>
                  <p className="text-xs text-terracotta-600 leading-relaxed">{AI_TIP.desc}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-cream-200 bg-cream-50 flex items-center justify-between">
              <a href="#contact" onClick={onClose} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium transition-colors">
                Contact Support →
              </a>
              <button onClick={onClose}
                className="px-4 py-2 bg-white border border-cream-300 hover:bg-cream-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
