export type { ChatMessage, TimerState, GoalItem as Goal, RoomListItem as RoomInfo } from '../../../types';
export type { JoinRequest } from '../../../types';

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
  studyStatus?: string;
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
