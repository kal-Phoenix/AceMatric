import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Timer, Play, Pause, RotateCcw, X, Zap, GripVertical,
  Volume2, VolumeX, Minimize2, History, Settings,
  ChevronDown, ChevronUp, Target, Flame
} from 'lucide-react';

type FocusMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODES: Record<FocusMode, { label: string; duration: number; color: string; gradient: string }> = {
  pomodoro: { label: 'Focus', duration: 1500, color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  shortBreak: { label: 'Short Break', duration: 300, color: 'emerald', gradient: 'bg-slate-800/50' },
  longBreak: { label: 'Long Break', duration: 900, color: 'blue', gradient: 'from-blue-500 to-indigo-500' },
};

const DURATIONS: Record<FocusMode, number[]> = {
  pomodoro: [15, 25, 30, 45, 50, 60],
  shortBreak: [3, 5, 10, 15],
  longBreak: [10, 15, 20, 30],
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface SessionLog {
  id: number;
  mode: FocusMode;
  duration: number;
  completedAt: Date;
}

export default function FloatingTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalFocusToday, setTotalFocusToday] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [customDuration, setCustomDuration] = useState(25);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const current = MODES[mode];
  const progress = 1 - timeLeft / current.duration;
  const circumference = 2 * Math.PI * 18;

  const switchMode = useCallback((m: FocusMode) => {
    setIsRunning(false);
    setMode(m);
    setTimeLeft(MODES[m].duration);
    setCustomDuration(Math.round(MODES[m].duration / 60));
  }, []);

  const setCustomTime = useCallback((minutes: number) => {
    setCustomDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
      if (mode === 'pomodoro') {
        setTotalFocusToday((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, timeLeft, mode]);

  useEffect(() => {
    if (timeLeft !== 0 || !isRunning) return;
    setIsRunning(false);

    const session: SessionLog = {
      id: Date.now(),
      mode,
      duration: current.duration,
      completedAt: new Date(),
    };
    setSessions((prev) => [session, ...prev]);

    if (mode === 'pomodoro') {
      setCompletedToday((c) => c + 1);
      if (soundEnabled) playNotificationSound();
      if (autoStart) {
        switchMode('shortBreak');
        setIsRunning(true);
      } else {
        switchMode('shortBreak');
      }
    } else {
      if (soundEnabled) playNotificationSound();
      if (autoStart) {
        switchMode('pomodoro');
        setIsRunning(true);
      } else {
        switchMode('pomodoro');
      }
    }
  }, [timeLeft, isRunning, mode, autoStart, soundEnabled, current.duration, switchMode]);

  const playNotificationSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  // Drag handlers — works on both the FAB and panel header
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    didDrag.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleToggle = useCallback(() => {
    if (didDrag.current) return;
    setIsOpen((o) => !o);
    setIsMinimized(false);
    setShowSettings(false);
    setShowHistory(false);
  }, []);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized((m) => !m);
    setShowSettings(false);
    setShowHistory(false);
  }, []);

  // === MINIMIZED STATE: tiny pill ===
  if (isMinimized) {
    return (
      <div
        className="fixed z-50 select-none touch-none"
        style={{ right: 16, bottom: 80, transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          onClick={handleToggle}
          onDoubleClick={handleMinimize}
          className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${current.gradient} text-white shadow-lg cursor-grab active:cursor-grabbing transition-all hover:scale-105`}
          title="Double-click to restore, click to expand"
        >
          {isRunning ? (
            <span className="text-xs font-semibold tabular-nums">{formatTime(timeLeft)}</span>
          ) : (
            <Timer className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  // === FULL / OPEN STATE ===
  return (
    <div
      className="fixed z-50 select-none touch-none"
      style={{ right: 16, bottom: 80, transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="flex flex-col items-end gap-3">
        {/* Expanded Panel */}
        {isOpen && (
          <div className="w-[min(288px,calc(100vw-32px))] bg-[#0F1218] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Draggable Header */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border-b border-slate-700/50 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-500" />
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Study Timer</span>
              </div>
              <div className="flex items-center gap-1">
                <button data-timer-btn onClick={handleMinimize} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors" title="Minimize" aria-label="Minimize timer">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button data-timer-btn onClick={() => { setIsOpen(false); }} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors" title="Close" aria-label="Close timer panel">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Circular Timer */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" className="stroke-slate-800" stroke="currentColor" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke="url(#tg)"
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - progress)}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={mode === 'pomodoro' ? '#f59e0b' : mode === 'shortBreak' ? '#10b981' : '#3b82f6'} />
                        <stop offset="100%" stopColor={mode === 'pomodoro' ? '#f97316' : mode === 'shortBreak' ? '#14b8a6' : '#6366f1'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold text-white tabular-nums">{formatTime(timeLeft)}</span>
                    <span className="text-xs font-bold text-slate-400 mt-1">{current.label}</span>
                  </div>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-1.5">
                {(Object.keys(MODES) as FocusMode[]).map((m) => (
                  <button
                    key={m} data-timer-btn
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      mode === m
                        ? 'bg-gradient-to-r ' + MODES[m].gradient + ' text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {MODES[m].label}
                  </button>
                ))}
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-3">
                <button data-timer-btn onClick={() => switchMode(mode)} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-all" title="Reset" aria-label="Reset timer">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  data-timer-btn
                  onClick={() => setIsRunning(!isRunning)}
                  className={`p-3.5 rounded-xl bg-gradient-to-r ${current.gradient} text-white shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95`}
                  title={isRunning ? 'Pause' : 'Start'}
                  aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button data-timer-btn onClick={() => setSoundEnabled(!soundEnabled)} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-all" title={soundEnabled ? 'Mute' : 'Unmute'} aria-label={soundEnabled ? 'Mute timer sound' : 'Unmute timer sound'}>
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-bold text-slate-300">{completedToday} sessions</span>
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">{formatTotalTime(totalFocusToday)} focused</span>
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-2">
                {/* Custom Duration */}
                <button
                  data-timer-btn
                  onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/40 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-300">Duration & Settings</span>
                  </div>
                  {showSettings ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                {showSettings && (
                  <div className="px-3 py-3 bg-slate-900/30 rounded-xl border border-slate-800/40 space-y-3">
                    {/* Quick Duration Picks */}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Duration</span>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {DURATIONS[mode].map((min) => (
                          <button
                            key={min} data-timer-btn
                            onClick={() => setCustomTime(min)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              customDuration === min
                                ? 'bg-gradient-to-r ' + current.gradient + ' text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {min}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Slider */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom</span>
                        <span className="text-[11px] font-semibold text-white tabular-nums">{customDuration} min</span>
                      </div>
                      <input
                        type="range"
                        min={1} max={120} value={customDuration}
                        onChange={(e) => setCustomTime(Number(e.target.value))}
                        className="w-full h-1.5 mt-2 rounded-full appearance-none bg-slate-700 accent-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Auto-start Toggle */}
                    <label className="flex items-center justify-between cursor-pointer" data-timer-btn>
                      <span className="text-[11px] font-bold text-slate-300">Auto-start next session</span>
                      <div
                        onClick={() => setAutoStart(!autoStart)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${autoStart ? 'bg-amber-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoStart ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>
                )}

                {/* Session History */}
                <button
                  data-timer-btn
                  onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/40 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-300">Session History</span>
                    {sessions.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">{sessions.length}</span>
                    )}
                  </div>
                  {showHistory ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                {showHistory && (
                  <div className="px-3 py-3 bg-slate-900/30 rounded-xl border border-slate-800/40 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {sessions.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-2">No sessions yet. Start focusing!</p>
                    ) : (
                      sessions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${s.mode === 'pomodoro' ? 'amber' : s.mode === 'shortBreak' ? 'emerald' : 'blue'}-400`} />
                            <span className="text-xs font-bold text-slate-300">{MODES[s.mode].label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-400">{formatTime(s.duration)}</span>
                            <span className="text-xs text-slate-600 ml-1.5">
                              {s.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button — draggable */}
        <button
          onClick={handleToggle}
          onDoubleClick={handleMinimize}
          className={`w-11 h-11 rounded-full bg-amber-500/90 hover:bg-amber-500 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:shadow-xl border border-amber-400/30`}
          title="Study Timer — drag to move, double-click to minimize"
        >
          {isRunning ? (
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm font-semibold tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <Timer className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
