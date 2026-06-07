// OmniPoll — Full Types (all 20 poll types)

export type PollType =
  | "multiple_choice" | "word_cloud" | "qa" | "quiz" | "rating"
  | "ranking" | "open_text" | "image_choice" | "nps" | "matrix"
  | "slider" | "true_false" | "fill_blank" | "bracket" | "prioritization"
  | "heatmap" | "emoji_reaction" | "poll_series" | "countdown_vote" | "live_matching";

export type PollStatus = "draft" | "live" | "paused" | "closed";

export interface PollOption {
  id: string;
  text: string;
  order?: number;
  imageUrl?: string;
  eliminated?: boolean;
}

export interface MatrixRow { id: string; label: string; }
export interface MatrixColumn { id: string; label: string; }
export interface MatchingPair { id: string; left: string; right: string; }

export interface QuizQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  points: number;
  timeLimit: number;
  options: PollOption[];
}

export interface QAQuestion {
  id: string;
  text?: string;
  questionText?: string;
  upvotes: number;
  status?: "open" | "answered" | "highlighted" | "dismissed";
  answered?: boolean;
  starred?: boolean;
  author?: string;
  participantId?: string;
  createdAt: number | string;
}

export interface QuizSubmission {
  participantId: string;
  participantName?: string;
  score: number;
  answers: Array<{ questionId: string; selected: string | null; isCorrect: boolean; points: number }>;
  completedAt: number;
}

export interface PollResponse {
  id: string;
  participantId?: string;
  participantName?: string;
  answer: unknown;
  questionId?: string;
  isCorrect?: boolean;
  score?: number;
  createdAt: number;
}

export interface PollSettings {
  duration?: number | null;
  showResults?: boolean;
  oneVote?: boolean;
  multiSelect?: boolean;
  min?: number; max?: number; step?: number;
  labelLeft?: string; labelRight?: string;
  maxResponses?: number;
  sentence?: string;        // fill_blank
  matrixRows?: MatrixRow[];
  matrixColumns?: MatrixColumn[];
  matchingPairs?: MatchingPair[];
  imageUrl?: string;        // heatmap
  allowSkip?: boolean;
}

export interface Poll {
  id: string;
  code: string;
  title: string;
  description?: string;
  category?: string;
  type: PollType;
  question: string;
  settings: PollSettings;
  options: PollOption[];
  quizQuestions: QuizQuestion[];
  responses: PollResponse[];
  qaQuestions: QAQuestion[];
  qnaQuestions?: QAQuestion[];
  quizSubmissions?: QuizSubmission[];
  status: PollStatus;
  creatorId?: string;
  participants: string[];
  createdAt: number;
  updatedAt?: number;
  expiresAt: number | null;
}

export interface OptionResult extends PollOption { votes: number; pct: number; emoji?: string; }
export interface LeaderboardEntry { participantId: string; name: string; score: number; answered: number; correct: number; }
export interface WordEntry { text: string; count: number; }
export interface SentimentResult { score: number; label: "positive" | "neutral" | "negative"; }
export interface ThemeEntry { label: string; count: number; }

export interface EmojiResult { id: string; emoji?: string; text?: string; count: number; }
export interface RankingResult { id: string; text: string; score: number; avgRank?: number; points?: number; }
export interface HeatPoint { x: number; y: number; count?: number; }

export interface PollResults {
  participants: number;
  totalVotes: number;
  options?: OptionResult[];
  words?: WordEntry[];
  totalResponses?: number;
  sentiment?: SentimentResult;
  themes?: ThemeEntry[];
  questions?: QAQuestion[];
  leaderboard?: Array<{ name: string; score: number; participantId?: string; correct?: number; answered?: number }>;
  submissions?: PollResponse[];
  average?: number;
  distribution?: Record<string, number>;
  npsScore?: number;
  detractors?: number; passives?: number; promoters?: number;
  matrix?: Record<string, Record<string, number>>;
  matrixRows?: MatrixRow[];
  matrixCols?: MatrixColumn[];
  matrixResults?: Record<string, Record<string, number>>;
  emojis?: EmojiResult[];
  emojiCounts?: Record<string, number>;
  heatPoints?: HeatPoint[];
  heatmapPoints?: Array<{ x: number; y: number; count: number }>;
  heatmapUrl?: string;
  rankings?: RankingResult[];
  rankingResults?: RankingResult[];
  matchResults?: Record<string, number>;
  matchingPairs?: MatchingPair[];
  matchingResults?: Array<{ left: string; right: string; correct: number; total: number }>;
  bracketResults?: OptionResult[];
  answers?: Array<{ text: string; count: number }> | string[];
}

