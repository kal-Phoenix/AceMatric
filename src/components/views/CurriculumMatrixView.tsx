import { useState } from 'react';
import { 
  Search, 
  Check, 
  CheckCircle2, 
  Dna, 
  Atom, 
  Orbit, 
  Percent, 
  BookOpen, 
  Globe, 
  Coins, 
  GraduationCap, 
  X, 
  ArrowRight,
  TrendingUp,
  Award,
  BookMarked,
  Layers
} from 'lucide-react';
import { Stream, Language } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';

interface CurriculumMatrixViewProps {
  language?: Language;
  stream: Stream;
  studiedChapters: string[];
  onSelectChapter: (grade: number, subject: string, chapterNumber: number) => void;
  isOfflineMode?: boolean;
  onClose?: () => void;
}

export default function CurriculumMatrixView({
  stream,
  studiedChapters = [],
  onSelectChapter,
  onClose
}: CurriculumMatrixViewProps) {

  // --- SPREADSHEET MATRIX STATE ---
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixStream, setMatrixStream] = useState<'Natural' | 'Social'>(
    stream === 'Natural Science' ? 'Natural' : 'Social'
  );
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<'all' | 'studied' | 'incomplete'>('all');

  // Subjects based on selected matrixStream
  const subjectsForMatrixStream = matrixStream === 'Natural' 
    ? ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT']
    : ['Maths', 'History', 'Geography', 'Economics', 'English', 'SAT'];

  // Retrieve current active stream data
  const matrixCurStream = ETHIOPIAN_CURRICULUM.find(s => s.stream === matrixStream);

  // Helper to get subject color scheme (for tags, progress bars, highlights)
  const getSubjectColorScheme = (subj: string) => {
    const norm = subj.toLowerCase();
    if (norm.includes('phys')) {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        glow: 'shadow-rose-500/20',
        pillBg: 'bg-rose-500',
        accent: 'rose'
      };
    }
    if (norm.includes('chem')) {
      return {
        text: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        glow: 'shadow-sky-500/20',
        pillBg: 'bg-sky-500',
        accent: 'sky'
      };
    }
    if (norm.includes('biol')) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/20',
        pillBg: 'bg-emerald-500',
        accent: 'emerald'
      };
    }
    if (norm.includes('math')) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/20',
        pillBg: 'bg-amber-500',
        accent: 'amber'
      };
    }
    if (norm.includes('hist')) {
      return {
        text: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        glow: 'shadow-indigo-500/20',
        pillBg: 'bg-indigo-500',
        accent: 'indigo'
      };
    }
    if (norm.includes('geog')) {
      return {
        text: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
        glow: 'shadow-teal-500/20',
        pillBg: 'bg-teal-500',
        accent: 'teal'
      };
    }
    if (norm.includes('econ')) {
      return {
        text: 'text-fuchsia-400',
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/20',
        glow: 'shadow-fuchsia-500/20',
        pillBg: 'bg-fuchsia-500',
        accent: 'fuchsia'
      };
    }
    if (norm.includes('engl')) {
      return {
        text: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        glow: 'shadow-violet-500/20',
        pillBg: 'bg-violet-500',
        accent: 'violet'
      };
    }
    if (norm.includes('sat') || norm.includes('aptitude')) {
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        glow: 'shadow-orange-500/20',
        pillBg: 'bg-orange-500',
        accent: 'orange'
      };
    }
    return {
      text: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      glow: 'shadow-slate-500/20',
      pillBg: 'bg-slate-500',
      accent: 'slate'
    };
  };

  const getSubjectIcon = (subj: string) => {
    const norm = subj.toLowerCase();
    if (norm.includes('phys')) return <Orbit className="w-4 h-4" />;
    if (norm.includes('chem')) return <Atom className="w-4 h-4" />;
    if (norm.includes('biol')) return <Dna className="w-4 h-4" />;
    if (norm.includes('math')) return <Percent className="w-4 h-4" />;
    if (norm.includes('hist')) return <BookOpen className="w-4 h-4" />;
    if (norm.includes('geog')) return <Globe className="w-4 h-4" />;
    if (norm.includes('econ')) return <Coins className="w-4 h-4" />;
    if (norm.includes('engl')) return <BookMarked className="w-4 h-4" />;
    if (norm.includes('sat') || norm.includes('aptitude')) return <Award className="w-4 h-4" />;
    return <GraduationCap className="w-4 h-4" />;
  };

  // --- COMPUTE STATISTICS FOR ACTIVE STREAM SPREADSHEET ---
  let totalChaptersCount = 0;
  let completedChaptersCount = 0;
  const subjectProgressCounts: Record<string, { total: number; completed: number }> = {};

  subjectsForMatrixStream.forEach(subj => {
    subjectProgressCounts[subj] = { total: 0, completed: 0 };
    [9, 10, 11, 12].forEach(g => {
      const subObj = matrixCurStream?.subjects.find(s => s.subject === subj && s.grade === g);
      if (subObj) {
        subObj.chapters.forEach(ch => {
          totalChaptersCount++;
          subjectProgressCounts[subj].total++;
          
          const isStudied = studiedChapters.includes(`${g}-${subj}-${ch.chapterNumber}`) || studiedChapters.includes(`${subj}-${ch.chapterNumber}`);
          if (isStudied) {
            completedChaptersCount++;
            subjectProgressCounts[subj].completed++;
          }
        });
      }
    });
  });

  const overallProgressPercent = totalChaptersCount > 0 
    ? Math.round((completedChaptersCount / totalChaptersCount) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Layers className="w-5 h-5" />
            </span>
            <span>Syllabus Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore the complete Grade 9-12 national syllabus and track your progress.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Explorer</span>
          </button>
        )}
      </div>

      {/* 1. FILTER & SEARCH CONTROL BAR */}
      <div className="bg-[#1E293B] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Stream toggler inside Grid */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Syllabus Stream Focus
          </label>
          <div className="flex bg-[#0F172A] rounded-2xl border border-slate-800 p-1 self-start">
            <button
              onClick={() => {
                setMatrixStream('Natural');
                setMatrixSearch('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                matrixStream === 'Natural' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Natural Science</span>
            </button>
            <button
              onClick={() => {
                setMatrixStream('Social');
                setMatrixSearch('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                matrixStream === 'Social' 
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-black shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              <span>Social Science</span>
            </button>
          </div>
        </div>

        {/* Completion Status Filter */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Completion Tracker Status
          </label>
          <div className="flex bg-[#0F172A] rounded-2xl border border-slate-800 p-1 self-start">
            {[
              { id: 'all', label: 'All Chapters' },
              { id: 'studied', label: 'Completed' },
              { id: 'incomplete', label: 'Incomplete' }
            ].map((filt) => (
              <button
                key={filt.id}
                onClick={() => setMatrixStatusFilter(filt.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixStatusFilter === filt.id 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Spreadsheet Search Bar */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-md">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Spreadsheet Filter
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              placeholder="Search topics e.g. Calculus, Atom, Cell..."
              className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-2xl pl-10 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            {matrixSearch && (
              <button
                onClick={() => setMatrixSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CURRICULUM MATRIX STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#131E32] border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Syllabus Chapters
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-black text-white">{totalChaptersCount}</span>
              <span className="text-xs text-slate-400 font-bold">Total Units</span>
            </div>
          </div>
        </div>

        <div className="bg-[#131E32] border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Units Studied
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-black text-emerald-400">{completedChaptersCount}</span>
              <span className="text-xs text-slate-400 font-bold">/ {totalChaptersCount} ({overallProgressPercent}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#131E32] border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Curriculum Mastery
            </span>
            <div className="w-full bg-[#0F172A] rounded-full h-2.5 mt-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#131E32] border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl text-fuchsia-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Exam Readiness
            </span>
            <span className="text-base font-black text-white mt-1 block">
              {overallProgressPercent >= 80 ? '🏆 Excellence' : overallProgressPercent >= 50 ? '⚡ Strong Pace' : '📘 Needs Review'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. CURRICULUM SYLLABUS MATRIX GRID */}
      <div className="bg-[#131E32] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse border-b border-slate-800 text-left min-w-[950px]">
                
                <thead>
                  {/* Main Row Headers */}
                  <tr className="bg-[#111A2E] border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-800 font-black text-slate-200 w-[18%] min-w-[170px] shrink-0">
                      Subject / Discipline
                    </th>
                    <th className="p-4 border-r border-slate-800 text-center font-black text-slate-200 w-[20.5%] min-w-[195px]">
                      Grade 9
                    </th>
                    <th className="p-4 border-r border-slate-800 text-center font-black text-slate-200 w-[20.5%] min-w-[195px]">
                      Grade 10
                    </th>
                    <th className="p-4 border-r border-slate-800 text-center font-black text-slate-200 w-[20.5%] min-w-[195px]">
                      Grade 11
                    </th>
                    <th className="p-4 border-r border-slate-800 text-center font-black text-slate-200 w-[20.5%] min-w-[195px]">
                      Grade 12
                    </th>
                  </tr>
                </thead>

                {/* 3. Table Rows per Subject */}
                <tbody>
                  {subjectsForMatrixStream.map((subj) => {
                    const colors = getSubjectColorScheme(subj);
                    const subProgress = subjectProgressCounts[subj] || { total: 0, completed: 0 };
                    const subProgressPercent = subProgress.total > 0 
                      ? Math.round((subProgress.completed / subProgress.total) * 100) 
                      : 0;

                    return (
                      <tr 
                        key={subj} 
                        className="border-b border-slate-800/80 hover:bg-slate-900/10 transition-colors"
                      >
                        
                        {/* Column A: Subject Badge */}
                        <td className="p-4 border-r border-slate-800 w-[18%] min-w-[170px] shrink-0 align-top">
                      <div className="space-y-2.5">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-xl border ${colors.bg} ${colors.border} ${colors.text} shrink-0`}>
                            {getSubjectIcon(subj)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-100">{subj}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {subProgress.total} Total Units
                            </span>
                          </div>
                        </div>

                        {/* Subject Mini-Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                            <span>Syllabus coverage</span>
                            <span className="text-emerald-400">{subProgressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                            <div 
                              className={`h-full rounded-full ${colors.pillBg}`} 
                              style={{ width: `${subProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columns B, C, D, E: Chapter Cards for Grades 9, 10, 11, 12 */}
                    {[9, 10, 11, 12].map((g) => {
                      const subjectData = matrixCurStream?.subjects.find(
                        (s) => s.subject === subj && s.grade === g
                      );
                      const chapters = subjectData ? subjectData.chapters : [];

                      // Apply search and status filters inside cells
                      const filteredChapters = chapters.filter(ch => {
                        const matchesSearch = matrixSearch === '' 
                          || ch.chapterName.toLowerCase().includes(matrixSearch.toLowerCase())
                          || `chapter ${ch.chapterNumber}`.toLowerCase().includes(matrixSearch.toLowerCase())
                          || ch.chapterNumber.toString() === matrixSearch;

                        const isStudied = studiedChapters.includes(`${g}-${subj}-${ch.chapterNumber}`) || studiedChapters.includes(`${subj}-${ch.chapterNumber}`);
                        const matchesStatus = matrixStatusFilter === 'all'
                          || (matrixStatusFilter === 'studied' && isStudied)
                          || (matrixStatusFilter === 'incomplete' && !isStudied);

                        return matchesSearch && matchesStatus;
                      });

                      return (
                        <td 
                          key={g} 
                          className="p-3 border-r border-slate-800/80 align-top w-[20.5%] min-w-[195px]"
                        >
                          {chapters.length === 0 ? (
                            <div className="h-full min-h-[90px] border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                              <span className="text-[10px] font-mono text-slate-600 font-semibold">
                                N/A in Syllabus
                              </span>
                            </div>
                          ) : filteredChapters.length === 0 ? (
                            <div className="h-full min-h-[90px] bg-slate-950/20 rounded-2xl flex items-center justify-center p-3 text-center">
                              <span className="text-[10px] text-slate-500 font-bold">
                                {matrixSearch ? 'No matches' : 'Empty filter'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                              {filteredChapters.map((ch) => {
                                const isStudied = studiedChapters.includes(`${g}-${subj}-${ch.chapterNumber}`) || studiedChapters.includes(`${subj}-${ch.chapterNumber}`);
                                
                                // Highlight matching chapters if search is active
                                const isSearchActive = matrixSearch !== '';
                                const isHighlighted = isSearchActive;

                                return (
                                  <div
                                    key={ch.chapterNumber}
                                    onClick={() => onSelectChapter(g, subj, ch.chapterNumber)}
                                    className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between h-auto gap-2 text-xs select-none ${
                                      isStudied 
                                        ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400' 
                                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                                    } ${
                                      isHighlighted 
                                        ? 'ring-2 ring-teal-400 border-teal-400 shadow-teal-500/10' 
                                        : ''
                                    }`}
                                  >
                                    
                                    {/* Top Metadata */}
                                    <div className="flex items-start justify-between gap-1.5">
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}>
                                        Ch {ch.chapterNumber}
                                      </span>
                                      
                                      {/* Completion Checkmark */}
                                      {isStudied && (
                                        <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                          <Check className="w-3 h-3 font-bold" />
                                        </span>
                                      )}
                                    </div>

                                    {/* Chapter Title */}
                                    <p className="font-extrabold text-[11px] leading-snug text-slate-100 group-hover:text-teal-300 transition-colors block">
                                      {ch.chapterName}
                                    </p>

                                    {/* Quick Link Hover Arrow */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 group-hover:text-teal-400 pt-1 border-t border-slate-900/40 transition-colors">
                                      <span>Study notes</span>
                                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}

                      </tr>
                    );
                  })}
                </tbody>

              </table>
        </div>

      </div>

    </div>
  );
}
