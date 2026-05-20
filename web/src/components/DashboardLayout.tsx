import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, PlusCircle, Home, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const nav = [
    { label: "Dashboard", href: "/dashboard/polls", icon: BarChart3 },
    { label: "Create Poll", href: "/create", icon: PlusCircle },
  ];

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 bg-warm-white/90 backdrop-blur border-b border-clay/30 h-14 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="font-playfair text-xl font-bold text-charcoal">
            <span className="text-terracotta">Omni</span>Poll
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            {nav.map((n) => (
              <Link key={n.href} to={n.href}>
                <Button
                  variant={isActive(n.href) ? "default" : "ghost"}
                  size="sm"
                  className={isActive(n.href) ? "bg-terracotta text-white" : "text-slate"}
                >
                  <n.icon size={14} className="mr-1.5" />
                  {n.label}
                </Button>
              </Link>
            ))}
            <div className="pl-2 border-l border-clay/30 flex items-center gap-2">
              <span className="text-sm text-slate">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { signOut(); navigate("/"); }}
              >
                <LogOut size={14} />
              </Button>
            </div>
          </div>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-warm-white border-b border-clay/30 px-4 py-3 space-y-1">
          {nav.map((n) => (
            <Link key={n.href} to={n.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={isActive(n.href) ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-start ${isActive(n.href) ? "bg-terracotta text-white" : "text-slate"}`}
              >
                <n.icon size={14} className="mr-2" />
                {n.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate"
            onClick={() => { signOut(); navigate("/"); }}
          >
            <LogOut size={14} className="mr-2" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
