import React from 'react';
import { Award } from 'lucide-react';
import { PracticeQuestion } from '../../../types';
import { ActiveQuiz, QuizScore } from './interfaces';
import { sanitizeHtml } from '../../../lib/sanitize';

interface QuizChallengeProps {
  activeQuiz: ActiveQuiz | null;
  quizTimeLeft: number;
  selectedOptionId: string | null;
  submittedAnswer: boolean;
  quizScores: QuizScore[];
  questions: PracticeQuestion[];
  handleSubmitAnswer: (optionId: string) => void;
  handleTriggerQuiz: () => void;
}

export default function QuizChallenge({
  activeQuiz,
  quizTimeLeft,
  selectedOptionId,
  submittedAnswer,
  quizScores,
  questions,
  handleSubmitAnswer,
  handleTriggerQuiz
}: QuizChallengeProps) {
  if (activeQuiz) {
    return (
      <div className="p-3 bg-slate-900 border-b border-indigo-500/20 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 rounded text-xs font-bold uppercase tracking-wide">
            Live Quiz Challenge
          </span>
          <span className="text-xs font-bold text-amber-400">
            {quizTimeLeft > 0 ? `${quizTimeLeft}s remaining` : 'Challenge Over'}
          </span>
        </div>

        <p className="text-xs text-white font-bold leading-relaxed bg-black/30 p-2 rounded-lg border border-slate-800"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeQuiz.questionText) }}
        />

        <div className="grid grid-cols-2 gap-2 mt-2">
          {activeQuiz.options.map((opt: any) => {
            const isSelected = selectedOptionId === opt.id;
            const hasEnded = quizTimeLeft === 0;
            
            const questionDef = questions.find(q => q.id === activeQuiz.questionId);
            const isCorrectOption = questionDef ? questionDef.correctOptionId === opt.id : false;

            let optionBtnClass = "";
            if (submittedAnswer) {
              if (isSelected) {
                if (isCorrectOption) {
                  optionBtnClass = "bg-emerald-650/20 text-emerald-300 border-emerald-500/50 shadow-sm";
                } else {
                  optionBtnClass = "bg-rose-650/20 text-rose-300 border-rose-500/50 shadow-sm";
                }
              } else if (isCorrectOption) {
                optionBtnClass = "bg-emerald-650/10 text-emerald-400 border-emerald-500/30 border-dashed";
              } else {
                optionBtnClass = "bg-slate-950/40 text-slate-650 border-slate-900/60 opacity-60";
              }
            } else if (hasEnded) {
              if (isCorrectOption) {
                optionBtnClass = "bg-emerald-650/20 text-emerald-300 border-emerald-500/50";
              } else {
                optionBtnClass = "bg-slate-950/40 text-slate-650 border-slate-900/60 opacity-60";
              }
            } else {
              if (isSelected) {
                optionBtnClass = "bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-950/30";
              } else {
                optionBtnClass = "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-850 hover:border-slate-750";
              }
            }

            return (
              <button
                key={opt.id}
                disabled={submittedAnswer || hasEnded}
                onClick={() => handleSubmitAnswer(opt.id)}
                className={`p-2.5 rounded-xl text-left text-xs font-bold leading-normal border transition-all truncate cursor-pointer active:scale-95 ${optionBtnClass}`}
              >
                <span className="font-extrabold mr-1.5 text-slate-400 uppercase">{opt.id}.</span>
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text) }} />
              </button>
            );
          })}
        </div>

        {quizScores.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/40 flex flex-wrap gap-1">
            {quizScores.map((score, idx) => (
              <span
                key={idx}
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  score.isCorrect
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold'
                }`}
              >
                {score.name.split(' ')[0]}: {score.selectedOptionId}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-slate-900 border-b border-slate-850 shrink-0 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Award className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">Test Preparation Drill</span>
      </div>
      <button
        onClick={handleTriggerQuiz}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg shadow-sm transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1"
      >
        Launch Quiz
      </button>
    </div>
  );
}
