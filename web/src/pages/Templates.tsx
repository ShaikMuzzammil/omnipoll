import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Copy, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { createPoll } from "@/lib/api";
import { POLL_TYPE_META } from "@/lib/types";
import type { PollType } from "@/lib/types";
import { nanoid } from "nanoid";
import { toast } from "sonner";

interface Template { id: string; title: string; question: string; type: PollType; category: string; options?: {id:string;text:string}[]; icon: string; }

const TEMPLATES: Template[] = [
  { id:"t1", icon:"🎤", title:"Speaker Feedback", question:"How would you rate the speaker?", type:"rating", category:"events", options:[] },
  { id:"t2", icon:"📚", title:"Student Understanding Check", question:"How well did you understand today's lesson?", type:"multiple_choice", category:"education", options:[{id:nanoid(),text:"Fully understood"},{id:nanoid(),text:"Mostly understood"},{id:nanoid(),text:"Partly understood"},{id:nanoid(),text:"Not at all"}] },
  { id:"t3", icon:"💡", title:"Idea Brainstorm", question:"What ideas do you have for improving our product?", type:"word_cloud", category:"product", options:[] },
  { id:"t4", icon:"📊", title:"NPS Survey", question:"How likely are you to recommend us to a friend or colleague?", type:"nps", category:"marketing", options:[] },
  { id:"t5", icon:"🏆", title:"Trivia Quiz", question:"Test your general knowledge!", type:"quiz", category:"events", options:[] },
  { id:"t6", icon:"⭐", title:"Event Rating", question:"How would you rate today's event overall?", type:"rating", category:"events", options:[] },
  { id:"t7", icon:"🔢", title:"Feature Priority", question:"Which features should we build next?", type:"prioritization", category:"product", options:[{id:nanoid(),text:"Dark mode"},{id:nanoid(),text:"Mobile app"},{id:nanoid(),text:"API access"},{id:nanoid(),text:"Integrations"}] },
  { id:"t8", icon:"😊", title:"Team Mood Check", question:"How is the team feeling today?", type:"emoji_reaction", category:"hr", options:[{id:nanoid(),text:"😄"},{id:nanoid(),text:"🙂"},{id:nanoid(),text:"😐"},{id:nanoid(),text:"😕"},{id:nanoid(),text:"😔"}] },
  { id:"t9", icon:"✅", title:"Quick Agreement Check", question:"Do you agree with the proposed approach?", type:"true_false", category:"general", options:[{id:nanoid(),text:"True"},{id:nanoid(),text:"False"}] },
  { id:"t10", icon:"🎯", title:"Exit Ticket", question:"What is one thing you learned today?", type:"open_text", category:"education", options:[] },
  { id:"t11", icon:"📈", title:"Performance Review", question:"Rate your satisfaction with each area:", type:"matrix", category:"hr", options:[] },
  { id:"t12", icon:"🔗", title:"Capital Matching Quiz", question:"Match each country to its capital:", type:"live_matching", category:"education", options:[] },
];

const CATEGORIES = ["all","events","education","product","marketing","hr","general"];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState<string|null>(null);
  const navigate = useNavigate();

  const filtered = TEMPLATES.filter(t =>
    (category === "all" || t.category === category) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.question.toLowerCase().includes(search.toLowerCase()))
  );

  const useTemplate = async (t: Template) => {
    setLoading(t.id);
    try {
      const userId = (() => { try { return JSON.parse(localStorage.getItem("omnipoll_auth")||"null")?.user?.id||""; } catch { return ""; } })();
      const data = await createPoll({ title: t.title, question: t.question, type: t.type, options: t.options||[], settings:{oneVote:true,showResults:true}, creatorId: userId });
      toast.success("Poll created from template! 🎉");
      navigate(`/poll/${data.poll.id}`);
    } catch { toast.error("Failed to create poll"); }
    finally { setLoading(null); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Launch a poll in seconds — pick a template and customise.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${category===c ? "bg-terracotta text-white" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const meta = POLL_TYPE_META[t.type];
            return (
              <motion.div key={t.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{t.icon}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t.question}</p>
                <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize mb-4">{t.category}</span>
                <Button onClick={() => useTemplate(t)} disabled={loading === t.id} className="w-full bg-terracotta hover:bg-terracotta/90 gap-2">
                  {loading === t.id ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Zap className="w-3.5 h-3.5" />Use Template</>}
                </Button>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-2">🔍</p>
            <p>No templates found for "{search}"</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
