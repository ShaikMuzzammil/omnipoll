import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Check, X, AlertTriangle, Filter, Search, Info, Sparkles, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

interface ModItem {
  id: string;
  text: string;
  poll: string;
  toxicity: number;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}

export default function Moderation() {
  const { dispatch } = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ModItem[]>([
    { id: "1", text: "Why is the product roadmap focused on enterprise features?", poll: "Q2 Roadmap", toxicity: 0.45, status: "pending", timestamp: "2 min ago" },
    { id: "2", text: "The new dashboard is confusing to navigate for first-time users", poll: "Q2 Roadmap", toxicity: 0.32, status: "pending", timestamp: "5 min ago" },
    { id: "3", text: "Can we get dark mode support please? Would be amazing!", poll: "All-Hands Q&A", toxicity: 0.12, status: "pending", timestamp: "8 min ago" },
    { id: "4", text: "This product is absolutely terrible and useless", poll: "Team Retreat", toxicity: 0.92, status: "rejected", timestamp: "1 hour ago" },
    { id: "5", text: "Great update! Love the new features and AI clustering", poll: "Q2 Roadmap", toxicity: 0.05, status: "approved", timestamp: "2 hours ago" },
    { id: "6", text: "When will mobile app be available on Android?", poll: "All-Hands Q&A", toxicity: 0.18, status: "approved", timestamp: "3 hours ago" },
  ]);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: action } : item)));
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: { id: Date.now().toString(), type: "success", message: `Item ${action}`, read: false },
    });
  };

  const filtered = items.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal">Moderation Queue</h1>
            <p className="text-slate mt-1">Review and manage audience submissions with AI assistance</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${pendingCount > 0 ? "bg-crimson/10 text-crimson" : "bg-sage/10 text-sage"}`}>
              {pendingCount} pending
            </span>
          </div>
        </motion.div>

        {/* What to Do Guide */}
        <motion.div
          className="bg-gradient-to-r from-terracotta/10 to-sage/10 rounded-xl border border-terracotta/20 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-terracotta/20 flex items-center justify-center shrink-0">
              <Info size={18} className="text-terracotta" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">How Moderation Works</h3>
              <p className="text-sm text-slate mb-3">
                Our AI automatically scores every submission for toxicity. Items above 70% are flagged for your review.
                Approve constructive feedback, reject harmful content — keep your sessions professional and inclusive.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-warm-white rounded-lg p-3 border border-clay/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={12} className="text-sage" />
                    <span className="text-xs font-medium text-charcoal">Auto-Approved</span>
                  </div>
                  <p className="text-xs text-slate">Toxicity &lt; 40% — appears instantly</p>
                </div>
                <div className="bg-warm-white rounded-lg p-3 border border-clay/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye size={12} className="text-[#D4A574]" />
                    <span className="text-xs font-medium text-charcoal">Needs Review</span>
                  </div>
                  <p className="text-xs text-slate">Toxicity 40-70% — your decision</p>
                </div>
                <div className="bg-warm-white rounded-lg p-3 border border-clay/30">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert size={12} className="text-crimson" />
                    <span className="text-xs font-medium text-charcoal">Auto-Rejected</span>
                  </div>
                  <p className="text-xs text-slate">Toxicity &gt; 70% — hidden by default</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions..."
              className="pl-10 bg-warm-white border-clay/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f ? "bg-terracotta text-white" : "bg-warm-white text-slate border border-clay/40 hover:bg-cream"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                className="bg-warm-white rounded-xl border border-clay/30 p-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-charcoal font-medium">{item.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate">
                      <span className="bg-cream px-2 py-0.5 rounded-full">{item.poll}</span>
                      <span>{item.timestamp}</span>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          item.toxicity > 0.7
                            ? "bg-crimson/10 text-crimson"
                            : item.toxicity > 0.4
                            ? "bg-[#D4A574]/10 text-[#D4A574]"
                            : "bg-sage/10 text-sage"
                        }`}
                      >
                        <AlertTriangle size={10} /> {(item.toxicity * 100).toFixed(0)}% toxicity
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-sage hover:bg-sage/90 text-white text-xs h-8"
                          onClick={() => handleAction(item.id, "approved")}
                        >
                          <Check size={14} className="mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-crimson/40 text-crimson hover:bg-crimson/5 text-xs h-8"
                          onClick={() => handleAction(item.id, "rejected")}
                        >
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          item.status === "approved" ? "bg-sage/10 text-sage" : "bg-crimson/10 text-crimson"
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              className="text-center py-16 bg-warm-white rounded-xl border border-clay/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ShieldAlert className="w-12 h-12 text-clay mx-auto mb-3" />
              <p className="text-charcoal font-medium">No items found</p>
              <p className="text-slate text-sm mt-1">All submissions have been reviewed</p>
            </motion.div>
          )}
        </div>

        {/* Benefits Card */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-terracotta" />
            <h3 className="font-semibold text-charcoal">Benefits of AI Moderation</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "Safer Sessions", desc: "Automatically filter toxic content before it reaches your audience" },
              { icon: Eye, title: "Full Control", desc: "Review flagged items and make the final call on every submission" },
              { icon: Sparkles, title: "Time Saving", desc: "AI pre-scores submissions so you focus on what matters" },
              { icon: Check, title: "Better Engagement", desc: "Create a respectful environment that encourages participation" },
            ].map((benefit, i) => (
              <div key={benefit.title} className="bg-cream rounded-lg p-4">
                <benefit.icon size={16} className="text-terracotta mb-2" />
                <p className="text-sm font-medium text-charcoal">{benefit.title}</p>
                <p className="text-xs text-slate mt-1">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
