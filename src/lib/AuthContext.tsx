import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from './supabase';
import { getAccessToken, setAccessToken, restoreTokenFromCookie } from './authToken';
import { logger } from './logger';

type AppStage = 'landing' | 'auth' | 'onboarding' | 'main';

interface AuthContextValue {
  user: UserProfile | null;
  appStage: AppStage;
  isPremium: boolean;
  streakDays: number;
  updateUserProfile: (profile: UserProfile) => void;
  logout: () => void;
  setAppStage: (stage: AppStage) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function asStudentRole(role: string): 'student' | 'admin' {
  return role === 'admin' ? 'admin' : 'student';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appStage, setAppStageState] = useState<AppStage>('landing');

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = await restoreTokenFromCookie();
      if (!token || cancelled) return;

      try {
        const verifyRes = await db.verifyToken();
        if (!verifyRes?.success || cancelled) return;

        const email = verifyRes.user.email;
        const profile = await db.getStudentProfile(email);
        if (cancelled) return;

        if (profile) {
          const profileWithRole = { ...profile, role: asStudentRole(verifyRes.user.role || 'student') };
          setUser(profileWithRole);
          setAppStageState('main');
        } else {
          setUser({
            email,
            name: verifyRes.user.name,
            role: asStudentRole(verifyRes.user.role || 'student'),
            stream: 'Natural Science',
            streakDays: 0,
            dailyQuestionsUsed: 0,
            dailyQuestionsCap: 10,
            isPremium: false,
            examReadinessScore: 0,
            subjectsPerformance: {},
            savedQuestionIds: [],
            completedMockIds: [],
          });
          setAppStageState('onboarding');
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const setAppStage = useCallback((stage: AppStage) => {
    setAppStageState(stage);
  }, []);

  const updateUserProfile = useCallback((updated: UserProfile) => {
    setUser(updated);
    db.saveStudentProfile(updated).catch((err) => {
      logger.error('Failed to save profile', err, { email: updated.email });
    });
  }, []);

  const logout = useCallback(() => {
    db.logout().catch((err) => {
      logger.error('Logout cleanup failed', err);
    });
    setUser(null);
    setAppStageState('landing');
    setAccessToken(null);
  }, []);

  const value = useMemo(() => ({
    user,
    appStage,
    isPremium: user?.isPremium || false,
    streakDays: user?.streakDays || 0,
    updateUserProfile,
    logout,
    setAppStage,
  }), [user, appStage, updateUserProfile, logout, setAppStage]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
