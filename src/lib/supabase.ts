import {
  ContactMessage,
  SessionHistoryEntry,
  PracticeQuestion,
  StudyNote,
  MockExam,
  UserProfile,
  AuthSignupResponse,
  AuthSigninResponse,
  AuthMessageResponse,
  AuthVerifyResponse,
  ServerNotification,
  DailyProgress,
  ChapterContent,
  AiResponse,
  RoomListItem,
  RoomState,
  PaymentRequest,
  PaymentMethod,
  LeaderboardResponse,
  AdminStats,
  AdminAnalyticsResponse,
} from '../types';

import { getAccessToken, setAccessToken } from './authToken';
import { logger } from './logger';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearAuthState(): void {
  setAccessToken(null);
  window.dispatchEvent(new Event('auth:unauthorized'));
}

let refreshPromise: Promise<string | null> | null = null;
let refreshCooldown: ReturnType<typeof setTimeout> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.token) {
        setAccessToken(data.token);
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    // Keep the promise cached briefly to prevent concurrent refresh attempts
    refreshCooldown = setTimeout(() => {
      refreshPromise = null;
      refreshCooldown = null;
    }, 1000);
  }
}

async function api<T = unknown>(path: string, options?: RequestInit, retries = 1): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
          ...options?.headers,
        },
        credentials: 'include',
      });

      if (res.status === 401) {
        const body = await res.json().catch(() => ({}));

        if (body.code === 'TOKEN_EXPIRED' && attempt === 0) {
          const newToken = await attemptTokenRefresh();
          if (newToken) {
            const retryRes = await fetch(path, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
                ...options?.headers,
              },
              credentials: 'include',
            });
            if (!retryRes.ok) {
              const err = await retryRes.json().catch(() => ({}));
              throw new Error(err.error || `Request failed (${retryRes.status})`);
            }
            return retryRes.json();
          }
        }

        clearAuthState();
        throw new Error('UNAUTHORIZED');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      return res.json();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message === 'UNAUTHORIZED' || attempt === retries) throw lastError;
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

