import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { signIn } from "@/lib/api";

export default function Login() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    try {
      const data = await signIn({ email, password });
      setUser(data.user);
      toast.success("Welcome back, " + data.user.name + "!");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "bg-warm-white border-clay/40 focus:border-terracotta";

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="font-playfair text-2xl font-bold text-charcoal block text-center mb-8">
          <span className="text-terracotta">Omni</span>Poll
        </Link>
        <div className="bg-warm-white rounded-2xl border border-clay/30 p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="font-playfair text-2xl font-bold text-charcoal">Welcome back</h1>
            <p className="text-slate text-sm mt-1">Sign in to your OmniPoll account</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="••••••••" className={fieldClass} />
            </div>
          </div>
          <Button onClick={handle} disabled={loading}
            className="w-full mt-6 bg-terracotta hover:bg-orange-600 text-white">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
          <p className="text-center text-sm text-slate mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-terracotta font-medium hover:underline">Sign up</Link>
          </p>
          <p className="text-center text-sm text-slate mt-2">
            <Link to="/auth?mode=signin" className="text-terracotta font-medium hover:underline">Use magic link</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
