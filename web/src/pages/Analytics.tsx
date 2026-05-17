import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, MessageSquare, BarChart3, Clock,
  ArrowUpRight, Download, Calendar, Filter, Sparkles,
  PieChart, Activity, Eye, ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const monthlyData = [
  { month: "Jan", polls: 4, responses: 320, engagement: 72 },
  { month: "Feb", polls: 6, responses: 540, engagement: 78 },
  { month: "Mar", polls: 8, responses: 890, engagement: 82 },
  { month: "Apr", polls: 12, responses: 1200, engagement: 85 },
  { month: "May", polls: 10, responses: 980, engagement: 87 },
];

const topPolls = [
  { title: "Q2 Product Roadmap", responses: 342, engagement: 94, type: "Multiple Choice", sentiment: 88 },
  { title: "All-Hands Q&A", responses: 156, engagement: 87, type: "Q&A", sentiment: 76 },
  { title: "Team Retreat Feedback", responses: 89, engagement: 82, type: "Word Cloud", sentiment: 91 },
  { title: "Customer Satisfaction", responses: 67, engagement: 78, type: "Rating", sentiment: 72 },
];

const sentimentTimeline = [
  { time: "00:00", positive: 45, neutral: 35, negative: 20 },
  { time: "00:15", positive: 52, neutral: 30, negative: 18 },
  { time: "00:30", positive: 58, neutral: 28, negative: 14 },
  { time: "00:45", positive: 62, neutral: 25, negative: 13 },
  { time: "01:00", positive: 68, neutral: 22, negative: 10 },
  { time: "01:15", positive: 72, neutral: 20, negative: 8 },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const maxResponses = Math.max(...monthlyData.map((d) => d.responses));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-playfair text-3xl font-bold text-charcoal">Analytics</h1>
            <p className="text-slate mt-1">Deep insights across all your polls and engagement</p>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  timeRange === r ? "bg-terracotta text-white" : "bg-warm-white text-slate border border-clay/40 hover:bg-cream"
                }`}
              >
                {r}
              </button>
            ))}
            <Button variant="outline" size="sm" className="border-clay/60 text-slate text-xs ml-2">
              <Download size={14} className="mr-1" /> Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Polls", value: "40", change: "+12%", icon: BarChart3, color: "bg-terracotta/10 text-terracotta" },
            { label: "Total Responses", value: "3,932", change: "+24%", icon: MessageSquare, color: "bg-sage/10 text-sage" },
            { label: "Avg Engagement", value: "85%", change: "+5%", icon: TrendingUp, color: "bg-[#D4A574]/10 text-[#D4A574]" },
            { label: "Active Sessions", value: "1,247", change: "+18%", icon: Users, color: "bg-[#7B9EA8]/10 text-[#7B9EA8]" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="bg-warm-white rounded-xl p-5 border border-clay/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon size={18} />
                </div>
                <span className="text-xs font-medium text-sage bg-sage/10 px-2 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{s.value}</p>
              <p className="text-xs text-slate mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Responses Chart */}
          <motion.div
            className="bg-warm-white rounded-xl border border-clay/30 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Response Trends</h2>
              <span className="text-xs text-slate flex items-center gap-1">
                <Calendar size={12} /> Last 5 months
              </span>
            </div>
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((d, i) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full bg-terracotta/80 rounded-t-lg relative group"
                    style={{ height: `${(d.responses / maxResponses) * 100}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.responses / maxResponses) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.responses} responses
                    </div>
                  </motion.div>
                  <span className="text-xs text-slate">{d.month}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Performing Polls */}
          <motion.div
            className="bg-warm-white rounded-xl border border-clay/30 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Top Performing Polls</h2>
              <span className="text-xs text-slate">All time</span>
            </div>
            <div className="space-y-4">
              {topPolls.map((poll, i) => (
                <motion.div
                  key={poll.title}
                  className="flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-cream/80 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-warm-white flex items-center justify-center text-xs font-bold text-slate border border-clay/30">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{poll.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate">
                        <span>{poll.type}</span>
                        <span>&middot;</span>
                        <span>{poll.responses} responses</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={10} className="text-sage" />
                        <span className="text-xs font-medium text-sage">{poll.sentiment}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-cream rounded-full overflow-hidden border border-clay/30">
                        <motion.div
                          className="h-full bg-sage rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${poll.engagement}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-charcoal w-8">{poll.engagement}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sentiment Timeline */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-terracotta" />
              <h2 className="font-playfair text-xl font-bold text-charcoal">Live Sentiment Timeline</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sage" /> Positive</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#D4A574]" /> Neutral</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-crimson" /> Negative</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {sentimentTimeline.map((point, i) => (
              <div key={point.time} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden">
                  <motion.div
                    className="w-full bg-crimson/70"
                    style={{ height: `${point.negative * 1.2}px` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${point.negative * 1.2}px` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  />
                  <motion.div
                    className="w-full bg-[#D4A574]/70"
                    style={{ height: `${point.neutral * 1.2}px` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${point.neutral * 1.2}px` }}
                    transition={{ duration: 0.6, delay: i * 0.08 + 0.05 }}
                  />
                  <motion.div
                    className="w-full bg-sage/70"
                    style={{ height: `${point.positive * 1.2}px` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${point.positive * 1.2}px` }}
                    transition={{ duration: 0.6, delay: i * 0.08 + 0.1 }}
                  />
                </div>
                <span className="text-[10px] text-slate">{point.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Poll Type Distribution */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-terracotta" />
            <h2 className="font-playfair text-xl font-bold text-charcoal">Poll Type Distribution</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { type: "Multiple Choice", count: 18, color: "bg-terracotta", total: 40 },
              { type: "Word Cloud", count: 8, color: "bg-[#D4A574]", total: 40 },
              { type: "Q&A", count: 7, color: "bg-sage", total: 40 },
              { type: "Quiz", count: 4, color: "bg-[#7B9EA8]", total: 40 },
              { type: "Rating", count: 3, color: "bg-[#9B8AA5]", total: 40 },
            ].map((item) => (
              <div key={item.type} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5DDD3" strokeWidth="3" />
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={item.color.replace("bg-", "#")}
                      strokeWidth="3"
                      strokeDasharray={`${(item.count / item.total) * 100} 100`}
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ strokeDasharray: `${(item.count / item.total) * 100} 100` }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-charcoal">{item.count}</span>
                </div>
                <p className="text-xs text-slate">{item.type}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Engagement Insights */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Eye, label: "Total Views", value: "8,421", desc: "Across all polls" },
            { icon: Activity, label: "Peak Activity", value: "2:30 PM", desc: "Most active time" },
            { icon: ThumbsUp, label: "Avg Sentiment", value: "78%", desc: "Positive responses" },
          ].map((item, i) => (
            <div key={item.label} className="bg-warm-white rounded-xl border border-clay/30 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                <item.icon size={18} className="text-terracotta" />
              </div>
              <div>
                <p className="text-xs text-slate">{item.label}</p>
                <p className="text-xl font-bold text-charcoal">{item.value}</p>
                <p className="text-xs text-slate">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
