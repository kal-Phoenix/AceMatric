import { useState, useEffect, useMemo } from 'react';
// FIXME: this component is ~1800 lines. Needs to be broken into smaller components.
import { 
  Sparkles, ArrowRight, BookOpen, Clock, 
  CheckCircle2, Flame, Award, RefreshCw, HelpCircle, AlertCircle, Check, X,
  Globe, GraduationCap, TrendingUp, Zap,
  Compass, Brain, Layers, Target, Trophy, Lock, Play,
  ChevronDown, ChevronUp, Trash2, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Stream, Language, Subject, PracticeQuestion, SessionHistoryEntry } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { db } from '../../lib/supabase';
import { fisherYatesShuffle } from '../../lib/utils';
import { getAccessToken } from '../../lib/authToken';
import { AceSpadeIcon } from '../ui/BrandLogo';
import { sanitizeHtml } from '../../lib/sanitize';

interface Milestone {
  id: string;
  unit: number;
  unitTitle: string;
  title: string;
  subtitle: string;
  icon: string;
  actionType: 'study' | 'practice' | 'simulator' | 'leaderboard' | 'upgrade';
  xp: number;
  color: string;
  ringColor: string;
  isWeak?: boolean;
}

const SUBJECT_TOPICS: Record<string, { title: string; icon: string }[]> = {
  Physics: [
    { title: 'Vectors and 2D Motion', icon: 'compass' },
    { title: 'Dynamics & Newton\'s Laws', icon: 'target' },
    { title: 'Work, Energy & Power', icon: 'zap' },
    { title: 'Electrostatics & Circuits', icon: 'brain' },
    { title: 'Electromagnetism', icon: 'layers' },
    { title: 'Atomic and Nuclear Physics', icon: 'sparkles' },
  ],
  Chemistry: [
    { title: 'Atomic Structure & Bonding', icon: 'brain' },
    { title: 'Chemical Equilibrium', icon: 'layers' },
    { title: 'Acid-Base & Salts Solutions', icon: 'compass' },
    { title: 'Electrochemistry & Reactions', icon: 'zap' },
    { title: 'Organic Chemistry & Polymers', icon: 'sparkles' },
    { title: 'Industrial Chemistry in Ethiopia', icon: 'target' },
  ],
  Biology: [
    { title: 'Cell Biology & Biomolecules', icon: 'layers' },
    { title: 'Enzymes and Cellular Respiration', icon: 'zap' },
    { title: 'Genetics & Molecular Inheritance', icon: 'brain' },
    { title: 'Human Physiology & Health', icon: 'target' },
    { title: 'Ecology & Natural Resources', icon: 'compass' },
    { title: 'Microbiology & Diseases', icon: 'sparkles' },
  ],
  Mathematics: [
    { title: 'Relations, Functions & Matrices', icon: 'layers' },
    { title: 'Sequences and Series', icon: 'compass' },
    { title: 'Limits and Continuity', icon: 'target' },
    { title: 'Differential Calculus', icon: 'brain' },
    { title: 'Integral Calculus', icon: 'zap' },
    { title: 'Probability and Statistics', icon: 'sparkles' },
  ],
  History: [
    { title: 'Ancient & Medieval Ethiopia', icon: 'compass' },
    { title: 'Modern Ethiopian History (1855-1991)', icon: 'layers' },
    { title: 'World Wars & Global Alliances', icon: 'target' },
    { title: 'Decolonization of Africa', icon: 'sparkles' },
  ],
  Geography: [
    { title: 'Map Reading & GIS', icon: 'compass' },
    { title: 'Physical Geography of Ethiopia', icon: 'layers' },
    { title: 'Climatology and Climate Change', icon: 'brain' },
    { title: 'Economic Geography & Resources', icon: 'zap' },
  ],
  Economics: [
    { title: 'Microeconomics: Demand & Supply', icon: 'target' },
    { title: 'National Income Accounting', icon: 'layers' },
    { title: 'Ethiopian Economic Sectors', icon: 'compass' },
    { title: 'Monetary & Fiscal Policies', icon: 'zap' },
  ],
  English: [
    { title: 'Advanced Grammar & Tenses', icon: 'brain' },
    { title: 'Vocabulary & Context Clues', icon: 'compass' },
    { title: 'Reading Comprehension Drills', icon: 'target' },
    { title: 'Sentence Structures & Word Orders', icon: 'layers' },
  ],
  'SAT': [
    { title: 'Quantitative Reasoning', icon: 'zap' },
    { title: 'Verbal Analogies & Logic', icon: 'brain' },
    { title: 'Spatial Reasoning & Patterns', icon: 'compass' },
    { title: 'Analytical Problem Solving', icon: 'target' },
  ]
};

