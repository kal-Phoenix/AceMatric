import { useState, useEffect, FormEvent, useMemo } from 'react';
import {
  User, Settings, Award, Target, Clock, BookOpen, Sparkles, Check, Edit3,
  Shield, Sliders, Moon, Sun, Bell, BellOff, RefreshCw, Flame, BarChart2,
  Activity, Play, HelpCircle, ChevronUp, ChevronDown, Camera
} from 'lucide-react';
import { Stream, Language, SessionHistoryEntry } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { db } from '../../lib/supabase';
import { getAccessToken } from '../../lib/authToken';

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
  } | null;
  onProfileUpdate: (profile: any) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  sessionHistory?: SessionHistoryEntry[];
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🚀', '💡', '⚡', '🎯', '🌟', '🦁', '🏆', '📚'];
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
  sessionHistory = []
}: ProfileViewProps) {

  const [activeViewTab, setActiveViewTab] = useState<'profile' | 'analytics'>('profile');

  const [name, setName] = useState(userProfile?.name || 'Dawit Scholar');
  const [email, setEmail] = useState(userProfile?.email || 'student@acematric.edu.et');
  const [selectedStream, setSelectedStream] = useState<Stream>(userProfile?.stream || stream);
  const [targetScore, setTargetScore] = useState<number>(() => {
    const rawScore = userProfile?.targetScore || 520;
    return rawScore > 600 ? 540 : rawScore;
  });
  const [avatar, setAvatar] = useState<string>(userProfile?.avatar || '🚀');
  const [school, setSchool] = useState<string>(userProfile?.school || '');
  const [region, setRegion] = useState<string>(userProfile?.region || 'Addis Ababa');
  const [bio, setBio] = useState<string>(userProfile?.bio || '');
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(userProfile?.dailyGoalHours || 4);
  const [notifications, setNotifications] = useState<boolean>(userProfile?.notifications ?? true);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [auditReport, setAuditReport] = useState<string>(() => {
    return userProfile?.proStudyAudit || '';
  });
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const response = await fetch('/api/ai/pro-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, school, region, targetScore, dailyGoalHours,
          preparationLevel: userProfile?.preparationLevel || 'Medium',
          studyStyle: userProfile?.studyStyle || 'Visual / Active Recall',
          weakSubjects: userProfile?.weakSubjects || ['Physics', 'Mathematics'],
          totalMinutesStudied: analyticsData.totalMinsCombined,
          studiedChaptersCount: studiedChapters.length,
        }),
      });
      const data = await response.json();
      if (data.audit) {
        setAuditReport(data.audit);
        if (userProfile?.email) {
          db.saveStudentProfile({ ...userProfile, proStudyAudit: data.audit } as any).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16 text-slate-100">

      {/* Toast */}
      {isSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 stroke-[3]" />
          Profile saved successfully
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar - click to change */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-4xl shadow-lg shadow-teal-500/20 border-4 border-slate-900 hover:scale-105 transition-all cursor-pointer"
            >
              {avatar}
            </button>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center border-2 border-[#1E293B] opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3 text-white" />
            </div>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="absolute top-full mt-2 left-0 bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-2xl z-30 flex flex-wrap gap-2 w-56 animate-fadeIn">
                <div className="w-full text-[10px] font-bold text-slate-400 mb-1">Choose avatar</div>
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => { setAvatar(opt); setShowAvatarPicker(false); }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      avatar === opt
                        ? 'bg-teal-500/25 border-2 border-teal-400 scale-110'
                        : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:scale-105'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-white truncate">{name}</h1>
              {userProfile?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-teal-500/15 text-teal-400 text-[9px] font-black uppercase tracking-wider rounded border border-teal-500/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{school || 'No school set'} {region ? `- ${region}` : ''}</p>
            {bio && <p className="text-[11px] text-slate-500 mt-1 italic">{bio}</p>}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Target Score</span>
            <span className="font-mono font-black text-2xl text-teal-400">{targetScore}<span className="text-xs text-slate-500">/600</span></span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-[#1E293B] p-1 rounded-xl border border-slate-800 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveViewTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'profile'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'analytics'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
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
          <div className="bg-[#1E293B] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <User className="w-4 h-4 text-teal-400" />
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-200">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">School</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Your high school or prep academy"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-400 transition-colors cursor-pointer"
                >
                  {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short tagline about your study goals"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
          </div>

          {/* Academic Settings */}
          <div className="bg-[#1E293B] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-200">Academic Settings</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Stream</label>
                {userProfile?.role === 'admin' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(['Natural Science', 'Social Science'] as const).map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSelectedStream(s)}
                        className={`p-3 rounded-xl border font-black text-xs transition-all cursor-pointer ${
                          selectedStream === s
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <span className="text-teal-400 font-black text-sm">{selectedStream}</span>
                    <span className="text-[9px] uppercase font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Locked
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Score</label>
                  <span className="font-mono font-black text-amber-400 text-sm">{targetScore}</span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={600}
                  step={5}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>300 (Pass)</span>
                  <span>600 (Top)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Daily Study Goal</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 6, 8].map((hrs) => (
                  <button
                    type="button"
                    key={hrs}
                    onClick={() => setDailyGoalHours(hrs)}
                    className={`p-2.5 rounded-xl border font-mono font-black text-xs transition-all cursor-pointer ${
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
          <div className="bg-[#1E293B] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-200">Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  {notifications ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-slate-500" />}
                  <div className="text-left">
                    <div className="font-black text-xs text-white">Notifications</div>
                    <div className="text-[10px] text-slate-400">{notifications ? 'Enabled' : 'Muted'}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${notifications ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
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
                    <div className="font-black text-xs text-white">Theme</div>
                    <div className="text-[10px] text-slate-400">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                  {theme}
                </span>
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Profile
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5 animate-fadeIn">

          {/* Analytics Header */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                    Pro Analytics
                  </span>
                </div>
                <h2 className="text-base font-black text-white">Study Analytics & Insights</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Monitor coverage, focus balance, and session history</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400">SYNCED</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Study', value: `${analyticsData.totalMinsCombined}m`, icon: Clock, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
              { label: 'Coverage', value: `${Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%`, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { label: 'Sessions', value: analyticsData.totalSessionsCount, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
              { label: 'XP Earned', value: `+${(analyticsData.studySessionsCount * 50) + (analyticsData.practiceSessionsCount * 40) + (analyticsData.simulationSessionsCount * 120)}`, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className={`text-xl font-mono font-black ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Subject Focus */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60 mb-4">
              <BarChart2 className="w-4 h-4 text-teal-400" />
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
                          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700"
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400">AI Balance Tip</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{analyticsData.balanceAdvice}</p>
            </div>
          </div>

          {/* Pro Audit */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-teal-400/10 border border-teal-400/30 rounded text-[9px] font-extrabold uppercase tracking-widest text-teal-400">
                    Gemini AI
                  </span>
                </div>
                <h3 className="font-black text-sm text-white">Study Audit & Strategy</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">AI-powered diagnostic of your study habits and target score plan</p>
              </div>
              <button
                type="button"
                disabled={isAuditing}
                onClick={handleRunAudit}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50 shrink-0"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Audit
                  </>
                )}
              </button>
            </div>

            {auditReport ? (
              <div className="mt-4 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-slate-300 leading-relaxed space-y-3 max-h-96 overflow-y-auto">
                {auditReport.split('\n\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('###')) {
                    return <h3 key={pIdx} className="text-sm font-black text-white mt-3 border-b border-slate-800 pb-1">{paragraph.replace('###', '').trim()}</h3>;
                  }
                  if (paragraph.startsWith('####')) {
                    return <h4 key={pIdx} className="text-xs font-black text-teal-300 mt-2">{paragraph.replace('####', '').trim()}</h4>;
                  }
                  if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1 text-xs">
                        {paragraph.split('\n').map((line, lIdx) => (
                          <li key={lIdx}>{line.replace(/^[-*]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={pIdx} className="text-xs leading-relaxed text-slate-300">{paragraph}</p>;
                })}
              </div>
            ) : (
              <div className="mt-4 py-8 text-center bg-slate-900/30 border border-slate-800/60 border-dashed rounded-xl">
                <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Click "Generate Audit" to get AI analysis of your study plan</p>
              </div>
            )}
          </div>

          {/* Session History */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5">
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
                    className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      analyticsFilter === f
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/20'
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
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                        log.type === 'study' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        log.type === 'practice' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {log.type === 'study' ? 'S' : log.type === 'practice' ? 'P' : 'M'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{log.subject}</div>
                        <div className="text-[10px] text-slate-500">{log.date || 'N/A'} &middot; {log.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-white">+{log.durationMinutes}m</div>
                      <div className="text-[9px] text-emerald-400 font-black">+{log.durationMinutes * (log.type === 'study' ? 2 : log.type === 'practice' ? 3 : 5)} XP</div>
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
        <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">Danger Zone</h3>
        <p className="text-[11px] text-slate-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button
          onClick={async () => {
            if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
            if (!confirm('This will delete ALL your data including progress, session history, and payments. Continue?')) return;
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
          className="px-4 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black rounded-xl hover:bg-rose-500/25 transition-colors cursor-pointer"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}
