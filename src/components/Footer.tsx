import { Globe, RefreshCw } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate?: (tab: string) => void;
}

export default function Footer({ language, onLanguageChange, onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-[#0F172A] text-slate-400 text-xs shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
          {onNavigate && (
            <>
              <button onClick={() => onNavigate('about')} className="hover:text-teal-400 transition-colors cursor-pointer">About</button>
              <button onClick={() => onNavigate('faq')} className="hover:text-teal-400 transition-colors cursor-pointer">FAQ</button>
              <button onClick={() => onNavigate('privacy')} className="hover:text-teal-400 transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => onNavigate('terms')} className="hover:text-teal-400 transition-colors cursor-pointer">Terms</button>
              <button onClick={() => onNavigate('contact')} className="hover:text-teal-400 transition-colors cursor-pointer">Contact</button>
            </>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
          <div className="flex items-center space-x-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>AceMatric v4.2 Stable</span>
            <span className="h-1 w-1 bg-slate-700 rounded-full" />
            <span className="flex items-center text-teal-400">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Synced to Supabase Cloud</span>
            </span>
          </div>

          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
            Academic Excellence for Ethiopian Scholars
          </div>
        </div>
      </div>
    </footer>
  );
}