export function getTopicsForGrade(subject: string, grade: number): { title: string; icon: string }[] {
  const searchSubject = subject === 'Mathematics' ? 'Maths' : subject;
  
  // Find in Natural stream
  let subObj = ETHIOPIAN_CURRICULUM.find(s => s.stream === 'Natural')?.subjects.find(
    s => s.subject.toLowerCase() === searchSubject.toLowerCase() && s.grade === grade
  );
  
  // Find in Social stream if not found
  if (!subObj) {
    subObj = ETHIOPIAN_CURRICULUM.find(s => s.stream === 'Social')?.subjects.find(
      s => s.subject.toLowerCase() === searchSubject.toLowerCase() && s.grade === grade
    );
  }

  if (subObj) {
    return subObj.chapters.map((ch, idx) => {
      // Assign custom icons based on chapter number or index
      const icons = ['compass', 'target', 'zap', 'brain', 'layers', 'sparkles', 'globe', 'coins'];
      const icon = icons[idx % icons.length];
      return {
        title: ch.chapterName,
        icon: icon
      };
    });
  }

  // Fallback to static SUBJECT_TOPICS
  return SUBJECT_TOPICS[subject] || [];
}

export function generateDynamicRoadmap(
  stream: string,
  weakSubjects: string[] = [],
  studyStyle: string = 'Practice / Quiz',
  targetScore: number = 600,
  grade: number = 12
): Milestone[] {
  const subjects = stream === 'Natural Science'
    ? ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT']
    : ['Mathematics', 'History', 'Geography', 'Economics', 'English', 'SAT'];

  const milestones: Milestone[] = [];
  let idCounter = 1;

  // Stagger all chapters across the subjects to construct a unified learning path
  // Max chapters is 6 (Mathematics, Physics, Chemistry, Biology have 6 chapters each)
  const learningTopics: { subject: string; title: string; icon: string; isWeak: boolean; topicIdx: number }[] = [];
  
  for (let topicIdx = 0; topicIdx < 6; topicIdx++) {
    subjects.forEach(sub => {
      const topics = getTopicsForGrade(sub, grade);
      if (topics[topicIdx]) {
        learningTopics.push({
          subject: sub,
          title: topics[topicIdx].title,
          icon: topics[topicIdx].icon,
          isWeak: weakSubjects.includes(sub),
          topicIdx
        });
      }
    });
  }

  // Generate learning milestones for Unit 1, Unit 2, Unit 3
  learningTopics.forEach((topic) => {
    // Map topics to Unit 1, 2, or 3 based on their chapter depth
    let unitNumber = 1;
    let unitTitle = '';
    let unitTitleAm = '';

    if (topic.topicIdx <= 1) {
      unitNumber = 1;
      unitTitle = 'Unit 1: Foundations & Core Weakness Drills';
    } else if (topic.topicIdx <= 3) {
      unitNumber = 2;
      unitTitle = 'Unit 2: Progress & Intermediate Problem Solving';
    } else {
      unitNumber = 3;
      unitTitle = 'Unit 3: Advanced Applications & High-Yield Speed Tests';
    }

    let actionType: 'study' | 'practice' | 'simulator' | 'leaderboard' | 'upgrade' = 'study';
    // Alternate action types nicely for dynamic style
    if (topic.topicIdx % 2 === 0) {
      actionType = topic.isWeak ? 'practice' : 'study';
    } else {
      actionType = 'practice';
    }

    let color = 'from-indigo-500 to-blue-600';
    let ringColor = 'border-indigo-500';
    if (topic.isWeak) {
      color = 'from-blue-600 to-indigo-600';
      ringColor = 'border-blue-500';
    } else if (unitNumber === 2) {
      color = 'bg-white/10';
      ringColor = 'border-emerald-500';
    } else if (unitNumber === 3) {
      color = 'from-purple-500 to-fuchsia-600';
      ringColor = 'border-purple-500';
    }

    let subtitle = '';
    let subtitleAm = '';

    const isAmStyle = studyStyle === 'Visual / Video';
    const isPrStyle = studyStyle === 'Practice / Quiz';
    const isRdStyle = studyStyle === 'Reading & Summaries';

    if (topic.isWeak) {
      if (isAmStyle) {
        subtitle = `Reinforce your weak area in ${topic.subject}. Watch video deep-dives on "${topic.title}" and inspect core formula derivations.`;
      } else if (isPrStyle) {
        subtitle = `Defeat your weak spot in ${topic.subject}. Tackle 15 high-yield multiple-choice drills on "${topic.title}".`;
      } else if (isRdStyle) {
        subtitle = `Lock in core definitions in ${topic.subject}. Review interactive study notes and formula summary cards for "${topic.title}".`;
      } else {
        subtitle = `Review challenging aspects of "${topic.title}" (${topic.subject}) with interactive step-by-step guidance.`;
      }
    } else {
      if (isAmStyle) {
        subtitle = `Review conceptual video walk-throughs for "${topic.title}" in ${topic.subject}.`;
      } else if (isPrStyle) {
        subtitle = `Run a timed micro-quiz on "${topic.title}" (${topic.subject}) to secure study retention.`;
      } else if (isRdStyle) {
        subtitle = `Read summary boxes, physical constants, and key vocabulary for "${topic.title}".`;
      } else {
        subtitle = `Analyze shortcuts and key exam pitfalls for "${topic.title}" in ${topic.subject}.`;
      }
    }

    const xpReward = Math.round((topic.isWeak ? 160 : 120) * (targetScore / 600));

    milestones.push({
      id: `m${idCounter++}`,
      unit: unitNumber,
      unitTitle,
      title: `${topic.subject}: ${topic.title}`,
      subtitle,
      icon: topic.icon,
      actionType,
      xp: xpReward,
      color,
      ringColor
    });
  });

  // Now generate Unit 4 Full Course Syllabus Simulators for each subject
  subjects.forEach(sub => {
    const isWeakSub = weakSubjects.includes(sub);
    const xpReward = Math.round((isWeakSub ? 250 : 200) * (targetScore / 600));

    milestones.push({
      id: `m${idCounter++}`,
      unit: 4,
      unitTitle: 'Unit 4: Mock Board Simulator & Peak Performance Run',
      title: `${sub}: Comprehensive Syllabus Simulator`,
      subtitle: `Run a complete 50-question diagnostic exam simulator in ${sub} under strict time limitations to predict your entrance grade.`,
      icon: 'award',
      actionType: 'simulator',
      xp: xpReward,
      color: 'bg-white/10',
      ringColor: 'border-cyan-500'
    });
  });

  // Finally, the Grand Matric Victory Cup
  milestones.push({
    id: `m${idCounter}`,
    unit: 4,
    unitTitle: 'Unit 4: Mock Board Simulator & Peak Performance Run',
    title: 'Grand Matric Victory Cup',
    subtitle: `You completed all personalized topic modules & subject mock exams! Target score: ${targetScore}/600. Step out and claim your rank!`,
    icon: 'trophy',
    actionType: 'upgrade',
    xp: 500,
      color: 'from-blue-600 via-indigo-600 to-violet-600',
    ringColor: 'border-blue-400'
  });

  return milestones;
}

