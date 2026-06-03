import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, LayoutDashboard, Vote, PlusCircle, ShieldAlert,
  TrendingUp, Settings, HelpCircle, Bell, ChevronLeft,
  ChevronRight, LogOut, Menu, X, User, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/polls", label: "My Polls", icon: Vote },
  { path: "/dashboard/polls/create", label: "Create New", icon: PlusCircle },
  { path: "/dashboard/moderation", label: "Moderation", icon: ShieldAlert, badge: true },
  { path: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden lg:flex flex-col bg-warm-white border-r border-clay/30 fixed h-full z-40 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
      >
        <div className="p-4 flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <span className="font-playfair text-lg font-bold text-charcoal">OmniPoll</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate hover:text-charcoal">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-terracotta/10 text-terracotta border-l-2 border-terracotta"
                    : "text-slate hover:bg-cream hover:text-charcoal"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon size={18} />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="bg-crimson text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-clay/30 space-y-1">
          <button 
            onClick={() => setShowHelp(!showHelp)} 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-cream hover:text-charcoal w-full transition-all"
          >
            <HelpCircle size={18} />
            {!collapsed && <span>Help</span>}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-crimson hover:bg-crimson/5 w-full transition-all">
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
        {!collapsed && state.user && (
          <div className="p-3 border-t border-clay/30">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-cream">
              <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center">
                <User size={14} className="text-terracotta" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-charcoal truncate">{state.user.name || "Guest"}</p>
                <p className="text-[10px] text-slate truncate">{state.user.email}</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/30 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-64 bg-warm-white border-r border-clay/30 z-50 lg:hidden flex flex-col"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-playfair text-lg font-bold text-charcoal">OmniPoll</span>
                </Link>
                <button onClick={() => setMobileOpen(false)}><X size={20} className="text-slate" /></button>
              </div>
              <nav className="flex-1 px-2 py-2 space-y-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active ? "bg-terracotta/10 text-terracotta border-l-2 border-terracotta" : "text-slate hover:bg-cream hover:text-charcoal"
                      }`}
                    >
                      <item.icon size={18} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && <span className="bg-crimson text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-clay/30">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-crimson hover:bg-crimson/5 w-full">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-warm-white rounded-2xl border border-clay/40 shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-playfair text-xl font-bold text-charcoal mb-4">Help Center</h2>
              {!state.isAuthenticated ? (
                <div className="bg-terracotta/10 rounded-xl p-4 mb-4">
                  <p className="text-sm text-charcoal font-medium mb-2">Authentication Required</p>
                  <p className="text-xs text-slate">Please log in to access all features and personalized help.</p>
                  <Button onClick={() => { setShowHelp(false); navigate("/auth/login"); }} className="mt-3 bg-terracotta hover:bg-terracotta/90 text-white text-xs">
                    Go to Login
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-cream rounded-lg p-3">
                    <p className="text-sm font-medium text-charcoal">Create Your First Poll</p>
                    <p className="text-xs text-slate mt-1">Go to Create New and choose a poll type. Add options and share the join code.</p>
                  </div>
                  <div className="bg-cream rounded-lg p-3">
                    <p className="text-sm font-medium text-charcoal">Join a Poll</p>
                    <p className="text-xs text-slate mt-1">Use the join code shared by your presenter to participate in live polls.</p>
                  </div>
                  <div className="bg-cream rounded-lg p-3">
                    <p className="text-sm font-medium text-charcoal">Moderation</p>
                    <p className="text-xs text-slate mt-1">Review flagged responses before they appear in your Q&A sessions.</p>
                  </div>
                </div>
              )}
              <Button onClick={() => setShowHelp(false)} variant="outline" className="mt-4 w-full border-clay/60 text-slate">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 min-h-screen transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 glass border-b border-clay/30 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate hover:text-charcoal">
                <Menu size={20} />
              </button>
              <Link to="/" className="hidden sm:flex items-center gap-1.5 text-xs text-slate hover:text-terracotta transition-colors">
                <Home size={12} /> Home
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate">
                <span>Dashboard</span>
                {location.pathname !== "/dashboard" && (
                  <>
                    <ChevronRight size={12} />
                    <span className="text-charcoal capitalize">{location.pathname.split("/").pop()?.replace("-", " ")}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center text-slate hover:text-charcoal hover:bg-cream/80 transition-colors relative"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-crimson text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="absolute right-0 mt-2 w-72 bg-warm-white rounded-xl border border-clay/40 shadow-lg p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <p className="text-sm font-semibold text-charcoal mb-3">Notifications</p>
                      {state.notifications.length === 0 ? (
                        <p className="text-xs text-slate text-center py-4">No notifications yet</p>
                      ) : (
                        <div className="space-y-2">
                          {state.notifications.map((n) => (
                            <div key={n.id} className={`text-xs p-2 rounded-lg ${n.read ? "bg-cream/50" : "bg-terracotta/5"}`}>
                              <p className="text-charcoal">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {state.socketConnected && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-sage bg-sage/10 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" /> Live
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
