import { useState } from 'react';
import {
  Search,
  X,
  ChevronRight,
  Layers,
  GraduationCap,
  Dna,
  Atom,
  Orbit,
  Percent,
  Globe,
  Coins,
  BookOpen,
  BookMarked,
  Award,
} from 'lucide-react';
import { Stream } from '../../../types';
import { StreamCurriculum, SubjectCurriculum, ChapterInfo } from '../../../data/curriculum';

interface ChapterSelectorProps {
  stream: Stream;
  isOfflineMode?: boolean;
  savedNotes: string[];
  studiedChapters: string[];
  selectedGrade: number;
  selectedSubject: string;
  searchQuery: string;
  showSuggestions: boolean;
  filteredSearchChapters: Array<{
    grade: number;
    subject: string;
    chapterNumber: number;
    chapterName: string;
  }>;
  activeSubject: string | null;
  curStream: StreamCurriculum | undefined;
  subjectsForGrade: SubjectCurriculum[];
  onGradeChange: (grade: number) => void;
  onSearchQueryChange: (query: string) => void;
  onSearchFocus: () => void;
  onSuggestionSelect: (grade: number, subject: string, chapterNumber: number) => void;
  onActiveSubjectChange: (subject: string | null) => void;
  onChapterEnter: (grade: number, subject: string, chapterNumber: number) => void;
}

const getSubjectIcon = (subj: string) => {
  const norm = subj.toLowerCase();
  if (norm.includes('phys')) return <Orbit className="w-4 h-4 text-rose-400" />;
  if (norm.includes('chem')) return <Atom className="w-4 h-4 text-sky-400" />;
  if (norm.includes('biol')) return <Dna className="w-4 h-4 text-emerald-400" />;
  if (norm.includes('math')) return <Percent className="w-4 h-4 text-amber-400" />;
  if (norm.includes('hist')) return <BookOpen className="w-4 h-4 text-indigo-400" />;
  if (norm.includes('geog')) return <Globe className="w-4 h-4 text-teal-400" />;
  if (norm.includes('econ')) return <Coins className="w-4 h-4 text-fuchsia-400" />;
  if (norm.includes('engl')) return <BookMarked className="w-4 h-4 text-violet-400" />;
  if (norm.includes('sat')) return <Award className="w-4 h-4 text-orange-400" />;
  return <GraduationCap className="w-4 h-4 text-slate-400" />;
};

const getThemeStyles = (sName: string) => {
  const norm = sName.toLowerCase();
  if (norm.includes('phys')) {
    return {
      glow: 'shadow-rose-500/5 hover:border-rose-500/40 border-slate-800',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      badge: 'bg-rose-500/10 text-rose-300 border border-rose-500/15',
      hoverText: 'group-hover/item:text-rose-400'
    };
  }
  if (norm.includes('chem')) {
    return {
      glow: 'shadow-sky-500/5 hover:border-sky-500/40 border-slate-800',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      bar: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      badge: 'bg-sky-500/10 text-sky-300 border border-sky-500/15',
      hoverText: 'group-hover/item:text-sky-400'
    };
  }
  if (norm.includes('biol')) {
    return {
      glow: 'shadow-emerald-500/5 hover:border-emerald-500/40 border-slate-800',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15',
      hoverText: 'group-hover/item:text-emerald-400'
    };
  }
  if (norm.includes('math')) {
    return {
      glow: 'shadow-amber-500/5 hover:border-amber-500/40 border-slate-800',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/15',
      hoverText: 'group-hover/item:text-amber-400'
    };
  }
  if (norm.includes('hist')) {
    return {
      glow: 'shadow-indigo-500/5 hover:border-indigo-500/40 border-slate-800',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      bar: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      badge: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/15',
      hoverText: 'group-hover/item:text-indigo-400'
    };
  }
  if (norm.includes('geog')) {
    return {
      glow: 'shadow-teal-500/5 hover:border-teal-500/40 border-slate-800',
      iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
      bar: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      badge: 'bg-teal-500/10 text-teal-300 border border-teal-500/15',
      hoverText: 'group-hover/item:text-teal-400'
    };
  }
  if (norm.includes('econ')) {
    return {
      glow: 'shadow-fuchsia-500/5 hover:border-fuchsia-500/40 border-slate-800',
      iconBg: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
      bar: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
      badge: 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/15',
      hoverText: 'group-hover/item:text-fuchsia-400'
    };
  }
  if (norm.includes('engl')) {
    return {
      glow: 'shadow-violet-500/5 hover:border-violet-500/40 border-slate-800',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      bar: 'bg-gradient-to-r from-violet-500 to-indigo-500',
      badge: 'bg-violet-500/10 text-violet-300 border border-violet-500/15',
      hoverText: 'group-hover/item:text-violet-400'
    };
  }
  if (norm.includes('sat')) {
    return {
      glow: 'shadow-orange-500/5 hover:border-orange-500/40 border-slate-800',
      iconBg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      bar: 'bg-gradient-to-r from-orange-500 to-amber-500',
      badge: 'bg-orange-500/10 text-orange-300 border border-orange-500/15',
      hoverText: 'group-hover/item:text-orange-400'
    };
  }
  return {
    glow: 'shadow-slate-500/5 hover:border-slate-500/40 border-slate-800',
    iconBg: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    bar: 'bg-gradient-to-r from-slate-500 to-slate-400',
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/15',
    hoverText: 'group-hover/item:text-slate-400'
  };
};

