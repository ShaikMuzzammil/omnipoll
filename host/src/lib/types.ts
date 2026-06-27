// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
  institution?: string;
  createdAt: string;
}

// ── Poll types ─────────────────────────────────────────────────────────────────
export type PollType =
  | 'multiple_choice' | 'word_cloud' | 'qa'      | 'quiz'
  | 'nps'             | 'rating'     | 'slider'   | 'ranking'
  | 'matrix'          | 'priority'   | 'heatmap'  | 'emoji'
  | 'bracket'         | 'fill_blank' | 'matching' | 'true_false'
  | 'image_choice'    | 'countdown'  | 'series'   | 'open_ended';

export type PollStatus = 'draft' | 'active' | 'paused' | 'closed' | 'results_released';

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  points?: number;
}

export interface MatrixRow { id: string; text: string; }
export interface MatrixCol { id: string; text: string; }

export interface Poll {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: PollType;
  status: PollStatus;
  creatorId: string;
  creator?: User;
  options: PollOption[];
  matrixRows?: MatrixRow[];
  matrixCols?: MatrixCol[];
  settings: PollSettings;
  classroomId?: string;
  classroom?: Classroom;
  totalVotes: number;
  uniqueParticipants: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  resultsReleasedAt?: string;
  scheduledStartAt?: string;
}

export interface PollSettings {
  // Timing
  timeLimit?: number;           // seconds per question (quiz)
  globalTimerSecs?: number;     // whole poll timer
  // Participation
  allowAnonymous: boolean;
  requireLogin: boolean;
  maxResponses?: number;
  oneResponsePerUser: boolean;
  // Results
  showResultsLive: boolean;
  showCorrectAnswers: boolean;
  showKeySheetAfter: boolean;
  // Quiz
  shuffleOptions: boolean;
  shuffleQuestions: boolean;
  passingScore?: number;        // percentage
  pointsPerQuestion?: number;
  penaltyForWrong?: number;     // negative marking
  // Conduct
  preventTabSwitch: boolean;
  showProgressBar: boolean;
  allowReview: boolean;
  fullscreenMode?: boolean;
  negativeMarking?: boolean;
  penaltyPoints?: number;
  caseSensitive?: boolean;
}

// ── Attempt (student quiz response) ───────────────────────────────────────────
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface Attempt {
  id: string;
  pollId: string;
  poll?: Poll;
  userId?: string;
  user?: User;
  guestName?: string;
  guestEmail?: string;
  answers: AttemptAnswer[];
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  timeTaken?: number;           // seconds
  startedAt: string;
  submittedAt?: string;
  status: AttemptStatus;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;           // maps to Poll.id for single-q or option id for series
  selectedOptions: string[];
  textAnswer?: string;
  numericAnswer?: number;
  matrixAnswers?: Record<string, string>; // rowId → colId
  rankingOrder?: string[];
  heatmapX?: number;
  heatmapY?: number;
  isCorrect?: boolean;
  pointsEarned?: number;
  timeTaken?: number;
}

// ── Classroom ─────────────────────────────────────────────────────────────────
export interface Classroom {
  id: string;
  name: string;
  description?: string;
  code: string;
  inviteCode: string;
  subject?: string;
  teacherId: string;
  teacher?: User;
  students?: User[];
  studentCount: number;
  pollCount: number;
  avgScore?: number;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotifType =
  | 'result_released' | 'poll_started' | 'poll_closed'
  | 'classroom_invite' | 'quiz_graded'  | 'announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface OptionStat {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface PollAnalytics {
  pollId: string;
  poll?: Poll;
  totalAttempts: number;
  completedAttempts: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  averageTimeSecs?: number;
  passRate?: number;
  optionStats: OptionStat[];
  scoreDistribution?: { range: string; count: number }[];
  topStudents?: { name: string; score: number; rank: number }[];
  questionAnalysis?: QuestionAnalysis[];
  hourlyActivity?: { hour: string; count: number }[];
}

export interface QuestionAnalysis {
  questionId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correctRate: number;
  avgTimeSecs: number;
  optionStats: OptionStat[];
}

// ── API helpers ───────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
