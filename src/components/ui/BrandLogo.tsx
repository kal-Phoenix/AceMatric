import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
  glow?: boolean;
  useImage?: boolean;
}

const SIZES = {
  xs: { box: 'w-7 h-7', img: 28, text: 'text-sm' },
  sm: { box: 'w-8 h-8', img: 32, text: 'text-base' },
  md: { box: 'w-10 h-10', img: 40, text: 'text-lg' },
  lg: { box: 'w-12 h-12', img: 48, text: 'text-xl' },
  xl: { box: 'w-16 h-16', img: 64, text: 'text-2xl' },
};

export const AceSpadeIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Blue Crown / Tip */}
    <path
      d="M 50 10 L 73 40 C 64 34 57 29 50 22 C 43 29 36 34 27 40 Z"
      fill="#3898FE"
    />
    {/* Porcelain White Spade Body */}
    <path
      d="M 50 22 C 57 29 64 34 73 40 C 80 46 82 54 81 62 C 79 73 69 79 57 74 C 53 72 51 69 50 66 C 49 69 47 72 43 74 C 31 79 21 73 19 62 C 18 54 20 46 27 40 C 36 34 43 29 50 22 Z"
      fill="#F8FAFC"
    />
    {/* Spade Stem with dynamic flare */}
    <path
      d="M 45 66 C 47 74 44 82 31 88 L 71 85 C 57 81 54 74 55 66 Z"
      fill="#F8FAFC"
    />
  </svg>
);

export default function BrandLogo({
  size = 'md',
  showText = true,
  textClassName = '',
  className = '',
  glow = true,
  useImage = true,
}: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative ${s.box} rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden ${
          glow ? 'shadow-sm' : ''
        }`}
      >
        {useImage ? (
          <img
            src="/logo.png"
            alt="AceMatric Brand Logo"
            className="w-full h-full object-contain rounded-xl"
            loading="eager"
            onError={(e) => {
              // Fallback to SVG if image fails to load
              (e.currentTarget as HTMLElement).style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.svg-fallback');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`svg-fallback w-full h-full p-1 bg-[#090B0E] border border-white/10 rounded-xl items-center justify-center ${useImage ? 'hidden' : 'flex'}`}>
          <AceSpadeIcon className="w-full h-full drop-shadow-[0_2px_8px_rgba(56,152,254,0.3)]" />
        </div>
      </div>

      {showText && (
        <span
          className={`brand-logo-text font-extrabold tracking-tight flex items-center ${s.text} ${textClassName}`}
        >
          Ace<span className="brand-logo-accent">Matric</span>
        </span>
      )}
    </div>
  );
}
