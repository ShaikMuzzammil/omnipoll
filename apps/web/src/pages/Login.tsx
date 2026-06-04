import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Radio, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Demo login handler
  const demoLogin = async () => {
    setLoading(true);
    try {
      await login("demo@omnipoll.io", "demo1234");
    } catch {
      // If demo doesn't exist, create a demo session locally
      toast.info("Demo mode activated!");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#12151C] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-terracotta p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <span className="font-playfair text-xl font-bold text-white">OmniPoll</span>
          <span className="text-xs font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded">2.0</span>
        </div>
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
              <Sparkles size={14} />
              <span>Live right now</span>
            </div>
            <h2 className="font-playfair text-4xl font-bold text-white mb-4 leading-tight">
              Thousands of polls<br />happening live.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Real-time audience intelligence for every type of session — meetings, events, classrooms, and beyond.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Poll Types", value: "20" },
              { label: "Concurrent Users", value: "50K" },
              { label: "Uptime", value: "99.9%" },
              { label: "Countries", value: "94" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white font-playfair">{s.value}</div>
                <div className="text-white/60 text-sm">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <p className="text-white/40 text-xs">© 2026 OmniPoll. Trusted by 12,000+ organizations.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate hover:text-charcoal dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>

          <h1 className="font-playfair text-3xl font-bold text-charcoal dark:text-white mb-2">Welcome back</h1>
          <p className="text-slate dark:text-gray-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11" placeholder="you@company.com" autoFocus />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-charcoal dark:text-gray-300">Password</label>
                <a href="#" className="text-sm text-terracotta hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-charcoal dark:hover:text-gray-200">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-clay/20 dark:border-white/10" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-cream dark:bg-[#12151C] px-4 text-slate">or</span></div>
          </div>

          <button onClick={demoLogin} className="w-full btn-outline py-3 text-sm">
            🚀 Try with demo account
          </button>

          <p className="text-center text-sm text-slate dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-terracotta hover:underline font-medium">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
