import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Radio, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

const PERKS = [
  "5 free polls per month",
  "Up to 50 participants per poll",
  "Real-time results & analytics",
  "5 core poll types included",
  "No credit card required",
];

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#12151C] flex">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-charcoal dark:bg-[#1a1e28] p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <span className="font-playfair text-xl font-bold text-white">OmniPoll</span>
        </div>
        <div>
          <h2 className="font-playfair text-4xl font-bold text-white mb-6 leading-tight">
            Start free.<br />Go live in<br />60 seconds.
          </h2>
          <div className="space-y-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3 text-white/70">
                <CheckCircle2 size={16} className="text-sage shrink-0" />
                <span className="text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">Join 12,000+ organizations already using OmniPoll.</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate hover:text-charcoal dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="font-playfair text-3xl font-bold text-charcoal dark:text-white mb-2">Create your account</h1>
          <p className="text-slate dark:text-gray-400 mb-8">Free forever · No credit card needed</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-2">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-11" placeholder="Jane Smith" autoFocus />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-charcoal dark:hover:text-gray-200">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate dark:text-gray-500">
              By creating an account you agree to our{" "}
              <a href="#" className="text-terracotta hover:underline">Terms</a> and{" "}
              <a href="#" className="text-terracotta hover:underline">Privacy Policy</a>.
            </p>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating account…" : "Create Free Account"}
            </button>
          </form>
          <p className="text-center text-sm text-slate dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-terracotta hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