const renderMilestoneIcon = (iconName: string, className = "w-6 h-6") => {
  switch (iconName) {
    case 'compass': return <Compass className={className} />;
    case 'book': return <BookOpen className={className} />;
    case 'layers': return <Layers className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'target': return <Target className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'brain': return <Brain className={className} />;
    case 'trophy': return <Trophy className={className} />;
    case 'graduation-cap': return <GraduationCap className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'award': return <Award className={className} />;
    case 'book-open': return <BookOpen className={className} />;
    case 'coins': return <Coins className={className} />;
    case 'globe': return <Globe className={className} />;
    default: return <HelpCircle className={className} />;
  }
};

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
  

  const roadMilestones = useMemo(() => {
    const s = user?.stream || stream || 'Natural Science';
    const weak = user?.weakSubjects || [];
    const style = user?.studyStyle || 'Practice / Quiz';
    const score = user?.targetScore || targetPercentage || 600;
    const gradeVal = user?.activeGrade || 12;
    return generateDynamicRoadmap(s, weak, style, score, gradeVal);
  }, [user, stream, targetPercentage]);

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

  // Roadmap States
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() => {
    if (user?.completedMilestones?.length > 0) return user.completedMilestones;
    return ['m1', 'm2'];
  });

  const [activeRoadmapTab, setActiveRoadmapTab] = useState<'grid' | 'syllabus'>('grid');
  const [isRoadmapExpanded, setIsRoadmapExpanded] = useState(false);
  const [activeUnitTab, setActiveUnitTab] = useState<number>(1);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const currentActiveUnit = useMemo(() => {
    const nextIncomplete = roadMilestones.find(m => !completedMilestones.includes(m.id));
    return nextIncomplete ? nextIncomplete.unit : 1;
  }, [roadMilestones, completedMilestones]);

  useEffect(() => {
    setActiveUnitTab(currentActiveUnit);
  }, [currentActiveUnit]);

  const handleToggleMilestone = (milestone: Milestone) => {
    const isCompleted = completedMilestones.includes(milestone.id);
    let newCompleted: string[];

    if (isCompleted) {
      newCompleted = completedMilestones.filter(id => id !== milestone.id);
    } else {
      newCompleted = [...completedMilestones, milestone.id];
    }

    setCompletedMilestones(newCompleted);
    db.updateGamification(0, newCompleted).catch(() => {});
    if (user?.email) {
      db.saveStudentProfile({ ...user, completedMilestones: newCompleted }).catch(() => {});
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
      // Optionally update user streak
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

  // Generate study plan manually if they do not have one
  const handleGenerateAIStudyPlan = async () => {
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
          targetScore: user?.targetScore || 520,
          currentHours: user?.dailyHours || 4,
          weakSubjects: user?.weakSubjects || ['Mathematics', 'Physics'],
          stream,
          language,
          school: user?.school,
          region: user?.region,
          bio: user?.bio,
          preparationLevel: user?.preparationLevel,
          studyStyle: user?.studyStyle,
          studyTimeOfDay: user?.studyTimeOfDay,
          examFocusStrategy: user?.examFocusStrategy,
          biggestChallenge: user?.biggestChallenge,
          mockFrequency: user?.mockFrequency
        })
      });
      const data = await res.json();
      if (data.plan) {
        if (onProfileUpdate) {
          onProfileUpdate({
            ...user,
            customRoadmap: data.plan
          });
        }
      } else {
        throw new Error('No plan returned from tutor engine');
      }
    } catch (err: any) {
      console.error(err);
      setStudyPlanError('Failed to generate study plan. Please check your connection and try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
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
      <div className="bg-[#0D1017] border border-white/[0.08] hover:border-blue-500/30 transition-all rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-lift">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-white">
              Today's Daily Challenge
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Five questions from your stream subjects — takes about 5 minutes.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowChallengeModal(true)}
          className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Start Daily Challenge</span>
        </button>
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
            const score = subjectPerformance[subj] || 75;
            
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

      {/* 5. YOUR GAMIFIED STUDY ROADMAP SECTION */}
      <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-white tracking-tight">
                  Your Personalized Roadmap
                </h3>
                <span className="bg-slate-950 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-800 uppercase tracking-wider shrink-0">
                  {completedMilestones.length}/{roadMilestones.length} Done
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                A 16-topic path built around your weaker subjects and study habits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isRoadmapExpanded && activeRoadmapTab === 'syllabus' && userPlan && (
              <button
                onClick={handleGenerateAIStudyPlan}
                disabled={isGeneratingPlan}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer disabled:opacity-50 mr-2"
              >
                {isGeneratingPlan ? 'Regenerating...' : 'Regenerate Plan'}
              </button>
            )}

            {isRoadmapExpanded && (
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setActiveRoadmapTab('grid')}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeRoadmapTab === 'grid' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tracker
                </button>
                <button
                  onClick={() => setActiveRoadmapTab('syllabus')}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeRoadmapTab === 'syllabus' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Plan
                </button>
              </div>
            )}

            <button
              onClick={() => setIsRoadmapExpanded(!isRoadmapExpanded)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              title={isRoadmapExpanded ? 'Collapse' : 'Expand'}
              aria-label={isRoadmapExpanded ? 'Collapse roadmap' : 'Expand roadmap'}
            >
              {isRoadmapExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {studyPlanError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold text-center">
            {studyPlanError}
          </div>
        )}

        {!isRoadmapExpanded ? (
          // ==========================================
          // COLLAPSED COMPACT SUMMARY VIEW (PREMIUM)
          // ==========================================
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-900/20 p-5 rounded-xl border border-slate-800/60 shadow-md relative overflow-hidden">
            
            {/* Left circular gauge panel (md:col-span-4) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/50 pb-5 md:pb-0 md:pr-6">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-950"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {/* Active glowing ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-indigo-500"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - completedMilestones.length / roadMilestones.length)}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.45))'
                    }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-semibold text-white tracking-tight">
                    {Math.round((completedMilestones.length / roadMilestones.length) * 100)}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Curriculum
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase text-center bg-indigo-500/5 px-2.5 py-0.5 rounded-full border border-indigo-500/10">
                {`STAGE ${completedMilestones.length + 1} ACTIVE`}
              </div>
            </div>

            {/* Right Next Milestone Spotlight panel (md:col-span-8) */}
            {(() => {
              const nextMilestone = roadMilestones.find(m => !completedMilestones.includes(m.id)) || roadMilestones[roadMilestones.length - 1];
              if (!nextMilestone) return null;
              return (
                <div className="md:col-span-8 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider rounded-md">
                        Up Next
                      </span>
                      {nextMilestone.isWeak && (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider rounded-md">
                          Priority weak topic
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight line-clamp-1">
                        {nextMilestone.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {nextMilestone.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setSelectedMilestone(nextMilestone)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Launch Target Step</span>
                    </button>
                    <button
                      onClick={() => setIsRoadmapExpanded(true)}
                      className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-800"
                    >
                      Browse Complete 16-Topic Roadmap
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        ) : (
          // ==========================================
          // EXPANDED MULTI-UNIT STUDY TIMELINE
          // ==========================================
          <div className="space-y-6">
            {activeRoadmapTab === 'grid' ? (
              <div className="space-y-6">
                {/* Horizontal Selector for the 4 Units */}
                <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-850 flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {[1, 2, 3, 4].map(unitNum => {
                    const unitMilestones = roadMilestones.filter(m => m.unit === unitNum);
                    const doneInUnit = unitMilestones.filter(m => completedMilestones.includes(m.id)).length;
                    const isUnitCompleted = doneInUnit === unitMilestones.length && unitMilestones.length > 0;
                    const isActive = activeUnitTab === unitNum;

                    return (
                      <button
                        key={unitNum}
                        onClick={() => setActiveUnitTab(unitNum)}
                        className={`flex-1 min-w-[125px] py-3 px-4 rounded-xl text-center cursor-pointer transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md font-semibold'
                            : 'text-slate-400 hover:text-slate-200 font-bold hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="text-xs uppercase tracking-wider opacity-85">
                          {`Unit ${unitNum}`}
                        </div>
                        <div className="text-xs mt-0.5 truncate font-semibold">
                          {unitNum === 1 && ('Foundations')}
                          {unitNum === 2 && ('Concept Mastery')}
                          {unitNum === 3 && ('Speed Trials')}
                          {unitNum === 4 && ('Completed')}
                        </div>
                        <div className="mt-1.5 flex items-center justify-center gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive ? 'bg-indigo-900/40 text-indigo-200' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {doneInUnit}/{unitMilestones.length}
                          </span>
                          {isUnitCompleted && (
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3.5]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Unit Description */}
                <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800/60">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 uppercase tracking-wide">
                    {(() => {
                      const firstMilestone = roadMilestones.find(m => m.unit === activeUnitTab);
                      return firstMilestone ? firstMilestone.unitTitle : '';
                    })()}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                    {activeUnitTab === 1 && 'Intensive remedial drills tailored to patch subject-matter gaps first.'}
                    {activeUnitTab === 2 && 'Expanding core conceptual foundations with high-yield challenges.'}
                    {activeUnitTab === 3 && 'Advanced full-length subjects under simulated real-world conditions.'}
                    {activeUnitTab === 4 && 'Final predictive assessment and peak mock run for university prep.'}
                  </p>
                </div>

                {/* Clean Grid Tracker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadMilestones
                    .filter(m => m.unit === activeUnitTab)
                    .map((m) => {
                      const isCompleted = completedMilestones.includes(m.id);
                      const mIdx = roadMilestones.indexOf(m);
                      const isUnlocked = mIdx === 0 || completedMilestones.includes(roadMilestones[mIdx - 1].id);

                      return (
                        <div
                          key={m.id}
                          className={`group relative p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-4 ${
                            isCompleted
                              ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-200'
                              : isUnlocked
                                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200 shadow-xl'
                                : 'bg-slate-950/20 border-slate-950 text-slate-500 opacity-55'
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                              isCompleted 
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : isUnlocked
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-slate-900/40 text-slate-500'
                            }`}>
                              {m.title.split(':')[0]}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {isCompleted ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Done
                                </span>
                              ) : !isUnlocked ? (
                                <span className="text-xs font-semibold text-slate-600 bg-slate-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-900">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Title and Subtitle */}
                          <div className="space-y-1">
                            <h5 className={`text-sm font-semibold line-clamp-1 group-hover:text-white transition-colors tracking-tight ${
                              isUnlocked ? 'text-slate-100' : 'text-slate-500'
                            }`}>
                              {m.title.substring(m.title.indexOf(':') + 1).trim()}
                            </h5>
                            <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                              isUnlocked ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {m.subtitle}
                            </p>
                          </div>

                          {/* Action */}
                          <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                              <span className="opacity-75">Action:</span>
                              <span className="text-slate-200">
                                {m.actionType === 'study' && ('Study Guide')}
                                {m.actionType === 'practice' && ('Interactive MCQ')}
                                {m.actionType === 'simulator' && ('Exam Sim')}
                                {m.actionType === 'leaderboard' && ('Leaderboard')}
                                {m.actionType === 'upgrade' && ('Trophy Victory')}
                              </span>
                            </div>

                            {isUnlocked && (
                              <button
                                onClick={() => setSelectedMilestone(m)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-md ${
                                  isCompleted
                                    ? 'bg-slate-950 text-slate-300 hover:bg-slate-900 border border-slate-800'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                                }`}
                              >
                                {isCompleted ? (
                                  <span>Review</span>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-white" />
                                    <span>
                                      {m.actionType === 'study' && ('Read Guide')}
                                      {m.actionType === 'practice' && ('Solve MCQ')}
                                      {m.actionType === 'simulator' && ('Start Simulation')}
                                      {m.actionType === 'leaderboard' && ('View Ranking')}
                                      {m.actionType === 'upgrade' && ('Claim Reward')}
                                    </span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              // Study plan content
              <div className="space-y-4">
                {userPlan ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto shadow-inner">
                      {userPlan}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        This study plan was generated once upon signup and is persisted to your student profile.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                    <HelpCircle className="w-12 h-12 text-indigo-400/80 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        No Study Plan Found
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Generate a personalised 4-week study plan based on your stream, daily hours, and weak subjects.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateAIStudyPlan}
                      disabled={isGeneratingPlan}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mx-auto"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating plan...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate My Study Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Collapse button at bottom */}
            <div className="pt-2 flex justify-center border-t border-slate-800/40">
              <button
                onClick={() => setIsRoadmapExpanded(false)}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Collapse Roadmap View</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Milestone Interactive Overlay */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0F1218] border border-slate-800 w-full max-w-md rounded-xl p-6 relative overflow-hidden shadow-2xl space-y-5 text-left"
            >
              {/* Colored background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {`Unit ${selectedMilestone.unit} • Milestone`}
                </span>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    {renderMilestoneIcon(selectedMilestone.icon, "w-5 h-5")}
                  </span>
                  <span>{selectedMilestone.title}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed pl-11">
                  {selectedMilestone.subtitle}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Reward
                  </div>
                  <div className="text-sm font-semibold text-amber-400 mt-0.5 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-amber-400" />
                    <span>+{selectedMilestone.xp} XP Score</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Status
                  </div>
                  <div className="mt-0.5">
                    {completedMilestones.includes(selectedMilestone.id) ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedMilestone(null);
                    if (selectedMilestone.actionType === 'study') {
                      onTabChange('study');
                    } else if (selectedMilestone.actionType === 'practice') {
                      onTabChange('practice');
                    } else if (selectedMilestone.actionType === 'simulator') {
                      onTabChange('simulator');
                    } else if (selectedMilestone.actionType === 'leaderboard') {
                      onTabChange('leaderboard');
                    } else if (selectedMilestone.actionType === 'upgrade') {
                      onTabChange('upgrade');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {`Launch ${selectedMilestone.actionType.toUpperCase()} Goal`}
                  </span>
                </button>

                <button
                  onClick={() => handleToggleMilestone(selectedMilestone)}
                  className={`w-full py-2.5 border rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                    completedMilestones.includes(selectedMilestone.id)
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {completedMilestones.includes(selectedMilestone.id) ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Mark as Incomplete</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark as Completed</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
