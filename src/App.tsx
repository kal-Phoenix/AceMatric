import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthCallback from './components/AuthCallback';
import {
  Target,
  Clock,
  MessageSquare,
  BarChart3,
  Award,
  Zap,
  GraduationCap,
  Trophy,
  Users,
} from 'lucide-react';
import { Stream, Language, Subject, SessionHistoryEntry, UserProfile } from './types';
import { db } from './lib/supabase';
import { useAuth } from './lib/AuthContext';
import { useTheme } from './lib/ThemeContext';
import Footer from './components/Footer';
import AppShell from './components/AppShell';
import MobileShell from './components/MobileShell';
import ErrorBoundary from './components/ErrorBoundary';
import { useToast, useLiveNotifications } from './hooks';
import { useNavigationState, TAB_ROUTES } from './hooks/useNavigationState';
import { useIsMobile } from './hooks/useIsMobile';
import type { TabId } from './hooks/useNavigationState';
import { createDefaultProfile } from '../shared/profileDefaults';
import { logger } from './lib/logger';
import Toast from './components/Toast';

const DashboardView = lazy(() => import('./components/views/DashboardView'));
const StudyView = lazy(() => import('./components/views/StudyView'));
const PracticeView = lazy(() => import('./components/views/PracticeView'));
const SimulatorView = lazy(() => import('./components/views/SimulatorView'));
const LeaderboardView = lazy(() => import('./components/views/LeaderboardView'));
const CollaborationView = lazy(() => import('./components/views/CollaborationView'));
const ProfileView = lazy(() => import('./components/views/ProfileView'));
const AuthScreenView = lazy(() => import('./components/views/AuthScreenView'));
const OnboardingRoadmapView = lazy(() => import('./components/views/OnboardingRoadmapView'));
const ContactUsView = lazy(() => import('./components/views/ContactUsView'));
const PrivacyPolicyView = lazy(() => import('./components/views/PrivacyPolicyView'));
const TermsOfServiceView = lazy(() => import('./components/views/TermsOfServiceView'));
const AboutView = lazy(() => import('./components/views/AboutView'));
const FAQView = lazy(() => import('./components/views/FAQView'));
const NotFoundView = lazy(() => import('./components/views/NotFoundView'));
const LandingView = lazy(() => import('./components/views/LandingView'));
const ProUpgradeView = lazy(() => import('./components/views/ProUpgradeView'));
const AdminConsoleView = lazy(() => import('./components/views/AdminConsoleView'));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, appStage, isPremium, streakDays, updateUserProfile, logout, setAppStage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const initialTab = (Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === location.pathname) || 'dashboard') as TabId;
  const nav = useNavigationState(initialTab);

  const [stream, setStream] = useState<Stream>('Natural Science');
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('acematric-language');
      if (stored === 'en' || stored === 'am') return stored;
    } catch {}
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('acematric-language', lang);
    } catch {}
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
    document.documentElement.classList.toggle('lang-am', lang === 'am');
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'am' ? 'am' : 'en';
    document.documentElement.classList.toggle('lang-am', language === 'am');
  }, [language]);

  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([]);
  const [usedQuestionsCount, setUsedQuestionsCount] = useState<number>(() => {
    const today = new Date().toDateString();
    if (user?.dailyProgressDate === today) {
      return user?.dailyQuestionsUsed || 0;
    }
    return 0;
  });
  const dailyCap = 10;

  const { toast, showGlobalToast, dismissToast } = useToast();

  const {
    notifications,
    isNotificationOpen,
    setIsNotificationOpen,
    unreadCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
  } = useLiveNotifications(user?.email, showGlobalToast);

  // Sync stream from user profile
  useEffect(() => {
    if (user?.stream) setStream(user.stream);
  }, [user?.stream]);

  // Handle OAuth error redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      const messages: Record<string, string> = {
        google_cancelled: 'Google sign-in was cancelled.',
        google_no_email: 'Google did not provide an email address.',
        google_signup_failed: 'Failed to create account with Google.',
        google_profile_failed: 'Failed to set up your profile.',
        google_session_failed: 'Failed to create session.',
        google_auth_config: 'Google sign-in is not configured. Contact support.',
        google_auth_failed: 'Google sign-in failed. Please try again.',
      };
      showGlobalToast(messages[error] || 'Authentication failed. Please try again.', 'warning');
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  // Fetch session history once on login
  useEffect(() => {
    if (user?.email) {
      let cancelled = false;
      db.getSessionHistory().then(data => {
        if (!cancelled && data.length > 0) setSessionHistory(data);
      }).catch((err) => {
        logger.error('Failed to fetch session history', err, { email: user.email });
      });
      return () => { cancelled = true; };
    }
  }, [user?.email]);

  // Sync active tab from URL
  useEffect(() => {
    const path = location.pathname;
    const matched = Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === path);
    if (matched && matched !== nav.state.activeTab) {
      nav.setTab(matched as TabId);
    } else if (!matched && path !== '/' && appStage === 'main') {
      nav.setTab('404');
    }
  }, [location.pathname]);

  const handleTabChange = useCallback((tab: string) => {
    nav.setTab(tab as TabId);
    const route = TAB_ROUTES[tab] || '/';
    if (location.pathname !== route) {
      navigate(route);
    }
  }, [nav.setTab, navigate, location.pathname]);

  const handleUpdateUserProfile = useCallback((updatedUser: UserProfile) => {
    updateUserProfile(updatedUser);
  }, [updateUserProfile]);

  const addHistoryEntry = useCallback((entry: Omit<SessionHistoryEntry, 'id' | 'date'>) => {
    const newEntry: SessionHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setSessionHistory(prev => [newEntry, ...prev]);
    if (user?.email) {
      db.addSessionHistory(entry).catch((err) => {
        logger.error('Failed to add session history', err, { email: user.email });
      });
    }
  }, [user?.email]);

  const handleClearHistory = useCallback(() => {
    setSessionHistory([]);
    if (user?.email) {
      db.clearSessionHistory().catch((err) => {
        logger.error('Failed to clear session history', err, { email: user.email });
      });
    }
  }, [user?.email]);

  const handleIncrementUsage = useCallback(() => {
    if (isPremium || usedQuestionsCount < dailyCap) {
      const next = usedQuestionsCount + 1;
      setUsedQuestionsCount(next);
      if (user?.email) {
        db.consumeDailyQuestions(1).then((result) => {
          if (!result) return;
          setUsedQuestionsCount(result.used);
          if (!result.allowed) {
            handleTabChange('upgrade');
          }
        }).catch((err) => {
          logger.error('Failed to record question usage', err, { email: user.email });
        });
      }
      return true;
    }
    handleTabChange('upgrade');
    return false;
  }, [isPremium, usedQuestionsCount, user?.email, handleTabChange]);

  // Bulk usage (e.g. daily challenge completion counts several questions).
  const handleConsumeUsage = useCallback((count: number) => {
    if (!user?.email) return;
    db.consumeDailyQuestions(count).then((result) => {
      if (!result) return;
      setUsedQuestionsCount(result.used);
      if (!result.allowed) {
        handleTabChange('upgrade');
      }
    }).catch((err) => {
      logger.error('Failed to record question usage', err, { email: user.email });
    });
  }, [user?.email, handleTabChange]);

  const handleStartMockFromDashboard = useCallback((mockId: string) => {
    nav.startMock(mockId);
  }, [nav.startMock]);

  const handleCompleteMock = useCallback((_mockId: string, pct: number, mockTitle?: string) => {
    addHistoryEntry({
      type: 'simulation',
      subject: mockTitle || 'National Exam Simulation',
      score: pct,
      total: 100,
      durationMinutes: 120,
    });
  }, [addHistoryEntry]);

  const handleCompletePractice = useCallback((subject: Subject, chapter: string, correct: number, total: number, durationMinutes: number) => {
    addHistoryEntry({ type: 'practice', subject, chapter, score: correct, total, durationMinutes });
  }, [addHistoryEntry]);

  const handleCompleteStudy = useCallback((subject: string, chapterName: string, durationMinutes: number) => {
    addHistoryEntry({ type: 'study', subject, chapter: chapterName, durationMinutes });
  }, [addHistoryEntry]);

  const handleOpenStudyNoteFromDashboard = useCallback((noteId: string) => {
    nav.openStudyNote(noteId);
  }, [nav.openStudyNote]);

  const VALID_SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Economics', 'History', 'Geography', 'SAT'];

  const handleJumpToExplainer = useCallback((qText: string, subj: string) => {
    const subject = VALID_SUBJECTS.includes(subj as Subject) ? (subj as Subject) : 'Physics';
    nav.jumpToExplainer(qText, subject);
  }, [nav.jumpToExplainer]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const isAdmin = user?.role === 'admin';
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', fullLabel: 'Roadmap & Diagnostic Hub', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'study', label: 'Study Hub', fullLabel: 'AI Study & Prep Hub', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> },
    { id: 'practice', label: 'Practice', fullLabel: 'Interactive Practice Arena', icon: <Target className="w-4 h-4" /> },
    { id: 'simulator', label: 'Past Exams', fullLabel: 'Past Exam Papers', icon: <Clock className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Ranks', fullLabel: 'National Matric Leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { id: 'collaboration', label: 'Study Rooms', fullLabel: 'Real-time Collaborative Rooms', icon: <Users className="w-4 h-4 text-indigo-400" /> },
    { id: 'upgrade', label: 'Pro Upgrade', fullLabel: 'CBE / Telebirr Pro Upgrade', icon: <Zap className="w-4 h-4 text-emerald-400 animate-pulse" /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', fullLabel: 'Admin Console', icon: <Award className="w-4 h-4 text-blue-400 font-bold" /> }] : []),
    { id: 'contact', label: 'Help', fullLabel: 'Help & Support', icon: <MessageSquare className="w-4 h-4 text-cyan-400" /> },
  ], [isAdmin]);

  if (appStage === 'landing') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ViewLoader />}>
          <LandingView onGetStarted={() => setAppStage('auth')} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (appStage === 'auth') {
    return (
      <ErrorBoundary>
        <div className="bg-[#0A0E14] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden">
          <Suspense fallback={<ViewLoader />}>
            <AuthScreenView
              language={language}
              onLanguageChange={setLanguage}
              onAuthComplete={async (userData) => {
                if (userData.isNewUser) {
                  const newUser = createDefaultProfile({ email: userData.email, name: userData.name, stream: userData.stream, role: userData.role as 'student' | 'admin' });
                  handleUpdateUserProfile(newUser as UserProfile);
                  setAppStage('onboarding');
                } else {
                  const existingProfile = await db.getStudentProfile(userData.email);
                  if (existingProfile) {
                    const profileWithRole = { ...existingProfile, role: (userData.role || 'student') as 'student' | 'admin' };
                    handleUpdateUserProfile(profileWithRole);
                    setAppStage('main');
                  } else {
                    const newUser = createDefaultProfile({ email: userData.email, name: userData.name, stream: userData.stream, role: userData.role as 'student' | 'admin' });
                    handleUpdateUserProfile(newUser as UserProfile);
                    setAppStage('onboarding');
                  }
                }
              }}
            />
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  if (appStage === 'onboarding') {
    return (
      <ErrorBoundary>
        <div className="bg-[#0A0E14] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden p-4 sm:p-8">
          <Suspense fallback={<ViewLoader />}>
            <OnboardingRoadmapView
              stream={stream}
              language={language}
              userName={user?.name || 'Scholar'}
              userProfile={user}
              onComplete={(onboardingData) => {
                const updatedUser: UserProfile = {
                  ...(user as UserProfile),
                  targetScore: onboardingData.targetScore,
                  dailyHours: onboardingData.dailyHours,
                  studyStyle: onboardingData.studyStyle as UserProfile['studyStyle'],
                  weakSubjects: onboardingData.weakSubjects,
                  customRoadmap: onboardingData.customRoadmap,
                  school: onboardingData.school,
                  region: onboardingData.region,
                  bio: onboardingData.bio,
                };
                handleUpdateUserProfile(updatedUser);
                setAppStage('main');
              }}
            />
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  const ShellComponent = isMobile ? MobileShell : AppShell;

  return (
    <>
      <ShellComponent
        navItems={navItems}
        activeTab={nav.state.activeTab}
        onTabChange={handleTabChange}
        stream={stream}
        isPremium={isPremium}
        user={user}
        onLogout={handleLogout}
        onOpenUpgrade={() => handleTabChange('upgrade')}
        onOpenChapa={() => handleTabChange('upgrade')}
        notifications={notifications}
        unreadCount={unreadCount}
        isNotificationOpen={isNotificationOpen}
        onNotificationToggle={() => setIsNotificationOpen(!isNotificationOpen)}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNotificationAction={(url) => handleTabChange(url)}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        <ErrorBoundary>
          <Suspense fallback={<ViewLoader />}>
            {nav.state.activeTab === 'practice' && (
              <PracticeView
                stream={stream}
                language={language}
                dailyUsed={usedQuestionsCount}
                dailyCap={dailyCap}
                isPremium={isPremium}
                onIncrementUsage={handleIncrementUsage}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onJumpToExplainer={handleJumpToExplainer}
                onNavigate={handleTabChange}
                initialSubject={nav.state.practiceSubject}
                initialAutoStart={nav.state.practiceAutoStart}
                onClearInitial={nav.clearPracticeInitial}
                onCompletePractice={handleCompletePractice}
              />
            )}

            {nav.state.activeTab === 'simulator' && (
              <SimulatorView
                stream={stream}
                language={language}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onCompleteMock={handleCompleteMock}
                onJumpToExplainer={handleJumpToExplainer}
                initialMockId={nav.state.initialMockId}
              />
            )}

            {nav.state.activeTab === 'dashboard' && (
              <DashboardView
                stream={stream}
                language={language}
                streakDays={streakDays}
                readinessScore={user?.examReadinessScore || 0}
                subjectPerformance={user?.subjectsPerformance || {}}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onTabChange={handleTabChange}
                onStartLesson={handleOpenStudyNoteFromDashboard}
                onStartMock={handleStartMockFromDashboard}
                onStartFocusedStudy={(subj) => nav.startPractice(subj, true)}
                user={user}
                onProfileUpdate={handleUpdateUserProfile}
                onConsumeUsage={handleConsumeUsage}
                sessionHistory={sessionHistory}
                onClearHistory={handleClearHistory}
              />
            )}

            {nav.state.activeTab === 'study' && (
              <StudyView
                activeSubTab={nav.state.studySubTab}
                onSubTabChange={nav.setStudySubTab}
                stream={stream}
                language={language}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onJumpToExplainer={handleJumpToExplainer}
                initialNoteId={nav.state.initialNoteId}
                explainerQuery={nav.state.explainerQuery}
                explainerSubj={nav.state.explainerSubj}
                onClearExplainerInitial={nav.clearExplainer}
                onCompleteStudy={handleCompleteStudy}
                sessionHistory={sessionHistory}
                showToast={showGlobalToast}
              />
            )}

            {nav.state.activeTab === 'leaderboard' && (
              <LeaderboardView stream={stream} language={language} userProfile={user} />
            )}

            {nav.state.activeTab === 'collaboration' && (
              <CollaborationView
                userProfile={user}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                showToast={showGlobalToast}
              />
            )}

            {nav.state.activeTab === 'profile' && (
              <ProfileView
                stream={stream}
                onStreamChange={setStream}
                language={language}
                onLanguageChange={setLanguage}
                userProfile={user}
                onProfileUpdate={handleUpdateUserProfile}
                theme={theme}
                onThemeToggle={toggleTheme}
                sessionHistory={sessionHistory}
                onTabChange={handleTabChange}
              />
            )}

            {nav.state.activeTab === 'upgrade' && <ProUpgradeView isPremium={isPremium} />}
            {nav.state.activeTab === 'admin' && <AdminConsoleView currentAdminEmail={user?.email} />}
            {nav.state.activeTab === 'contact' && <ContactUsView userName={user?.name} userEmail={user?.email} />}
            {nav.state.activeTab === 'privacy' && <PrivacyPolicyView onBack={() => handleTabChange('dashboard')} />}
            {nav.state.activeTab === 'terms' && <TermsOfServiceView onBack={() => handleTabChange('dashboard')} />}
            {nav.state.activeTab === 'about' && <AboutView onBack={() => handleTabChange('dashboard')} />}
            {nav.state.activeTab === 'faq' && <FAQView onBack={() => handleTabChange('dashboard')} onNavigate={handleTabChange} />}
            {nav.state.activeTab === '404' && <NotFoundView onNavigate={handleTabChange} />}
          </Suspense>
        </ErrorBoundary>

        <Footer language={language} onLanguageChange={setLanguage} onNavigate={handleTabChange} />
      </ShellComponent>

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
