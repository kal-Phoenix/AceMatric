import { Language } from '../types';
import BrandLogo from './ui/BrandLogo';

interface FooterProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate?: (tab: string) => void;
}

export default function Footer({ language, onLanguageChange, onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07080B] text-slate-400 text-xs shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 space-y-4">
        {/* Top Row: Brand & Quick Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="xs" glow={false} />

          {onNavigate && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <button onClick={() => onNavigate('about')} className="hover:text-blue-400 transition-colors cursor-pointer">About</button>
              <button onClick={() => onNavigate('faq')} className="hover:text-blue-400 transition-colors cursor-pointer">FAQ</button>
              <button onClick={() => onNavigate('privacy')} className="hover:text-blue-400 transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => onNavigate('terms')} className="hover:text-blue-400 transition-colors cursor-pointer">Terms</button>
              <button onClick={() => onNavigate('contact')} className="hover:text-blue-400 transition-colors cursor-pointer">Contact</button>
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/[0.06] text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} AceMatric EdTech · High School Matriculation Prep
          </div>

          <div className="flex items-center gap-3">
            <span>Natural & Social Science</span>
            <span>•</span>
            <span className="text-slate-400">Addis Ababa, Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
