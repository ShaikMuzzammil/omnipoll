import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handle = async () => {
    if (!name || !email || !password) { toast.error("Fill in all fields"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await signUp(name, email, password);
      toast.success("Welcome to OmniPoll!");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "bg-warm-white border-clay/40 focus:border-terracotta";

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
            <h1 className="font-playfair text-2xl font-bold text-charcoal">Create account</h1>
            <p className="text-slate text-sm mt-1">Start creating live polls today</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-charcoal">Confirm Password</Label>
              <Input
                type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="Repeat password" className={fieldClass}
              />
            </div>
          </div>

          <Button
            onClick={handle} disabled={loading}
            className="w-full mt-6 bg-terracotta hover:bg-orange-600 text-white"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-slate mt-4">
            Already have an account?{" "}
            <Link to="/auth?mode=signin" className="text-terracotta font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
