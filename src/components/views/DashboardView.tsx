import { useState, useEffect, useMemo } from 'react';
// FIXME: this component is ~1800 lines. Needs to be broken into smaller components.
import { 
  Sparkles, ArrowRight, BookOpen, Clock, 
  CheckCircle2, Flame, Award, RefreshCw, HelpCircle, AlertCircle, Check, X,
  Globe, GraduationCap, TrendingUp, Zap,
  Compass, Brain, Layers, Target, Trophy, Lock, Play,
  ChevronDown, ChevronUp, Trash2, Coins, Search, CheckSquare, Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Stream, Language, Subject, PracticeQuestion, SessionHistoryEntry } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { db } from '../../lib/supabase';
import { fisherYatesShuffle } from '../../lib/utils';
import { getAccessToken } from '../../lib/authToken';
import { AceSpadeIcon } from '../ui/BrandLogo';
import { sanitizeHtml } from '../../lib/sanitize';

interface DashboardViewProps {
  stream: Stream;
  language: Language;
  streakDays: number;
  readinessScore: number;
  subjectPerformance: Record<Subject, number>;
  targetPercentage?: number;
  isPremium: boolean;
  onOpenUpgrade: () => void;
  onTabChange: (tab: string) => void;
  onStartLesson: (noteId: string) => void;
  onStartMock: (mockId: string) => void;
  onStartFocusedStudy?: (subject: Subject) => void;
  user?: any;
  onProfileUpdate?: (updatedUser: any) => void;
  sessionHistory?: SessionHistoryEntry[];
  onClearHistory?: () => void;
}

