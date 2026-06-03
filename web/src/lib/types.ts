// OmniPoll shared types

export type PollType = "multiple_choice" | "word_cloud" | "qa" | "quiz" | "rating";
export type PollStatus = "live" | "paused" | "closed";

export interface PollOption {
  id: string;
  text: string;
  order?: number;
}

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
  questionText: string;
  upvotes: number;
  status: "open" | "answered" | "highlighted";
  participantId?: string;
  createdAt: number;
}

export interface QuizSubmission {
  participantId: string;
  participantName?: string;
  score: number;
  answers: Array<{
    questionId: string;
    selected: string | null;
    isCorrect: boolean;
    points: number;
  }>;
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
  min?: number;
  max?: number;
  step?: number;
  labelLeft?: string;
  labelRight?: string;
  maxResponses?: number;
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
  /** Q&A questions array */
  qaQuestions: QAQuestion[];
  /** Alias for qaQuestions — kept for backward compatibility */
  qnaQuestions?: QAQuestion[];
  /** Quiz submissions summary */
  quizSubmissions?: QuizSubmission[];
  status: PollStatus;
  creatorId?: string;
  participants: string[];
  createdAt: number;
  updatedAt?: number;
  expiresAt: number | null;
}

export interface OptionResult extends PollOption {
  votes: number;
  pct: number;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  score: number;
  answered: number;
  correct: number;
}

export interface WordEntry {
  text: string;
  count: number;
}

export interface SentimentResult {
  score: number;
  label: "positive" | "neutral" | "negative";
}

export interface ThemeEntry {
  label: string;
  count: number;
}

export interface PollResults {
  participants: number;
  // multiple_choice
  totalVotes?: number;
  options?: OptionResult[];
  // word_cloud
  words?: WordEntry[];
  totalResponses?: number;
  sentiment?: SentimentResult;
  themes?: ThemeEntry[];
  // qa
  questions?: QAQuestion[];
  // quiz
  leaderboard?: LeaderboardEntry[];
  submissions?: PollResponse[];
  // rating
  average?: number;
  distribution?: Record<string, number>;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
