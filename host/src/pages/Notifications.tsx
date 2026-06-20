import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, BookOpen, BarChart3, Users, Trophy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { notifApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Notification } from '@/lib/types';

const typeIcon = (t: Notification['type']) => {
  switch(t) {
    case 'result_released':  return <BookOpen  size={16} className="text-green-600"/>;
    case 'poll_started':     return <BarChart3 size={16} className="text-blue-600"/>;
    case 'classroom_invite': return <Users     size={16} className="text-purple-600"/>;
    case 'quiz_graded':      return <Trophy    size={16} className="text-yellow-600"/>;
    default:                 return <Bell      size={16} className="text-terracotta-500"/>;
  }
};

export default function Notifications() {
  const { notifications, markRead, markAllRead } = useApp();
  const unread = notifications.filter(n => !n.isRead).length;

  const delMut = useMutation({
    mutationFn: (id:string) => notifApi.delete(id),
    onSuccess: () => toast.success('Notification removed'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-terracotta-600 hover:text-terracotta-700 font-medium px-3 py-1.5 bg-terracotta-50 rounded-xl transition-colors">
            <CheckCheck size={14}/> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white/60 border border-cream-300 rounded-2xl">
          <Bell size={40} className="mx-auto mb-3 text-slate-300"/>
          <p className="text-slate-500">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">You'll be notified when results are released or polls go live</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
              className={`op-card p-4 flex items-start gap-3 cursor-pointer hover:border-terracotta-200 transition-colors ${!n.isRead ? 'bg-terracotta-50/40 border-terracotta-100' : ''}`}
              onClick={() => !n.isRead && markRead(n.id)}>
              <div className="w-9 h-9 bg-cream-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!n.isRead && <span className="w-2 h-2 bg-terracotta-500 rounded-full"/>}
                    <button onClick={e => { e.stopPropagation(); delMut.mutate(n.id); }}
                      className="p-1 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={12}/>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">{formatDate(n.createdAt)}</p>
                {n.link && (
                  <Link to={n.link} className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium mt-1 inline-block" onClick={e => e.stopPropagation()}>
                    View details →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
