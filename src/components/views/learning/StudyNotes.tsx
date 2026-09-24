import {
  Bookmark,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { ChapterStudyMaterial } from '../../../types';
import { useState } from 'react';
import { ChapterInfo } from '../../../data/curriculum';
import { sanitizeHtml } from '../../../lib/sanitize';

interface StudyNotesProps {
  studyMaterial: ChapterStudyMaterial;
  selectedGrade: number;
  selectedSubject: string;
  selectedChapterNum: number;
  selectedChapter: ChapterInfo;
  noteFontSize: 'sm' | 'base' | 'lg';
  studiedChapters: string[];
  chapters: ChapterInfo[];
  onFontSizeChange: (size: 'sm' | 'base' | 'lg') => void;
  onEnterFullscreen: () => void;
  onMarkStudied: () => void;
  onNextChapter: (chapterNumber: number) => void;
}

const getFontSizeClass = (noteFontSize: 'sm' | 'base' | 'lg') => {
  if (noteFontSize === 'sm') return 'text-xs sm:text-sm leading-relaxed';
  if (noteFontSize === 'lg') return 'text-base sm:text-lg leading-loose';
  return 'text-sm sm:text-base leading-relaxed';
};

export default function StudyNotes({
  studyMaterial,
  selectedGrade,
  selectedSubject,
  selectedChapterNum,
  selectedChapter,
  noteFontSize,
  studiedChapters,
  chapters,
  onFontSizeChange,
  onEnterFullscreen,
  onMarkStudied,
  onNextChapter,
}: StudyNotesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-12 space-y-6">
        <div className={`bg-[#111827] border border-slate-800/80 p-6 sm:p-8 rounded-xl shadow-lg space-y-8 ${getFontSizeClass(noteFontSize)}`}>

          {/* Chapter Overview */}
          <div className="space-y-4 border-b border-slate-800/60 pb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Chapter Overview</span>
            </div>
            <div
              className="text-slate-300 font-medium pl-4 border-l-2 border-blue-500/40 leading-relaxed text-left prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(studyMaterial.overview || '') }}
            />
          </div>

          {/* Subtopics */}
          {studyMaterial.subtopics && studyMaterial.subtopics.length > 0 && (
            <div className="space-y-6 pt-2 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Detailed Breakdown
                </h5>
              </div>

              <div className="space-y-5">
                {studyMaterial.subtopics.map((sub, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 text-left"
                  >
                    {/* Subtopic Header */}
                    <div className="flex items-center space-x-2.5 border-b border-slate-800/40 pb-3 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                        {selectedChapterNum}.{idx + 1}
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                        {sub.title}
                      </h4>
                    </div>

                    {/* Image */}
                    {sub.imageUrl && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-[#070B16] flex flex-col items-center p-3">
                        <img
                          src={sub.imageUrl}
                          alt={sub.imageCaption || sub.title}
                          referrerPolicy="no-referrer"
                          className="max-h-72 w-auto object-contain rounded-lg"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {sub.imageCaption && (
                          <p className="text-[10px] text-slate-500 mt-2 italic text-center">
                            {sub.imageCaption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed text-left prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(sub.content || '') }} />

                    {/* Exam Insight */}
                    {sub.examInsight && (
                      <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 exam-tip-container flex items-start space-x-2.5 clear-both">
                        <Lightbulb className="w-4 h-4 text-amber-400 exam-tip-icon shrink-0 mt-0.5" />
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-400 exam-tip-label">Exam Tip</span>
                          <p className="text-xs leading-relaxed text-amber-300/80 exam-tip-text text-left">{sub.examInsight}</p>
                        </div>
                      </div>
                    )}

                    {/* Practice Problems */}
                    {sub.practiceProblems && sub.practiceProblems.length > 0 && (
                      <PracticeProblemsBlock problems={sub.practiceProblems} chapterNum={selectedChapterNum} subtopicNum={idx + 1} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Syllabus Points */}
          {studyMaterial.corePoints && studyMaterial.corePoints.length > 0 && (
            <div className="space-y-4 pt-2 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-emerald-500" />
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Core Syllabus Focus Points
                </h5>
              </div>
              <div className="bg-[#1F2937]/40 border border-slate-800/40 p-5 rounded-2xl">
                <ul className="space-y-3">
                  {studyMaterial.corePoints.map((pt, i) => (
                    <li key={i} className="flex items-start text-xs sm:text-sm text-slate-300">
                      <Target className="w-3.5 h-3.5 text-emerald-400 mr-2.5 mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PracticeProblemsBlock({ problems, chapterNum, subtopicNum }: { problems: Array<{ question: string; options: string[]; answer: string; solution: string }>; chapterNum: number; subtopicNum: number }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setRevealed(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="mt-5 clear-both">
      <div className="flex items-center space-x-2 mb-3">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400">Practice Problems</span>
      </div>
      <div className="space-y-3">
        {problems.map((p, i) => (
          <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4">
            <p className="text-xs sm:text-sm text-slate-200 font-medium mb-2.5">
              <span className="text-emerald-400 font-bold mr-1.5">Q{i + 1}.</span>
              {p.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
              {p.options.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const isCorrect = letter === p.answer;
                return (
                  <div
                    key={oi}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      revealed[i] && isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/40 border-slate-700/30 text-slate-400'
                    }`}
                  >
                    <span className="font-bold mr-1.5">{letter}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => toggle(i)}
              className="flex items-center space-x-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {revealed[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{revealed[i] ? 'Hide Solution' : 'Show Solution'}</span>
            </button>
            {revealed[i] && (
              <div
                className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 rounded-lg p-3 border border-slate-700/30 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.solution) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
