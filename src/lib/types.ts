export type PollType =
  | 'multiple_choice' | 'word_cloud' | 'qa' | 'quiz' | 'rating'
  | 'ranking' | 'open_text' | 'image_choice' | 'nps' | 'matrix'
  | 'slider' | 'true_false' | 'fill_blank' | 'bracket' | 'prioritization'
  | 'heatmap' | 'emoji_reaction' | 'poll_series' | 'countdown_vote' | 'live_matching';

export type PollStatus = 'live' | 'paused' | 'closed';

export interface PollOption {
  id: string; text: string; order?: number; imageUrl?: string; eliminated?: boolean;
}
export interface MatrixRow { id: string; label: string; }
export interface MatrixColumn { id: string; label: string; }
export interface MatchingPair { id: string; left: string; right: string; }

export interface QuizQuestion {
  id: string; questionText: string; correctAnswer: string;
  points: number; timeLimit: number; options: PollOption[];
}
export interface QAQuestion {
  id: string; questionText: string; upvotes: number;
  status: 'open' | 'answered' | 'highlighted' | 'dismissed';
  participantId?: string; createdAt: number;
}
export interface QuizSubmission {
  participantId: string; participantName?: string;
  score: number; correct: number; answered: number;
  answers: { questionId: string; selected: string | null; isCorrect: boolean; points: number }[];
  completedAt: number;
}
export interface PollResponse {
  id: string; participantId?: string; participantName?: string;
  answer: unknown; questionId?: string; isCorrect?: boolean; score?: number; createdAt: number;
}
export interface PollSettings {
  duration?: number | null; showResults?: boolean; oneVote?: boolean;
  multiSelect?: boolean; min?: number; max?: number; step?: number;
  labelLeft?: string; labelRight?: string; maxResponses?: number;
  sentence?: string; matrixRows?: MatrixRow[]; matrixColumns?: MatrixColumn[];
  matchingPairs?: MatchingPair[]; imageUrl?: string;
}
export interface Poll {
  id: string; code: string; title: string; description?: string;
  type: PollType; question: string; settings: PollSettings;
  options: PollOption[]; quizQuestions: QuizQuestion[];
  responses: PollResponse[]; qaQuestions: QAQuestion[];
  quizSubmissions?: QuizSubmission[];
  status: PollStatus; creatorId?: string; participants: string[];
  createdAt: number; updatedAt?: number; expiresAt: number | null;
}
export interface OptionResult extends PollOption { votes: number; pct: number; }
export interface LeaderboardEntry { participantId: string; name: string; score: number; answered: number; correct: number; }
export interface WordEntry { text: string; count: number; }
export interface PollResults {
  participants: number; totalVotes?: number;
  options?: OptionResult[]; words?: WordEntry[];
  totalResponses?: number; questions?: QAQuestion[];
  leaderboard?: LeaderboardEntry[]; submissions?: PollResponse[];
  average?: number; distribution?: Record<string, number>;
  npsScore?: number; detractors?: number; passives?: number; promoters?: number;
  matrixResults?: Record<string, Record<string, number>>;
  emojiCounts?: Record<string, number>;
  heatmapPoints?: { x: number; y: number }[];
  rankingResults?: { id: string; text: string; avgRank: number; points: number }[];
  matchingResults?: { left: string; right: string; correct: number; total: number }[];
  answers?: string[];
}
export interface User { id: string; name: string; email: string; plan?: string; }

export const POLL_TYPE_META: Record<PollType, { icon: string; label: string; desc: string; plan: string; }> = {
  multiple_choice: { icon:'📊', label:'Multiple Choice',  desc:'Real-time vote bars & %',     plan:'free' },
  word_cloud:      { icon:'☁️', label:'Word Cloud',       desc:'Live word aggregation',        plan:'free' },
  qa:              { icon:'❓', label:'Q&A Session',      desc:'Submit & upvote questions',    plan:'free' },
  quiz:            { icon:'🏆', label:'Live Quiz',        desc:'Timed scoring & leaderboard',  plan:'free' },
  rating:          { icon:'⭐', label:'Rating Scale',     desc:'1–10 scale + distribution',    plan:'free' },
  ranking:         { icon:'🔢', label:'Ranking',          desc:'Drag to order options',        plan:'starter' },
  open_text:       { icon:'💬', label:'Open Text',        desc:'Free-form responses',          plan:'starter' },
  image_choice:    { icon:'🖼️', label:'Image Choice',     desc:'Visual poll with images',      plan:'starter' },
  nps:             { icon:'📈', label:'NPS Score',        desc:'Net Promoter Score 0–10',      plan:'starter' },
  matrix:          { icon:'🗃️', label:'Matrix Grid',      desc:'Rows × columns rating',        plan:'starter' },
  slider:          { icon:'🎚️', label:'Slider',           desc:'Continuous value selection',   plan:'pro' },
  true_false:      { icon:'✅', label:'True / False',     desc:'Simple binary choice',         plan:'starter' },
  fill_blank:      { icon:'✏️', label:'Fill the Blank',   desc:'Complete the sentence',        plan:'pro' },
  bracket:         { icon:'🥊', label:'Bracket Vote',     desc:'Tournament elimination',       plan:'pro' },
  prioritization:  { icon:'🎯', label:'Prioritization',   desc:'Allocate 100 points',          plan:'pro' },
  heatmap:         { icon:'🔥', label:'Heatmap',          desc:'Click on an image',            plan:'pro' },
  emoji_reaction:  { icon:'😊', label:'Emoji Reaction',   desc:'React with emojis',            plan:'starter' },
  poll_series:     { icon:'📋', label:'Poll Series',      desc:'Sequential questions',         plan:'pro' },
  countdown_vote:  { icon:'⏳', label:'Countdown Vote',   desc:'Options expire over time',     plan:'pro' },
  live_matching:   { icon:'🔗', label:'Live Matching',    desc:'Match two columns live',       plan:'pro' },
};

export const CHART_COLORS = ['#D96C4A','#7B9E87','#C4A882','#4A7BB5','#E8C547','#B56A9E','#4AB5A0','#E87347','#7B7BC4','#C47B7B'];
export const EMOJIS = ['😄','😂','❤️','👏','🔥','😮','😢','👍','🚀','🎉'];
