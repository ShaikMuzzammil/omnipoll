import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PollType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts,
  });
}

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${(secs / 3600).toFixed(1)}h`;
}

export function generateCode(len = 6): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function pollTypeLabel(type: PollType): string {
  const labels: Record<PollType, string> = {
    multiple_choice: 'Multiple Choice',
    word_cloud:      'Word Cloud',
    qa:              'Q&A',
    quiz:            'Quiz',
    nps:             'NPS Score',
    rating:          'Star Rating',
    slider:          'Slider',
    ranking:         'Ranking',
    matrix:          'Matrix Grid',
    priority:        '100-Point Priority',
    heatmap:         'Heatmap Click',
    emoji:           'Emoji Reactions',
    bracket:         'Bracket Vote',
    fill_blank:      'Fill in the Blank',
    matching:        'Live Matching',
    true_false:      'True / False',
    image_choice:    'Image Choice',
    countdown:       'Countdown Timer',
    series:          'Poll Series',
    open_ended:      'Open Ended',
  };
  return labels[type] ?? type;
}

export function pollTypeIcon(type: PollType): string {
  const icons: Record<PollType, string> = {
    multiple_choice: '☑️', word_cloud: '☁️', qa: '💬', quiz: '🧠',
    nps: '📊', rating: '⭐', slider: '🎚️', ranking: '🏆',
    matrix: '🔲', priority: '💯', heatmap: '🎯', emoji: '😍',
    bracket: '🏅', fill_blank: '✏️', matching: '🔗', true_false: '✅',
    image_choice: '🖼️', countdown: '⏱️', series: '📋', open_ended: '📝',
  };
  return icons[type] ?? '📊';
}

export function scoreColor(pct: number): string {
  if (pct >= 90) return 'text-green-600';
  if (pct >= 75) return 'text-blue-600';
  if (pct >= 60) return 'text-yellow-600';
  if (pct >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function scoreLabel(pct: number): string {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Average';
  if (pct >= 40) return 'Below Average';
  return 'Needs Improvement';
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function pluralise(n: number, singular: string, plural?: string) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + 's'}`;
}
