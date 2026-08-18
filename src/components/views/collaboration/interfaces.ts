export interface ChatMessage {
  id: string;
  name: string;
  email: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface Member {
  email: string;
  name: string;
  avatar: string;
  stream: string;
  activeChannel?: string;
  voiceChannel?: string | null;
  isMuted?: boolean;
  isDeafened?: boolean;
  videoEnabled?: boolean;
}

export interface RoomInfo {
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
  joinRequests: {
    email: string;
    name: string;
    avatar: string;
    stream: string;
    requestedAt: string;
  }[];
}

export interface CoStudyingPartner {
  email: string;
  name: string;
  avatar: string;
  isMe: boolean;
  videoEnabled: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  subject: string;
  status: string;
  stream: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  setter: string;
}

export interface TimerState {
  isPlaying: boolean;
  timeLeft: number;
  duration: number;
  lastUpdated: number;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface ActiveQuiz {
  id: string;
  questionId: string;
  questionText: string;
  options: QuizOption[];
  endTime: number;
}

export interface QuizScore {
  name: string;
  selectedOptionId: string;
  isCorrect: boolean;
}
