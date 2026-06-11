'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { createPoll } from '@/lib/api';
import { POLL_TYPE_META } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { genId } from '@/lib/utils';
import { toast } from 'sonner';

const TEMPLATES = [
  { id: 'nps-satisfaction', category: 'Business', title: 'Customer satisfaction (NPS)', type: 'nps' as const, question: 'How likely are you to recommend us to a friend?', options: [], icon: '📈' },
  { id: 'team-standup', category: 'Work', title: 'Daily standup check-in', type: 'multiple_choice' as const, question: 'How are you feeling about your workload today?', options: [{ id: genId(), text: '✅ On track' }, { id: genId(), text: '⚡ Busy but fine' }, { id: genId(), text: '🔥 Overwhelmed' }, { id: genId(), text: '😴 Slow day' }], icon: '🏢' },
  { id: 'quiz-general', category: 'Education', title: 'General knowledge quiz', type: 'quiz' as const, question: 'Test your knowledge!', options: [], icon: '🏆' },
  { id: 'word-brainstorm', category: 'Brainstorm', title: 'Brainstorm session', type: 'word_cloud' as const, question: 'What words come to mind when you think about our product?', options: [], icon: '💡' },
  { id: 'event-feedback', category: 'Events', title: 'Event feedback', type: 'rating' as const, question: 'How would you rate today\'s event overall?', options: [], icon: '🎉' },
  { id: 'qa-session', category: 'Presentations', title: 'Q&A session', type: 'qa' as const, question: 'What questions do you have?', options: [], icon: '❓' },
  { id: 'feature-priority', category: 'Product', title: 'Feature prioritization', type: 'prioritization' as const, question: 'Which features should we build next?', options: [{ id: genId(), text: 'Mobile app' }, { id: genId(), text: 'Dark mode' }, { id: genId(), text: 'API access' }, { id: genId(), text: 'Better analytics' }], icon: '🎯' },
  { id: 'true-false-trivia', category: 'Fun', title: 'True or false trivia', type: 'true_false' as const, question: 'The Great Wall of China is visible from space.', options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }], icon: '✅' },
  { id: 'opinion-scale', category: 'Research', title: 'Agreement scale', type: 'rating' as const, question: 'I feel satisfied with the current process.', options: [], icon: '📊' },
  { id: 'emoji-mood', category: 'Fun', title: 'Team mood check', type: 'emoji_reaction' as const, question: 'How are you feeling right now?', options: [], icon: '😊' },
  { id: 'open-feedback', category: 'Business', title: 'Open feedback', type: 'open_text' as const, question: 'What could we do better?', options: [], icon: '💬' },
  { id: 'poll-series-onboard', category: 'Education', title: 'Onboarding survey', type: 'poll_series' as const, question: 'Help us understand your goals', options: [{ id: genId(), text: 'Learning new skills' }, { id: genId(), text: 'Team collaboration' }, { id: genId(), text: 'Process automation' }, { id: genId(), text: 'Customer engagement' }], icon: '📋' },
];

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.question.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const useTemplate = async (template: typeof TEMPLATES[0]) => {
    setLoading(template.id);
    try {
      const body = {
        title: template.title,
        question: template.question,
        type: template.type,
        creatorId: user?.id || '',
        options: template.options,
        quizQuestions: [],
        settings: { showResults: true, oneVote: true },
      };
      const data = await createPoll(body) as { poll: { id: string } };
      toast.success('Poll created from template!');
      router.push(`/present/${data.poll.id}`);
    } catch { toast.error('Failed to create poll'); }
    finally { setLoading(null); }
  };

  return (
    <DashboardLayout title="Templates">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-2xl font-bold text-foreground mb-1">Poll Templates</h1>
          <p className="text-muted-foreground text-sm">Start with a ready-made template and customise it</p>
        </motion.div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search templates…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  category === cat ? 'bg-terracotta text-white border-terracotta' : 'border-border text-muted-foreground hover:border-terracotta/50'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template, i) => {
            const meta = POLL_TYPE_META[template.type];
            return (
              <motion.div key={template.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  <Badge variant="outline" className="text-xs">{template.category}</Badge>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{template.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.question}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <span>{meta.icon}</span><span>{meta.label}</span>
                </div>
                <Button size="sm" className="w-full gap-1.5 text-xs" onClick={() => useTemplate(template)}
                  disabled={loading === template.id}>
                  {loading === template.id ? (
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Sparkles className="w-3 h-3" />Use template<ArrowRight className="w-3 h-3 ml-auto" /></>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No templates match your search</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
