export type PollType =
  | "multiple_choice" | "word_cloud" | "qa" | "quiz" | "rating"
  | "ranking" | "open_text" | "image_choice" | "nps" | "matrix"
  | "slider" | "true_false" | "fill_blank" | "bracket" | "prioritization"
  | "heatmap" | "emoji_reaction" | "poll_series" | "countdown_vote" | "live_matching";

export type PollStatus = "draft" | "live" | "paused" | "closed";
export type UserRole = "admin" | "presenter" | "moderator" | "viewer";
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";
export type PollDomain = "general" | "education" | "healthcare" | "events" | "research" | "hr" | "sales" | "marketing" | "product" | "onboarding";

export interface PollOption { id: string; text: string; imageUrl?: string; emoji?: string; order?: number; isEliminated?: boolean; }
export interface PollSettings {
  duration?: number | null; showResults?: boolean; oneVote?: boolean; multiSelect?: boolean; maxSelections?: number;
  randomizeOptions?: boolean; min?: number; max?: number; step?: number; labelLeft?: string; labelRight?: string;
  showCorrectAnswer?: boolean; maxWords?: number; profanityFilter?: boolean; matrixRows?: string[]; matrixColumns?: string[];
  maxResponses?: number; allowAnonymous?: boolean; requireName?: boolean; theme?: string; accentColor?: string;
  npsLabels?: { low: string; high: string }; blankTemplate?: string; totalPoints?: number; countdownSeconds?: number;
  matchPairs?: Array<{ left: string; right: string; id: string }>;
}
export interface QuizQuestion { id: string; questionText: string; options: PollOption[]; correctAnswer: string; points: number; timeLimit: number; explanation?: string; }
export interface QAQuestion {
  id: string; questionText: string; upvotes: number; downvotes: number;
  status: "open" | "answered" | "highlighted" | "dismissed";
  participantId?: string; participantName?: string; answer?: string; createdAt: number;
  tags?: string[]; aiFlags?: { spam: boolean; toxic: boolean; offTopic: boolean };
}
export interface PollResponse { id: string; participantId?: string; participantName?: string; answer: unknown; questionId?: string; isCorrect?: boolean; score?: number; timeToRespond?: number; device?: string; createdAt: number; }
export interface BracketMatch { id: string; round: number; option1Id: string; option2Id: string; winnerId?: string; votes: Record<string, number>; }
export interface Poll {
  id: string; code: string; title: string; description?: string; category?: string; type: PollType;
  question: string; settings: PollSettings; options: PollOption[]; quizQuestions: QuizQuestion[];
  responses: PollResponse[]; qaQuestions: QAQuestion[]; bracketMatches?: BracketMatch[];
  status: PollStatus; creatorId?: string; participants: string[]; participantCount: number;
  tags?: string[]; scheduledAt?: number | null; expiresAt?: number | null;
  createdAt: number; updatedAt?: number;
}
export interface SentimentResult { score: number; label: "positive" | "neutral" | "negative"; breakdown: { positive: number; neutral: number; negative: number }; }
export interface ThemeEntry { label: string; count: number; keywords: string[]; }
export interface WordEntry { text: string; count: number; sentiment?: string; }
export interface OptionResult extends PollOption { votes: number; pct: number; }
export interface LeaderboardEntry { participantId: string; name: string; score: number; answered: number; correct: number; avgTime: number; rank: number; }
export interface MatrixResult { rowId: string; row: string; scores: Record<string, number>; average: number; }
export interface NPSResult { score: number; promoters: number; passives: number; detractors: number; breakdown: Record<number, number>; }
export interface PollResults {
  participants: number; participantCount: number; totalVotes?: number; totalResponses?: number;
  options?: OptionResult[]; words?: WordEntry[]; textResponses?: string[]; questions?: QAQuestion[];
  leaderboard?: LeaderboardEntry[]; submissions?: PollResponse[]; average?: number; distribution?: Record<string, number>;
  nps?: NPSResult; matrixResults?: MatrixResult[];
  rankings?: Array<{ id: string; text: string; avgRank: number; votes: number }>;
  priorityScores?: Array<{ id: string; text: string; totalPoints: number; avgPoints: number }>;
  bracketMatches?: BracketMatch[]; currentMatchId?: string; champion?: PollOption;
  blanks?: Record<string, number>; heatmapPoints?: Array<{ x: number; y: number; weight: number }>;
  sentiment?: SentimentResult; themes?: ThemeEntry[]; engagementRate?: number; avgResponseTime?: number;
  deviceBreakdown?: { mobile: number; tablet: number; desktop: number };
}
export interface User { id: string; name: string; email: string; avatar?: string; role: UserRole; plan: SubscriptionPlan; createdAt: number; twoFactorEnabled?: boolean; }
export interface Notification { id: string; userId: string; type: string; title: string; message: string; read: boolean; data?: Record<string, unknown>; createdAt: number; }
export interface BillingInfo { plan: SubscriptionPlan; status: string; currentPeriodEnd: number; cancelAtPeriodEnd: boolean; usage: { polls: { used: number; limit: number }; participants: { used: number; limit: number }; team: { used: number; limit: number }; }; }
export interface PollTemplate { id: string; name: string; description: string; type: PollType; domain: PollDomain; question: string; options: PollOption[]; settings: PollSettings; thumbnail?: string; useCount: number; rating: number; tags: string[]; }
export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string; }

