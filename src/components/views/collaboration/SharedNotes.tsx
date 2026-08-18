import React from 'react';
import { FileText } from 'lucide-react';

interface SharedNotesProps {
  sharedNotes: string;
  handleNotesChange: (text: string) => void;
}

export default function SharedNotes({
  sharedNotes,
  handleNotesChange
}: SharedNotesProps) {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 shrink-0">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          Live Shared Study Board
        </span>
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Auto-Syncs</span>
      </div>

      <textarea
        value={sharedNotes}
        onChange={(e) => handleNotesChange(e.target.value)}
        placeholder="Collaboratively summarize exam formulas, key theorems, and notes in this shared window. Every study partner in the room sees updates instantly."
        className="flex-1 w-full p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500/30 resize-none font-mono leading-relaxed placeholder:text-slate-600"
      />
    </div>
  );
}
