import { useState, useEffect, FormEvent, useMemo, useRef } from 'react';
import {
  User, Award, Target, Clock, BookOpen, Sparkles, Check,
  Sliders, Moon, Sun, Bell, BellOff, RefreshCw, Flame, BarChart2, Languages,
  Activity, Camera, Share2, Copy, Gift,
  Star, Zap, Crown, Rocket, Lightbulb, Upload, X
} from 'lucide-react';
import { Stream, Language, SessionHistoryEntry } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { db } from '../../lib/supabase';
import { getAccessToken } from '../../lib/authToken';
import { subscribeToPush, unsubscribeFromPush } from '../../lib/push';

interface ProfileViewProps {
  stream: Stream;
  onStreamChange: (newStream: Stream) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userProfile: {
    name: string;
    email?: string;
    stream: Stream;
    targetScore?: number;
    role?: string;
    avatar?: string;
    school?: string;
    region?: string;
    bio?: string;
    dailyGoalHours?: number;
    notifications?: boolean;
    preparationLevel?: string;
    studyStyle?: string;
    weakSubjects?: string[];
    proStudyAudit?: string;
    studiedChapters?: string[];
    isPremium?: boolean;
    premiumExpiresAt?: string;
  } | null;
  onProfileUpdate: (profile: any) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  sessionHistory?: SessionHistoryEntry[];
}

const AVATAR_ICONS = [User, Target, Flame, Award, BookOpen, Star, Zap, Crown, Rocket, Lightbulb] as const;
const REGIONS = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'South Ethiopia', 'Central Ethiopia', 'Dire Dawa', 'Harari'];

