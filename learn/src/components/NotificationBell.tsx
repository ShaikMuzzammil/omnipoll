import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, BookOpen, BarChart3, Users, Trophy, Zap, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { Notification } from '@/lib/types';

const typeIcon = (t: Notification['type']) => {
  switch(t) {
    case 'result_released':  return <BookOpen  size={13} className="text-green-600"/>;
    case 'poll_started':     return <BarChart3 size={13} className="text-blue-600"/>;
    case 'classroom_invite': return <Users     size={13} className="text-purple-600"/>;
    case 'quiz_graded':      return <Trophy    size={13} className="text-yellow-600"/>;
    case 'announcement':     return <Zap       size={13} className="text-terracotta-500"/>;
    default:                 return <Info      size={13} className="text-slate-400"/>;
  }
};

const typeColor = (t: Notification['type']) => {
  switch(t) {
    case 'result_released':  return 'bg-green-100';
    case 'poll_started':     return 'bg-blue-100';
    case 'classroom_invite': return 'bg-purple-100';
    case 'quiz_graded':      return 'bg-yellow-100';
    default:                 return 'bg-cream-200';
  }
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { user, notifications, unreadCount, markRead, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Inject a welcome notification for new users
  const displayNotifs: Notification[] = notifications.length === 0 ? [{
    id: 'welcome',
    userId: user?.id ?? '',
    type: 'announcement' as Notification['type'],
    title: `Welcome to OmniPoll, ${user?.name?.split(' ')[0] ?? 'there'}!`,
    message: 'Your account is ready. Create your first poll or join one with a code.',
    isRead: false,
    createdAt: new Date().toISOString(),
    link: '/create',
  }] : notifications;

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl hover:bg-cream-200 text-slate-600 transition-colors"
        aria-label="Notifications">
        <Bell size={17}/>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale:0 }} animate={{ scale:1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terracotta-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-11 w-80 bg-white border border-cream-300 rounded-2xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity:0, y:-8, scale:0.96 }}
            animate={{ opacity:1, y:0,  scale:1 }}
            exit={{   opacity:0, y:-8, scale:0.96 }}
            transition={{ duration:0.15, type:'spring', stiffness:400, damping:30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-200 bg-cream-50">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-terracotta-500"/>
                <h3 className="font-display font-semibold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 bg-terracotta-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-terracotta-600 hover:text-terracotta-700 font-medium px-2 py-1 hover:bg-terracotta-50 rounded-lg transition-colors">
                    <CheckCheck size={11}/> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-cream-200 rounded-lg text-slate-400">
                  <X size={13}/>
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {displayNotifs.slice(0, 15).map((n, i) => (
                <motion.div key={n.id}
                  initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.03 }}
                  onClick={() => { if (n.id !== 'welcome') markRead(n.id); setOpen(false); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-cream-50 border-b border-cream-100 last:border-0 transition-colors ${!n.isRead ? 'bg-terracotta-50/50' : ''}`}
                >
                  <div className={`w-7 h-7 ${typeColor(n.type)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-terracotta-500 rounded-full flex-shrink-0 mt-1.5"/>}
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-cream-200 bg-cream-50 flex items-center justify-between">
              <Link to="/notifications" onClick={() => setOpen(false)}
                className="text-[11px] text-terracotta-600 hover:text-terracotta-700 font-semibold transition-colors">
                View all notifications
              </Link>
              <span className="text-[10px] text-slate-400">{displayNotifs.length} total</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
