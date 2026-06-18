import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, PlusCircle, BarChart3, Settings, LogOut,
  Users, GraduationCap, Trophy, Layers, HelpCircle, ChevronLeft,
  Menu, X, Home, Bell, BookOpen, Shield,
} from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import HelpCenterModal from './HelpCenterModal';

type NavItem = { label:string; href:string; icon:LucideIcon; badge?:string };
const NAV_TEACHER: NavItem[] = [
  { label:'Dashboard',  href:'/dashboard',         icon:LayoutDashboard },
  { label:'My Polls',   href:'/dashboard?tab=polls',icon:BarChart3 },
  { label:'Create New', href:'/create',             icon:PlusCircle },
  { label:'Moderation', href:'/notifications',      icon:Shield, badge:'moderation' },
  { label:'Analytics',  href:'/analytics',          icon:BarChart3 },
  { label:'Settings',   href:'/settings',           icon:Settings },
];
const NAV_STUDENT: NavItem[] = [
  { label:'Dashboard',  href:'/student/dashboard',  icon:LayoutDashboard },
  { label:'My Results', href:'/student/results',    icon:BookOpen },
  { label:'Classrooms', href:'/classrooms',         icon:GraduationCap },
  { label:'Leaderboard',href:'/leaderboard',        icon:Trophy },
  { label:'Settings',   href:'/settings',           icon:Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, notifications } = useApp();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen]     = useState(false);

  const nav = user?.role === 'student' ? NAV_STUDENT : NAV_TEACHER;
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'OP';
  const unread = notifications.filter(n => !n.isRead).length;
  const moderationCount = 3; // demo

  const isActive = (href: string) =>
    location.pathname === href.split('?')[0] ||
    (href !== '/dashboard' && href !== '/student/dashboard' && location.pathname.startsWith(href.split('?')[0]));

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className={cn('flex items-center gap-2 px-4 py-4 border-b border-cream-200', collapsed && !mobile ? 'justify-center px-2' : '')}>
        <div className="w-8 h-8 bg-terracotta-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <BarChart3 size={16} className="text-white"/>
        </div>
        {(!collapsed || mobile) && (
          <span className="font-display font-bold text-slate-800 text-lg leading-none">OmniPoll</span>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto p-1 hover:bg-cream-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={15} className={cn('transition-transform', collapsed ? 'rotate-180' : '')}/>
          </button>
        )}
      </div>

      {/* Breadcrumb hint */}
      {(!collapsed || mobile) && (
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-slate-400">
          <Home size={10}/> <span>Home</span> <span>/</span>
          <span className="text-terracotta-600 font-medium capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className={cn('flex-1 py-2', collapsed && !mobile ? 'px-2' : 'px-3')}>
        {nav.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link key={href} to={href}
              onClick={() => mobile && setMobileOpen(false)}
              title={collapsed && !mobile ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5 relative group',
                collapsed && !mobile ? 'justify-center px-2' : '',
                active
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-terracotta-50 hover:text-terracotta-700'
              )}>
              <Icon size={17} className="flex-shrink-0"/>
              {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              {badge === 'moderation' && moderationCount > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                  active ? 'bg-white/30 text-white' : 'bg-terracotta-100 text-terracotta-700',
                  collapsed && !mobile ? 'absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0' : 'ml-auto'
                )}>
                  {moderationCount}
                </span>
              )}
              {collapsed && !mobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={cn('border-t border-cream-200 pt-2 pb-3', collapsed && !mobile ? 'px-2' : 'px-3')}>
        {[
          { label:'Home', href:'/', icon: Home, onClick: undefined },
        ].map(item => (
          <Link key={item.label} to={item.href}
            className={cn('flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-cream-100 hover:text-slate-700 transition-all', collapsed && !mobile ? 'justify-center px-2' : '')}>
            <item.icon size={16} className="flex-shrink-0"/>
            {(!collapsed || mobile) && item.label}
          </Link>
        ))}
        <button onClick={() => setHelpOpen(true)}
          className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-cream-100 hover:text-slate-700 transition-all', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <HelpCircle size={16} className="flex-shrink-0"/>
          {(!collapsed || mobile) && 'Help'}
        </button>
        <button onClick={handleLogout}
          className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <LogOut size={16} className="flex-shrink-0"/>
          {(!collapsed || mobile) && 'Logout'}
        </button>
      </div>

      {/* User chip */}
      {(!collapsed || mobile) && (
        <div className="mx-3 mb-3 p-3 bg-cream-100 border border-cream-200 rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      )}
      {collapsed && !mobile && (
        <div className="flex justify-center pb-3">
          <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-100 overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white border-r border-cream-300 flex-shrink-0 overflow-hidden"
        style={{ minWidth: collapsed ? 64 : 220 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
            <motion.aside className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl"
              initial={{ x:-224 }} animate={{ x:0 }} exit={{ x:-224 }}
              transition={{ type:'spring', stiffness:300, damping:30 }}>
              <SidebarContent mobile />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help center modal */}
      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-cream-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-cream-100 text-slate-500">
              <Menu size={18}/>
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Home size={11}/> <span>Home</span> <span>/</span>
              <span className="text-slate-700 font-medium capitalize">
                {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/settings" className="w-7 h-7 bg-terracotta-100 hover:bg-terracotta-200 rounded-full flex items-center justify-center text-terracotta-700 text-xs font-bold transition-colors">
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity:0, y:4 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.18 }}
            className="p-4 lg:p-6 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
