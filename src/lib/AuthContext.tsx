import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from './supabase';
import { setAccessToken, restoreTokenFromCookie } from './authToken';
import { consumeOAuthNewUserFlag } from '../components/AuthCallback';
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

    // OAuth failures land on /?error=... — surface them on the auth screen
    // instead of silently showing the landing page.
    const oauthError = new URLSearchParams(window.location.search).get('error');

    async function restoreSession() {
      const { getAccessToken } = await import('./authToken');
      let token = getAccessToken();
      if (!token) {
        token = await restoreTokenFromCookie();
      }
      if (cancelled) return;

      if (!token) {
        if (oauthError) setAppStageState('auth');
        return;
      }

      try {
        const verifyRes = await db.verifyToken();
        if (!verifyRes?.success || cancelled) return;

        const email = verifyRes.user.email;
        const profile = await db.getStudentProfile(email);
        if (cancelled) return;

        if (profile) {
          const profileWithRole = { ...profile, role: asStudentRole(verifyRes.user.role || 'student') };
          setUser(profileWithRole);
          setAppStageState(consumeOAuthNewUserFlag() ? 'onboarding' : 'main');
        } else {
          setUser({
            email,
            name: verifyRes.user.name,
            role: asStudentRole(verifyRes.user.role || 'student'),
            stream: 'Natural Science',
            streakDays: 0,
            dailyQuestionsUsed: 0,
            dailyQuestionsCap: 10,
            isPremium: true, // PAYMENTS DISABLED — everything is free
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

    const handleAuthChange = () => {
      restoreSession();
    };
    window.addEventListener('acematric_auth_change', handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener('acematric_auth_change', handleAuthChange);
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
    isPremium: true, // PAYMENTS DISABLED — everyone has Pro for now
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
