import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Check,
  X,
  HelpCircle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  RotateCcw,
  Maximize2,
  Minimize2,
  Clock,
  Orbit,
  Atom,
  Dna,
  Percent,
  Globe,
  Coins,
  BookMarked,
  Award,
  GraduationCap,
  Target
} from 'lucide-react';
import { Stream, Language, PracticeQuestion } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { db } from '../../lib/supabase';
import CurriculumMatrixView from './CurriculumMatrixView';
import VideoPlayer from './learning/VideoPlayer';
import ChapterSelector from './learning/ChapterSelector';
import StudyNotes from './learning/StudyNotes';
import FormulaSheet from './learning/FormulaSheet';
import { sanitizeHtml } from '../../lib/sanitize';
import { getTopicVideo } from '../../data/topicVideos';

interface LearningViewProps {
  stream: Stream;
  language: Language;
  isPremium: boolean;
  onOpenUpgrade: () => void;
  onJumpToExplainer: (qText: string, subj: string) => void;
  initialNoteId?: string;
  isOfflineMode?: boolean;
  onCompleteStudy?: (subject: string, chapterName: string, durationMinutes: number) => void;
  initialGrade?: number;
  initialSubject?: string;
  initialChapterNum?: number;
  onClearDeepLink?: () => void;
}

