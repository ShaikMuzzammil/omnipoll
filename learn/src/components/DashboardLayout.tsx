import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, LogOut, BookOpen, Trophy, GraduationCap,
  Bell, Settings, Home, HelpCircle, Menu, ChevronLeft,
  ArrowRight, Zap, Star, Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import HelpCenterModal from './HelpCenterModal';

interface NavItem { label:string; href:string; icon:LucideIcon; badge?:string|number }

const NAV: NavItem[] = [
  { label:'My Dashboard',  href:'/student/dashboard',  icon:LayoutDashboard },
  { label:'My Results',    href:'/student/results',     icon:BookOpen },
  { label:'Classrooms',    href:'/classrooms',          icon:GraduationCap },
  { label:'Leaderboard',   href:'/leaderboard',         icon:Trophy },
  { label:'Notifications', href:'/notifications',       icon:Bell },
  { label:'Settings',      href:'/settings',            icon:Settings },
];

const QUICK_JOIN = [
  { emoji:'🧠', label:'Join Quiz',  href:'/join?type=quiz' },
  { emoji:'📊', label:'Join Poll',  href:'/join' },
  { emoji:'📋', label:'My Scores',  href:'/student/results' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, notifications } = useApp();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen,   setHelpOpen]   = useState(false);

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'ST';
  const unread   = notifications.filter(n => !n.isRead).length;

  const isActive = (href: string) =>
    location.pathname === href.split('?')[0] ||
    (href !== '/student/dashboard' && location.pathname.startsWith(href.split('?')[0]));

  const SidebarContent = ({ mobile=false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-2 px-4 py-4 border-b border-cream-200', collapsed && !mobile ? 'justify-center px-2' : '')}>
        <div className="w-8 h-8 bg-terracotta-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <BookOpen size={15} className="text-white"/>
        </div>
        {(!collapsed || mobile) && (
          <div>
            <span className="font-display font-bold text-slate-800 text-base leading-none">OmniPoll</span>
            <span className="text-terracotta-500 ml-1 text-[10px] font-bold">LEARN</span>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto p-1 hover:bg-cream-200 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft size={14} className={cn('transition-transform', collapsed ? 'rotate-180' : '')}/>
          </button>
        )}
      </div>

      {/* Quick join card */}
      {(!collapsed || mobile) && (
        <div className="mx-3 mt-3 p-3 bg-terracotta-500 rounded-xl text-white">
          <p className="text-xs font-bold text-terracotta-100 mb-2">Quick Actions</p>
          <div className="space-y-1">
            {QUICK_JOIN.map(q => (
              <Link key={q.href} to={q.href} onClick={() => mobile && setMobileOpen(false)}
                className="flex items-center gap-2 text-xs font-medium hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors">
                <span>{q.emoji}</span>{q.label}
                <ArrowRight size={10} className="ml-auto"/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={cn('flex-1 py-3', collapsed && !mobile ? 'px-2' : 'px-2')}>
        {NAV.map(item => {
          const active = isActive(item.href);
          const badge  = item.label === 'Notifications' ? unread : item.badge;
          return (
            <Link key={item.href} to={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              title={collapsed && !mobile ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 relative group',
                collapsed && !mobile ? 'justify-center px-2' : '',
                active ? 'bg-terracotta-500 text-white shadow-sm' : 'text-slate-600 hover:bg-terracotta-50 hover:text-terracotta-700'
              )}>
              <item.icon size={16} className="flex-shrink-0"/>
              {(!collapsed || mobile) && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {badge && Number(badge) > 0 && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/30' : 'bg-red-100 text-red-700')}>
                      {badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && !mobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}{badge && Number(badge) > 0 ? ` (${badge})` : ''}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stats strip */}
      {(!collapsed || mobile) && (
        <div className="mx-3 mb-3 p-3 bg-cream-100 border border-cream-200 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">My Progress</p>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[
              { icon:Star,  val:'—', label:'Avg' },
              { icon:Trophy,val:'—', label:'Best' },
              { icon:Clock, val:'—', label:'Done' },
            ].map(s => (
              <div key={s.label}>
                <s.icon size={11} className="text-terracotta-400 mx-auto mb-0.5"/>
                <p className="text-xs font-bold text-slate-700">{s.val}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className={cn('border-t border-cream-200 pt-2 pb-2', collapsed && !mobile ? 'px-2' : 'px-2')}>
        <Link to="/" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-cream-100 transition-all mb-0.5', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <Home size={14}/>{(!collapsed||mobile) && 'Home'}
        </Link>
        <button onClick={() => setHelpOpen(true)}
          className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-cream-100 transition-all mb-0.5', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <HelpCircle size={14}/>{(!collapsed||mobile) && 'Help'}
        </button>
        <button onClick={() => { logout(); navigate('/'); }}
          className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-all', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <LogOut size={14}/>{(!collapsed||mobile) && 'Logout'}
        </button>
      </div>

      {/* User chip */}
      {(!collapsed || mobile) && (
        <div className="mx-2 mb-2 p-2.5 bg-cream-100 border border-cream-200 rounded-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400">Student</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-100 overflow-hidden">
      <motion.aside animate={{ width: collapsed ? 56 : 224 }} transition={{ duration:0.2, ease:'easeInOut' }}
        className="hidden lg:flex flex-col bg-white border-r border-cream-300 flex-shrink-0 overflow-hidden"
        style={{ minWidth: collapsed ? 56 : 224 }}>
        <SidebarContent/>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
            <motion.aside className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-xl"
              initial={{ x:-240 }} animate={{ x:0 }} exit={{ x:-240 }}
              transition={{ type:'spring', stiffness:300, damping:30 }}>
              <SidebarContent mobile/>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)}/>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 bg-white border-b border-cream-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-cream-100 text-slate-500"><Menu size={18}/></button>
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Home size={10}/> <span>/</span>
              <span className="text-slate-700 font-medium capitalize">{location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/join"
              className="hidden sm:flex items-center gap-1.5 text-xs bg-terracotta-500 hover:bg-terracotta-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <Zap size={12}/> Join Poll
            </Link>
            <NotificationBell/>
            <Link to="/settings" className="w-7 h-7 bg-terracotta-100 hover:bg-terracotta-200 rounded-full flex items-center justify-center text-terracotta-700 text-xs font-bold transition-colors">
              {initials}
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <motion.div key={location.pathname} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.18 }}
            className="p-4 lg:p-6 max-w-5xl mx-auto">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