export const db = {
  async signup(email: string, password: string, name: string, stream?: string): Promise<AuthSignupResponse> {
    return api<AuthSignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, stream }),
    });
  },

  async signin(email: string, password: string): Promise<AuthSigninResponse> {
    return api<AuthSigninResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      logger.error('Logout failed', err);
    }
    clearAuthState();
  },

  async forgotPassword(email: string): Promise<AuthMessageResponse> {
    return api<AuthMessageResponse>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<AuthMessageResponse> {
    return api<AuthMessageResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  async appleSignin(idToken: string, fullName?: string): Promise<AuthSigninResponse> {
    return api<AuthSigninResponse>('/api/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ idToken, fullName }),
    });
  },

  async verifyToken(): Promise<AuthVerifyResponse> {
    return api<AuthVerifyResponse>('/api/auth/verify-token', { method: 'POST' });
  },

  async saveStudentProfile(profile: UserProfile): Promise<{ success: true }> {
    return api<{ success: true }>('/api/profile', { method: 'POST', body: JSON.stringify(profile) });
  },

  async getStudentProfile(email: string): Promise<UserProfile | null> {
    try {
      return await api<UserProfile>(`/api/profile/${encodeURIComponent(email)}`);
    } catch {
      return null;
    }
  },

  async getSavedChapters(): Promise<string[]> {
    try {
      return await api<string[]>('/api/notes/saved-chapters');
    } catch {
      return [];
    }
  },

  async toggleSavedChapter(chapterKey: string): Promise<string[]> {
    return api<string[]>('/api/notes/saved-chapters', {
      method: 'POST',
      body: JSON.stringify({ chapterKey }),
    });
  },

  async getStudiedChapters(): Promise<string[]> {
    try {
      return await api<string[]>('/api/notes/studied-chapters');
    } catch {
      return [];
    }
  },

  async toggleStudiedChapter(chapterKey: string): Promise<string[]> {
    return api<string[]>('/api/notes/studied-chapters', {
      method: 'POST',
      body: JSON.stringify({ chapterKey }),
    });
  },

  async saveContactMessage(msg: ContactMessage): Promise<{ success: true }> {
    return api<{ success: true }>('/api/contact', { method: 'POST', body: JSON.stringify(msg) });
  },

  async getChapterContent(
    grade: number,
    subject: string,
    chapter: number,
  ): Promise<ChapterContent> {
    const params = new URLSearchParams({
      grade: String(grade),
      subject,
      chapter: String(chapter),
    });
    return api<ChapterContent>(`/api/content?${params.toString()}`);
  },

  async getSessionHistory(): Promise<SessionHistoryEntry[]> {
    try {
      return await api<SessionHistoryEntry[]>('/api/session-history');
    } catch {
      return [];
    }
  },

  async addSessionHistory(entry: Omit<SessionHistoryEntry, 'id' | 'date'>): Promise<SessionHistoryEntry> {
    return api<SessionHistoryEntry>('/api/session-history', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async clearSessionHistory(): Promise<void> {
    await api('/api/session-history', { method: 'DELETE' });
  },

  async getDailyProgress(stream: string, date: string): Promise<DailyProgress | null> {
    try {
      const params = new URLSearchParams({ stream, date });
      return await api<DailyProgress | null>(`/api/daily-progress?${params.toString()}`);
    } catch {
      return null;
    }
  },

  async saveDailyProgress(data: {
    stream: string;
    quizDate: string;
    questions: PracticeQuestion[];
    currentIndex: number;
    selectedOptionId: string | null;
    isAnswerChecked: boolean;
    correctAnswersCount: number;
    completed: boolean;
  }): Promise<{ success: true }> {
    return api<{ success: true }>('/api/daily-progress', { method: 'POST', body: JSON.stringify(data) });
  },

  async getQuestions(filters?: { subject?: string; stream?: string; questionType?: string }): Promise<PracticeQuestion[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.stream) params.set('stream', filters.stream);
      if (filters?.questionType) params.set('questionType', filters.questionType);
      const qs = params.toString();
      const res = await api<{ data: PracticeQuestion[] }>(`/api/questions${qs ? `?${qs}` : ''}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createQuestion(q: PracticeQuestion): Promise<{ success: true }> {
    return api<{ success: true }>('/api/questions', { method: 'POST', body: JSON.stringify(q) });
  },

  async updateQuestion(id: string, q: Partial<PracticeQuestion>): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/questions/${id}`, { method: 'PUT', body: JSON.stringify(q) });
  },

  async deleteQuestion(id: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/questions/${id}`, { method: 'DELETE' });
  },

  async getMockExams(filters?: { subject?: string; stream?: string }): Promise<MockExam[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.stream) params.set('stream', filters.stream);
      const qs = params.toString();
      return await api<MockExam[]>(`/api/mock-exams${qs ? `?${qs}` : ''}`);
    } catch {
      return [];
    }
  },

  async createMockExam(exam: MockExam): Promise<{ success: true }> {
    return api<{ success: true }>('/api/mock-exams', { method: 'POST', body: JSON.stringify(exam) });
  },

  async deleteMockExam(id: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/mock-exams/${id}`, { method: 'DELETE' });
  },

  async updateMockExam(id: string, exam: Partial<MockExam>): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/mock-exams/${id}`, { method: 'PUT', body: JSON.stringify(exam) });
  },

  async getPastExams(filters?: { subject?: string; yearEC?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.yearEC) params.set('yearEC', filters.yearEC);
      const qs = params.toString();
      return await api<any[]>(`/api/past-exam-manage/public${qs ? `?${qs}` : ''}`);
    } catch {
      return [];
    }
  },

  async getPastExamsManage(filters?: { subject?: string; grade?: number; yearEC?: string; status?: string; search?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.grade) params.set('grade', String(filters.grade));
      if (filters?.yearEC) params.set('yearEC', filters.yearEC);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return await api<any[]>(`/api/past-exam-manage/list${qs ? `?${qs}` : ''}`);
    } catch {
      return [];
    }
  },

  async getPastExamManage(id: string): Promise<any> {
    return api<any>(`/api/past-exam-manage/${id}`);
  },

  async getPastExamsManageStats(): Promise<{ total: number; published: number; draft: number; subjects: string[] }> {
    return api('/api/past-exam-manage/stats');
  },

  async savePastExam(exam: any): Promise<any> {
    return api<any>('/api/past-exam-manage/save', { method: 'POST', body: JSON.stringify(exam) });
  },

  async deletePastExam(id: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/past-exam-manage/${id}`, { method: 'DELETE' });
  },

  async duplicatePastExam(id: string, title?: string): Promise<any> {
    return api<any>('/api/past-exam-manage/duplicate', { method: 'POST', body: JSON.stringify({ id, title }) });
  },

  async getPastExamVersions(id: string): Promise<any[]> {
    return api<any[]>(`/api/past-exam-manage/${id}/versions`);
  },

  async getQuizzesManage(filters?: { subject?: string; grade?: number; status?: string; search?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.grade) params.set('grade', String(filters.grade));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return await api<any[]>(`/api/quiz-manage/list${qs ? `?${qs}` : ''}`);
    } catch {
      return [];
    }
  },

  async getQuizManage(subject: string, grade: number, chapter: number): Promise<any> {
    return api<any>(`/api/quiz-manage/${encodeURIComponent(subject)}/${grade}/${chapter}`);
  },

  async getQuizzesManageStats(): Promise<{ total: number; published: number; draft: number; subjects: string[] }> {
    return api('/api/quiz-manage/stats');
  },

  async saveQuiz(quiz: any): Promise<any> {
    return api<any>('/api/quiz-manage/save', { method: 'POST', body: JSON.stringify(quiz) });
  },

  async deleteQuiz(subject: string, grade: number, chapter: number): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/quiz-manage/${encodeURIComponent(subject)}/${grade}/${chapter}`, { method: 'DELETE' });
  },

  async getNotifications(email: string): Promise<ServerNotification[]> {
    try {
      return await api<ServerNotification[]>(`/api/notifications?email=${encodeURIComponent(email)}`);
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<{ success: true }> {
    return api<{ success: true }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async markAllNotificationsRead(email: string): Promise<{ success: true }> {
    return api<{ success: true }>('/api/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async createNotification(data: { title: string; message: string; type?: string; actionUrl?: string; userEmail?: string }): Promise<{ success: true; notification: ServerNotification }> {
    return api<{ success: true; notification: ServerNotification }>('/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGamification(xp: number, completedMilestones: string[]): Promise<{ success: true }> {
    return api<{ success: true }>('/api/profile/gamification', {
      method: 'POST',
      body: JSON.stringify({ xp, completedMilestones }),
    });
  },

  async getCollaborationRooms(): Promise<RoomListItem[]> {
    try {
      const data = await api<{ rooms: RoomListItem[] }>('/api/collaboration/rooms');
      return data.rooms || [];
    } catch {
      return [];
    }
  },

  async createCollaborationRoom(data: { name: string; subject: string; description: string; creatorEmail: string }): Promise<{ success: true; id: string; name: string; room: RoomState & { id: string } }> {
    return api('/api/collaboration/rooms/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async conceptExplainer(prompt: string, subject: string): Promise<AiResponse> {
    return api<AiResponse>('/api/ai/concept-explainer', {
      method: 'POST',
      body: JSON.stringify({ prompt, subject }),
    });
  },

  async studyPlan(profile: UserProfile): Promise<AiResponse> {
    return api<AiResponse>('/api/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify({
        targetScore: profile.targetScore,
        currentHours: profile.dailyHours,
        weakSubjects: profile.weakSubjects,
        stream: profile.stream,
        school: profile.school,
        region: profile.region,
        preparationLevel: profile.preparationLevel,
        studyStyle: profile.studyStyle,
        studyTimeOfDay: profile.studyTimeOfDay,
        examFocusStrategy: profile.examFocusStrategy,
        biggestChallenge: profile.biggestChallenge,
        mockFrequency: profile.mockFrequency,
      }),
    });
  },

  async askTutor(question: string, subject: string): Promise<AiResponse> {
    return api<AiResponse>('/api/ai/ask-tutor', {
      method: 'POST',
      body: JSON.stringify({ question, subject }),
    });
  },

  async getPaymentAccounts(): Promise<Record<string, { bank: string; accountName: string; accountNumber: string; note: string }>> {
    return api('/api/payments/accounts');
  },

  async submitPayment(paymentMethod: PaymentMethod, transactionRef: string, screenshot: File): Promise<{ success: true; payment: PaymentRequest }> {
    const formData = new FormData();
    formData.append('paymentMethod', paymentMethod);
    formData.append('transactionRef', transactionRef);
    formData.append('screenshot', screenshot);

    const res = await fetch('/api/payments/submit', {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
      credentials: 'include',
    });
    if (res.status === 401) {
      clearAuthState();
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Payment submission failed (${res.status})`);
    }
    return res.json();
  },

  async getMyPayments(): Promise<PaymentRequest[]> {
    try {
      return await api<PaymentRequest[]>('/api/payments/my');
    } catch {
      return [];
    }
  },

  async getAllPayments(status?: string): Promise<PaymentRequest[]> {
    try {
      const qs = status ? `?status=${status}` : '';
      return await api<PaymentRequest[]>(`/api/payments${qs}`);
    } catch {
      return [];
    }
  },

  async reviewPayment(id: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  async getLeaderboard(stream?: string): Promise<LeaderboardResponse> {
    try {
      const params = stream && stream !== 'All' ? `?stream=${encodeURIComponent(stream)}` : '';
      return await api<LeaderboardResponse>(`/api/leaderboard${params}`);
    } catch {
      return { leaderboard: [], currentUserRank: null, totalStudents: 0 };
    }
  },

  async getAdminStats(): Promise<AdminStats | null> {
    try {
      return await api<AdminStats>('/api/admin/stats');
    } catch {
      return null;
    }
  },

  async getAdminUsers(params?: { search?: string; stream?: string; page?: number; limit?: number }): Promise<{ users: any[]; total: number; page: number; pageSize: number }> {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.stream) qs.set('stream', params.stream);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return await api(`/api/admin/users${q ? '?' + q : ''}`);
    } catch {
      return { users: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  async setAdminUserRole(email: string, role: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/admin/users/${encodeURIComponent(email)}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async setAdminUserPremium(email: string, isPremium: boolean): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/admin/users/${encodeURIComponent(email)}/premium`, {
      method: 'PUT',
      body: JSON.stringify({ isPremium }),
    });
  },

  async deleteAdminUser(email: string): Promise<{ success: true }> {
    return api<{ success: true }>(`/api/admin/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  },

  async getContentManageList(filters?: { subject?: string; grade?: number; stream?: string; status?: string; search?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.grade) params.set('grade', String(filters.grade));
      if (filters?.stream) params.set('stream', filters.stream);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return await api(`/api/content-manage/list${qs ? `?${qs}` : ''}`);
    } catch {
      return [];
    }
  },

  async getContentManageStats(): Promise<{ total: number; published: number; draft: number; subjects: string[] }> {
    return api('/api/content-manage/stats');
  },

  async getContentManageEntry(subject: string, grade: number, chapter: number): Promise<any> {
    try {
      return await api(`/api/content-manage/${encodeURIComponent(subject)}/${grade}/${chapter}`);
    } catch {
      return null;
    }
  },

  async getContentManageVersions(subject: string, grade: number, chapter: number): Promise<any[]> {
    try {
      return await api(`/api/content-manage/${encodeURIComponent(subject)}/${grade}/${chapter}/versions`);
    } catch {
      return [];
    }
  },

  async saveContentManageEntry(entry: any): Promise<any> {
    return api('/api/content-manage/save', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async duplicateContentManage(subject: string, grade: number, chapter: number, newChapter: number): Promise<any> {
    return api('/api/content-manage/duplicate', {
      method: 'POST',
      body: JSON.stringify({ subject, grade, chapterNumber: chapter, newChapterNumber: newChapter }),
    });
  },

  async batchSaveContentManage(entries: any[]): Promise<{ saved: number; failed: number; total: number; errors: string[] }> {
    return api('/api/content-manage/batch-save', {
      method: 'POST',
      body: JSON.stringify({ items: entries }),
    });
  },

  async deleteContentManageEntry(subject: string, grade: number, chapter: number): Promise<{ success: true }> {
    return api(`/api/content-manage/${encodeURIComponent(subject)}/${grade}/${chapter}`, {
      method: 'DELETE',
    });
  },

  async trackEvent(eventType: string, subject?: string, score?: number, durationSeconds?: number, metadata?: Record<string, any>): Promise<{ success: true }> {
    return api<{ success: true }>('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType, subject, score, durationSeconds, metadata }),
    });
  },

  async getAnalyticsSummary(): Promise<{
    totalStudyMinutes: number;
    todayMinutes: number;
    weekMinutes: number;
    totalSessions: number;
    todaySessions: number;
    weekSessions: number;
    subjects: { name: string; sessions: number; avgScore: number; totalMinutes: number }[];
    eventTypes: Record<string, number>;
    dailyActivity: { date: string; sessions: number; minutes: number }[];
  }> {
    try {
      return await api('/api/analytics/summary');
    } catch {
      return {
        totalStudyMinutes: 0, todayMinutes: 0, weekMinutes: 0,
        totalSessions: 0, todaySessions: 0, weekSessions: 0,
        subjects: [], eventTypes: {}, dailyActivity: [],
      };
    }
  },

  async getAdminAnalytics(): Promise<AdminAnalyticsResponse> {
    try {
      return await api<AdminAnalyticsResponse>('/api/admin/analytics');
    } catch {
      return {
        totalEvents: 0, activeUsersWeekly: 0, activeUsersToday: 0,
        subjectPerformance: [], dailyActiveUsers: [], topUsers: [],
      };
    }
  },
};
