import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Plus, BarChart3, Shield, CreditCard, Settings,
  Radio, LogOut, Menu, Sun, Moon, Monitor, ChevronDown, Bell, Search, Zap
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useThemeStore } from "../../store/themeStore";
import { useNotificationStore } from "../../store/notificationStore";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { path: "/dashboard/create", icon: Plus, label: "Create Poll" },
  { path: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/dashboard/moderation", icon: Shield, label: "Moderation" },
  { path: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { path: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));

  const THEME_OPTIONS = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];
  const ThemeIcon = THEME_OPTIONS.find(t => t.value === theme)?.icon || Monitor;

  return (
    <div className="flex min-h-screen bg-cream dark:bg-[#12151C]">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 w-64 bg-warm-white dark:bg-[#1a1e28] border-r border-clay/15 dark:border-white/5 flex flex-col transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-clay/10 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center">
              <Radio size={15} className="text-white" />
            </div>
            <span className="font-playfair text-lg font-bold text-charcoal dark:text-white">OmniPoll</span>
            <span className="text-xs font-bold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">2.0</span>
          </div>
        </div>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => { navigate("/dashboard/create"); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> New Poll
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-terracotta/10 text-terracotta" : "text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200 hover:bg-parchment dark:hover:bg-white/5")}>
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user?.plan === "free" && (
          <div className="px-4 py-3 border-t border-clay/10 dark:border-white/5">
            <div className="bg-terracotta/5 dark:bg-terracotta/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-terracotta" />
                <span className="text-xs font-semibold text-terracotta">Free Plan</span>
              </div>
              <p className="text-xs text-slate dark:text-gray-500 mb-2">Upgrade for 20 poll types & analytics</p>
              <Link to="/dashboard/billing" className="block text-center text-xs font-semibold text-white bg-terracotta rounded-lg py-1.5 hover:bg-terracotta/90 transition-colors">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}
        <div className="px-4 py-3 border-t border-clay/10 dark:border-white/5 relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 hover:bg-parchment dark:hover:bg-white/5 rounded-xl p-2 transition-colors">
            <div className="w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium text-charcoal dark:text-gray-200 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-slate dark:text-gray-500 truncate">{user?.email}</p>
            </div>
            <ChevronDown size={14} className="text-slate" />
          </button>
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
              <Link to="/dashboard/settings" className="flex items-center gap-2 px-4 py-3 text-sm text-slate dark:text-gray-400 hover:bg-parchment dark:hover:bg-white/5 transition-colors" onClick={() => setShowUserMenu(false)}>
                <Settings size={15} /> Settings
              </Link>
              <button onClick={() => { setShowUserMenu(false); logout(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-crimson hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-cream/80 dark:bg-[#12151C]/80 backdrop-blur-xl border-b border-clay/10 dark:border-white/5 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate hover:text-charcoal dark:hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 text-slate hover:text-charcoal dark:hover:text-white rounded-xl hover:bg-parchment dark:hover:bg-white/5 transition-colors">
              <Search size={17} />
            </button>
            <div className="relative">
              <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-2 text-slate hover:text-charcoal dark:hover:text-white rounded-xl hover:bg-parchment dark:hover:bg-white/5 transition-colors">
                <ThemeIcon size={17} />
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-1 bg-warm-white dark:bg-[#1a1e28] border border-clay/20 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 w-36">
                  {THEME_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                      className={cn("w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                        theme === opt.value ? "text-terracotta bg-terracotta/5" : "text-slate hover:text-charcoal dark:hover:text-white hover:bg-parchment dark:hover:bg-white/5")}>
                      <opt.icon size={14} /> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative p-2 text-slate hover:text-charcoal dark:hover:text-white rounded-xl hover:bg-parchment dark:hover:bg-white/5 transition-colors">
              <Bell size={17} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terracotta rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