export const POLL_TYPE_CONFIG: Record<PollType, { label: string; icon: string; description: string; plan: SubscriptionPlan }> = {
  multiple_choice: { label: "Multiple Choice", icon: "📊", description: "Predefined options with live vote bars", plan: "free" },
  word_cloud: { label: "Word Cloud", icon: "☁️", description: "Open text generates live word cloud", plan: "free" },
  qa: { label: "Q&A Session", icon: "❓", description: "Submit & upvote questions in real-time", plan: "free" },
  quiz: { label: "Live Quiz", icon: "🏆", description: "Timed scoring with live leaderboard", plan: "free" },
  rating: { label: "Rating Scale", icon: "⭐", description: "Numeric scale with distribution chart", plan: "free" },
  ranking: { label: "Ranking", icon: "🥇", description: "Drag-and-drop ordering of options", plan: "starter" },
  open_text: { label: "Open Text", icon: "📝", description: "Free-form responses with AI categorization", plan: "starter" },
  image_choice: { label: "Image Choice", icon: "🖼️", description: "Options displayed as images", plan: "starter" },
  nps: { label: "Net Promoter Score", icon: "📈", description: "0-10 scale with NPS calculation", plan: "starter" },
  matrix: { label: "Matrix Grid", icon: "🔲", description: "Rows × columns rating grid", plan: "starter" },
  slider: { label: "Slider", icon: "🎚️", description: "Continuous value on a spectrum", plan: "pro" },
  true_false: { label: "True / False", icon: "✅", description: "Binary choice with explanation", plan: "starter" },
  fill_blank: { label: "Fill in the Blank", icon: "📋", description: "Sentence completion", plan: "pro" },
  bracket: { label: "Bracket Vote", icon: "🏅", description: "Tournament-style elimination", plan: "pro" },
  prioritization: { label: "Prioritization", icon: "⚖️", description: "Allocate 100 points across options", plan: "pro" },
  heatmap: { label: "Heatmap", icon: "🗺️", description: "Click on image to mark locations", plan: "pro" },
  emoji_reaction: { label: "Emoji Reaction", icon: "😀", description: "Real-time emoji rain", plan: "starter" },
  poll_series: { label: "Poll Series", icon: "📚", description: "Linked multi-question sequential flow", plan: "pro" },
  countdown_vote: { label: "Countdown Vote", icon: "⏰", description: "Options disappear as time expires", plan: "pro" },
  live_matching: { label: "Live Matching", icon: "🔗", description: "Match items from two columns", plan: "pro" },
};

export const PLAN_LIMITS = {
  free: { pollsPerMonth: 5, participantsPerPoll: 50, teamMembers: 1, pollTypes: 5, analytics: false, export: false, customBranding: false, apiAccess: false, sso: false, prioritySupport: false },
  starter: { pollsPerMonth: 30, participantsPerPoll: 250, teamMembers: 3, pollTypes: 10, analytics: true, export: true, customBranding: false, apiAccess: false, sso: false, prioritySupport: false },
  pro: { pollsPerMonth: 200, participantsPerPoll: 2000, teamMembers: 10, pollTypes: 20, analytics: true, export: true, customBranding: true, apiAccess: true, sso: false, prioritySupport: true },
  enterprise: { pollsPerMonth: -1, participantsPerPoll: -1, teamMembers: -1, pollTypes: 20, analytics: true, export: true, customBranding: true, apiAccess: true, sso: true, prioritySupport: true },
};

export const CHART_COLORS = [
  "#E07A5F", "#81B29A", "#F2CC8F", "#3D405B", "#A8DADC",
  "#B5927A", "#C84B4B", "#6B8CBA", "#F4A261", "#2A9D8F",
];

export const POLL_DOMAIN_CONFIG: Record<PollDomain, { label: string; icon: string; description: string }> = {
  general: { label: "General", icon: "🌐", description: "All-purpose polling" },
  education: { label: "Education", icon: "🎓", description: "Classroom & e-learning" },
  healthcare: { label: "Healthcare", icon: "🏥", description: "Patient & staff feedback" },
  events: { label: "Events", icon: "🎉", description: "Live events & conferences" },
  research: { label: "Research", icon: "🔬", description: "Academic & market research" },
  hr: { label: "HR & People", icon: "👥", description: "Employee engagement" },
  sales: { label: "Sales", icon: "💼", description: "Pipeline & deal insights" },
  marketing: { label: "Marketing", icon: "📣", description: "Campaign & brand research" },
  product: { label: "Product", icon: "🚀", description: "User feedback & discovery" },
  onboarding: { label: "Onboarding", icon: "👋", description: "New user experience" },
};
