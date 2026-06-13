import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { createPoll } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import type { PollType } from '@/lib/types';

function gid() { const a=new Uint8Array(8); crypto.getRandomValues(a); const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789'; return Array.from(a,b=>c[b%c.length]).join(''); }

const TEMPLATES = [
  {id:'nps',    cat:'Business',  title:'Customer satisfaction (NPS)', type:'nps'           as PollType, question:'How likely are you to recommend us?', options:[], icon:'📈'},
  {id:'mc-team',cat:'Work',      title:'Team standup check-in', type:'multiple_choice'     as PollType, question:'How are you feeling about your workload today?', options:[{id:gid(),text:'✅ On track'},{id:gid(),text:'⚡ Busy but fine'},{id:gid(),text:'🔥 Overwhelmed'},{id:gid(),text:'😴 Slow day'}], icon:'🏢'},
  {id:'quiz',   cat:'Education', title:'General knowledge quiz', type:'quiz'               as PollType, question:'Test your knowledge!', options:[], icon:'🏆'},
  {id:'wc',     cat:'Brainstorm',title:'Brainstorm session',     type:'word_cloud'         as PollType, question:'What words come to mind about our product?', options:[], icon:'💡'},
  {id:'rating', cat:'Events',    title:'Event feedback',         type:'rating'             as PollType, question:"How would you rate today's event?", options:[], icon:'🎉'},
  {id:'qa',     cat:'Presentations',title:'Q&A session',         type:'qa'                 as PollType, question:'What questions do you have?', options:[], icon:'❓'},
  {id:'prio',   cat:'Product',   title:'Feature prioritization', type:'prioritization'     as PollType, question:'Which features should we build next?', options:[{id:gid(),text:'Mobile app'},{id:gid(),text:'Dark mode'},{id:gid(),text:'API access'},{id:gid(),text:'Better analytics'}], icon:'🎯'},
  {id:'tf',     cat:'Fun',       title:'True or false trivia',   type:'true_false'         as PollType, question:'The Great Wall of China is visible from space.', options:[{id:'true',text:'True'},{id:'false',text:'False'}], icon:'✅'},
  {id:'emoji',  cat:'Fun',       title:'Team mood check',        type:'emoji_reaction'     as PollType, question:'How are you feeling right now?', options:[], icon:'😊'},
  {id:'open',   cat:'Business',  title:'Open feedback',          type:'open_text'          as PollType, question:'What could we do better?', options:[], icon:'💬'},
  {id:'nps2',   cat:'Research',  title:'Agreement scale',        type:'rating'             as PollType, question:'I feel satisfied with the current process.', options:[], icon:'📊'},
  {id:'match',  cat:'Education', title:'Live matching exercise',  type:'live_matching'     as PollType, question:'Match the following items:', options:[], icon:'🔗'},
];
const CATS = ['All', ...Array.from(new Set(TEMPLATES.map(t=>t.cat)))];

export default function Templates() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState<string|null>(null);

  const filtered = TEMPLATES.filter(t=>{
    const mc = cat==='All'||t.cat===cat;
    const ms = !search||t.title.toLowerCase().includes(search.toLowerCase());
    return mc&&ms;
  });

  const useTemplate = async (t: typeof TEMPLATES[0]) => {
    setLoading(t.id);
    try {
      const data = await createPoll({title:t.title,question:t.question,type:t.type,creatorId:user?.id||'',options:t.options,quizQuestions:[],settings:{showResults:true,oneVote:true}}) as {poll:{id:string}};
      toast.success('Poll created from template! 🎉');
      navigate(`/present/${data.poll.id}`);
    } catch { toast.error('Failed to create poll'); }
    finally { setLoading(null); }
  };

  return (
    <DashboardLayout title="Templates">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div><h1 className="font-playfair text-2xl font-bold text-foreground mb-1">Poll Templates</h1><p className="text-muted-foreground text-sm">Start with a ready-made template</p></div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input placeholder="Search templates…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9"/></div>
          <div className="flex gap-2 flex-wrap">
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${cat===c?'bg-terracotta text-white border-terracotta':'border-border text-muted-foreground hover:border-terracotta/50'}`}>{c}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t,i)=>{
            const meta=POLL_TYPE_META[t.type];
            return (
              <motion.div key={t.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{t.icon}</div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t.cat}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.question}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"><span>{meta.icon}</span><span>{meta.label}</span></div>
                <Button size="sm" className="w-full gap-1.5 text-xs" onClick={()=>useTemplate(t)} disabled={loading===t.id}>
                  {loading===t.id?<span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>:<><Sparkles className="w-3 h-3"/>Use template<ArrowRight className="w-3 h-3 ml-auto"/></>}
                </Button>
              </motion.div>
            );
          })}
        </div>
        {filtered.length===0&&<div className="text-center py-12 text-muted-foreground"><Search className="w-10 h-10 mx-auto mb-3 opacity-30"/><p>No templates match</p></div>}
      </div>
    </DashboardLayout>
  );
}
