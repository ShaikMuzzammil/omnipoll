import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, Eye, EyeOff, ArrowRight, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { signup } from "@/lib/api";

export default function Signup() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!name.trim()) { setError("Please enter your name"); return false; }
    if (!email.trim()) { setError("Please enter your email or account name"); return false; }
    if (!password.trim()) { setError("Please enter a password"); return false; }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signup({ name, email, password });
      dispatch({
        type: "SET_USER",
        payload: user,
      });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: Date.now().toString(),
          type: "success",
          message: `Welcome to OmniPoll, ${user.name}!`,
          read: false,
        },
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-terracotta flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-playfair text-2xl font-bold text-charcoal">OmniPoll</span>
          </Link>
          <h1 className="font-playfair text-3xl font-bold text-charcoal mb-2">Create your account</h1>
          <p className="text-slate">Start engaging your audience today</p>
        </div>

        <div className="bg-warm-white rounded-2xl border border-clay/40 p-8 shadow-sm">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-crimson/10 text-crimson rounded-lg p-3 flex items-center gap-2 text-sm mb-4"
              >
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-charcoal">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="pl-10 bg-cream border-clay/40 focus:border-terracotta focus:ring-terracotta/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-charcoal">Email or account name</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <Input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com or nova" className="pl-10 bg-cream border-clay/40 focus:border-terracotta focus:ring-terracotta/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-charcoal">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="pl-10 pr-10 bg-cream border-clay/40 focus:border-terracotta focus:ring-terracotta/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-charcoal">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-terracotta hover:bg-terracotta/90 text-white py-5" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"} <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-slate mt-6">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-terracotta font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
