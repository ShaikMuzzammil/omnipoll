import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  pollId: string;
  title: string;
}

export default function QRModal({ open, onClose, code, pollId, title }: QRModalProps) {
  const joinUrl = `${window.location.origin}/join/${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Join link copied!');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1,   y: 0,  opacity: 1 }}
            exit={{   scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
              <div>
                <h3 className="font-display font-semibold text-slate-800">Share Poll</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{title}</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-cream-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* QR Code */}
            <div className="p-6 text-center">
              <div className="inline-block p-3 bg-white border-2 border-cream-300 rounded-2xl shadow-sm mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}&bgcolor=FEFAF5&color=374151&qzone=1`}
                  alt="QR Code"
                  className="w-44 h-44"
                />
              </div>

              {/* Code display */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {code.split('').map((ch, i) => (
                    <span key={i} className="w-9 h-11 bg-terracotta-50 border-2 border-terracotta-200 rounded-xl flex items-center justify-center font-mono font-black text-xl text-terracotta-700">
                      {ch}
                    </span>
                  ))}
                </div>
                <button onClick={copyCode} className="p-2 hover:bg-cream-100 rounded-xl text-slate-400 hover:text-terracotta-600 transition-colors" title="Copy code">
                  <Copy size={15} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-5">
                Go to <span className="font-semibold text-slate-700">omnipoll.vercel.app/join</span> and enter code above
              </p>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <Copy size={14} /> Copy Link
                </button>
                <a
                  href={joinUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                >
                  <ExternalLink size={14} /> Preview
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
