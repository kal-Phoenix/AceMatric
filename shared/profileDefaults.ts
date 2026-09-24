export interface DefaultProfileParams {
  email: string;
  name: string;
  stream?: string;
  role?: 'student' | 'admin';
  avatarUrl?: string;
}

export interface DefaultProfile {
  email: string;
  name: string;
  stream: string;
  isPremium: boolean;
  streakDays: number;
  dailyQuestionsUsed: number;
  dailyQuestionsCap: number;
  examReadinessScore: number;
  subjectsPerformance: Record<string, number>;
  savedQuestionIds: string[];
  completedMockIds: string[];
  telegramConnected: boolean;
  studyStyle: string;
  dailyHours: number;
  avatar: string;
  bio: string;
  school: string;
  region: string;
  customRoadmap: string;
  weakSubjects: string[];
  targetScore: number;
  role: 'student' | 'admin';
  dailyProgressDate: string;
  studiedChapters: string[];
  proStudyAudit: string;
  activeGrade: number;
}

export function createDefaultProfile(params: DefaultProfileParams): DefaultProfile {
  const { email, name, stream, role, avatarUrl } = params;
  return {
    email,
    name,
    stream: stream || 'Natural Science',
    isPremium: false,
    streakDays: 0,
    dailyQuestionsUsed: 0,
    dailyQuestionsCap: 10,
    examReadinessScore: 0,
    subjectsPerformance: {},
    savedQuestionIds: [],
    completedMockIds: [],
    telegramConnected: false,
    studyStyle: 'Practice / Quiz',
    dailyHours: 3,
    avatar: avatarUrl || '🎓',
    bio: '',
    school: 'Ethiopian School',
    region: 'Addis Ababa',
    customRoadmap: '',
    weakSubjects: ['Physics', 'Mathematics'],
    targetScore: 520,
    role: role || 'student',
    dailyProgressDate: '',
    studiedChapters: [],
    proStudyAudit: '',
    activeGrade: 12,
  };
}
