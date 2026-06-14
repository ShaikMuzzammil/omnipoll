import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, BookOpen, BarChart3, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const typeIcon = (t: Notification['type']) => {
  switch (t) {
    case 'result_released':  return <BookOpen  size={14} className="text-green-600" />;
    case 'poll_started':     return <BarChart3 size={14} className="text-blue-600" />;
    case 'classroom_invite': return <Users     size={14} className="text-purple-600" />;
    case 'quiz_graded':      return <Trophy    size={14} className="text-yellow-600" />;
    default:                 return <Bell      size={14} className="text-terracotta-500" />;
  }
};

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-cream-200 text-slate-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-10 w-80 bg-white border border-cream-300 rounded-xl shadow-xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-200">
              <h3 className="font-display font-semibold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-cream-50 border-b border-cream-100 last:border-0 ${!n.isRead ? 'bg-terracotta-50/40' : ''}`}
                  >
                    <div className="w-7 h-7 bg-cream-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {typeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-terracotta-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-cream-200 text-center">
              <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium">
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
