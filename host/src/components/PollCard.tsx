import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Clock, BarChart3, Play, Square,
  Copy, Trash2, ExternalLink, Share2, Eye,
} from 'lucide-react';
import { formatDate, pollTypeLabel, pollTypeIcon, truncate } from '@/lib/utils';
import type { Poll } from '@/lib/types';

interface Props {
  poll: Poll;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onRelease?: (id: string) => void;
  showActions?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  draft:            'badge-draft',
  active:           'badge-live',
  paused:           'badge-conduct',
  closed:           'badge-closed',
  results_released: 'bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', active: 'Live', paused: 'Paused',
  closed: 'Closed', results_released: 'Released',
};

export default function PollCard({ poll, onDelete, onDuplicate, onStatusChange, onRelease, showActions = true }: Props) {
  const shareUrl = `${window.location.origin}/join/${poll.code}`;

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <motion.div
      className="op-card p-4 group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{pollTypeIcon(poll.type)}</span>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-slate-800 truncate text-sm">
              {truncate(poll.title, 42)}
            </h3>
            <p className="text-xs text-slate-500">{pollTypeLabel(poll.type)}</p>
          </div>
        </div>
        <span className={STATUS_STYLE[poll.status] ?? 'badge-closed'}>
          {STATUS_LABEL[poll.status] ?? poll.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Users size={11} /> {poll.uniqueParticipants} participants
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 size={11} /> {poll.totalVotes} votes
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {formatDate(poll.createdAt)}
        </span>
      </div>

      {/* Code chip */}
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-cream-200 rounded-lg px-2.5 py-1 font-mono text-sm font-bold text-terracotta-700 tracking-widest">
          {poll.code}
        </div>
        <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500 hover:text-terracotta-600 transition-colors" title="Copy join link">
          <Copy size={13} />
        </button>
        <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500 hover:text-terracotta-600 transition-colors" title="Share">
          <Share2 size={13} />
        </button>
      </div>

      {showActions && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-cream-200">
          <Link
            to={`/results/${poll.id}`}
            className="flex-1 flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-slate-700 font-medium transition-colors"
          >
            <Eye size={12} /> Results
          </Link>
          <Link
            to={`/present/${poll.id}`}
            className="flex-1 flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-slate-700 font-medium transition-colors"
            target="_blank"
          >
            <ExternalLink size={12} /> Present
          </Link>
          {poll.status === 'draft' && (
            <button
              onClick={() => onStatusChange?.(poll.id, 'active')}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-medium transition-colors"
            >
              <Play size={12} /> Launch
            </button>
          )}
          {poll.status === 'active' && (
            <button
              onClick={() => onStatusChange?.(poll.id, 'closed')}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
            >
              <Square size={12} /> Close
            </button>
          )}
          {poll.status === 'closed' && (
            <button
              onClick={() => onRelease?.(poll.id)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium transition-colors"
            >
              🔓 Release
            </button>
          )}
          {onDuplicate && (
            <button onClick={() => onDuplicate(poll.id)} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500" title="Duplicate">
              <Copy size={13} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(poll.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500" title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
