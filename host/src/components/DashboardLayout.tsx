import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, BarChart3, Settings, LogOut,
  GraduationCap, Trophy, Layers, HelpCircle, ChevronLeft, ChevronDown,
  Menu, Home, Shield, Users, BookOpen, Bell, BarChart2,
  FileText, Activity, Eye, Shuffle, Clock, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import HelpCenterModal from './HelpCenterModal';

interface NavChild { label:string; href:string; icon:LucideIcon }
interface NavItem  { label:string; href:string; icon:LucideIcon; badge?:string|number; children?:NavChild[] }

const NAV: NavItem[] = [
  { label:'Dashboard',  href:'/dashboard',   icon:LayoutDashboard },
  {
    label:'Polls',      href:'/dashboard',   icon:BarChart3,
    children:[
      { label:'All Polls',    href:'/dashboard',   icon:FileText },
      { label:'Create New',   href:'/create',       icon:PlusCircle },
      { label:'Templates',    href:'/templates',    icon:Layers },
      { label:'Live / Present',href:'/dashboard',  icon:Eye },
    ],
  },
  {
    label:'Quizzes',    href:'/create?type=quiz', icon:BookOpen,
    children:[
      { label:'New Quiz',     href:'/create?type=quiz',  icon:PlusCircle },
      { label:'Quiz Results', href:'/analytics',          icon:BarChart2 },
      { label:'Leaderboard',  href:'/leaderboard',        icon:Trophy },
    ],
  },
  {
    label:'Classrooms', href:'/classrooms',  icon:GraduationCap,
    children:[
      { label:'My Classrooms', href:'/classrooms',  icon:GraduationCap },
      { label:'Students',      href:'/classrooms',  icon:Users },
      { label:'Class Results', href:'/analytics',   icon:BarChart2 },
    ],
  },
  { label:'Analytics',  href:'/analytics',   icon:BarChart3 },
  { label:'Moderation', href:'/moderation',  icon:Shield, badge:'!' },
  { label:'Notifications',href:'/notifications',icon:Bell },
  { label:'Settings',   href:'/settings',    icon:Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, notifications } = useApp();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [helpOpen,    setHelpOpen]    = useState(false);
  const [expandedNav, setExpandedNav] = useState<string[]>(['Polls']);

  const initials   = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? 'OP';
  const unread     = notifications.filter(n => !n.isRead).length;

  const isActive = (href: string) =>
    location.pathname === href.split('?')[0] ||
    (href !== '/dashboard' && location.pathname.startsWith(href.split('?')[0]));

  const toggleExpand = (label: string) =>
    setExpandedNav(prev => prev.includes(label) ? prev.filter(l=>l!==label) : [...prev, label]);

  const SidebarContent = ({ mobile=false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-2 px-4 py-4 border-b border-cream-200', collapsed && !mobile ? 'justify-center px-2' : '')}>
        <div className="w-8 h-8 bg-terracotta-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <BarChart3 size={16} className="text-white"/>
        </div>
        {(!collapsed || mobile) && <span className="font-display font-bold text-slate-800 text-lg leading-none">OmniPoll<span className="text-terracotta-500 ml-1 text-xs font-medium">HOST</span></span>}
        {!mobile && (
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto p-1 hover:bg-cream-200 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft size={14} className={cn('transition-transform', collapsed ? 'rotate-180' : '')}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-2 overflow-y-auto scrollbar-thin', collapsed && !mobile ? 'px-2' : 'px-2')}>
        {NAV.map(item => {
          const active   = isActive(item.href);
          const expanded = expandedNav.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.label}>
              <div className="flex items-center gap-0.5">
                <Link to={item.href}
                  onClick={() => mobile && !hasChildren && setMobileOpen(false)}
                  title={collapsed && !mobile ? item.label : undefined}
                  className={cn(
                    'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 relative group',
                    collapsed && !mobile ? 'justify-center px-2' : '',
                    active && !hasChildren ? 'bg-terracotta-500 text-white shadow-sm' :
                    active && hasChildren  ? 'bg-terracotta-50 text-terracotta-700' :
                    'text-slate-600 hover:bg-terracotta-50 hover:text-terracotta-700'
                  )}>
                  <item.icon size={16} className="flex-shrink-0"/>
                  {(!collapsed || mobile) && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          active ? 'bg-white/30 text-white' : 'bg-red-100 text-red-700')}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && !mobile && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
                {hasChildren && (!collapsed || mobile) && (
                  <button onClick={() => toggleExpand(item.label)}
                    className="p-1.5 hover:bg-cream-100 rounded-lg text-slate-400 transition-colors">
                    <ChevronDown size={12} className={cn('transition-transform', expanded ? 'rotate-180' : '')}/>
                  </button>
                )}
              </div>

              {/* Sub-items */}
              {hasChildren && (!collapsed || mobile) && expanded && (
                <div className="ml-4 pl-3 border-l border-cream-200 space-y-0.5 mb-1">
                  {item.children!.map(child => (
                    <Link key={child.label} to={child.href}
                      onClick={() => mobile && setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                        isActive(child.href) ? 'bg-terracotta-100 text-terracotta-700' : 'text-slate-500 hover:bg-cream-100 hover:text-slate-700'
                      )}>
                      <child.icon size={12} className="flex-shrink-0"/>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-cream-200 pt-2 pb-2', collapsed && !mobile ? 'px-2' : 'px-2')}>
        <Link to="/" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-cream-100 hover:text-slate-700 transition-all mb-0.5', collapsed && !mobile ? 'justify-center px-2' : '')}>
          <Home size={14}/>{(!collapsed||mobile) && 'Home'}
        </Link>
        <button onClick={() => setHelpOpen(true)}
          className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-cream-100 hover:text-slate-700 transition-all mb-0.5', collapsed && !mobile ? 'justify-center px-2' : '')}>
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
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-100 overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 56 : 228 }} transition={{ duration:0.2, ease:'easeInOut' }}
        className="hidden lg:flex flex-col bg-white border-r border-cream-300 flex-shrink-0 overflow-y-auto"
        style={{ minWidth: collapsed ? 56 : 228 }}>
        <SidebarContent/>
      </motion.aside>

      {/* Mobile */}
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
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-cream-100 text-slate-500">
              <Menu size={18}/>
            </button>
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Home size={10}/> <span>/</span>
              <span className="text-slate-700 font-medium capitalize">{location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/create" className="hidden sm:flex items-center gap-1.5 text-xs bg-terracotta-500 hover:bg-terracotta-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <PlusCircle size={12}/> New Poll
            </Link>
            <NotificationBell/>
            <Link to="/settings" className="w-7 h-7 bg-terracotta-100 hover:bg-terracotta-200 rounded-full flex items-center justify-center text-terracotta-700 text-xs font-bold transition-colors">
              {initials}
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <motion.div key={location.pathname} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.18 }}
            className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
