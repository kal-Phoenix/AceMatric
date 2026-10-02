import { User, Target, Flame, Award, BookOpen, Star, Zap, Crown, Rocket, Lightbulb } from 'lucide-react';

export const AVATAR_ICONS = [User, Target, Flame, Award, BookOpen, Star, Zap, Crown, Rocket, Lightbulb] as const;

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  className?: string;
  iconClassName?: string;
}

const hasClass = (cls: string, prefix: string) => new RegExp(`(^|\\s)${prefix}`).test(cls);

export default function UserAvatar({ avatar, name, className = 'w-8 h-8 rounded-lg', iconClassName = '' }: UserAvatarProps) {
  const isUrl = !!avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'));

  if (isUrl) {
    return <img src={avatar} alt="" className={`${className} object-cover`} />;
  }

  const base = `${className} flex items-center justify-center shrink-0 ${hasClass(className, 'bg-') ? '' : 'bg-slate-700'}`;
  const idx = avatar !== null && avatar !== undefined && avatar !== '' ? Number(avatar) : NaN;

  if (Number.isInteger(idx) && idx >= 0 && idx < AVATAR_ICONS.length) {
    const Icon = AVATAR_ICONS[idx];
    return (
      <div className={`${base} ${hasClass(className, 'text-') ? '' : 'text-white'}`}>
        <Icon className={`w-1/2 h-1/2 ${iconClassName}`} />
      </div>
    );
  }

  return (
    <div className={`${base} ${hasClass(className, 'font-') ? '' : 'font-medium'} ${hasClass(className, 'text-') ? '' : 'text-slate-300'}`}>
      {name?.[0] || 'S'}
    </div>
  );
}
