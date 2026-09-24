import { useState } from 'react';
import { Search, X, Eye, EyeOff, Lightbulb } from 'lucide-react';
import { FormulaOrKeyTerm } from '../../../types';

interface FormulaSheetProps {
  materials: FormulaOrKeyTerm[];
}

export default function FormulaSheet({ materials }: FormulaSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [quizMode, setQuizMode] = useState(false);

  const filteredMaterials = materials.filter(m => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      (m.formula && m.formula.toLowerCase().includes(query))
    );
  });

  const toggleReveal = (index: number) => {
    setRevealedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const formulasWithFormulas = filteredMaterials.filter(m => m.formula);

  return (
    <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="font-semibold text-base text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Formula & Key Terms Sheet</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Review essential formulas and key concepts. Toggle quiz mode to test yourself.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold uppercase">
            {formulasWithFormulas.length} Formulas
          </span>
          <button
            onClick={() => setQuizMode(!quizMode)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
              quizMode
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-[#0A0E14] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {quizMode ? 'Exit Quiz' : 'Quiz Mode'}
          </button>
        </div>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search formulas or terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0A0E14] border border-slate-800/80 rounded-2xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0E14] border border-slate-800 rounded-xl text-slate-400 text-xs">
          No formulas or terms match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((m, idx) => {
            const isRevealed = revealedIndices.includes(idx);
            const hasFormula = !!m.formula;

            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl space-y-3 hover:border-slate-700/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-300 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-md">
                    {m.name}
                  </span>
                  {hasFormula && (
                    <button
                      onClick={() => toggleReveal(idx)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer text-slate-400 hover:text-white"
                      title={isRevealed ? 'Hide formula' : 'Reveal formula'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {quizMode && hasFormula && !isRevealed ? '???' : m.description}
                </p>

                {hasFormula && (isRevealed || !quizMode) && (
                  <div className="mt-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <span className="font-mono text-xs sm:text-sm text-indigo-300 font-semibold">
                      {m.formula}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
