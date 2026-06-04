import { useState } from 'react';
import { CheckCircle, XCircle, Flag, Star, Filter, MessageSquare, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  author: string;
  time: string;
  upvotes: number;
  status: 'pending' | 'approved' | 'rejected' | 'starred';
  aiScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const DEMO_QUESTIONS: Question[] = [
  { id: '1', text: 'What is the roadmap for the next quarter and when can we expect feature X?', author: 'Alice M.', time: '2m ago', upvotes: 14, status: 'pending', aiScore: 95, sentiment: 'positive' },
  { id: '2', text: 'How does your pricing compare to competitors in the market?', author: 'Bob K.', time: '3m ago', upvotes: 8, status: 'pending', aiScore: 88, sentiment: 'neutral' },
  { id: '3', text: 'This is such a terrible product, why would anyone use it???', author: 'Anonymous', time: '4m ago', upvotes: 0, status: 'pending', aiScore: 12, sentiment: 'negative' },
  { id: '4', text: 'Can you expand on the security measures you have in place for data protection?', author: 'Carol T.', time: '5m ago', upvotes: 22, status: 'approved', aiScore: 97, sentiment: 'neutral' },
  { id: '5', text: 'What happens to existing users when you transition to the new platform?', author: 'Dave P.', time: '6m ago', upvotes: 11, status: 'pending', aiScore: 82, sentiment: 'neutral' },
  { id: '6', text: 'SPAM SPAM SPAM BUY NOW cheapdiscounts.ru', author: 'Anonymous', time: '7m ago', upvotes: 0, status: 'rejected', aiScore: 2, sentiment: 'negative' },
];

export default function Moderation() {
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [autoMod, setAutoMod] = useState(true);

  const update = (id: string, status: Question['status']) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, status } : q));
    toast.success(status === 'approved' ? '✅ Question approved' : status === 'rejected' ? '❌ Question rejected' : '⭐ Starred');
  };

  const filtered = questions.filter(q => filter === 'all' || q.status === filter);
  const pending = questions.filter(q => q.status === 'pending').length;
  const approved = questions.filter(q => q.status === 'approved').length;

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-charcoal dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-terracotta" /> Moderation Queue
            </h1>
            {/* Auto-mod toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate dark:text-gray-400">AI Auto-Mod</span>
              <button
                onClick={() => { setAutoMod(v => !v); toast.success(autoMod ? 'Auto-mod disabled' : 'AI auto-mod enabled'); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoMod ? 'bg-terracotta' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${autoMod ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <p className="text-slate dark:text-gray-400 text-sm">
            Review, approve, and feature audience questions in real time.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: questions.length, color: 'text-charcoal dark:text-white' },
            { label: 'Pending', value: pending, color: 'text-amber-500' },
            { label: 'Approved', value: approved, color: 'text-green-600 dark:text-green-400' },
            { label: 'Rejected', value: questions.filter(q => q.status === 'rejected').length, color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-slate dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* AI Auto-mod Banner */}
        {autoMod && (
          <div className="flex items-center gap-3 bg-terracotta/10 border border-terracotta/20 rounded-xl px-4 py-3 mb-5 text-sm">
            <span className="text-xl">🤖</span>
            <div>
              <span className="font-semibold text-terracotta">AI Auto-Mod active</span>
              <span className="text-slate dark:text-gray-400 ml-2">Questions scored below 30 are automatically rejected. Spam, profanity, and off-topic content filtered.</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 mb-5 w-fit border border-clay/20 dark:border-gray-700">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-terracotta text-white' : 'text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-white'
              }`}
            >
              {f} {f === 'pending' && pending > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5">{pending}</span>}
            </button>
          ))}
        </div>

        {/* Question List */}
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className={`card p-4 border-l-4 transition-all ${
              q.status === 'approved' ? 'border-l-green-500' :
              q.status === 'rejected' ? 'border-l-red-500 opacity-60' :
              q.status === 'starred' ? 'border-l-amber-400' :
              'border-l-clay/30 dark:border-l-gray-600'
            }`}>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-slate dark:text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-charcoal dark:text-white text-sm mb-2 leading-relaxed">{q.text}</p>
                  <div className="flex items-center gap-3 text-xs text-slate dark:text-gray-400">
                    <span>{q.author}</span>
                    <span>·</span>
                    <span>{q.time}</span>
                    <span>·</span>
                    <span>▲ {q.upvotes}</span>
                    <span>·</span>
                    {/* AI Score */}
                    <span className={`font-medium ${q.aiScore >= 70 ? 'text-green-600 dark:text-green-400' : q.aiScore >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                      AI: {q.aiScore}/100
                    </span>
                    <span>·</span>
                    <span className={`capitalize ${q.sentiment === 'positive' ? 'text-green-600 dark:text-green-400' : q.sentiment === 'negative' ? 'text-red-500' : 'text-slate'}`}>
                      {q.sentiment}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => update(q.id, 'starred')}
                    title="Star"
                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors ${q.status === 'starred' ? 'text-amber-400' : 'text-slate dark:text-gray-400 hover:text-amber-500'}`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => update(q.id, 'approved')}
                    title="Approve"
                    className={`p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${q.status === 'approved' ? 'text-green-600' : 'text-slate dark:text-gray-400 hover:text-green-600'}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => update(q.id, 'rejected')}
                    title="Reject"
                    className={`p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${q.status === 'rejected' ? 'text-red-500' : 'text-slate dark:text-gray-400 hover:text-red-500'}`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-slate/30 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate dark:text-gray-400">No questions in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
