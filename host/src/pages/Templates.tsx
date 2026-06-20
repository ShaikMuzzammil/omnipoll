import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layers, Search, Loader2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { templatesApi } from '@/lib/api';
import { pollTypeIcon, pollTypeLabel } from '@/lib/utils';

const BUILTIN = [
  { id:'b1', title:'Student Satisfaction Survey', type:'multiple_choice', category:'Education', description:'Quick 5-question satisfaction check' },
  { id:'b2', title:'Weekly Knowledge Quiz',        type:'quiz',            category:'Education', description:'10-question scored quiz template' },
  { id:'b3', title:'NPS Customer Feedback',        type:'nps',             category:'Business',  description:'Net Promoter Score with follow-up' },
  { id:'b4', title:'Team Retrospective',           type:'rating',          category:'Business',  description:'Rate the sprint across 5 dimensions' },
  { id:'b5', title:'Live Classroom Poll',          type:'word_cloud',      category:'Education', description:'Gather one-word responses live' },
  { id:'b6', title:'Event Feedback Form',          type:'matrix',          category:'Events',    description:'Rate multiple aspects of an event' },
  { id:'b7', title:'True/False Quick Check',       type:'true_false',      category:'Education', description:'Fast knowledge verification' },
  { id:'b8', title:'Priority Ranking',             type:'priority',        category:'Business',  description:'100-point allocation across options' },
  { id:'b9', title:'Live Q&A Session',             type:'qa',              category:'Events',    description:'Audience questions with upvoting' },
  { id:'b10',title:'Emoji Pulse Check',            type:'emoji',           category:'Education', description:'Quick mood/reaction check' },
] as const;

const CATS = ['All','Education','Business','Events'] as const;

interface Template { id:string; title:string; type:string; description?:string; category?:string; pollId?:string }

export default function Templates() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [search, setSearch]   = useState('');
  const [cat,    setCat]      = useState<typeof CATS[number]>('All');

  const { data: saved = [] } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list() as Promise<Template[]>,
  });

  const delMut = useMutation({
    mutationFn: (id:string) => templatesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['templates'] }); toast.success('Template deleted'); },
  });

  const allTemplates = [
    ...BUILTIN.map(t => ({ ...t, isBuiltin: true })),
    ...saved.map(t => ({ ...t, isBuiltin: false, category: 'Saved' })),
  ];

  const filtered = allTemplates.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = cat === 'All' || t.category === cat || (cat === 'Education' && !t.category);
    return matchSearch && matchCat;
  });

  const useTemplate = (t: typeof allTemplates[0]) => {
    navigate(`/create?type=${t.type}&template=${t.id}`);
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Start from a proven template</p>
        </div>
        <Link to="/create" className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm">
          <Plus size={15}/> Create Custom
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="w-full pl-8 pr-3 py-2 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
        </div>
        <div className="flex gap-1">
          {[...CATS, 'Saved' as const].map(c => (
            <button key={c} onClick={() => setCat(c === 'Saved' ? 'All' : c as typeof cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${cat === c ? 'bg-terracotta-500 text-white' : 'bg-white border border-cream-300 text-slate-600 hover:border-terracotta-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-cream-300 rounded-2xl">
          <Layers size={40} className="mx-auto mb-3 text-slate-300"/>
          <p className="text-slate-500">No templates found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              className="op-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{pollTypeIcon(t.type as Parameters<typeof pollTypeIcon>[0])}</span>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{pollTypeLabel(t.type as Parameters<typeof pollTypeLabel>[0])}</p>
                    {t.category && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        t.category === 'Education' ? 'bg-blue-100 text-blue-700' :
                        t.category === 'Business'  ? 'bg-green-100 text-green-700' :
                        t.category === 'Events'    ? 'bg-purple-100 text-purple-700' :
                        'bg-terracotta-100 text-terracotta-700'
                      }`}>{t.category}</span>
                    )}
                  </div>
                </div>
                {!('isBuiltin' in t && t.isBuiltin) && (
                  <button onClick={() => delMut.mutate(t.id)} className="p-1 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-slate-800 mb-1">{t.title}</h3>
                {t.description && <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>}
              </div>
              <button onClick={() => useTemplate(t)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-terracotta-50 hover:bg-terracotta-100 border border-terracotta-200 text-terracotta-700 rounded-xl text-sm font-semibold transition-all">
                Use Template <ArrowRight size={14}/>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
