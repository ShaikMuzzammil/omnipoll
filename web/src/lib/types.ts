export type PollType = "multiple_choice" | "word_cloud" | "qa" | "quiz" | "rating";
export type PollStatus = "draft" | "live" | "paused" | "closed";

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "email";
  createdAt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  order?: number;
  votes?: number;
}

export interface QuizQuestion {
  id: string;
  pollId?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
  order: number;
}

export interface PollSettings {
  anonymity?: boolean;
  moderation?: boolean;
  allowMultiple?: boolean;
  showResults?: boolean;
  restrictOnePerDevice?: boolean;
  timer?: number;
  ratingMin?: number;
  ratingMax?: number;
  ratingStep?: number;
  ratingLowLabel?: string;
  ratingHighLabel?: string;
  maxResponses?: number;
}

export interface PollResponse {
  id: string;
  pollId: string;
  participantId: string;
  answer: Record<string, unknown>;
  createdAt: string;
}

export interface QnAQuestion {
  id: string;
  pollId: string;
  participantId?: string;
  questionText: string;
  upvotes: number;
  status: "active" | "answered" | "highlighted";
  createdAt: string;
}

export interface QuizSubmission {
  id: string;
  participantId: string;
  participantName: string;
  quizPollId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  score: number;
  createdAt: string;
}

export interface Poll {
  id: string;
  creatorId: string;
  title: string;
  question: string;
  description?: string;
  category?: string;
  type: PollType;
  status: PollStatus;
  code: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  settings?: PollSettings;
  options?: PollOption[];
  responses?: PollResponse[];
  qnaQuestions?: QnAQuestion[];
  quizQuestions?: QuizQuestion[];
  quizSubmissions?: QuizSubmission[];
}

export interface SentimentResult {
  positive: number;
  neutral: number;
  negative: number;
  score: number;
  label: "positive" | "neutral" | "negative";
}

export interface ThemeResult {
  label: string;
  count: number;
  examples: string[];
}

export interface PollResults {
  pollId: string;
  code: string;
  type: PollType;
  status: PollStatus;
  totalResponses: number;
  participants: number;
  totalVotes?: number;
  options?: Array<PollOption & { pct: number }>;
  average?: number;
  distribution?: Record<string, number>;
  values?: number[];
  words?: Array<{ text: string; count: number }>;
  responses?: Array<{ id?: string; text: string }>;
  questions?: QnAQuestion[];
  sentiment?: SentimentResult;
  themes?: ThemeResult[];
  leaderboard?: Array<{
    participantId: string;
    name: string;
    score: number;
    correct: number;
    answered: number;
  }>;
  submissions?: QuizSubmission[];
  updatedAt: string;
}