export interface User { id: string; name: string; email: string; }

export const POLL_TYPE_META: Record<PollType, { icon: string; label: string; desc: string; plan: "free" | "starter" | "pro"; color: string }> = {
  multiple_choice: { icon: "📊", label: "Multiple Choice", desc: "Real-time vote bars", plan: "free", color: "bg-blue-50 text-blue-600 border-blue-100" },
  word_cloud:      { icon: "☁️", label: "Word Cloud",      desc: "Live word aggregation", plan: "free", color: "bg-sky-50 text-sky-600 border-sky-100" },
  qa:              { icon: "❓", label: "Q&A Session",     desc: "Upvote questions", plan: "free", color: "bg-amber-50 text-amber-600 border-amber-100" },
  quiz:            { icon: "🏆", label: "Live Quiz",       desc: "Timed leaderboard", plan: "free", color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
  rating:          { icon: "⭐", label: "Rating Scale",    desc: "1–10 with distribution", plan: "free", color: "bg-orange-50 text-orange-600 border-orange-100" },
  ranking:         { icon: "🔢", label: "Ranking",         desc: "Order options", plan: "starter", color: "bg-purple-50 text-purple-600 border-purple-100" },
  open_text:       { icon: "💬", label: "Open Text",       desc: "Free-form responses", plan: "starter", color: "bg-teal-50 text-teal-600 border-teal-100" },
  image_choice:    { icon: "🖼️", label: "Image Choice",    desc: "Visual poll options", plan: "starter", color: "bg-pink-50 text-pink-600 border-pink-100" },
  nps:             { icon: "📈", label: "NPS Score",       desc: "Net Promoter Score", plan: "starter", color: "bg-green-50 text-green-600 border-green-100" },
  matrix:          { icon: "🗃️", label: "Matrix Grid",     desc: "Rows × columns rating", plan: "starter", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  slider:          { icon: "🎚️", label: "Slider",          desc: "Continuous value", plan: "pro", color: "bg-violet-50 text-violet-600 border-violet-100" },
  true_false:      { icon: "✅", label: "True / False",    desc: "Binary choice", plan: "starter", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  fill_blank:      { icon: "✏️", label: "Fill the Blank",  desc: "Complete the sentence", plan: "pro", color: "bg-lime-50 text-lime-600 border-lime-100" },
  bracket:         { icon: "🥊", label: "Bracket Vote",    desc: "Tournament elimination", plan: "pro", color: "bg-red-50 text-red-600 border-red-100" },
  prioritization:  { icon: "🎯", label: "Prioritization",  desc: "Allocate 100 points", plan: "pro", color: "bg-rose-50 text-rose-600 border-rose-100" },
  heatmap:         { icon: "🔥", label: "Heatmap",         desc: "Click on an image", plan: "pro", color: "bg-orange-50 text-orange-700 border-orange-100" },
  emoji_reaction:  { icon: "😊", label: "Emoji Reaction",  desc: "Express with emojis", plan: "starter", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  poll_series:     { icon: "📋", label: "Poll Series",     desc: "Sequential questions", plan: "pro", color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  countdown_vote:  { icon: "⏳", label: "Countdown Vote",  desc: "Options expire over time", plan: "pro", color: "bg-slate-50 text-slate-600 border-slate-100" },
  live_matching:   { icon: "🔗", label: "Live Matching",   desc: "Match two columns", plan: "pro", color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100" },
};

export const CHART_COLORS = ["#D96C4A","#7B9E87","#C4A882","#4A7BB5","#E8C547","#B56A9E","#4AB5A0","#E87347","#7B7BC4","#C47B7B"];
