import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flame, Filter, Sparkles, ShieldCheck, Clock, Zap } from 'lucide-react';
import { Stream, Language } from '../../types';
import { db } from '../../lib/supabase';

interface LeaderboardViewProps {
  stream: Stream;
  language: Language;
  userProfile?: {
    name: string;
    stream: Stream;
    targetScore?: number;
    region?: string;
  } | null;
}

interface StudentRank {
  rank: number;
  name: string;
  school: string;
  region: string;
  stream: Stream;
  xp: number;
  streak: number;
  examReadinessScore: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardView({
  stream,
  language,
  userProfile,
}: LeaderboardViewProps) {
  const [filterStream, setFilterStream] = useState<Stream | 'All'>('All');
  const [leaderboard, setLeaderboard] = useState<StudentRank[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    db.getLeaderboard(filterStream === 'All' ? undefined : filterStream)
      .then((data) => {
        const entries = data.leaderboard.map((e: any) => ({
          ...e,
          isCurrentUser: userProfile?.name === e.name,
        }));
        setLeaderboard(entries);
        setCurrentUserRank(data.currentUserRank);
        setTotalStudents(data.totalStudents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStream, userProfile]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-xs font-bold text-slate-500 w-5 text-center">{rank}</span>;
  };

  const getScore = (entry: StudentRank) => entry.xp + (entry.streak * 50) + (entry.examReadinessScore * 2);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">National Leaderboard</h1>
              <p className="text-xs text-slate-400">{totalStudents} students competing</p>
            </div>
          </div>
          {currentUserRank && (
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl px-3 py-1.5 text-xs font-black text-teal-400">
              Your Rank: #{currentUserRank}
            </div>
          )}
        </div>
      </div>

      {/* Stream Filter */}
      <div className="flex gap-2">
        {(['All', 'Natural Science', 'Social Science'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStream(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStream === s
                ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s === 'All' ? 'All Streams' : s === 'Natural Science' ? 'Natural Sci.' : 'Social Sci.'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm">
          No leaderboard data yet. Start studying to climb the ranks!
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 items-end max-w-lg mx-auto">
              {/* #2 */}
              <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-2 border-2 border-slate-400">
                  <Medal className="w-6 h-6 text-slate-300" />
                </div>
                <div className="text-xs font-black text-white truncate">{top3[1].name}</div>
                <div className="text-[10px] text-slate-500 truncate">{top3[1].school}</div>
                <div className="mt-2 text-sm font-black text-teal-400">{getScore(top3[1])}</div>
                <div className="text-[9px] text-slate-500">pts</div>
              </div>
              {/* #1 */}
              <div className="bg-[#1E293B] border border-yellow-500/40 rounded-2xl p-4 text-center ring-2 ring-yellow-500/20">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2 border-2 border-yellow-400">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-sm font-black text-white truncate">{top3[0].name}</div>
                <div className="text-[10px] text-slate-500 truncate">{top3[0].school}</div>
                <div className="mt-2 text-base font-black text-yellow-400">{getScore(top3[0])}</div>
                <div className="text-[9px] text-slate-500">pts</div>
              </div>
              {/* #3 */}
              <div className="bg-[#1E293B] border border-amber-700/40 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center mx-auto mb-2 border-2 border-amber-600">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-xs font-black text-white truncate">{top3[2].name}</div>
                <div className="text-[10px] text-slate-500 truncate">{top3[2].school}</div>
                <div className="mt-2 text-sm font-black text-amber-500">{getScore(top3[2])}</div>
                <div className="text-[9px] text-slate-500">pts</div>
              </div>
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_80px_80px_60px] gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <span>Rank</span>
              <span>Student</span>
              <span>XP</span>
              <span>Streak</span>
              <span>Score</span>
            </div>
            {rest.map((entry) => (
              <div
                key={entry.rank}
                className={`grid grid-cols-[40px_1fr_80px_80px_60px] gap-2 px-4 py-3 border-b border-slate-800/50 items-center ${
                  entry.isCurrentUser ? 'bg-teal-500/5' : 'hover:bg-slate-800/30'
                }`}
              >
                <span className="text-xs font-bold text-slate-400">#{entry.rank}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{entry.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{entry.school}</div>
                </div>
                <span className="text-xs font-bold text-teal-400">{entry.xp}</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {entry.streak}d
                </span>
                <span className="text-xs font-black text-white">{getScore(entry)}</span>
              </div>
            ))}
          </div>

          {/* Scoring explanation */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-400">How scoring works:</div>
            <div>Score = XP earned + (Study Streak × 50) + (Exam Readiness × 2)</div>
            <div>Complete practice sessions, study notes, and mock exams to earn XP and climb the ranks!</div>
          </div>
        </>
      )}
    </div>
  );
}
