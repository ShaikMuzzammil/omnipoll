import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPollByCode } from "@/lib/api";

export default function Join() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(urlCode || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a poll code");
      return;
    }
    setLoading(true);
    try {
      const response = await getPollByCode(code.toUpperCase());
      if (response.poll.status === "closed") {
        setError("This poll is closed");
        return;
      }
      setLoading(false);
      navigate(`/p/${response.poll.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poll code not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-terracotta flex items-center justify-center mx-auto mb-6 shadow-lg shadow-terracotta/20"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <BarChart3 className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="font-playfair text-3xl font-bold text-charcoal mb-2">Join a Poll</h1>
        <p className="text-slate mb-8">Enter the poll code from your presenter</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="relative">
            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              placeholder="e.g., A7K9Q2"
              className="pl-12 py-6 text-center text-xl font-mono font-bold bg-warm-white border-clay/40 focus:border-terracotta tracking-widest uppercase"
              maxLength={12}
            />
          </div>
          {error && <p className="text-crimson text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-terracotta hover:bg-terracotta/90 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-terracotta/20"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Poll"} <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-clay/30">
          <p className="text-xs text-slate">Don't have a code?</p>
          <button onClick={() => navigate("/")} className="text-terracotta text-sm font-medium hover:underline mt-1">
            Create your own poll
          </button>
        </div>
      </motion.div>
    </div>
  );
}
