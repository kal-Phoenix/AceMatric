import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import { Stream, Language, Subject, SessionHistoryEntry } from './types';
import { db } from './lib/supabase';
import { useAuth } from './lib/AuthContext';
import { useTheme } from './lib/ThemeContext';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import { useToast, useLiveNotifications } from './hooks';
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
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}

const TAB_ROUTES: Record<string, string> = {
  dashboard: '/',
  study: '/study',
  practice: '/practice',
  simulator: '/simulator',
  leaderboard: '/leaderboard',
  collaboration: '/collaboration',
  upgrade: '/upgrade',
  admin: '/admin',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
  faq: '/faq',
  profile: '/profile',
};

function createDefaultProfile(userData: any) {
  return {
    name: userData.name,
    email: userData.email,
    stream: userData.stream,
    targetScore: userData.targetScore,
    role: userData.role || 'student',
    avatar: '🎓',
    school: 'Ethiopian School',
    region: 'Addis Ababa',
    bio: 'Consistency over intensity. Aiming for Top 1% national rank.',
    streakDays: 0,
    dailyQuestionsUsed: 0,
    dailyQuestionsCap: 10,
    isPremium: false,
    examReadinessScore: 0,
    subjectsPerformance: {},
    savedQuestionIds: [],
    completedMockIds: [],
    telegramConnected: false,
    studyStyle: 'Practice / Quiz',
    dailyHours: 3,
    customRoadmap: '',
    weakSubjects: ['Physics', 'Mathematics'],
  };
}

