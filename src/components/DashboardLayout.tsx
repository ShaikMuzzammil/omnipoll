import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, BarChart3, BookOpen,
  Settings, LogOut, Bell, Users, ChevronRight,
  Menu, X, GraduationCap, Trophy, Layers,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';

const NAV_TEACHER = [
  { label: 'Dashboard',    href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Create Poll',  href: '/create',               icon: PlusCircle },
  { label: 'Classrooms',   href: '/classrooms',           icon: GraduationCap },
  { label: 'Analytics',    href: '/analytics',            icon: BarChart3 },
  { label: 'Templates',    href: '/templates',            icon: Layers },
  { label: 'Leaderboard',  href: '/leaderboard',          icon: Trophy },
];
const NAV_STUDENT = [
  { label: 'My Dashboard', href: '/student/dashboard',   icon: LayoutDashboard },
  { label: 'My Results',   href: '/student/results',     icon: BookOpen },
  { label: 'Classrooms',   href: '/classrooms',          icon: GraduationCap },
  { label: 'Leaderboard',  href: '/leaderboard',         icon: Trophy },
];
const NAV_BOTTOM = [
  { label: 'Settings',     href: '/settings',            icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = user?.role === 'student' ? NAV_STUDENT : NAV_TEACHER;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'OP';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      'flex flex-col h-full',
      mobile ? 'p-4' : 'p-5'
    )}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 bg-terracotta-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-terracotta-600 transition-colors">
          <BarChart3 size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl text-slate-800">OmniPoll</span>
      </Link>

      {/* Role badge */}
      <div className="mb-5 px-3 py-1.5 bg-terracotta-50 border border-terracotta-100 rounded-lg">
        <p className="text-xs font-medium text-terracotta-600 capitalize">{user?.role} Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = location.pathname === href ||
            (href !== '/dashboard' && href !== '/student/dashboard' && location.pathname.startsWith(href));
          return (
            <Link
              key={href}
              to={href}
              onClick={() => mobile && setOpen(false)}
              className={cn('sidebar-link', active && 'active')}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-cream-300 pt-4 space-y-0.5 mt-4">
        {NAV_BOTTOM.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            onClick={() => mobile && setOpen(false)}
            className={cn('sidebar-link', location.pathname === href && 'active')}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User chip */}
      <div className="mt-4 p-3 bg-cream-200 rounded-xl flex items-center gap-3">
        <div className="w-9 h-9 bg-terracotta-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-cream-300 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Sidebar mobile />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-cream-300 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-cream-200 text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />
            <Link to="/settings" className="w-8 h-8 bg-terracotta-100 rounded-full flex items-center justify-center text-terracotta-700 text-sm font-bold hover:bg-terracotta-200 transition-colors">
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
