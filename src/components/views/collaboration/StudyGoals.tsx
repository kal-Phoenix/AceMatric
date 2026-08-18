import React from 'react';
import { 
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { Goal } from './interfaces';

interface StudyGoalsProps {
  goals: Goal[];
  newGoalText: string;
  setNewGoalText: (v: string) => void;
  handleAddGoal: (e: React.FormEvent) => void;
  handleToggleGoal: (id: string) => void;
  handleDeleteGoal: (id: string) => void;
}

export default function StudyGoals({
  goals,
  newGoalText,
  setNewGoalText,
  handleAddGoal,
  handleToggleGoal,
  handleDeleteGoal
}: StudyGoalsProps) {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col min-h-0 shrink-0">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
          Cooperative Goals
        </span>
        <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 text-[9px] font-bold rounded">
          {goals.filter(g => g.completed).length}/{goals.length} Completed
        </span>
      </div>

      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {goals.map((g) => (
          <div
            key={g.id}
            className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
              g.completed
                ? 'bg-slate-950/20 border-emerald-500/10 text-slate-500'
                : 'bg-slate-950/60 border-slate-850 text-slate-200'
            }`}
          >
            <button
              onClick={() => handleToggleGoal(g.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {g.completed ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500 shrink-0 hover:text-slate-400" />
              )}
              <span className={`text-[11px] truncate font-bold ${g.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {g.text}
              </span>
            </button>
            
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest bg-slate-900/60 px-1 py-0.5 rounded">
                {g.setter}
              </span>
              <button
                onClick={() => handleDeleteGoal(g.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="text-center py-4 text-slate-500 text-[11px] italic">
            No study goals defined. Type below to set tasks!
          </div>
        )}
      </div>

      <form onSubmit={handleAddGoal} className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-800/40">
        <input
          type="text"
          required
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="Set a session task..."
          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-hidden focus:border-indigo-500/40"
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
}
