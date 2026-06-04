import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Star, Lock } from 'lucide-react';
import { POLL_TYPE_CONFIG } from '../types';
import { toast } from 'sonner';

const TEMPLATES = [
  { id: 't1', title: 'Net Promoter Score', type: 'nps', category: 'Business', emoji: '📊', uses: 2840, rating: 4.9, free: true, desc: 'Measure customer loyalty with the industry-standard NPS question.' },
  { id: 't2', title: 'Employee Satisfaction', type: 'rating', category: 'HR', emoji: '💼', uses: 1920, rating: 4.8, free: true, desc: 'Gauge team happiness with a multi-dimension satisfaction survey.' },
  { id: 't3', title: 'Product Feature Vote', type: 'prioritization', category: 'Product', emoji: '🚀', uses: 1540, rating: 4.7, free: true, desc: 'Let your users help prioritize the next feature to build.' },
  { id: 't4', title: 'Live Q&A Session', type: 'qa', category: 'Events', emoji: '🎤', uses: 3200, rating: 4.9, free: true, desc: 'Collect and surface audience questions in real time.' },
  { id: 't5', title: 'Knowledge Quiz', type: 'quiz', category: 'Education', emoji: '🧠', uses: 2100, rating: 4.8, free: false, desc: 'Test understanding with auto-scored quiz questions and leaderboards.' },
  { id: 't6', title: 'Brand Word Association', type: 'word_cloud', category: 'Marketing', emoji: '☁️', uses: 1340, rating: 4.6, free: true, desc: 'Discover how your audience perceives your brand in one word.' },
  { id: 't7', title: 'Icebreaker Poll', type: 'emoji_reaction', category: 'Events', emoji: '🎉', uses: 890, rating: 4.7, free: true, desc: 'Warm up any audience with fun emoji-based questions.' },
  { id: 't8', title: 'Salary Range Survey', type: 'slider', category: 'HR', emoji: '💰', uses: 760, rating: 4.5, free: false, desc: 'Collect anonymous salary expectation ranges with slider input.' },
  { id: 't9', title: 'Tournament Bracket', type: 'bracket', category: 'Fun', emoji: '🏆', uses: 650, rating: 4.8, free: false, desc: 'Let your community vote in an exciting elimination-style tournament.' },
  { id: 't10', title: 'UX Heatmap Feedback', type: 'heatmap', category: 'Product', emoji: '🎯', uses: 480, rating: 4.6, free: false, desc: 'Gather click-location feedback on UI mockups or images.' },
  { id: 't11', title: 'Conference Ice Breaker', type: 'multiple_choice', category: 'Events', emoji: '🤝', uses: 1780, rating: 4.7, free: true, desc: 'Break the ice at any conference or meetup in seconds.' },
  { id: 't12', title: 'Likert Scale Matrix', type: 'matrix', category: 'Research', emoji: '📋', uses: 920, rating: 4.5, free: false, desc: 'Collect structured survey data with a professional matrix grid.' },
];

const CATEGORIES = ['All', 'Business', 'HR', 'Product', 'Events', 'Education', 'Marketing', 'Fun', 'Research'];

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [filter, setFilter] = useState<'all' | 'free' | 'pro'>('all');

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    const matchFilter = filter === 'all' || (filter === 'free' && t.free) || (filter === 'pro' && !t.free);
    return matchSearch && matchCat && matchFilter;
  });

  const useTemplate = (template: typeof TEMPLATES[0]) => {
    if (!template.free) {
      toast.info('Upgrade to Pro to use this template');
      navigate('/pricing');
      return;
    }
    navigate(`/create?template=${template.id}&type=${template.type}`);
  };

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal dark:text-white mb-2">Templates</h1>
          <p className="text-slate dark:text-gray-400">Start fast with professionally crafted poll templates</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'free', 'pro'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === f ? 'bg-terracotta text-white' : 'bg-white dark:bg-gray-800 text-slate dark:text-gray-400 border border-clay/30 dark:border-gray-600 hover:border-terracotta/50'
                }`}
              >
                {f === 'pro' ? '⭐ Pro' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-charcoal dark:bg-white text-white dark:text-charcoal'
                  : 'bg-white dark:bg-gray-800 text-slate dark:text-gray-400 border border-clay/30 dark:border-gray-600 hover:border-terracotta/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(template => (
            <div key={template.id} className="card p-5 hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => useTemplate(template)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.emoji}</span>
                  <div>
                    <span className="text-xs font-medium text-slate dark:text-gray-400 block">{template.category}</span>
                    <span className="text-xs text-terracotta font-medium">{POLL_TYPE_CONFIG[template.type as keyof typeof POLL_TYPE_CONFIG]?.label}</span>
                  </div>
                </div>
                {!template.free && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> Pro
                  </div>
                )}
              </div>
              <h3 className="font-bold text-charcoal dark:text-white mb-2 group-hover:text-terracotta transition-colors">{template.title}</h3>
              <p className="text-sm text-slate dark:text-gray-400 mb-4 leading-relaxed">{template.desc}</p>
              <div className="flex items-center justify-between text-xs text-slate dark:text-gray-500">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-terracotta" />
                  <span>{template.uses.toLocaleString()} uses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{template.rating}</span>
                </div>
              </div>
              <button className="mt-4 w-full py-2 rounded-lg bg-terracotta/10 hover:bg-terracotta text-terracotta hover:text-white text-sm font-medium transition-all duration-200">
                {template.free ? 'Use Template' : 'Upgrade to Use'}
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-charcoal dark:text-white font-semibold mb-2">No templates found</p>
            <p className="text-slate dark:text-gray-400 text-sm">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
