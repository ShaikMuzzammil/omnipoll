import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Play, BarChart2, Users, Clock, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { usePoll, useSetStatus, useDeletePoll } from '../hooks/usePolls';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { POLL_TYPE_CONFIG } from '../types';

export default function PollView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePoll(id!);
  const setStatus = useSetStatus();
  const deletePoll = useDeletePoll();

  if (isLoading) return (
    <div className="min-h-screen bg-parchment dark:bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const poll = data?.poll;

  if (!poll) return (
    <div className="min-h-screen bg-parchment dark:bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate dark:text-gray-400 mb-4">Poll not found</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );

  const config = POLL_TYPE_CONFIG[poll.type as keyof typeof POLL_TYPE_CONFIG];
  const joinUrl = `${window.location.origin}/participate/${poll.code}`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Join link copied!');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this poll? This cannot be undone.')) return;
    await deletePoll.mutateAsync(poll.id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{config?.icon}</span>
              <span className="text-xs font-medium text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">{config?.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                poll.status === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                poll.status === 'draft' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>{poll.status}</span>
            </div>
            <h1 className="text-2xl font-bold text-charcoal dark:text-white">{poll.question}</h1>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Users, label: 'Participants', value: poll.participantCount ?? 0 },
            { icon: BarChart2, label: 'Responses', value: poll.responses?.length ?? 0 },
            { icon: Clock, label: 'Created', value: format(new Date(poll.createdAt), 'MMM d, yyyy') },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <Icon className="w-5 h-5 text-terracotta mx-auto mb-1" />
              <div className="text-2xl font-bold text-charcoal dark:text-white">{value}</div>
              <div className="text-xs text-slate dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Join Link */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-charcoal dark:text-white">Join Link</span>
            <div className="flex gap-2">
              <button onClick={copyJoinLink} className="text-xs flex items-center gap-1 text-slate dark:text-gray-400 hover:text-terracotta transition-colors">
                <Copy className="w-3 h-3" /> Copy
              </button>
              <a href={joinUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-slate dark:text-gray-400 hover:text-terracotta transition-colors">
                <ExternalLink className="w-3 h-3" /> Open
              </a>
            </div>
          </div>
          <div className="bg-parchment dark:bg-gray-800 rounded-lg px-3 py-2 font-mono text-sm text-charcoal dark:text-gray-300 truncate">
            {joinUrl}
          </div>
          <div className="mt-2 text-sm text-slate dark:text-gray-400">
            Join code: <span className="font-bold font-mono text-terracotta tracking-widest">{poll.code}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {poll.status === 'draft' && (
            <button onClick={() => setStatus.mutate({ id: poll.id, status: 'live' })} className="btn-primary flex items-center gap-2">
              <Play className="w-4 h-4" /> Go Live
            </button>
          )}
          {poll.status === 'live' && (
            <Link to={`/present/${poll.id}`} className="btn-primary flex items-center gap-2">
              <Play className="w-4 h-4" /> Present
            </Link>
          )}
          <Link to={`/analytics/${poll.id}`} className="px-4 py-2 rounded-lg border border-clay dark:border-gray-600 text-charcoal dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Analytics
          </Link>
          <button onClick={copyJoinLink} className="px-4 py-2 rounded-lg border border-clay dark:border-gray-600 text-charcoal dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={handleDelete} className="ml-auto px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