export default function ChapterSelector({
  stream,
  isOfflineMode,
  savedNotes,
  studiedChapters,
  selectedGrade,
  selectedSubject,
  searchQuery,
  showSuggestions,
  filteredSearchChapters,
  activeSubject,
  curStream,
  subjectsForGrade,
  onGradeChange,
  onSearchQueryChange,
  onSearchFocus,
  onSuggestionSelect,
  onActiveSubjectChange,
  onChapterEnter,
}: ChapterSelectorProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchQueryChange(value);
  };

  const gradeLabels: Record<number, string> = {
    9: 'Grade 9',
    10: 'Grade 10',
    11: 'Grade 11',
    12: 'Grade 12'
  };

  const gradeSubtitles: Record<number, string> = {
    9: 'Foundation Level',
    10: 'Intermediate Level',
    11: 'Advanced Academy',
    12: 'National Matric Prep'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-slate-100">
      {isOfflineMode && (
        <div className="lg:col-span-12 bg-amber-500/15 border border-amber-500/40 rounded-3xl p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 text-lg">💾</span>
            <div>
              <strong className="text-amber-300 font-black block text-sm">
                {'Offline Study Mode Active'}
              </strong>
              <span className="text-slate-300 text-[11px]">
                {'Accessing downloaded lesson materials from device storage. Your study progress will sync automatically when connectivity returns.'}
              </span>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs shrink-0 self-start sm:self-center">
            {savedNotes.length} CACHED CHAPTERS
          </div>
        </div>
      )}

      <div className="lg:col-span-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1E293B] to-[#1E293B]/70 p-4 rounded-3xl border border-slate-800 shadow-md">
          <div className="space-y-1 text-left">
            <span className="text-xs font-black text-teal-400 uppercase tracking-wider block">
              {'Quick Search & Direct Jump'}
            </span>
            <p className="text-[11px] text-slate-400 max-w-xl leading-normal">
              {'Type any topic or unit name to instantly jump into your dedicated interactive study workspace.'}
            </p>
          </div>
          
          <div className="relative w-full md:max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={"Search units, subjects, grades or topics..."}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={onSearchFocus}
                className="w-full bg-[#0F172A] border border-slate-800/80 rounded-2xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30 transition-all font-medium"
              />
              {localSearch && (
                <button 
                  onClick={() => { setLocalSearch(''); onSearchQueryChange(''); }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSuggestions && filteredSearchChapters.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-[#131E32] border border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                <div className="px-2 py-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {"Quick-Jump Suggestions"}
                </div>
                {filteredSearchChapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLocalSearch('');
                      onSuggestionSelect(ch.grade, ch.subject, ch.chapterNumber);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between text-xs gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-teal-400 group-hover:text-teal-300 transition-colors shrink-0">{getSubjectIcon(ch.subject)}</span>
                      <span className="text-slate-200 font-bold group-hover:text-white truncate text-[11px]">
                        Unit {ch.chapterNumber}: {ch.chapterName}
                      </span>
                    </div>
                    <span className="text-[9px] text-teal-400 font-black uppercase tracking-wider shrink-0 bg-[#0F172A] border border-slate-800 px-1.5 py-0.5 rounded-md">
                      G-{ch.grade}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-teal-400 uppercase tracking-wider">
              {'Browse by Grade Level'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {stream === 'Natural Science' ? '🔬 Natural Science Stream' : '🌍 Social Science Stream'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[9, 10, 11, 12].map((g) => {
              const isSelected = selectedGrade === g;
              
              const subjects = curStream ? curStream.subjects.filter(sub => sub.grade === g) : [];
              const totalChapters = subjects.reduce((acc, s) => acc + s.chapters.length, 0);
              const completedChapters = subjects.reduce((acc, s) => {
                return acc + s.chapters.filter(ch => 
                  studiedChapters.includes(`${g}-${s.subject}-${ch.chapterNumber}`) || 
                  studiedChapters.includes(`${s.subject}-${ch.chapterNumber}`)
                ).length;
              }, 0);
              
              const percentComplete = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

              return (
                <div
                  key={g}
                  onClick={() => onGradeChange(g)}
                  className={`relative overflow-hidden rounded-3xl p-5 border text-left transition-all duration-300 cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#1E293B] to-[#131E32] border-teal-500 shadow-lg shadow-teal-500/5 scale-[1.02]'
                      : 'bg-[#1E293B]/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700/80 hover:bg-[#1E293B]/80 hover:scale-[1.01]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-black ${isSelected ? 'text-teal-400' : 'text-slate-300'}`}>
                        G-{g}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        isSelected ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'bg-[#0F172A] text-slate-500 border border-slate-800'
                      }`}>
                        {totalChapters} {'Units'}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {gradeLabels[g]}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {gradeSubtitles[g]}
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800/40">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold text-slate-400">{'Progress'}</span>
                        <span className={`font-black font-mono ${isSelected ? 'text-teal-400' : 'text-slate-400'}`}>
                          {percentComplete}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/50 pb-2">
            <div className="space-y-0.5">
              <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span className="p-1 bg-teal-500/15 border border-teal-500/25 rounded-lg text-teal-400">
                  <Layers className="w-4 h-4" />
                </span>
                <span>{`Grade ${selectedGrade} Subjects & Units`}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {'Explore syllabus chapters and click on any Unit below to enter your dedicated immersive study room.'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div className="px-3 py-1 bg-[#1E293B] border border-slate-800 rounded-xl text-[10px] font-mono font-black text-teal-300 shrink-0">
                Grade {selectedGrade} • {subjectsForGrade.length} Subjects Available
              </div>
            </div>
          </div>

          {(() => {
            const activeSubName = (activeSubject && subjectsForGrade.some(sub => sub.subject === activeSubject))
              ? activeSubject 
              : (subjectsForGrade[0]?.subject || '');
            const activeSub = subjectsForGrade.find(sub => sub.subject === activeSubName);
            const collapsedSubs = subjectsForGrade.filter(sub => sub.subject !== activeSubName);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
                <div className="lg:col-span-4 space-y-3">
                  <div className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1 h-5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span>{'Other Subjects'}</span>
                  </div>
                  
                  <div className="space-y-2.5 lg:space-y-4">
                    {collapsedSubs.map((sub) => {
                      const totalCh = sub.chapters.length;
                      const completedCh = sub.chapters.filter(ch => 
                        studiedChapters.includes(`${selectedGrade}-${sub.subject}-${ch.chapterNumber}`) || 
                        studiedChapters.includes(`${sub.subject}-${ch.chapterNumber}`)
                      ).length;
                      const subPercent = totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0;
                      const t = getThemeStyles(sub.subject);

                      return (
                        <button
                          key={sub.subject}
                          onClick={() => onActiveSubjectChange(sub.subject)}
                          className={`w-full text-left p-4 lg:p-5 lg:py-5.5 rounded-2xl bg-[#1E293B]/40 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 shadow-sm flex items-center justify-between group/coll cursor-pointer active:scale-[0.98] ${t.glow}`}
                        >
                          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                            <span className={`p-2.5 lg:p-3.5 rounded-xl lg:rounded-2xl text-lg lg:text-xl ${t.iconBg} transition-transform group-hover/coll:scale-105 shrink-0`}>
                              {getSubjectIcon(sub.subject)}
                            </span>
                            <div className="space-y-0.5 truncate">
                              <h4 className="font-extrabold text-sm lg:text-[15px] text-slate-200 group-hover/coll:text-white transition-colors">
                                {sub.subject}
                              </h4>
                              <span className="text-[10px] lg:text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                                {sub.chapters.length} {'Units'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 lg:gap-4 shrink-0 ml-2">
                            <div className="text-right">
                              <span className="text-[10px] lg:text-[11px] text-slate-400 font-mono font-bold block">
                                {subPercent}%
                              </span>
                              <span className="text-[8px] lg:text-[9px] text-slate-600 block font-bold tracking-wider uppercase">
                                {'Done'}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-slate-500 group-hover/coll:text-teal-400 group-hover/coll:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="text-[11px] font-black uppercase text-teal-400 tracking-widest px-1 h-5 flex items-center gap-1.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                    <span>{'Active Subject Units'}</span>
                  </div>

                  {activeSub && (() => {
                    const totalCh = activeSub.chapters.length;
                    const completedCh = activeSub.chapters.filter(ch => 
                      studiedChapters.includes(`${selectedGrade}-${activeSub.subject}-${ch.chapterNumber}`) || 
                      studiedChapters.includes(`${activeSub.subject}-${ch.chapterNumber}`)
                    ).length;
                    const subPercent = totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0;
                    const t = getThemeStyles(activeSub.subject);

                    return (
                      <div 
                        key={activeSub.subject}
                        className={`bg-[#1E293B] border rounded-3xl p-5 sm:p-6 shadow-2xl animate-fadeIn ${t.glow}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                          <div className="flex items-center gap-4">
                            <span className={`p-3 rounded-2xl text-2xl ${t.iconBg} shadow-lg shadow-black/10`}>
                              {getSubjectIcon(activeSub.subject)}
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono text-[9px] font-black uppercase tracking-wider">
                                  {'Active'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {'Syllabus Course'}
                                </span>
                              </div>
                              <h4 className="font-black text-lg sm:text-xl text-white">
                                {activeSub.subject}
                              </h4>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 self-start sm:self-center bg-[#0F172A]/40 border border-slate-800/60 rounded-2xl p-3">
                            <div className="text-left">
                              <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
                                {'Course Progress'}
                              </span>
                              <span className="text-xs text-white font-mono font-black block mt-0.5">
                                {completedCh}/{totalCh} {'Units Studied'}
                              </span>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800/80 border border-slate-700/40 flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-black font-mono text-teal-300">{subPercent}%</span>
                              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest font-mono">Done</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-5">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                              <span>COMPLETION RATIO</span>
                              <span>{subPercent}%</span>
                            </div>
                            <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden border border-slate-800/40">
                              <div 
                                className={`h-full ${t.bar} rounded-full transition-all duration-500`}
                                style={{ width: `${subPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                            {activeSub.chapters.map((ch) => {
                              const isStudied = studiedChapters.includes(`${selectedGrade}-${activeSub.subject}-${ch.chapterNumber}`) || studiedChapters.includes(`${activeSub.subject}-${ch.chapterNumber}`);
                              const isSaved = savedNotes.includes(`cache-${selectedGrade}-${activeSub.subject}-${ch.chapterNumber}`);
                              
                              return (
                                <button
                                  key={ch.chapterNumber}
                                  onClick={() => onChapterEnter(selectedGrade, activeSub.subject, ch.chapterNumber)}
                                  className="w-full text-left p-3.5 rounded-2xl bg-[#0F172A]/40 hover:bg-[#0F172A] border border-slate-800/40 hover:border-slate-700 transition-all duration-200 flex items-center justify-between text-xs group/item cursor-pointer hover:shadow-md hover:shadow-black/5"
                                >
                                  <div className="flex items-center space-x-3.5 min-w-0">
                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors ${
                                      isStudied 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                        : 'bg-slate-800/80 text-slate-400 border border-slate-800/80 group-hover/item:border-slate-700'
                                    }`}>
                                      {isStudied ? '✓' : ch.chapterNumber}
                                    </span>
                                    <div className="truncate text-left space-y-0.5">
                                      <span className={`text-slate-200 ${t.hoverText} font-extrabold block truncate text-xs sm:text-sm leading-snug transition-colors`}>
                                        Unit {ch.chapterNumber}: {ch.chapterName}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block font-medium truncate">
                                        {'Interactive summaries, recalls & flashcards'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                                    {isSaved && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[8px] font-bold">
                                        💾 OFFLINE
                                      </span>
                                    )}
                                    <div className="p-1.5 rounded-lg bg-slate-800/40 group-hover/item:bg-teal-500/10 border border-transparent group-hover/item:border-teal-500/20 transition-all">
                                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover/item:text-teal-400 transition-transform group-hover/item:translate-x-0.5" />
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