export default function ProfileView({
  stream,
  onStreamChange,
  language,
  onLanguageChange,
  userProfile,
  onProfileUpdate,
  theme,
  onThemeToggle,
  sessionHistory = [],
  onTabChange,
}: ProfileViewProps & { onTabChange?: (tab: string) => void }) {

  const [activeViewTab, setActiveViewTab] = useState<'profile' | 'analytics'>('profile');

  const [name, setName] = useState(userProfile?.name || 'Dawit Scholar');
  const [email, setEmail] = useState(userProfile?.email || 'student@acematric.edu.et');
  const [selectedStream, setSelectedStream] = useState<Stream>(userProfile?.stream || stream);
  const [targetScore, setTargetScore] = useState<number>(() => {
    const rawScore = userProfile?.targetScore || 520;
    return rawScore > 600 ? 540 : rawScore;
  });
  const [avatar, setAvatar] = useState<string>(userProfile?.avatar || '0');
  const [school, setSchool] = useState<string>(userProfile?.school || '');
  const [region, setRegion] = useState<string>(userProfile?.region || 'Addis Ababa');
  const [bio, setBio] = useState<string>(userProfile?.bio || '');
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(userProfile?.dailyGoalHours || 4);
  const [notifications, setNotifications] = useState<boolean>(userProfile?.notifications ?? true);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      const token = await getAccessToken();
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
        setShowAvatarPicker(false);
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isAvatarUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'));

  // Keep the Web Push subscription in sync with the preference toggle
  // (no-ops when the browser doesn't support push or permission is denied)
  const handleNotificationsToggle = () => {
    const next = !notifications;
    setNotifications(next);
    if (next) {
      void subscribeToPush();
    } else {
      void unsubscribeFromPush();
    }
  };

  const subjectsList = useMemo(() => {
    return stream === 'Natural Science'
      ? ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'SAT']
      : ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'SAT'];
  }, [stream]);

  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'study' | 'practice' | 'simulation'>('all');

  const totalChaptersInSyllabus = useMemo(() => {
    const curStreamKey = stream === 'Natural Science' ? 'Natural' : 'Social';
    const streamData = ETHIOPIAN_CURRICULUM.find(s => s.stream === curStreamKey);
    if (!streamData) return 0;
    return streamData.subjects.reduce((sum, sub) => sum + sub.chapters.length, 0);
  }, [stream]);

  const [studiedChapters, setStudiedChapters] = useState<string[]>(['12-Physics-1']);

  useEffect(() => {
    if (userProfile?.email) {
      db.getStudiedChapters().then(chapters => {
        if (chapters && chapters.length > 0) setStudiedChapters(chapters);
      }).catch(() => {});
    }
  }, [userProfile?.email]);

  const analyticsData = useMemo(() => {
    const studyEntries = sessionHistory.filter(h => h.type === 'study');
    const practiceEntries = sessionHistory.filter(h => h.type === 'practice');
    const simulationEntries = sessionHistory.filter(h => h.type === 'simulation');

    const totalStudyMins = studyEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalPracticeMins = practiceEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalSimMins = simulationEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalMinsCombined = totalStudyMins + totalPracticeMins + totalSimMins;

    const subjectMins: Record<string, number> = {};
    sessionHistory.forEach(h => {
      const subj = h.subject || 'Other';
      subjectMins[subj] = (subjectMins[subj] || 0) + h.durationMinutes;
    });

    const sortedSubjects = Object.entries(subjectMins).map(([subject, minutes]) => ({
      subject, minutes
    })).sort((a, b) => b.minutes - a.minutes);

    let balanceAdvice = "You're showing consistent study patterns! Consider reviewing multiple subjects daily to keep your memory retrieval fresh.";
    if (sortedSubjects.length > 0) {
      const topSubj = sortedSubjects[0].subject;
      const otherSubjectsInStream = subjectsList.filter(s => s !== topSubj);
      if (otherSubjectsInStream.length > 0) {
        const recommendedSubj = otherSubjectsInStream[Math.floor(Math.random() * otherSubjectsInStream.length)];
        balanceAdvice = `You've spent the most focus time on ${topSubj} (${sortedSubjects[0].minutes} mins). To maintain a balanced study index and prevent curriculum drift, schedule your next study block on ${recommendedSubj}!`;
      }
    }

    return {
      totalStudyMins, totalPracticeMins, totalSimMins, totalMinsCombined,
      sortedSubjects, balanceAdvice, totalSessionsCount: sessionHistory.length,
      studySessionsCount: studyEntries.length, practiceSessionsCount: practiceEntries.length,
      simulationSessionsCount: simulationEntries.length
    };
  }, [sessionHistory, stream, subjectsList]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const updated = { name, email, stream: selectedStream, targetScore, avatar, school, region, bio, dailyGoalHours, notifications };
    onStreamChange(selectedStream);
    onProfileUpdate(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-slate-100">

      {/* Toast */}
      {isSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          Profile saved successfully
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-[#141920] border border-slate-800 rounded-2xl p-6 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar - click to change */}
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg shadow-black/5 border-4 border-slate-900 hover:scale-105 transition-all cursor-pointer overflow-hidden"
            >
              {isAvatarUrl ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (() => { const Icon = AVATAR_ICONS[Number(avatar)] || User; return <Icon className="w-8 h-8 text-white" />; })()
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#141920] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-400"
              title="Upload photo"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="absolute top-full mt-2 left-0 bg-[#141920] border border-slate-700 rounded-xl p-3 shadow-2xl z-30 w-56">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer mb-3 disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                </button>
                <div className="text-xs font-bold text-slate-400 mb-1">Or pick an icon</div>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_ICONS.map((Icon, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => { setAvatar(String(idx)); setShowAvatarPicker(false); }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        avatar === String(idx) && !isAvatarUrl
                          ? 'bg-blue-500/25 border-2 border-blue-400 scale-110'
                          : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:scale-105'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-white truncate">{name}</h1>
              {userProfile?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 text-xs font-semibold uppercase tracking-wider rounded border border-blue-500/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{school || 'No school set'} {region ? `- ${region}` : ''}</p>
            {bio && <p className="text-xs text-slate-500 mt-1 italic">{bio}</p>}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Target Score</span>
            <span className="font-mono font-semibold text-2xl text-blue-400">{targetScore}<span className="text-xs text-slate-500">/600</span></span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-[#141920] p-1 rounded-xl border border-slate-800 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveViewTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'analytics'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Pro Analytics
        </button>
      </div>

      {activeViewTab === 'profile' ? (
        <form onSubmit={handleSave} className="space-y-5">

          {/* Personal Info */}
          <div className="bg-[#141920] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <User className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-200">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">School</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Your high school or prep academy"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
                >
                  {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short tagline about your study goals"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Academic Settings */}
          <div className="bg-[#141920] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-200">Academic Settings</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Stream</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Natural Science', 'Social Science'] as const).map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => {
                        setSelectedStream(s);
                        onStreamChange(s);
                      }}
                      className={`p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                        selectedStream === s
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Score</label>
                  <span className="font-mono font-semibold text-amber-400 text-sm">{targetScore}</span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={600}
                  step={5}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-blue-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
                <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                  <span>300 (Pass)</span>
                  <span>600 (Top)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Daily Study Goal</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 6, 8].map((hrs) => (
                  <button
                    type="button"
                    key={hrs}
                    onClick={() => setDailyGoalHours(hrs)}
                    className={`p-2.5 rounded-xl border font-mono font-semibold text-xs transition-all cursor-pointer ${
                      dailyGoalHours === hrs
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-[#141920] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-200">Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNotificationsToggle}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  {notifications ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-slate-500" />}
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">Notifications</div>
                    <div className="text-xs text-slate-400">{notifications ? 'Enabled' : 'Muted'}</div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${notifications ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {notifications ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={onThemeToggle}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">Theme</div>
                    <div className="text-xs text-slate-400">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                  {theme}
                </span>
              </button>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Languages className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold text-xs text-white">Language</div>
                    <div className="text-xs text-slate-400">
                      UI labels where available; questions can include Amharic text
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('am')}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      language === 'am'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    አማርኛ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-[#141920] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Award className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-200">Subscription Status</h2>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                {userProfile?.isPremium ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-xs text-white">
                    {userProfile?.isPremium ? 'Pro Member' : 'Free Plan'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {userProfile?.isPremium && userProfile?.premiumExpiresAt
                      ? `Expires: ${new Date(userProfile.premiumExpiresAt).toLocaleDateString()}`
                      : userProfile?.isPremium
                        ? 'Lifetime access'
                        : '10 questions/day limit'}
                  </div>
                </div>
              </div>
              {!userProfile?.isPremium && (
                <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg cursor-pointer" onClick={() => onTabChange?.('upgrade')}>
                  Upgrade
                </span>
              )}
            </div>

            {/* Referral / Share */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-xs text-white">Refer a Friend</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Share AceMatric with friends and help them ace their matric exam!</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = window.location.origin;
                    const text = 'Check out AceMatric - the best Ethiopian matric exam prep platform!';
                    if (navigator.share) {
                      navigator.share({ title: 'AceMatric', text, url });
                    } else {
                      navigator.clipboard.writeText(`${text}\n${url}`);
                      setIsSavedToast(true);
                      setTimeout(() => setIsSavedToast(false), 3000);
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    setIsSavedToast(true);
                    setTimeout(() => setIsSavedToast(false), 3000);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3 h-3" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Profile
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">

          {/* Analytics Header */}
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs font-semibold uppercase tracking-widest text-amber-400">
                    Pro Analytics
                  </span>
                </div>
                <h2 className="text-base font-semibold text-white">Study Analytics & Insights</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monitor coverage, focus balance, and session history</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-400">SYNCED</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Study', value: `${analyticsData.totalMinsCombined}m`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Coverage', value: `${Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%`, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { label: 'Sessions', value: analyticsData.totalSessionsCount, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
              { label: 'XP Earned', value: `+${(analyticsData.studySessionsCount * 50) + (analyticsData.practiceSessionsCount * 40) + (analyticsData.simulationSessionsCount * 120)}`, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className={`text-xl font-mono font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Subject Focus */}
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60 mb-4">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs text-white">Focus per Subject</h3>
            </div>

            {analyticsData.sortedSubjects.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.sortedSubjects.map(({ subject, minutes }) => {
                  const maxMins = Math.max(...analyticsData.sortedSubjects.map(s => s.minutes)) || 1;
                  const pct = Math.round((minutes / maxMins) * 100);
                  return (
                    <div key={subject}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-200">{subject}</span>
                        <span className="font-mono text-slate-400 font-bold">{minutes}m</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No study data yet. Start studying to see analytics.</div>
            )}

            <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Study Balance Recommendation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{analyticsData.balanceAdvice}</p>
            </div>
          </div>



          {/* Session History */}
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs text-white">Session History</h3>
              </div>
              <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {(['all', 'study', 'practice', 'simulation'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAnalyticsFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      analyticsFilter === f
                        ? 'bg-slate-800 text-blue-300 border border-blue-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {sessionHistory
                .filter(h => analyticsFilter === 'all' || h.type === analyticsFilter)
                .map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl hover:border-slate-700/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        log.type === 'study' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        log.type === 'practice' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {log.type === 'study' ? 'S' : log.type === 'practice' ? 'P' : 'M'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{log.subject}</div>
                        <div className="text-xs text-slate-500">{log.date || 'N/A'} &middot; {log.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-white">+{log.durationMinutes}m</div>
                      <div className="text-xs text-emerald-400 font-semibold">+{log.durationMinutes * (log.type === 'study' ? 2 : log.type === 'practice' ? 3 : 5)} XP</div>
                    </div>
                  </div>
                ))}

              {sessionHistory.filter(h => analyticsFilter === 'all' || h.type === analyticsFilter).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No sessions found for this filter</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-[#111827] rounded-2xl border border-rose-500/20 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Danger Zone</h3>
        <p className="text-xs text-slate-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button
          onClick={async () => {
            if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
            if (!confirm('This will delete ALL your data including progress and session history. Continue?')) return;
            try {
              const token = getAccessToken();
              const res = await fetch('/api/profile', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || ''}` },
              });
              if (res.ok) {
                await db.logout();
                window.location.href = '/';
              }
            } catch {}
          }}
          className="px-4 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl hover:bg-rose-500/25 transition-colors cursor-pointer"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}
