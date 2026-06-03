import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPollByCode } from "@/lib/api";

export default function Join() {
  const { code: routeCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(routeCode?.toUpperCase() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-join if code is in the URL
  useEffect(() => {
    if (routeCode) {
      joinPoll(routeCode.toUpperCase());
    }
  }, [routeCode]);

  const joinPoll = async (joinCode: string) => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) { setError("Enter a join code"); return; }
    setLoading(true);
    setError("");
    try {
      const { poll } = await getPollByCode(trimmed);
      if (poll.status === "closed") {
        setError("This poll is closed.");
        return;
      }
      if (poll.status === "paused") {
        setError("This poll is currently paused. Please check back soon.");
        return;
      }
      navigate(`/poll/${poll.code}`);
    } catch {
      setError("Poll not found. Double-check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => joinPoll(code);

  // If auto-joining from URL, show loading state
  if (routeCode && loading) return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <span className="font-playfair text-2xl font-bold text-charcoal">
            <span className="text-terracotta">Omni</span>Poll
          </span>
        </div>

        <div className="bg-warm-white rounded-2xl border border-clay/30 p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="font-playfair text-2xl font-bold text-charcoal">Join a Poll</h1>
            <p className="text-slate text-sm mt-1">Enter the 6-character code from your host</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="ABC123"
              maxLength={6}
              className="text-center font-mono text-xl tracking-[0.5em] uppercase bg-warm-white border-clay/40 focus:border-terracotta h-14"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || code.length < 4}
              className="w-full bg-terracotta hover:bg-orange-600 text-white h-11 text-base font-semibold"
            >
              {loading ? "Joining…" : "Join Poll →"}
            </Button>
          </div>

          <p className="text-center text-xs text-slate mt-4">
            Want to create your own?{" "}
            <a href="/signup" className="text-terracotta font-medium hover:underline">Sign up free</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