export default function LearningView({
  stream,
  language,
  isPremium,
  onOpenUpgrade,
  onJumpToExplainer,
  initialNoteId,
  isOfflineMode,
  onCompleteStudy,
  initialGrade,
  initialSubject,
  initialChapterNum,
  onClearDeepLink,
}: LearningViewProps) {
  

  // --- CURRICULUM STATE ---
  const [selectedGrade, setSelectedGrade] = useState<number>(12);
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'notebook' | 'recall'>('notebook');
  const [viewMode, setViewMode] = useState<'explorer' | 'matrix'>('explorer');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // --- INTERACTIVE CUSTOM STATES FOR TEXTBOOK DESIGN ---
  const [isVideoExpanded, setIsVideoExpanded] = useState<boolean>(false);
  const [noteLanguage, setNoteLanguage] = useState<'en' | 'am'>(language);
  const [recallMode, setRecallMode] = useState<'quiz' | 'flashcards'>('quiz');
  const [expandedSubtopicIndex, setExpandedSubtopicIndex] = useState<number>(0);
  // Custom smart reader states
  const [noteFontSize, setNoteFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [highlightKeyTerms, setHighlightKeyTerms] = useState<boolean>(false);
  const [formulaQuizMode, setFormulaQuizMode] = useState<boolean>(false);
  const [revealedFormulas, setRevealedFormulas] = useState<number[]>([]);
  const [formulaSearchQuery, setFormulaSearchQuery] = useState<string>('');
  const [isSelectorCollapsed, setIsSelectorCollapsed] = useState<boolean>(true);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(true);
  const [isChapterEntered, setIsChapterEntered] = useState<boolean>(false);

  // --- ZEN FOCUS MODE STATES ---
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [showZenNotes, setShowZenNotes] = useState<boolean>(false);
  const [zenTimeElapsed, setZenTimeElapsed] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // --- CHAPTER CONTENT (loaded from Supabase) ---
  const [studyMaterial, setStudyMaterial] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState<boolean>(false);

  // --- QUESTIONS from Supabase ---
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  useEffect(() => {
    db.getQuestions().then(setAllQuestions).catch(() => {});
  }, []);

  // Zen mode timer effect
  useEffect(() => {
    let interval: any = null;
    if (isZenMode && !isTimerPaused) {
      interval = setInterval(() => {
        setZenTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isZenMode, isTimerPaused]);

  // Format Zen elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync note language if root language changes
  useEffect(() => {
    setNoteLanguage(language);
  }, [language]);

  useEffect(() => {
    setExpandedSubtopicIndex(0);
    setRevealedFormulas([]);
    setFormulaSearchQuery('');
  }, [selectedGrade, selectedSubject, selectedChapterNum]);

  // Font size mapper
  const getFontSizeClass = () => {
    if (noteFontSize === 'sm') return 'text-xs sm:text-sm leading-relaxed';
    if (noteFontSize === 'lg') return 'text-base sm:text-lg leading-loose';
    return 'text-sm sm:text-base leading-relaxed';
  };

  // Keyword highlighter
  const renderHighlightedText = (text: string) => {
    if (!text) return '';
    if (!highlightKeyTerms) return text;
    
    const keywords = [
      "coulomb's law", "electrostatic force", "electric field", "electric potential", "potential energy", "capacitor", "capacitance", "dielectric",
      "limit", "indeterminate form", "continuity", "derivative", "tangent line", "optimization", "critical point", "L’Hôpital’s Rule",
      "acid", "base", "Arrhenius", "Brønsted-Lowry", "Lewis", "conjugate", "pH", "buffer", "titration", "indicator",
      "cell theory", "organelle", "mitochondria", "ribosome", "passive transport", "active transport", "cellular respiration", "ATP", "mitosis", "meiosis",
      "macroeconomics", "monetary policy", "fiscal policy", "inflation", "unemployment", "GDP", "taxation"
    ];

    let parsed = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword}s?)\\b`, 'gi');
      parsed = parsed.replace(regex, '<mark class="bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 px-1 py-0.5 rounded font-semibold">$1</mark>');
    });

    return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed) }} />;
  };



  // --- SPREADSHEET MATRIX STATE ---
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixStream, setMatrixStream] = useState<'Natural' | 'Social'>(stream === 'Natural Science' ? 'Natural' : 'Social');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<'all' | 'studied' | 'incomplete'>('all');

  // --- FLASHCARD STATE ---
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);

  // --- INTERACTIVE QUIZ STATE ---
  const [currentQuizQuestionIdx, setCurrentQuizQuestionIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [completedQuiz, setCompletedQuiz] = useState<boolean>(false);

  // --- OFFLINE CACHING STATE ---
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [studiedChapters, setStudiedChapters] = useState<string[]>([]);

  useEffect(() => {
    db.getSavedChapters().then(setSavedNotes).catch(() => {});
    db.getStudiedChapters().then(setStudiedChapters).catch(() => {});
  }, []);



  // --- INTEGRATION FOR DEEP LINKS (initialNoteId) ---
  useEffect(() => {
    if (initialNoteId) {
      if (initialNoteId === 'note-phys-elec') {
        setSelectedGrade(11);
        setSelectedSubject('Physics');
        setSelectedChapterNum(6); // Electrostatics & Electric Circuit
        setActiveSubTab('notebook');
        setIsChapterEntered(true);
      } else if (initialNoteId === 'note-math-calc') {
        setSelectedGrade(12);
        setSelectedSubject('Mathematics');
        setSelectedChapterNum(2); // Introduction to Calculus
        setActiveSubTab('notebook');
        setIsChapterEntered(true);
      } else if (initialNoteId === 'note-eco-policy') {
        setSelectedGrade(12);
        setSelectedSubject('Economics');
        setSelectedChapterNum(4); // Macroeconomic Policy Instruments
        setActiveSubTab('notebook');
        setIsChapterEntered(true);
      }
    }
  }, [initialNoteId]);

  useEffect(() => {
    if (initialGrade !== undefined && initialSubject && initialChapterNum !== undefined) {
      setSelectedGrade(initialGrade);
      setSelectedSubject(initialSubject);
      setSelectedChapterNum(initialChapterNum);
      setIsChapterEntered(true);
      setActiveSubTab('notebook');
      setViewMode('explorer');
      if (onClearDeepLink) {
        onClearDeepLink();
      }
    }
  }, [initialGrade, initialSubject, initialChapterNum, onClearDeepLink]);

  // --- UTILS FOR NAVIGATION ---
  const streamKey = stream === 'Natural Science' ? 'Natural' : 'Social';
  const curStream = ETHIOPIAN_CURRICULUM.find(s => s.stream === streamKey);

  // --- FAST-TRACK SELECTION & SEARCH SYSTEM ---
  const [selectionMethod, setSelectionMethod] = useState<'matrix' | 'classic'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allChapters = useMemo(() => {
    const list: Array<{ grade: number; subject: string; chapterNumber: number; chapterName: string }> = [];
    if (curStream) {
      curStream.subjects.forEach(sub => {
        sub.chapters.forEach(ch => {
          list.push({
            grade: sub.grade,
            subject: sub.subject,
            chapterNumber: ch.chapterNumber,
            chapterName: ch.chapterName
          });
        });
      });
    }
    return list;
  }, [curStream]);

  const filteredSearchChapters = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allChapters.filter(ch => 
      ch.chapterName.toLowerCase().includes(query) ||
      ch.subject.toLowerCase().includes(query) ||
      `grade ${ch.grade}`.includes(query) ||
      `g-${ch.grade}`.includes(query) ||
      `unit ${ch.chapterNumber}`.includes(query)
    ).slice(0, 5);
  }, [searchQuery, allChapters]);

  const subjectsForGrade = curStream ? curStream.subjects.filter(sub => sub.grade === selectedGrade) : [];
  
  // Normalized unique subject list
  const uniqueSubjects = Array.from(new Set(subjectsForGrade.map(s => s.subject)));

  // Sync state when Grade changes
  const handleGradeChange = (grade: number) => {
    setSelectedGrade(grade);
    const subjects = curStream ? curStream.subjects.filter(sub => sub.grade === grade) : [];
    const subjectNames = Array.from(new Set(subjects.map(s => s.subject)));
    if (subjectNames.length > 0) {
      if (!subjectNames.includes(selectedSubject)) {
        // Find closest match or first available
        setSelectedSubject(subjectNames[0]);
      }
    }
    setSelectedChapterNum(1);
    resetQuizState();
  };

  // Sync state when Subject changes
  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    setSelectedChapterNum(1);
    resetQuizState();
  };

  const handleChapterChange = (chNum: number) => {
    setSelectedChapterNum(chNum);
    resetQuizState();
  };

  const resetQuizState = () => {
    setSelectedOptionId(null);
    setShowExplanation(false);
    setCurrentQuizQuestionIdx(0);
    setQuizScore(0);
    setCompletedQuiz(false);
    setFlashcardIndex(0);
    setIsFlashcardFlipped(false);
  };

  // Get current active chapters
  const currentSubjectCurriculum = subjectsForGrade.find(s => s.subject === selectedSubject);
  const chapters = currentSubjectCurriculum ? currentSubjectCurriculum.chapters : [];
  const selectedChapter = chapters.find(ch => ch.chapterNumber === selectedChapterNum) || chapters[0];

  // Fetch chapter content from Supabase (lazy-generated + cached)
  useEffect(() => {
    if (!selectedChapter) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setContentLoading(true);
    setStudyMaterial(null);
    db.getChapterContent(selectedGrade, selectedSubject, selectedChapter.chapterNumber)
      .then(setStudyMaterial)
      .catch(() => setStudyMaterial(null))
      .finally(() => setContentLoading(false));
  }, [selectedGrade, selectedSubject, selectedChapter?.chapterNumber]);

  const currentCacheKey = `cache-${selectedGrade}-${selectedSubject}-${selectedChapterNum}`;
  const isCurrentChapterSaved = savedNotes.includes(currentCacheKey);

  const toggleSaveOffline = () => {
    db.toggleSavedChapter(currentCacheKey).then(setSavedNotes).catch(() => {});
  };

  const toggleMarkStudied = () => {
    const key = `${selectedGrade}-${selectedSubject}-${selectedChapterNum}`;
    const chapterTitle = selectedChapter ? selectedChapter.chapterName : `Chapter ${selectedChapterNum}`;
    const isNowStudied = !studiedChapters.includes(key);

    db.toggleStudiedChapter(key).then(setStudiedChapters).catch(() => {});

    if (isNowStudied && onCompleteStudy) {
      onCompleteStudy(selectedSubject, chapterTitle, 20);
    }
  };

  // --- DYNAMIC PRACTICE QUESTION ALIGNMENT ---
  const activeQuizQuestions = allQuestions.filter(q => {
    const qSubj = q.subject === 'Mathematics' ? 'Maths' : q.subject;
    const targetSubj = selectedSubject === 'Mathematics' ? 'Maths' : selectedSubject;
    if (qSubj.toLowerCase() !== targetSubj.toLowerCase()) return false;

    // Filter questions whose chapter mentions words from the selected chapter name
    if (selectedChapter) {
      const words = selectedChapter.chapterName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return words.some(word => q.chapter.toLowerCase().includes(word));
    }
    return false;
  });

  // Fallback to any general subject questions so the student is never left empty
  const displayedQuestions = activeQuizQuestions.length > 0 
    ? activeQuizQuestions 
    : allQuestions.filter(q => {
        const qSubj = q.subject === 'Mathematics' ? 'Maths' : q.subject;
        const targetSubj = selectedSubject === 'Mathematics' ? 'Maths' : selectedSubject;
        return qSubj.toLowerCase() === targetSubj.toLowerCase();
      });

  const currentQuestion = displayedQuestions[currentQuizQuestionIdx];

  // Past papers removed - empty array
  const streamPapers: any[] = [];

  // --- DYNAMIC FLASHCARDS GENERATION ---
  const chapterFlashcards = (() => {
    const list: Array<{ front: string; back: string; formula?: string; category: string }> = [];
    
    // 1. Load from custom study material key terms / formulas
    if (studyMaterial && studyMaterial.materials) {
      studyMaterial.materials.forEach((mat: { name: string; description: string; formula?: string }) => {
        list.push({
          front: `What is the definition/concept of "${mat.name}"?`,
          back: mat.description,
          formula: mat.formula,
          category: selectedSubject
        });
      });
    }

    // 2. Flashcards removed - no external flashcard data

    return list;
  })();

  // Dynamic Icons helper
  const getSubjectIcon = (subj: string) => {
    const norm = subj.toLowerCase();
    if (norm.includes('phys')) return <Orbit className="w-4 h-4 text-rose-400" />;
    if (norm.includes('chem')) return <Atom className="w-4 h-4 text-sky-400" />;
    if (norm.includes('biol')) return <Dna className="w-4 h-4 text-emerald-400" />;
    if (norm.includes('math')) return <Percent className="w-4 h-4 text-amber-400" />;
    if (norm.includes('hist')) return <BookOpen className="w-4 h-4 text-indigo-400" />;
    if (norm.includes('geog')) return <Globe className="w-4 h-4 text-blue-400" />;
    if (norm.includes('econ')) return <Coins className="w-4 h-4 text-fuchsia-400" />;
    if (norm.includes('engl')) return <BookMarked className="w-4 h-4 text-violet-400" />;
    if (norm.includes('sat')) return <Award className="w-4 h-4 text-orange-400" />;
    return <GraduationCap className="w-4 h-4 text-slate-400" />;
  };

  const handleSelectFromMatrix = (grade: number, subject: string, chapterNumber: number) => {
    setSelectedGrade(grade);
    setSelectedSubject(subject);
    setSelectedChapterNum(chapterNumber);
    setViewMode('explorer');
    resetQuizState();
    setActiveSubTab('notebook');
    setIsChapterEntered(true);
  };

  return (
    <div className="space-y-6">
      
      {!isChapterEntered ? (
        <ChapterSelector
          stream={stream}
          isOfflineMode={isOfflineMode}
          savedNotes={savedNotes}
          studiedChapters={studiedChapters}
          selectedGrade={selectedGrade}
          selectedSubject={selectedSubject}
          searchQuery={searchQuery}
          showSuggestions={showSuggestions}
          filteredSearchChapters={filteredSearchChapters}
          activeSubject={activeSubject}
          curStream={curStream}
          subjectsForGrade={subjectsForGrade}
          onGradeChange={handleGradeChange}
          onSearchQueryChange={(q) => { setSearchQuery(q); setShowSuggestions(true); }}
          onSearchFocus={() => setShowSuggestions(true)}
          onSuggestionSelect={(grade, subject, chapterNumber) => {
            setSelectedGrade(grade);
            setSelectedSubject(subject);
            setSelectedChapterNum(chapterNumber);
            setSearchQuery('');
            setShowSuggestions(false);
            setIsChapterEntered(true);
            resetQuizState();
          }}
          onActiveSubjectChange={setActiveSubject}
          onChapterEnter={(grade, subject, chapterNumber) => {
            setSelectedGrade(grade);
            setSelectedSubject(subject);
            setSelectedChapterNum(chapterNumber);
            setIsChapterEntered(true);
            resetQuizState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : (
        /* IS CHAPTER ENTERED (DEDICATED IMMERSIVE STUDY PAGE) */
        <div className="space-y-6 text-slate-100">
          
          {/* Focused Study Room Header with Back Button */}
          <div className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={() => {
                  setIsChapterEntered(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-[#0A0E14] hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl flex items-center space-x-2 border border-slate-850 transition-all cursor-pointer self-start sm:self-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>
              
              <div className="space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-mono font-semibold uppercase">
                    Grade {selectedGrade} • {selectedSubject}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                    Unit {selectedChapterNum}
                  </span>
                  {isCurrentChapterSaved && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                      Saved Offline
                    </span>
                  )}
                  {(studiedChapters.includes(`${selectedGrade}-${selectedSubject}-${selectedChapterNum}`) || studiedChapters.includes(`${selectedSubject}-${selectedChapterNum}`)) && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-0.5">
                      ✓ Done
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-white">
                  {selectedChapter ? selectedChapter.chapterName : `Chapter ${selectedChapterNum}`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Font Sizer */}
              <div className="bg-[#0A0E14] p-0.5 rounded-xl border border-slate-800 flex items-center">
                <button
                  onClick={() => setNoteFontSize('sm')}
                  title="Small text size"
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'sm' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setNoteFontSize('base')}
                  title="Normal text size"
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'base' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setNoteFontSize('lg')}
                  title="Large text size"
                  className={`w-7 h-7 text-sm font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'lg' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A+
                </button>
              </div>

              {/* Mark Completed */}
              <button
                onClick={toggleMarkStudied}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border cursor-pointer transition-all ${
                  (studiedChapters.includes(`${selectedGrade}-${selectedSubject}-${selectedChapterNum}`) || studiedChapters.includes(`${selectedSubject}-${selectedChapterNum}`))
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#0A0E14] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${
                  (studiedChapters.includes(`${selectedGrade}-${selectedSubject}-${selectedChapterNum}`) || studiedChapters.includes(`${selectedSubject}-${selectedChapterNum}`)) ? 'text-emerald-400' : 'text-slate-500'
                }`} />
                <span>
                  {(studiedChapters.includes(`${selectedGrade}-${selectedSubject}-${selectedChapterNum}`) || studiedChapters.includes(`${selectedSubject}-${selectedChapterNum}`))
                    ? ('Completed') 
                    : ('Mark Completed')}
                </span>
              </button>

              {/* Fullscreen Mode Toggle */}
              <button
                onClick={() => {
                  setIsZenMode(true);
                  setZenTimeElapsed(0);
                  setIsTimerPaused(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer transition-all"
                title="Enter fullscreen study environment"
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-12 space-y-6">
            
            {/* Simplified Two-Mode Tab Navigator */}
            <div className="bg-[#141920] border border-slate-800 p-2 rounded-xl flex items-center space-x-2 shadow-md">
              <button
                onClick={() => setActiveSubTab('notebook')}
                className={`flex-1 flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'notebook'
                    ? 'bg-white/10 text-slate-300 border border-white/10 shadow-xs scale-[1.01]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Syllabus Study Notebook</span>
              </button>

              <button
                onClick={() => setActiveSubTab('recall')}
                className={`flex-1 flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'recall'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-xs scale-[1.01]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Active Recall Practice</span>
              </button>
            </div>

            {/* Content Area */}
            {contentLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 text-sm">Loading chapter content from database...</p>
                </div>
              </div>
            ) : studyMaterial ? (
          <div className="space-y-6">
            
            {activeSubTab === 'notebook' && (
              <>
                <StudyNotes
                  studyMaterial={studyMaterial}
                  selectedGrade={selectedGrade}
                  selectedSubject={selectedSubject}
                  selectedChapterNum={selectedChapterNum}
                  selectedChapter={selectedChapter}
                  noteFontSize={noteFontSize}
                  studiedChapters={studiedChapters}
                  chapters={chapters}
                  onFontSizeChange={setNoteFontSize}
                  onEnterFullscreen={() => {
                    setIsZenMode(true);
                    setZenTimeElapsed(0);
                    setIsTimerPaused(false);
                  }}
                  onMarkStudied={toggleMarkStudied}
                  onNextChapter={(chNum) => {
                    handleChapterChange(chNum);
                    resetQuizState();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                {studyMaterial.materials && studyMaterial.materials.length > 0 && (
                  <FormulaSheet materials={studyMaterial.materials} />
                )}
                {chapters.find(ch => ch.chapterNumber === selectedChapterNum + 1) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        handleChapterChange(selectedChapterNum + 1);
                        resetQuizState();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-[#0A0E14] hover:bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-xl border border-slate-800/85 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Next Unit</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
{/* --- SUB-TAB 2: ACTIVE RECALL PRACTICE HUB (QUIZ & FLASHCARDS) --- */}
            {activeSubTab === 'recall' && (
              <div className="space-y-6">
                
                {/* Selector inside Active Recall block */}
                <div className="bg-[#141920] border border-slate-800 p-1.5 rounded-xl flex items-center space-x-1 shadow-md">
                  <button
                    onClick={() => setRecallMode('quiz')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      recallMode === 'quiz'
                        ? 'bg-[#0A0E14] text-white border border-slate-800 shadow-inner'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Interactive Micro-Quiz</span>
                  </button>

                  <button
                    onClick={() => setRecallMode('flashcards')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      recallMode === 'flashcards'
                        ? 'bg-[#0A0E14] text-white border border-slate-800 shadow-inner'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Spaced Flashcards</span>
                  </button>
                </div>

                {/* A. QUIZ INTERACTION PANEL */}
                {recallMode === 'quiz' && (
                  <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-semibold text-base text-white">
                          Active Recall Chapter Micro-Quiz
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Test your conceptual mastery. Instant score & analytical explanations.
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase">
                        Mastery Check
                      </span>
                    </div>

                    {displayedQuestions.length === 0 ? (
                      <div className="p-8 text-center bg-[#0A0E14] border border-slate-800 rounded-xl space-y-3">
                        <div className="text-3xl text-slate-500">?</div>
                        <h5 className="font-semibold text-white">No active questions for this chapter yet</h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Use the AI Tutor Explainer to generate custom quiz questions for this chapter instantly.
                        </p>
                        <button
                          onClick={() => onJumpToExplainer(
                            `Please generate a 5-question multiple choice quiz on Grade ${selectedGrade} ${selectedSubject} Chapter ${selectedChapterNum}: ${selectedChapter.chapterName}`,
                            selectedSubject
                          )}
                          className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                        >
                          Ask AI Tutor to Quiz Me
                        </button>
                      </div>
                    ) : !completedQuiz ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>Question {currentQuizQuestionIdx + 1} of {displayedQuestions.length}</span>
                          <span className="text-blue-400">Difficulty: {currentQuestion.difficulty}</span>
                        </div>

                        <div className="bg-[#0A0E14] p-5 rounded-xl border border-slate-800 space-y-3">
                          <p className="text-sm sm:text-base font-semibold text-white leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.questionText) }}
                          />
                        </div>

                        {/* Options Stack */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {currentQuestion.options.map((opt) => {
                            const isSelected = selectedOptionId === opt.id;
                            const isCorrectOpt = opt.id === currentQuestion.correctOptionId;
                            
                            let optStyle = "bg-[#0A0E14] border-slate-800 text-slate-300 hover:bg-[#0F1218] hover:text-white";
                            if (isSelected) {
                              optStyle = "bg-indigo-500/10 border-indigo-500 text-indigo-200";
                            }
                            if (showExplanation) {
                              if (isCorrectOpt) {
                                optStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200";
                              } else if (isSelected) {
                                optStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                              } else {
                                optStyle = "bg-[#0A0E14] border-slate-800 opacity-60 text-slate-400";
                              }
                            }

                            return (
                              <button
                                key={opt.id}
                                disabled={showExplanation}
                                onClick={() => setSelectedOptionId(opt.id)}
                                className={`p-4 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                              >
                                <div className="flex items-center space-x-3 pr-2">
                                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-semibold text-xs shrink-0 text-slate-300">
                                    {opt.id.toUpperCase()}
                                  </span>
                                  <div>
                                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text) }} />
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {showExplanation && isCorrectOpt && <Check className="w-4 h-4 text-emerald-400" />}
                                  {showExplanation && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-rose-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-2 pt-3">
                          {!showExplanation ? (
                            <button
                              disabled={!selectedOptionId}
                              onClick={() => {
                                setShowExplanation(true);
                                if (selectedOptionId === currentQuestion.correctOptionId) {
                                  setQuizScore(prev => prev + 1);
                                }
                              }}
                              className={`px-5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                selectedOptionId 
                                  ? 'bg-blue-600 text-white shadow-md font-semibold' 
                                  : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              Submit Answer
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (currentQuizQuestionIdx + 1 < displayedQuestions.length) {
                                  setCurrentQuizQuestionIdx(prev => prev + 1);
                                  setSelectedOptionId(null);
                                  setShowExplanation(false);
                                } else {
                                  setCompletedQuiz(true);
                                }
                              }}
                              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                            >
                              {currentQuizQuestionIdx + 1 < displayedQuestions.length ? 'Next Question →' : 'Finish Quiz'}
                            </button>
                          )}
                        </div>

                        {/* Real-time explanation */}
                        {showExplanation && (
                          <div className="p-4.5 bg-[#0A0E14] border border-slate-800 rounded-xl animate-slideUp space-y-2.5">
                            <div className="flex items-center space-x-2">
                              <HelpCircle className="w-4 h-4 text-amber-400" />
                              <h5 className="font-semibold text-white text-xs uppercase tracking-wider">
                                Explanation & Workings:
                              </h5>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.explanation) }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Quiz completed reward console
                      <div className="p-8 text-center bg-[#0A0E14] border border-slate-800 rounded-xl space-y-4 max-w-md mx-auto">
                        <Award className="w-12 h-12 text-amber-400 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-white text-lg">Quiz Completed successfully!</h4>
                          <p className="text-xs text-slate-400">
                            Excellent recall session for Grade {selectedGrade} {selectedSubject} Unit {selectedChapterNum}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-bold">Your Score:</span>
                          <span className="font-mono text-lg font-semibold text-white bg-[#0A0E14] border border-slate-800 px-3 py-1 rounded-xl">
                            {quizScore} / {displayedQuestions.length} ({Math.round((quizScore / displayedQuestions.length) * 100)}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={resetQuizState}
                            className="flex-1 py-3 bg-[#0F1218] hover:bg-[#141920] border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                          >
                            Retry Quiz
                          </button>
                          <button
                            onClick={() => onJumpToExplainer(
                              `Please explain the core concepts of Grade ${selectedGrade} ${selectedSubject} Chapter ${selectedChapterNum} so I can prepare better for my next quiz.`,
                              selectedSubject
                            )}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                          >
                            Ask AI Explainer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* B. FLASHCARDS INTERACTION PANEL */}
                {recallMode === 'flashcards' && (
                  <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-semibold text-base text-white flex items-center gap-2">
                          <Layers className="w-5 h-5 text-amber-400" />
                          <span>Spaced Repetition Flashcards</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Practice active recall and spaced repetition for core concepts in this chapter.
                        </p>
                      </div>
                      <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                        {chapterFlashcards.length} Cards Available
                      </span>
                    </div>

                    {chapterFlashcards.length === 0 ? (
                      <div className="p-12 text-center bg-[#0A0E14] border border-slate-800 rounded-xl text-slate-400 text-xs">
                        No flashcards available for this specific unit yet.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Flippable card deck container */}
                        <div
                          onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                          className="relative min-h-[280px] sm:min-h-[320px] bg-[#0A0E14] border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 sm:p-10 shadow-2xl cursor-pointer flex flex-col justify-between transition-all transform hover:scale-[1.01] group select-none overflow-hidden"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="px-3 py-1 bg-slate-800/80 rounded-lg font-bold text-blue-400">
                              {selectedSubject} • Chapter {selectedChapterNum}
                            </span>
                            <span className="text-slate-400 font-bold">
                              {flashcardIndex + 1} / {chapterFlashcards.length}
                            </span>
                          </div>

                          {/* Card text */}
                          <div className="my-auto text-center space-y-4 px-4 py-6">
                            <span className="text-xs uppercase font-semibold text-slate-500 tracking-widest block">
                              {isFlashcardFlipped ? ('Back (Answer / Explanation)') : ('Front (Question / Concept)')}
                            </span>

                            <h3 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                              {isFlashcardFlipped 
                                ? chapterFlashcards[flashcardIndex].back 
                                : chapterFlashcards[flashcardIndex].front
                              }
                            </h3>

                            {isFlashcardFlipped && chapterFlashcards[flashcardIndex].formula && (
                              <div className="inline-block mt-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl font-mono text-xs sm:text-sm text-indigo-300 font-semibold">
                                {chapterFlashcards[flashcardIndex].formula}
                              </div>
                            )}
                          </div>

                          <div className="text-center text-xs text-slate-500 font-bold flex items-center justify-center space-x-1.5 pt-4 border-t border-slate-800/50">
                            <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-slate-400" />
                            <span>Click anywhere on card to flip</span>
                          </div>
                        </div>

                        {/* Grading quality selection */}
                        <div className="bg-[#0A0E14] border border-slate-800 p-5 rounded-xl space-y-3">
                          <p className="text-center text-xs uppercase font-semibold text-slate-400 tracking-wider">
                            How well did you recall this answer?
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <button
                              onClick={() => {
                                setIsFlashcardFlipped(false);
                                setFlashcardIndex((flashcardIndex + 1) % chapterFlashcards.length);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              Hard (Review)
                            </button>
                            <button
                              onClick={() => {
                                setIsFlashcardFlipped(false);
                                setFlashcardIndex((flashcardIndex + 1) % chapterFlashcards.length);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              Good (Practice)
                            </button>
                            <button
                              onClick={() => {
                                setIsFlashcardFlipped(false);
                                setFlashcardIndex((flashcardIndex + 1) % chapterFlashcards.length);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              Easy (Mastered)
                            </button>
                            <button
                              onClick={() => {
                                setIsFlashcardFlipped(false);
                                setFlashcardIndex((flashcardIndex + 1) % chapterFlashcards.length);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-blue-300 font-semibold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-blue-400 font-semibold" />
                              <span>Mastered Unit</span>
                            </button>
                          </div>
                        </div>

                        {/* Navigation dots buttons */}
                        <div className="flex justify-between items-center px-2">
                          <button
                            onClick={() => {
                              setFlashcardIndex(Math.max(0, flashcardIndex - 1));
                              setIsFlashcardFlipped(false);
                            }}
                            disabled={flashcardIndex === 0}
                            className="px-4 py-2 bg-[#0A0E14] hover:bg-slate-800/50 text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40 flex items-center space-x-1 border border-slate-800/80 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>
                          <button
                            onClick={() => {
                              setFlashcardIndex((flashcardIndex + 1) % chapterFlashcards.length);
                              setIsFlashcardFlipped(false);
                            }}
                            className="px-4 py-2 bg-[#0A0E14] hover:bg-slate-800/50 text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1 border border-slate-800/80 cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        ) : (
          <div className="bg-[#141920] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Select a subject and chapter to load lessons and worksheets.
          </div>
        )}
      </div>
      </div>
      )}

      {/* FULLSCREEN STUDY MODE IMMERSIVE OVERLAY */}
      {isZenMode && studyMaterial && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
          {/* Fullscreen Top Header bar */}
          <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#111625]/90 backdrop-blur-md shrink-0">
            <div className="flex items-center space-x-3.5">
              <button
                onClick={() => setIsZenMode(false)}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800/80 transition-all cursor-pointer"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <div className="text-left">
                <span className="text-xs uppercase font-mono font-semibold text-purple-400 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  FULLSCREEN STUDY MODE
                </span>
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {selectedChapter ? selectedChapter.chapterName : `Chapter ${selectedChapterNum}`}
                </h2>
              </div>
            </div>

            {/* Timer widget in center */}
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-[#161D2F] border border-slate-800/80 rounded-xl">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono text-sm font-semibold text-slate-200 tracking-tight">
                  {formatElapsedTime(zenTimeElapsed)}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-800" />
              <button
                onClick={() => setIsTimerPaused(!isTimerPaused)}
                className={`text-xs font-semibold uppercase px-2 py-0.5 rounded transition-all cursor-pointer ${
                  isTimerPaused 
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                }`}
              >
                {isTimerPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => setZenTimeElapsed(0)}
                className="text-xs font-semibold uppercase text-slate-500 hover:text-rose-400 cursor-pointer"
                title="Reset elapsed timer"
              >
                Reset
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2.5">
              {/* Font Sizer */}
              <div className="hidden sm:flex bg-[#0A0E14] p-0.5 rounded-xl border border-slate-800 items-center">
                <button
                  onClick={() => setNoteFontSize('sm')}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'sm' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setNoteFontSize('base')}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'base' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setNoteFontSize('lg')}
                  className={`w-7 h-7 text-sm font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    noteFontSize === 'lg' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A+
                </button>
              </div>
            </div>
          </header>

          {/* Zen Content Grid */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Reading area */}
            <div className="flex-1 overflow-y-auto px-6 py-10 sm:py-16 scroll-smooth bg-[#080A12] selection:bg-purple-500/20">
              {/* Real timer for mobile */}
              <div className="md:hidden flex items-center justify-center mb-8">
                <div className="flex items-center space-x-3 px-4 py-2 bg-[#161D2F] border border-slate-800/80 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono text-xs font-semibold text-slate-200 tracking-tight">
                      {formatElapsedTime(zenTimeElapsed)}
                    </span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-800" />
                  <button
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="text-xs font-semibold uppercase text-purple-400 cursor-pointer"
                  >
                    {isTimerPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </div>

              <div className="max-w-2xl mx-auto space-y-12">
                {/* Visual Accent/Intro Quote to focus them */}
                <div className="text-center space-y-3.5 border-b border-slate-900 pb-10">
                  <div className="inline-flex p-3 bg-purple-500/10 text-purple-300 rounded-xl border border-purple-500/20 shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-mono tracking-widest uppercase text-slate-500 font-semibold">
                      FULLSCREEN STUDY ROOM
                    </p>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-relaxed mt-1">
                      {selectedChapter ? selectedChapter.chapterName : `Chapter ${selectedChapterNum}`}
                    </h1>
                  </div>
                </div>

                {/* Main Text Content */}
                <div className={`space-y-10 text-left ${getFontSizeClass()}`}>
                  {/* Overview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-5 rounded-full bg-purple-500" />
                      <h3 className="text-xs font-mono font-semibold text-purple-400 uppercase tracking-widest">
                        Chapter Overview
                      </h3>
                    </div>
                    <p className="text-slate-300 pl-4 border-l-2 border-purple-500/30 leading-relaxed text-sm sm:text-base">
                      {studyMaterial.overview}
                    </p>
                  </div>

                  {/* Core Points */}
                  {studyMaterial.corePoints && studyMaterial.corePoints.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
                          Core Syllabus Focus Points
                        </h4>
                      </div>
                      <div className="bg-[#121726]/40 border border-slate-800/60 p-6 rounded-xl">
                        <ul className="space-y-3">
                          {studyMaterial.corePoints.map((pt: string, i: number) => (
                            <li key={i} className="flex items-start text-xs sm:text-sm text-slate-300 leading-relaxed">
                              <Target className="w-3.5 h-3.5 text-emerald-400 mr-2.5 mt-0.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Consolidated Exam Preparation Tips & Insights */}
                  {(() => {
                    const collectedTips: Array<{ source?: string; tip: string }> = [];
                    if (studyMaterial.examTips && studyMaterial.examTips.trim()) {
                      collectedTips.push({
                        source: 'General Strategy',
                        tip: studyMaterial.examTips,
                      });
                    }
                    if (studyMaterial.subtopics) {
                      studyMaterial.subtopics.forEach((sub: { title: string; examInsight: string }, idx: number) => {
                        if (sub.examInsight && sub.examInsight.trim()) {
                          collectedTips.push({
                            source: sub.title ? `${selectedChapterNum}.${idx + 1} ${sub.title}` : `Topic ${idx + 1}`,
                            tip: sub.examInsight,
                          });
                        }
                      });
                    }

                    if (collectedTips.length === 0) return null;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-5 rounded-full bg-amber-500" />
                          <h4 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest">
                            Exam Preparation Tips & Insights
                          </h4>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-xl">
                          <ul className="space-y-3.5">
                            {collectedTips.map((item, i) => (
                              <li key={i} className="flex items-start text-xs sm:text-sm text-slate-300 leading-relaxed">
                                <Lightbulb className="w-4 h-4 text-amber-400 mr-2.5 mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                  {item.source && (
                                    <span className="inline-block text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-400 mr-2 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      {item.source}
                                    </span>
                                  )}
                                  <span className="text-amber-100/90">{item.tip}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Vocabulary Terms */}
                  {studyMaterial.materials && studyMaterial.materials.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-slate-900/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-blue-500" />
                        <h4 className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest">
                          Key Terms & Formulas
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {studyMaterial.materials.map((m: { name: string; description: string; formula?: string }, idx: number) => (
                          <div key={idx} className="bg-[#121726]/30 border border-slate-900/60 p-4 rounded-xl hover:border-slate-800/60 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-mono text-xs font-semibold text-blue-300 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-md">
                                {m.name}
                              </span>
                              {m.formula && (
                                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                                  {m.formula}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {m.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtopics */}
                  {studyMaterial.subtopics && studyMaterial.subtopics.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-slate-900/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-purple-500" />
                        <h4 className="text-xs font-mono font-semibold text-purple-400 uppercase tracking-widest">
                          Detailed Breakdown
                        </h4>
                      </div>
                      <div className="space-y-5">
                        {studyMaterial.subtopics.map((sub: { title: string; content: string; examInsight: string; imageUrl?: string; imageCaption?: string }, idx: number) => (
                          <div key={idx} className="bg-[#0D1220]/50 border border-slate-900/60 rounded-xl p-6 sm:p-7 space-y-4">
                            <div className="flex items-center space-x-2.5 border-b border-slate-900/60 pb-3 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                                {selectedChapterNum}.{idx + 1}
                              </div>
                              <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                                {sub.title}
                              </h4>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
                              {sub.imageUrl && (
                                <div className="my-4 overflow-hidden rounded-xl border border-slate-900 bg-[#070B16] flex flex-col items-center p-4">
                                  <img
                                    src={sub.imageUrl}
                                    alt={sub.imageCaption || sub.title}
                                    referrerPolicy="no-referrer"
                                    className="max-h-96 w-auto object-contain rounded-xl"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  {sub.imageCaption && (
                                    <p className="text-xs text-slate-500 mt-2.5 italic font-medium text-center">
                                      {sub.imageCaption}
                                    </p>
                                  )}
                                </div>
                              )}
                              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line" dangerouslySetInnerHTML={{ __html: sanitizeHtml(sub.content || '') }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chapter Video Masterclass & Breakdown */}
                {(() => {
                  const fallbackVideo = getTopicVideo(selectedSubject, selectedGrade, selectedChapterNum, selectedChapter?.chapterName);
                  const validDbVideoId = studyMaterial.youtubeVideoId && studyMaterial.youtubeVideoId !== 'placeholder' && studyMaterial.youtubeVideoId !== 'dQw4w9WgXcQ' ? studyMaterial.youtubeVideoId : null;
                  const videoId = validDbVideoId || fallbackVideo.videoId;
                  const title = studyMaterial.title || `${selectedSubject} - ${selectedChapter?.chapterName || `Chapter ${selectedChapterNum}`}`;
                  const duration = (validDbVideoId ? studyMaterial.videoDuration : null) || fallbackVideo.duration;

                  if (!videoId) return null;

                  return (
                    <div className="space-y-4 pt-6 border-t border-slate-900/80 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-red-500" />
                        <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-widest">
                          Chapter Video Masterclass & Breakdown
                        </h4>
                      </div>
                      <VideoPlayer
                        videoId={videoId}
                        title={title}
                        duration={duration}
                      />
                    </div>
                  );
                })()}

                {/* Visual completion card */}
                <div className="pt-12 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
                  <div className="text-left space-y-1">
                    <h5 className="text-sm font-semibold text-white">
                      Done with this unit study?
                    </h5>
                    <p className="text-xs text-slate-500">
                      Log your study progress to update your leaderboard ranking.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={toggleMarkStudied}
                      className="flex-1 sm:flex-initial px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
                    >
                      ✓ Log Completed
                    </button>
                    <button
                      onClick={() => setIsZenMode(false)}
                      className="flex-1 sm:flex-initial px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Exit Fullscreen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