function MainApp() {
  const { user, appStage, isPremium, streakDays, updateUserProfile, logout, setAppStage } = useAuth();
  const { theme, toggleTheme, syncFromProfile } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [stream, setStream] = useState<Stream>('Natural Science');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = location.pathname.replace('/', '');
    return Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === location.pathname) || 'dashboard';
  });
  const [studySubTab, setStudySubTab] = useState<string>('learning');

  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  const [initialMockId, setInitialMockId] = useState<string | undefined>(undefined);
  const [initialNoteId, setInitialNoteId] = useState<string | undefined>(undefined);
  const [explainerQuery, setExplainerQuery] = useState<string | undefined>(undefined);
  const [explainerSubj, setExplainerSubj] = useState<Subject | undefined>(undefined);
  const [practiceSubject, setPracticeSubject] = useState<Subject | undefined>(undefined);
  const [practiceAutoStart, setPracticeAutoStart] = useState<boolean>(false);

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

  // Sync theme from user profile
  useEffect(() => {
    if (user) syncFromProfile(user.isDarkMode !== false);
  }, [user?.isDarkMode]);

  // Fetch session history once on login
  useEffect(() => {
    if (user?.email) {
      let cancelled = false;
      db.getSessionHistory().then(data => {
        if (!cancelled && data.length > 0) setSessionHistory(data);
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [user?.email]);

  // Sync stream from user profile
  useEffect(() => {
    const path = location.pathname;
    const matched = Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === path);
    if (matched && matched !== activeTab) {
      setActiveTab(matched);
    }
  }, [location.pathname]);

  useEffect(() => {
    const route = TAB_ROUTES[activeTab] || '/';
    if (location.pathname !== route) {
      navigate(route);
    }
  }, [activeTab]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    navigate(TAB_ROUTES[tab] || '/');
  }, [navigate]);

  const handleUpdateUserProfile = useCallback((updatedUser: any) => {
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
      db.addSessionHistory(entry).catch(() => {});
    }
  }, [user?.email]);

  const handleClearHistory = useCallback(() => {
    setSessionHistory([]);
    if (user?.email) {
      db.clearSessionHistory().catch(() => {});
    }
  }, [user?.email]);

  const handleIncrementUsage = useCallback(() => {
    if (isPremium || usedQuestionsCount < dailyCap) {
      const next = usedQuestionsCount + 1;
      setUsedQuestionsCount(next);
      if (user?.email) {
        const today = new Date().toDateString();
        db.saveStudentProfile({
          ...user,
          dailyQuestionsUsed: next,
          dailyProgressDate: today,
        }).catch(() => {});
      }
      return true;
    }
    handleTabChange('upgrade');
    return false;
  }, [isPremium, usedQuestionsCount, user?.email, handleTabChange]);

  const handleStartMockFromDashboard = useCallback((mockId: string) => {
    setInitialMockId(mockId);
    handleTabChange('simulator');
  }, [handleTabChange]);

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
    setInitialNoteId(noteId);
    setStudySubTab('learning');
    handleTabChange('study');
  }, [handleTabChange]);

  const handleJumpToExplainer = useCallback((qText: string, subj: any) => {
    setExplainerQuery(qText);
    setExplainerSubj((['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Economics', 'History', 'Geography', 'SAT'].includes(subj) ? subj : 'Physics') as Subject);
    setStudySubTab('explainer');
    handleTabChange('study');
  }, [handleTabChange]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  useEffect(() => {
    if (activeTab !== 'simulator' && initialMockId) {
      setInitialMockId(undefined);
    }
  }, [activeTab, initialMockId]);

  const isAdmin = user?.role === 'admin';
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', fullLabel: 'Roadmap & Diagnostic Hub', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'study', label: 'Study Hub', fullLabel: 'AI Study & Prep Hub', icon: <GraduationCap className="w-4 h-4 text-teal-400" /> },
    { id: 'practice', label: 'Practice', fullLabel: 'Interactive Practice Arena', icon: <Target className="w-4 h-4" /> },
    { id: 'simulator', label: 'Past Exams', fullLabel: 'Past Exam Papers', icon: <Clock className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', fullLabel: 'National Matric Leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { id: 'collaboration', label: 'Study Rooms', fullLabel: 'Real-time Collaborative Rooms', icon: <Users className="w-4 h-4 text-indigo-400" /> },
    { id: 'upgrade', label: 'Pro Upgrade', fullLabel: 'CBE / Telebirr Pro Upgrade', icon: <Zap className="w-4 h-4 text-emerald-400 animate-pulse" /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Console', fullLabel: 'Executive Admin Authority Console', icon: <Award className="w-4 h-4 text-teal-400 font-bold" /> }] : []),
    { id: 'contact', label: 'Contact Us', fullLabel: '24/7 Academic Helpdesk', icon: <MessageSquare className="w-4 h-4 text-cyan-400" /> },
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
        <div className="bg-[#0F172A] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden">
          <Suspense fallback={<ViewLoader />}>
            <AuthScreenView
              language={language}
              onLanguageChange={setLanguage}
              onAuthComplete={async (userData) => {
                if (userData.isNewUser) {
                  const newUser = createDefaultProfile(userData);
                  handleUpdateUserProfile(newUser);
                  setAppStage('onboarding');
                } else {
                  const existingProfile = await db.getStudentProfile(userData.email);
                  if (existingProfile) {
                    const profileWithRole = { ...existingProfile, role: userData.role || 'student' };
                    handleUpdateUserProfile(profileWithRole);
                    setAppStage('main');
                  } else {
                    const newUser = createDefaultProfile(userData);
                    handleUpdateUserProfile(newUser);
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
        <div className="bg-[#0F172A] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden p-4 sm:p-8">
          <Suspense fallback={<ViewLoader />}>
            <OnboardingRoadmapView
              stream={stream}
              language={language}
              userName={user?.name || 'Scholar'}
              userProfile={user}
              onComplete={(onboardingData) => {
                const updatedUser = {
                  ...user,
                  targetScore: onboardingData.targetScore,
                  dailyHours: onboardingData.dailyHours,
                  studyStyle: onboardingData.studyStyle,
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

  return (
    <>
      <AppShell
        navItems={navItems}
        activeTab={activeTab}
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
      >
        <ErrorBoundary>
          <Suspense fallback={<ViewLoader />}>
            {activeTab === 'practice' && (
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
                initialSubject={practiceSubject}
                initialAutoStart={practiceAutoStart}
                onClearInitial={() => { setPracticeSubject(undefined); setPracticeAutoStart(false); }}
                onCompletePractice={handleCompletePractice}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView
                stream={stream}
                language={language}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onCompleteMock={handleCompleteMock}
                onJumpToExplainer={handleJumpToExplainer}
                initialMockId={initialMockId}
              />
            )}

            {activeTab === 'dashboard' && (
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
                onStartFocusedStudy={(subj) => {
                  setPracticeSubject(subj);
                  setPracticeAutoStart(true);
                  handleTabChange('practice');
                }}
                user={user}
                onProfileUpdate={handleUpdateUserProfile}
                sessionHistory={sessionHistory}
                onClearHistory={handleClearHistory}
              />
            )}

            {activeTab === 'study' && (
              <StudyView
                activeSubTab={studySubTab}
                onSubTabChange={setStudySubTab}
                stream={stream}
                language={language}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                onJumpToExplainer={handleJumpToExplainer}
                initialNoteId={initialNoteId}
                explainerQuery={explainerQuery}
                explainerSubj={explainerSubj}
                onClearExplainerInitial={() => setExplainerQuery(undefined)}
                onCompleteStudy={handleCompleteStudy}
                sessionHistory={sessionHistory}
                showToast={showGlobalToast}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView stream={stream} language={language} userProfile={user} />
            )}

            {activeTab === 'collaboration' && (
              <CollaborationView
                userProfile={user}
                isPremium={isPremium}
                onOpenUpgrade={() => handleTabChange('upgrade')}
                showToast={showGlobalToast}
              />
            )}

            {activeTab === 'profile' && (
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
              />
            )}

            {activeTab === 'upgrade' && <ProUpgradeView isPremium={isPremium} />}
            {activeTab === 'admin' && <AdminConsoleView currentAdminEmail={user?.email} />}
            {activeTab === 'contact' && <ContactUsView userName={user?.name} userEmail={user?.email} />}
            {activeTab === 'privacy' && <PrivacyPolicyView onBack={() => handleTabChange('dashboard')} />}
            {activeTab === 'terms' && <TermsOfServiceView onBack={() => handleTabChange('dashboard')} />}
            {activeTab === 'about' && <AboutView onBack={() => handleTabChange('dashboard')} />}
            {activeTab === 'faq' && <FAQView onBack={() => handleTabChange('dashboard')} onNavigate={handleTabChange} />}
            {activeTab === '404' && <NotFoundView onNavigate={handleTabChange} />}
          </Suspense>
        </ErrorBoundary>

        <Footer language={language} onLanguageChange={setLanguage} onNavigate={handleTabChange} />
      </AppShell>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userData) => {
          if (userData.isNewUser) {
            const newUser = createDefaultProfile(userData);
            handleUpdateUserProfile(newUser);
            setAppStage('onboarding');
          } else {
            handleUpdateUserProfile(userData);
            setAppStage('main');
          }
        }}
        language={language}
        initialMode={authMode}
      />

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
