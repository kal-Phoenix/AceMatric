export type Language = 'en' | 'am';
export type Stream = 'Natural Science' | 'Social Science';

export type Subject =
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Mathematics'
  | 'English'
  | 'SAT'
  | 'History'
  | 'Geography'
  | 'Economics';

export interface QuestionOption {
  id: string;
  text: string;
  textAmharic?: string;
}

export interface PracticeQuestion {
  id: string;
  subject: Subject;
  stream: Stream | 'Common';
  chapter: string;
  yearEC: string;
  passage?: string;
  questionText: string;
  hasImage?: boolean;
  imagePlaceholder?: string;
  questionTextAmharic?: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  explanationAmharic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType?: 'practice' | 'past_exam';
}

export interface MockExam {
  id: string;
  title: string;
  titleAmharic?: string;
  stream: Stream;
  subject: Subject | 'Full National Exam';
  durationMinutes: number;
  totalQuestions: number;
  questionIds: string[];
}

export interface StudyNote {
  id: string;
  subject: Subject;
  stream: Stream | 'Common';
  chapter: string;
  title: string;
  titleAmharic?: string;
  summary: string;
  summaryAmharic?: string;
  youtubeVideoId: string;
  videoDuration: string;
  formulaSheet: {
    name: string;
    formula: string;
    description: string;
  }[];
}

export interface UserProfile {
  name: string;
  email?: string;
  role?: 'student' | 'admin';
  grade?: string;
  stream: Stream;
  language?: Language;
  isDarkMode?: boolean;
  isOfflineMode?: boolean;
  streakDays: number;
  dailyQuestionsUsed: number;
  dailyQuestionsCap: number;
  isPremium: boolean;
  premiumExpiresAt?: string;
  examReadinessScore: number;
  subjectsPerformance: Record<string, number>;
  savedQuestionIds: string[];
  completedMockIds: string[];
  completedMilestones?: string[];
  telegramConnected?: boolean;
  studyStyle?: 'Visual / Video' | 'Practice / Quiz' | 'Reading & Summaries' | 'Collaborative';
  dailyHours?: number;
  avatar?: string;
  bio?: string;
  school?: string;
  region?: string;
  customRoadmap?: string;
  weakSubjects?: Subject[];
  targetScore?: number;
  studyTimeOfDay?: string;
  examFocusStrategy?: string;
  biggestChallenge?: string;
  mockFrequency?: string;
  preparationLevel?: string;
  dailyProgressDate?: string;
  studiedChapters?: string[];
  proStudyAudit?: string;
  activeGrade?: number;
  xp?: number;
  videoWatchHistory?: Record<string, number>;
}

export interface SessionHistoryEntry {
  id: string;
  type: 'study' | 'practice' | 'simulation';
  subject: string;
  chapter?: string;
  score?: number;
  total?: number;
  durationMinutes: number;
  date: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface ApiSuccessResponse<T = Record<string, never>> {
  success: true;
  data?: T;
}

export interface ApiErrorResponse {
  error: string;
}

export type ApiResponse<T = Record<string, never>> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthSignupResponse {
  success: true;
  profile: UserProfile;
  token: string;
}

export interface AuthSigninResponse {
  success: true;
  profile: UserProfile;
  token: string;
}

export interface AuthMessageResponse {
  success: true;
  message: string;
}

export interface AuthVerifyResponse {
  success: true;
  user: { email: string; name: string; role?: string };
}

export type NotificationType = 'challenge' | 'mock' | 'achievement' | 'study_group' | 'info';

export interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  userEmail: string;
}

export interface DailyProgress {
  questions: PracticeQuestion[];
  currentIndex: number;
  selectedOptionId: string | null;
  isAnswerChecked: boolean;
  correctAnswersCount: number;
  completed: boolean;
}

export interface ChapterContent {
  title: string;
  overview: string;
  corePoints: string[];
  examTips: string;
  youtubeVideoId: string;
  videoDuration: string;
  materials: Array<{ name: string; formula: string; description: string }>;
  subtopics: Array<{ title: string; content: string }>;
  contentHtml?: string;
}

export interface AiResponse {
  explanation?: string;
  plan?: string;
  reply?: string;
  audit?: string;
}

export type PaymentMethod = 'cbe' | 'telebirr' | 'abyssinia';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  userEmail: string;
  userName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionRef: string;
  screenshotUrl: string;
  status: PaymentStatus;
  adminNotes: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface JoinRequest {
  email: string;
  name: string;
  avatar: string;
  stream: string;
  requestedAt: string;
}

export interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
  setter: string;
}

export interface ChatMessage {
  id: string;
  name: string;
  email: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface TimerState {
  isPlaying: boolean;
  timeLeft: number;
  duration: number;
  lastUpdated: number;
}

export interface RoomListItem {
  id: string;
  name: string;
  activeCount: number;
  lastMessage: string;
  creatorEmail: string;
  subject: string;
  description: string;
  createdAt: string;
  goalsCount: number;
  completedGoalsCount: number;
  allowedEmails: string[];
  joinRequests: JoinRequest[];
}

export interface RoomMember {
  email: string;
  name: string;
  avatar: string;
  stream: string;
  x?: number;
  y?: number;
  activeChannel?: string;
  voiceChannel?: string | null;
  isMuted?: boolean;
  isDeafened?: boolean;
  videoEnabled?: boolean;
  studyStatus?: string;
}

export interface RoomState {
  name: string;
  members: Record<string, RoomMember>;
  messages: ChatMessage[];
  canvasState: unknown[];
  activeQuiz: unknown | null;
  creatorEmail: string;
  subject: string;
  description: string;
  createdAt: string;
  goals: GoalItem[];
  sharedNotes: string;
  timerState: TimerState;
  allowedEmails?: string[];
  joinRequests?: JoinRequest[];
}

export interface FormulaOrKeyTerm {
  name: string;
  formula?: string;
  description: string;
}

export interface PracticeProblem {
  question: string;
  options: string[];
  answer: string;
  solution: string;
}

export interface SubTopicInfo {
  title: string;
  content: string;
  examInsight: string;
  imageUrl?: string;
  imageCaption?: string;
  practiceProblems?: PracticeProblem[];
}

export interface ChapterStudyMaterial {
  title: string;
  overview: string;
  corePoints: string[];
  examTips: string;
  youtubeVideoId: string;
  videoDuration: string;
  materials: FormulaOrKeyTerm[];
  subtopics: SubTopicInfo[];
  contentHtml?: string;
}

export interface LeaderboardEntry {
  email: string;
  name: string;
  avatar: string;
  stream: string;
  examReadinessScore: number;
  streakDays: number;
  rank: number;
}

export interface AdminAnalyticsUser {
  email: string;
  sessions: number;
}

export interface AdminAnalyticsDaily {
  date: string;
  activeUsers: number;
  totalSessions: number;
}

export interface AdminAnalyticsSubject {
  name: string;
  sessions: number;
  avgScore: number;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  totalStudents: number;
}

export interface AdminAnalyticsResponse {
  totalEvents: number;
  activeUsersWeekly: number;
  activeUsersToday: number;
  subjectPerformance: AdminAnalyticsSubject[];
  dailyActiveUsers: AdminAnalyticsDaily[];
  topUsers: AdminAnalyticsUser[];
}
