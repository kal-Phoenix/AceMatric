import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

function analyzePassword(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: '', feedback: [] };

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else feedback.push('Mix uppercase and lowercase');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add a number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add a special character');

  score = Math.min(score, 4);

  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#10b981' },
  ];

  return { score, ...levels[score], feedback };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const result = useMemo(() => analyzePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < result.score ? result.color : '#1e293b',
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: result.color }}>
          {result.label}
        </span>
        {result.feedback.length > 0 && (
          <span className="text-[9px] text-slate-500">{result.feedback[0]}</span>
        )}
      </div>
    </div>
  );
}
