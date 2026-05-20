import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handle = async () => {
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    if (mode === "signup" && !name) { toast.error("Enter your name"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(name, email, password);
        toast.success("Welcome to OmniPoll!");
      } else {
        const user = await signIn(email, password);
        toast.success("Welcome back, " + user.name + "!");
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="font-playfair text-2xl font-bold text-charcoal block text-center mb-8">
          <span className="text-terracotta">Omni</span>Poll
        </Link>

        <div className="bg-warm-white rounded-2xl border border-clay/30 p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="font-playfair text-2xl font-bold text-charcoal">
              {isSignup ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-slate text-sm mt-1">
              {isSignup ? "Start creating live polls today" : "Sign in to your OmniPoll account"}
            </p>
          </div>

          <div className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-charcoal">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-warm-white border-clay/40 focus:border-terracotta"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-charcoal">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="bg-warm-white border-clay/40 focus:border-terracotta"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-charcoal">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="bg-warm-white border-clay/40 focus:border-terracotta"
              />
            </div>
          </div>

          <Button
            onClick={handle}
            disabled={loading}
            className="w-full mt-6 bg-terracotta hover:bg-orange-600 text-white"
          >
            {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
          </Button>

          <p className="text-center text-sm text-slate mt-4">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              className="text-terracotta font-medium hover:underline"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
