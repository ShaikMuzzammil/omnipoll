'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, BarChart2, Settings,
  LogOut, Menu, X, ChevronRight, Sparkles,
  FileText, Moon, Sun, ExternalLink, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/dashboard' },
  { icon: PlusCircle,      label: 'Create Poll',  href: '/create' },
  { icon: FileText,        label: 'Templates',    href: '/templates' },
  { icon: BarChart2,       label: 'Analytics',    href: '/analytics' },
  { icon: Settings,        label: 'Settings',     href: '/settings' },
];

interface Props { children: React.ReactNode; title?: string; }

export default function DashboardLayout({ children, title }: Props) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark((d) => !d);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-4 py-5 border-b border-border hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-playfair font-bold text-lg text-foreground">OmniPoll</span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade badge */}
        {user?.plan === 'free' && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-terracotta/10 border border-terracotta/20">
            <p className="text-xs font-semibold text-terracotta mb-1">✦ Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground">Unlock all 20 poll types & analytics</p>
          </div>
        )}

        {/* User + controls */}
        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-accent/50">
            <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.plan || 'free'} plan</div>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border lg:hidden shadow-xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {title && (
            <h1 className="font-playfair font-semibold text-foreground hidden sm:block">{title}</h1>
          )}

          <div className="flex-1" />

          <Button variant="outline" size="sm" asChild className="hidden sm:flex gap-1.5 text-xs">
            <Link href="/join">
              <ExternalLink className="w-3.5 h-3.5" />Join Poll
            </Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5 text-xs">
            <Link href="/create">
              <PlusCircle className="w-3.5 h-3.5" />New Poll
            </Link>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
