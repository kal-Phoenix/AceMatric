import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Check } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export interface QBQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuestionBuilderProps {
  questions: QBQuestion[];
  onChange: (questions: QBQuestion[]) => void;
  disabled?: boolean;
}

let nextId = 0;
function uid() { return `q-${Date.now()}-${++nextId}`; }

function emptyQuestion(): QBQuestion {
  return { id: uid(), question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
}

export default function QuestionBuilder({ questions, onChange, disabled }: QuestionBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const add = () => {
    const q = emptyQuestion();
    onChange([...questions, q]);
    setExpandedId(q.id);
  };

  const remove = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const update = (id: string, patch: Partial<QBQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...questions];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="space-y-2">
      {questions.map((q, idx) => {
        const open = expandedId === q.id;
        return (
          <div key={q.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => setExpandedId(open ? null : q.id)}
            >
              {!disabled && (
                <div className="flex flex-col">
                  <button onClick={(e) => { e.stopPropagation(); move(idx, -1); }} className="text-slate-500 hover:text-slate-300 cursor-pointer"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); move(idx, 1); }} className="text-slate-500 hover:text-slate-300 cursor-pointer"><ChevronDown className="w-3 h-3" /></button>
                </div>
              )}
              <span className="text-xs font-black text-slate-500 w-6 shrink-0">#{idx + 1}</span>
              <span className="text-xs text-slate-300 truncate flex-1">{q.question || 'Untitled question'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${q.options[q.correctIndex] ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                {q.options[q.correctIndex] ? 'Set' : 'No answer'}
              </span>
              {!disabled && (
                <button onClick={(e) => { e.stopPropagation(); remove(q.id); }} className="text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>

            {open && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
                <div className="pt-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">Question</label>
                  <RichTextEditor
                    content={q.question}
                    onChange={html => update(q.id, { question: html })}
                    placeholder="Enter question text..."
                    minHeight="60px"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Options (click to mark correct)</label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-start gap-2">
                      <button
                        onClick={() => update(q.id, { correctIndex: oi })}
                        disabled={disabled}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer mt-1 ${
                          q.correctIndex === oi
                            ? 'bg-teal-500 border-teal-500'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {q.correctIndex === oi && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-[10px] font-black text-slate-500 w-4 shrink-0 mt-1">{String.fromCharCode(65 + oi)}.</span>
                      <div className="flex-1">
                        <RichTextEditor
                          content={opt}
                          onChange={html => {
                            const newOpts = [...q.options];
                            newOpts[oi] = html;
                            update(q.id, { options: newOpts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}...`}
                          minHeight="36px"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">Explanation</label>
                  <RichTextEditor
                    content={q.explanation}
                    onChange={html => update(q.id, { explanation: html })}
                    placeholder="Explain the correct answer..."
                    minHeight="60px"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          onClick={add}
          className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-xs font-black text-slate-500 hover:text-teal-400 hover:border-teal-500/50 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" />
          Add Question
        </button>
      )}
    </div>
  );
}