export default function DashboardView({
  stream,
  language,
  streakDays,
  readinessScore,
  subjectPerformance,
  targetPercentage,
  isPremium,
  onOpenUpgrade,
  onTabChange,
  onStartLesson,
  onStartMock,
  onStartFocusedStudy,
  user,
  onProfileUpdate,
  sessionHistory = [],
  onClearHistory,
}: DashboardViewProps) {
  



  // State for academic session history tracker
  const [activeHistoryFilter, setActiveHistoryFilter] = useState<string>('all');
  const filteredHistory = sessionHistory.filter(item => {
    if (activeHistoryFilter === 'all') return true;
    return item.type === activeHistoryFilter;
  });

  // State for study plan
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState('');
  
  // State for Daily Questions: loaded exclusively from Supabase
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  useEffect(() => {
    db.getQuestions().then(qs => {
      if (qs.length > 0) setAllQuestions(qs);
    }).catch(() => {});
  }, []);

  const [dailyQuestions, setDailyQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [showAmharicQuestion, setShowAmharicQuestion] = useState(false);

  // Modal Control for Daily Challenge
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Study Plan States
  const [activePlanTab, setActivePlanTab] = useState<'schedule' | 'custom'>(() => {
    return user?.customRoadmap ? 'custom' : 'schedule';
  });
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);
  const [customRoadmap, setCustomRoadmap] = useState<string>(user?.customRoadmap || '');

  useEffect(() => {
    if (user?.customRoadmap) {
      setCustomRoadmap(user.customRoadmap);
    }
  }, [user?.customRoadmap]);

  const handleGenerateAIPlan = async () => {
    setIsGeneratingPlan(true);
    setStudyPlanError('');
    try {
      const token = getAccessToken();
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetScore: user?.targetScore || targetPercentage || 520,
          currentHours: user?.dailyGoalHours || user?.dailyHours || 4,
          weakSubjects: user?.weakSubjects || [],
          stream: user?.stream || stream,
          language,
          school: user?.school || '',
          region: user?.region || 'Addis Ababa',
        }),
      });
      const data = await res.json();
      if (data.plan) {
        setCustomRoadmap(data.plan);
        setActivePlanTab('custom');
        if (user && onProfileUpdate) {
          onProfileUpdate({ ...user, customRoadmap: data.plan });
        }
      } else {
        throw new Error('Could not generate plan');
      }
    } catch {
      setStudyPlanError('Unable to generate AI plan right now. Showing structured schedule.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Load or generate 5 persistent daily questions for today
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const availableQuestions = allQuestions.filter(q => q.stream === stream || q.stream === 'Common');

    if (availableQuestions.length === 0) return;

    // Try Supabase first, then generate
    if (user?.email) {
      db.getDailyProgress(stream, todayStr).then(serverState => {
        if (serverState) {
          setDailyQuestions(serverState.questions);
          setCurrentQuestionIndex(serverState.currentIndex);
          setSelectedOptionId(serverState.selectedOptionId);
          setIsAnswerChecked(serverState.isAnswerChecked);
          setCorrectAnswersCount(serverState.correctAnswersCount);
          setDailyCompleted(serverState.completed);
          return;
        }
        generateNewDailyChallenge(availableQuestions);
      }).catch(() => {
        generateNewDailyChallenge(availableQuestions);
      });
    } else {
      generateNewDailyChallenge(availableQuestions);
    }
  }, [stream, allQuestions]);

  const generateNewDailyChallenge = (available: PracticeQuestion[]) => {
    // Pick 5 random/semi-random questions
    const shuffled = fisherYatesShuffle(available);
    const selected = shuffled.slice(0, 5);
    
    setDailyQuestions(selected);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setCorrectAnswersCount(0);
    setDailyCompleted(false);

    saveDailyState(selected, 0, null, false, 0, false);
  };

  const saveDailyState = (
    questions: PracticeQuestion[],
    index: number,
    selOption: string | null,
    checked: boolean,
    correctCount: number,
    isDone: boolean
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const state = {
      questions,
      currentIndex: index,
      selectedOptionId: selOption,
      isAnswerChecked: checked,
      correctAnswersCount: correctCount,
      completed: isDone,
    };

    // Sync to Supabase
    if (user?.email) {
      db.saveDailyProgress({
        stream,
        quizDate: todayStr,
        questions,
        currentIndex: index,
        selectedOptionId: selOption,
        isAnswerChecked: checked,
        correctAnswersCount: correctCount,
        completed: isDone,
      }).catch(() => {});
    }
  };

  const updateCurrentState = (updates: {
    index?: number;
    selOption?: string | null;
    checked?: boolean;
    correctCount?: number;
    isDone?: boolean;
  }) => {
    const newIndex = updates.index !== undefined ? updates.index : currentQuestionIndex;
    const newSelOption = updates.selOption !== undefined ? updates.selOption : selectedOptionId;
    const newChecked = updates.checked !== undefined ? updates.checked : isAnswerChecked;
    const newCorrectCount = updates.correctCount !== undefined ? updates.correctCount : correctAnswersCount;
    const newIsDone = updates.isDone !== undefined ? updates.isDone : dailyCompleted;

    setCurrentQuestionIndex(newIndex);
    setSelectedOptionId(newSelOption);
    setIsAnswerChecked(newChecked);
    setCorrectAnswersCount(newCorrectCount);
    setDailyCompleted(newIsDone);

    saveDailyState(dailyQuestions, newIndex, newSelOption, newChecked, newCorrectCount, newIsDone);
  };

  const handleOptionSelect = (optionId: string) => {
    if (isAnswerChecked) return;
    updateCurrentState({ selOption: optionId });
  };

  const handleCheckAnswer = () => {
    if (!selectedOptionId || isAnswerChecked) return;
    const currentQ = dailyQuestions[currentQuestionIndex];
    const isCorrect = selectedOptionId === currentQ.correctOptionId;
    const newCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;
    
    updateCurrentState({
      checked: true,
      correctCount: newCorrectCount
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < dailyQuestions.length - 1) {
      updateCurrentState({
        index: currentQuestionIndex + 1,
        selOption: null,
        checked: false
      });
    } else {
      updateCurrentState({
        isDone: true
      });
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      // Update user streak and daily usage
      if (user && onProfileUpdate) {
        onProfileUpdate({
          ...user,
          streakDays: streakDays + 1,
          dailyQuestionsUsed: (user.dailyQuestionsUsed || 0) + 5
        });
      }
    }
  };

  const handleResetChallenge = () => {
    const availableQuestions = allQuestions.filter(q => q.stream === stream || q.stream === 'Common');
    generateNewDailyChallenge(availableQuestions);
  };

  // Build a structured static study plan based on stream and weak subjects
  const buildStructuredStudyPlan = () => {
    const weakSubs = user?.weakSubjects || [];
    const dailyHours = user?.dailyHours || 4;
    const targetScore = user?.targetScore || 520;
    const allSubs = stream === 'Natural Science'
      ? ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English']
      : ['Mathematics', 'History', 'Geography', 'Economics', 'English'];

    // Assign daily time slots — weak subjects get more time
    const timeSlots: Record<string, string> = {};
    allSubs.forEach(sub => {
      const isWeak = weakSubs.includes(sub);
      const baseHours = isWeak ? Math.round(dailyHours * 0.28) : Math.round(dailyHours * 0.15);
      timeSlots[sub] = `${Math.max(1, baseHours)}h`;
    });

    // 4-week plan structure
    return [
      {
        week: 'Week 1',
        theme: 'Foundations & Concept Review',
        color: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgColor: 'bg-blue-500/5',
        days: [
          { day: 'Mon', activity: `${allSubs[0]} — Chapter review & core formulas`, type: 'study', duration: timeSlots[allSubs[0]] },
          { day: 'Tue', activity: `${allSubs[1]} — Conceptual overview & definitions`, type: 'study', duration: timeSlots[allSubs[1]] },
          { day: 'Wed', activity: `${allSubs[2] || allSubs[0]} — Summary notes + 10-Q drill`, type: 'practice', duration: timeSlots[allSubs[2] || allSubs[0]] },
          { day: 'Thu', activity: `${weakSubs[0] || allSubs[0]} — Weak topic deep dive`, type: 'study', duration: timeSlots[weakSubs[0] || allSubs[0]] },
          { day: 'Fri', activity: `English + SAT — Vocabulary & Reading`, type: 'study', duration: '1.5h' },
          { day: 'Sat', activity: 'Full 2-subject mini mock (60 Qs)', type: 'mock', duration: '3h' },
          { day: 'Sun', activity: 'Review mock errors + rest', type: 'review', duration: '1h' },
        ]
      },
      {
        week: 'Week 2',
        theme: 'Intensive Practice & Problem Solving',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/30',
        bgColor: 'bg-indigo-500/5',
        days: [
          { day: 'Mon', activity: `${allSubs[1]} — Past exam problems (2018–2022)`, type: 'practice', duration: timeSlots[allSubs[1]] },
          { day: 'Tue', activity: `${allSubs[0]} — Problem sets: hard difficulty`, type: 'practice', duration: timeSlots[allSubs[0]] },
          { day: 'Wed', activity: `${weakSubs[0] || allSubs[2] || allSubs[0]} — 20-question timed drill`, type: 'practice', duration: '2h' },
          { day: 'Thu', activity: `${allSubs[3] || allSubs[1]} — Chapter test simulation`, type: 'mock', duration: timeSlots[allSubs[3] || allSubs[1]] },
          { day: 'Fri', activity: 'English composition + SAT Math drills', type: 'practice', duration: '2h' },
          { day: 'Sat', activity: `Full ${targetScore >= 550 ? '4' : '3'}-subject national mock`, type: 'mock', duration: '4h' },
          { day: 'Sun', activity: 'Identify gaps from mock & plan corrections', type: 'review', duration: '1.5h' },
        ]
      },
      {
        week: 'Week 3',
        theme: 'Speed & Exam Strategy',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgColor: 'bg-emerald-500/5',
        days: [
          { day: 'Mon', activity: 'Timed 30-Q sprint — all subjects mixed', type: 'practice', duration: '2h' },
          { day: 'Tue', activity: `${weakSubs[1] || allSubs[0]} — Final weak topic mastery`, type: 'study', duration: '2.5h' },
          { day: 'Wed', activity: 'Past paper: 2023 or 2024 (full paper)', type: 'mock', duration: '3h' },
          { day: 'Thu', activity: 'Error correction + formula sheet review', type: 'review', duration: '2h' },
          { day: 'Fri', activity: 'SAT full practice test (Reading + Math)', type: 'mock', duration: '2.5h' },
          { day: 'Sat', activity: 'Comprehensive 5-subject national simulation', type: 'mock', duration: '5h' },
          { day: 'Sun', activity: 'Light review only — mental rest day', type: 'review', duration: '45m' },
        ]
      },
      {
        week: 'Week 4',
        theme: 'Final Polish & Peak Readiness',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/5',
        days: [
          { day: 'Mon', activity: 'Rapid-fire formula revision — all subjects', type: 'review', duration: '2h' },
          { day: 'Tue', activity: `${allSubs[0]} + ${allSubs[1]} — Final targeted drill`, type: 'practice', duration: '2.5h' },
          { day: 'Wed', activity: 'Full national exam simulation (600-point)', type: 'mock', duration: '5h' },
          { day: 'Thu', activity: 'Exam-day prep: strategy + timing practice', type: 'review', duration: '2h' },
          { day: 'Fri', activity: 'Light reading — only confident topics', type: 'review', duration: '1h' },
          { day: 'Sat', activity: 'Final mini-quiz + confidence building', type: 'practice', duration: '1.5h' },
          { day: 'Sun', activity: '🎯 EXAM DAY READY — Relax & rest!', type: 'rest', duration: '—' },
        ]
      }
    ];
  };

  // Filter subjects based on active stream
  const activeSubjects: Subject[] = stream === 'Natural Science' 
    ? ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT']
    : ['Mathematics', 'History', 'Geography', 'Economics', 'English', 'SAT'];

  const getSubjectIcon = (subj: Subject) => {
    switch (subj) {
      case 'Mathematics': return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'Physics': return <GraduationCap className="w-5 h-5 text-indigo-400" />;
      case 'Chemistry': return <Award className="w-5 h-5 text-sky-400" />;
      case 'Biology': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'History': return <Globe className="w-5 h-5 text-amber-400" />;
      case 'Geography': return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'Economics': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'English': return <BookOpen className="w-5 h-5 text-pink-400" />;
      case 'SAT': return <Sparkles className="w-5 h-5 text-amber-300" />;
      default: return <BookOpen className="w-5 h-5 text-slate-400" />;
    }
  };

  const activeQuestion = dailyQuestions[currentQuestionIndex];
  const userPlan = user?.customRoadmap || '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-10 select-none">
      
      {/* 1. Dashboard banner */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 bg-[#0C1018] border border-white/[0.08] rounded-2xl gap-6 overflow-hidden shadow-2xl brand-border-hover transition-all min-h-[160px]">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/[0.08] rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-sky-500/[0.05] rounded-full blur-[80px] pointer-events-none" />

        {/* Faint Ace Logo Watermark in Banner Background */}
        <div className="absolute -right-4 -bottom-8 w-44 h-44 opacity-[0.04] pointer-events-none">
          <AceSpadeIcon className="w-full h-full text-white" />
        </div>

        {/* Content Panel */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, Scholar
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {user?.name ? `Welcome back, ${user.name}!` : 'Welcome back, Scholar!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-normal leading-relaxed">
            Your study hub for the Ethiopian Grade 12 Matric exam.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] font-semibold text-blue-300">
              {stream} Stream
            </span>
              <span className="px-3 py-1 bg-slate-800/50 border border-white/[0.1] rounded-lg text-[11px] font-semibold text-white">
              Target Score: {user?.targetScore || 520}+
            </span>
          </div>
        </div>

        {/* Streak Counter Badge */}
        <div className="relative z-10 flex items-center space-x-4 bg-[#07090E]/90 p-4 border border-white/[0.08] rounded-xl self-start md:self-auto shrink-0">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Study Streak</div>
            <div className="text-lg font-extrabold text-white">{streakDays} Days</div>
          </div>
        </div>
      </div>

      {/* Diagnostic metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric 1: Diagnostic Exam Readiness */}
        <div className="bg-[#0D1017] border border-white/[0.08] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group card-lift hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Exam Readiness
            </div>
            <div className="text-xl font-extrabold text-blue-400 mt-0.5">{readinessScore}% Ready</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              Diagnostic Score
            </div>
          </div>
        </div>

        {/* Metric 2: Quick Actions */}
        <div className="bg-[#0D1017] border border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group card-lift hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                Quick Start
              </div>
              <div className="text-xs font-semibold mt-0.5 text-blue-400">
                Practice & Study
              </div>
            </div>
          </div>
          <button
            onClick={() => onTabChange('practice')}
            className="mt-3 py-2 px-3 rounded-lg text-xs font-bold tracking-wider uppercase bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            Start Practice
          </button>
        </div>
      </div>

      {/* Daily challenge card */}
      <div className="bg-[#0D1017] border border-white/[0.08] hover:border-amber-500/20 transition-all rounded-2xl overflow-hidden shadow-md card-lift">
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* Left: info panel */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                {dailyCompleted && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h3 className="font-bold text-base text-white">Today's Daily Challenge</h3>
                  {dailyCompleted && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Completed</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  5 curated questions from your {stream} stream. Takes ~5 minutes.
                </p>
              </div>
            </div>
            {/* Streak + XP badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="text-xs font-bold text-amber-300">{streakDays} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">+50 XP Reward</span>
              </div>
              {dailyCompleted && correctAnswersCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">{correctAnswersCount}/{dailyQuestions.length} Correct</span>
                </div>
              )}
            </div>
          </div>
          {/* Right: action */}
          <div className="px-6 py-5 sm:py-0 sm:flex sm:items-center sm:justify-center border-t sm:border-t-0 sm:border-l border-white/[0.06] shrink-0">
            <button
              onClick={() => setShowChallengeModal(true)}
              className={`w-full sm:w-auto py-3 px-7 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                dailyCompleted
                  ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {dailyCompleted ? (
                <><RefreshCw className="w-3.5 h-3.5" /><span>Practice Again</span></>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 fill-current" /><span>Start Challenge</span></>
              )}
            </button>
          </div>
        </div>
        {/* Progress strip */}
        {dailyQuestions.length > 0 && (
          <div className="h-1 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${dailyCompleted ? 100 : ((currentQuestionIndex + (isAnswerChecked ? 1 : 0)) / Math.max(dailyQuestions.length, 1)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Daily challenge modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141920] border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            
            {/* Header bar */}
            <div className="px-6 pt-5 pb-4 bg-slate-900/45 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base text-white truncate">
                      Today's Daily Challenge
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      5-question diagnostic drill
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChallengeModal(false)}
                  aria-label="Close daily challenge"
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              {dailyQuestions.length > 0 && !dailyCompleted && (
                <div className="mt-4 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/10 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + (isAnswerChecked ? 1 : 0)) / dailyQuestions.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Scrollable content container */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              {dailyQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 animate-pulse">
                    <Award className="w-8 h-8" />
                  </div>
                  <h4 className="mt-5 text-base font-semibold text-white">
                    Loading questions...
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {`Picking 5 questions from your ${stream} subjects`}
                  </p>
                  <div className="mt-8 w-full max-w-sm space-y-3 animate-pulse" aria-hidden="true">
                    <div className="h-3 bg-slate-800 rounded-full w-3/4" />
                    <div className="h-3 bg-slate-800/80 rounded-full w-1/2" />
                    <div className="h-12 bg-slate-800/70 rounded-xl w-full mt-5" />
                    <div className="h-12 bg-slate-800/70 rounded-xl w-full" />
                    <div className="h-12 bg-slate-800/70 rounded-xl w-full" />
                  </div>
                </div>
              ) : dailyCompleted ? (
                // Victory Screen
                <div className="flex flex-col items-center text-center py-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 animate-bounce">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h4 className="mt-5 text-xl font-semibold text-white">
                    Daily Challenge Completed!
                  </h4>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {`You scored ${correctAnswersCount} out of ${dailyQuestions.length} correct in today's diagnostic drill.`}
                  </p>

                  {/* Score breakdown metrics */}
                  <div className="mt-6 w-full grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-4">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accuracy</div>
                      <div className="mt-1 text-2xl font-semibold text-blue-400">{Math.round((correctAnswersCount / dailyQuestions.length) * 100)}%</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-4">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">XP Awarded</div>
                      <div className="mt-1 text-2xl font-semibold text-indigo-400">+50 XP</div>
                    </div>
                  </div>

                  <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleResetChallenge}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Practice Again
                    </button>
                    <button
                      onClick={() => {
                        setShowChallengeModal(false);
                        onTabChange('practice');
                      }}
                      className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Browse Practice Banks</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                // Active Question Board
                <div className="space-y-6">
                  
                  {/* Question text box */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-bold text-blue-300 uppercase tracking-wide">
                        {activeQuestion.subject} • {activeQuestion.yearEC}
                      </span>
                      {activeQuestion.questionTextAmharic && (
                        <button
                          onClick={() => setShowAmharicQuestion(!showAmharicQuestion)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                        >
                          {showAmharicQuestion ? 'View in English' : 'Translate to Amharic'}
                        </button>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(showAmharicQuestion && activeQuestion.questionTextAmharic ? activeQuestion.questionTextAmharic : activeQuestion.questionText) }}
                    />
                  </div>

                  {/* Options lists */}
                  <div className="grid grid-cols-1 gap-3">
                    {activeQuestion.options.map((opt, idx) => {
                      const letter = ['A', 'B', 'C', 'D', 'E', 'F'][idx];
                      const isSelected = selectedOptionId === opt.id;
                      const isCorrect = opt.id === activeQuestion.correctOptionId;

                      let optionStyles = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
                      let badgeStyles = 'bg-slate-800 border-slate-700 text-slate-400';

                      if (isSelected) {
                        optionStyles = 'bg-blue-500/10 border-blue-400/70 text-blue-100';
                        badgeStyles = 'bg-blue-600 border-blue-600 text-white';
                      }

                      if (isAnswerChecked) {
                        if (isCorrect) {
                          optionStyles = 'bg-emerald-500/10 border-emerald-400/70 text-emerald-100';
                          badgeStyles = 'bg-emerald-600 border-emerald-600 text-white';
                        } else if (isSelected) {
                          optionStyles = 'bg-rose-500/10 border-rose-400/70 text-rose-100';
                          badgeStyles = 'bg-rose-600 border-rose-600 text-white';
                        } else {
                          optionStyles = 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed';
                          badgeStyles = 'bg-slate-800/60 border-slate-700/60 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt.id)}
                          disabled={isAnswerChecked}
                          className={`p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all duration-150 flex items-start gap-3 cursor-pointer ${optionStyles}`}
                        >
                          <span className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center text-[11px] font-semibold border shrink-0 transition-colors ${badgeStyles}`}>
                            {letter}
                          </span>
                          <span className="flex-1 font-sans leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(showAmharicQuestion && opt.textAmharic ? opt.textAmharic : opt.text) }}
                          />
                          <span className="ml-1 shrink-0 mt-0.5">
                            {isAnswerChecked && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                            {isAnswerChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback and Explanation Box */}
                  {isAnswerChecked && (
                    <div className={`p-4 rounded-xl border-l-4 space-y-2 ${selectedOptionId === activeQuestion.correctOptionId ? 'bg-emerald-500/5 border-emerald-500' : 'bg-rose-500/5 border-rose-500'}`}>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {selectedOptionId === activeQuestion.correctOptionId ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Correct Answer!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-rose-400">Incorrect</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(showAmharicQuestion && activeQuestion.explanationAmharic ? activeQuestion.explanationAmharic : activeQuestion.explanation) }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky footer controls */}
            {dailyQuestions.length > 0 && !dailyCompleted && (
              <div className="shrink-0 px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-400 hidden sm:block">
                  {`Question ${currentQuestionIndex + 1} of ${dailyQuestions.length}`}
                </span>
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedOptionId}
                    className="w-full sm:w-auto py-3 px-6 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {currentQuestionIndex === dailyQuestions.length - 1
                        ? 'Complete Challenge'
                        : 'Next Question'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. YOUR SUBJECTS & DIAGNOSTIC TRACKER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white">
              Your Stream Subjects
            </h3>
            <p className="text-xs text-slate-400">
              Track your readiness across each subject and jump into practice.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 border border-blue-500/25 rounded-full flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            {`Avg Readiness: ${readinessScore}%`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeSubjects.map((subj) => {
            const score = subjectPerformance[subj] ?? 0;
            
            // Unified, premium blue-indigo progress scale
            let barColor = 'bg-gradient-to-r from-blue-600 to-indigo-600';
            let textColor = 'text-blue-400';
            if (score < 60) {
              barColor = 'bg-gradient-to-r from-sky-500 to-blue-500';
              textColor = 'text-sky-400';
            } else if (score < 80) {
              barColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
              textColor = 'text-blue-400';
            } else {
              barColor = 'bg-gradient-to-r from-blue-600 to-indigo-600';
              textColor = 'text-indigo-400';
            }

            return (
              <div 
                key={subj}
                className="p-5 bg-[#141920] border border-slate-800 hover:border-slate-700/80 rounded-xl flex flex-col justify-between transition-all duration-200 group hover:shadow-lg hover:shadow-slate-950/20"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                        {getSubjectIcon(subj)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">
                          {subj}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Matric Prep
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${textColor}`}>
                      {score}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-semibold uppercase">
                      <span>Weak</span>
                      <span>Average</span>
                      <span>Mastery</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-900/50 flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => {
                      if (onStartFocusedStudy) {
                        onStartFocusedStudy(subj);
                      } else {
                        onTabChange('practice');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    Practice Bank
                  </button>
                  <button 
                    onClick={() => onTabChange('study')}
                    className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-semibold text-indigo-400 border border-indigo-500/15 hover:border-indigo-500/30 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Study Notes</span>
                    <ArrowRight className="w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4.5. ACADEMIC SESSION HISTORY TRACKER */}
      <div id="session-history-tracker" className="bg-[#0F1218] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 border border-blue-500/20 rounded-full">
              Study history
            </span>
            <h3 className="font-semibold text-lg text-white mt-1.5">
              Activity & Performance History
            </h3>
            <p className="text-xs text-slate-400">
              A log of your recent study sessions, practice attempts, and mock scores.
            </p>
          </div>
          
          {/* History filter buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {['all', 'study', 'practice', 'simulation'].map((type) => {
              const isActive = activeHistoryFilter === type;
              const labels: Record<string, string> = {
                all: 'All',
                study: 'Study',
                practice: 'Practice',
                simulation: 'Mocks'
              };
              return (
                <button
                  key={type}
                  onClick={() => setActiveHistoryFilter(type)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md font-semibold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
          {sessionHistory.length > 0 && onClearHistory && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all activity history? This cannot be undone.')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Clear History
            </button>
          )}
        </div>

        {/* List of sessions */}
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-semibold">
            No history matching the selected filter.
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {filteredHistory.map((item) => {
              // Icon & color based on session type
              let itemIcon = <BookOpen className="w-4 h-4 text-blue-400" />;
              let typeLabel = 'Study Note';
              let badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
              let scoreDisplay = null;

              if (item.type === 'practice') {
                itemIcon = <TrendingUp className="w-4 h-4 text-emerald-400" />;
                typeLabel = 'Practice Set';
                badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                scoreDisplay = (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0">
                    {item.score} / {item.total} Correct
                  </span>
                );
              } else if (item.type === 'simulation') {
                itemIcon = <Award className="w-4 h-4 text-sky-400" />;
                typeLabel = 'National Simulation';
                badgeColor = 'bg-sky-500/10 border-sky-500/20 text-sky-400';
                scoreDisplay = (
                  <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg shrink-0">
                    {item.score}% Score
                  </span>
                );
              }

              return (
                <div 
                  key={item.id}
                  className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                      {itemIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-md shrink-0 ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {item.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 truncate mt-1">
                        {item.subject}
                      </h4>
                      {item.chapter && (
                        <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                          {item.chapter}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {scoreDisplay}
                    <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/60 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.durationMinutes}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. YOUR PERSONALIZED STUDY PLAN */}
      <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-white tracking-tight">
                  Your Personalized Study Plan
                </h3>
                <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-500/20 uppercase tracking-wider shrink-0">
                  {user?.stream || stream}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Custom study structure based on your stream, {user?.targetScore || 520}/600 target, and focus subjects.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {customRoadmap && (
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePlanTab('custom')}
                  className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    activePlanTab === 'custom'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Study Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlanTab('schedule')}
                  className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    activePlanTab === 'schedule'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Weekly Schedule
                </button>
              </div>
            )}

            {!customRoadmap && (
              <button
                type="button"
                onClick={handleGenerateAIPlan}
                disabled={isGeneratingPlan}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Plan</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setIsPlanExpanded(!isPlanExpanded)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              title={isPlanExpanded ? 'Collapse' : 'Expand'}
              aria-label={isPlanExpanded ? 'Collapse study plan' : 'Expand study plan'}
            >
              {isPlanExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Diagnostic Metadata Pill Row — shows where data comes from */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Stream</span>
            <span className="text-xs font-semibold text-white mt-0.5 block truncate">{user?.stream || stream}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Target Score</span>
            <span className="text-xs font-semibold text-blue-400 mt-0.5 block font-mono">{user?.targetScore || 520} / 600</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Daily Study Goal</span>
            <span className="text-xs font-semibold text-amber-400 mt-0.5 block font-mono">{user?.dailyGoalHours || user?.dailyHours || 4} hrs/day</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Priority Weak Topics</span>
            <span className="text-xs font-semibold text-emerald-400 mt-0.5 block truncate">
              {user?.weakSubjects && user.weakSubjects.length > 0 ? user.weakSubjects.join(', ') : 'All balanced'}
            </span>
          </div>
        </div>

        {studyPlanError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold text-center">
            {studyPlanError}
          </div>
        )}

        {isPlanExpanded && (
          <div className="space-y-5">
            {activePlanTab === 'custom' && customRoadmap ? (
              <div className="space-y-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Study Roadmap generated for {user?.name || 'Student'}
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAIPlan}
                      disabled={isGeneratingPlan}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingPlan ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none space-y-2">
                    {customRoadmap.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return <h4 key={i} className="text-base font-semibold text-white mt-4 mb-1.5">{line.replace('## ', '')}</h4>;
                      if (line.startsWith('### ')) return <h5 key={i} className="text-xs font-bold uppercase tracking-wider text-blue-400 mt-3 mb-1">{line.replace('### ', '')}</h5>;
                      if (line.startsWith('**')) return <p key={i} className="text-xs text-slate-200 font-semibold" dangerouslySetInnerHTML={{ __html: sanitizeHtml(line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')) }} />;
                      if (line.startsWith('- ')) return <li key={i} className="text-xs text-slate-300 ml-4 list-disc leading-relaxed">{line.replace('- ', '')}</li>;
                      if (line.trim()) return <p key={i} className="text-xs text-slate-400 leading-relaxed">{line}</p>;
                      return <br key={i} />;
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Structured 4-Week Study Plan Table
              (() => {
                const plan = buildStructuredStudyPlan();
                const typeColors: Record<string, string> = {
                  study: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                  practice: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                  mock: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  review: 'bg-slate-700/50 text-slate-300 border-slate-700',
                  rest: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
                };
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                      {[['study','Study Notes'],['practice','Practice Drill'],['mock','Mock Exam'],['review','Review Session'],['rest','Rest']].map(([type, label]) => (
                        <span key={type} className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${typeColors[type]}`}>{label}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.map((week) => (
                        <div key={week.week} className={`rounded-xl border ${week.borderColor} ${week.bgColor} overflow-hidden flex flex-col justify-between`}>
                          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase tracking-wider ${week.color}`}>{week.week}</span>
                            <span className="text-xs text-slate-400 font-semibold">{week.theme}</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/5 text-[11px] text-slate-500 font-semibold uppercase">
                                  <th className="text-left px-3 py-2 w-12">Day</th>
                                  <th className="text-left px-3 py-2">Activity</th>
                                  <th className="text-center px-2 py-2 w-16">Type</th>
                                  <th className="text-right px-3 py-2 w-14">Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03]">
                                {week.days.map((day) => (
                                  <tr key={day.day} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-3 py-2 font-bold text-slate-300">{day.day}</td>
                                    <td className="px-3 py-2 text-slate-200 leading-snug">{day.activity}</td>
                                    <td className="px-2 py-2 text-center">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[day.type]}`}>
                                        {day.type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-slate-400 font-semibold">{day.duration}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
