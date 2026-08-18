import React from 'react';
import { 
  Clock, 
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { TimerState } from './interfaces';

interface RoomTimerProps {
  timerState: TimerState;
  handleTimerControl: (action: 'start' | 'pause' | 'reset', customDuration?: number) => void;
  formatTime: (seconds: number) => string;
}

export default function RoomTimer({
  timerState,
  handleTimerControl,
  formatTime
}: RoomTimerProps) {
  return (
    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-xl">
      <div className="flex items-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 transition-all duration-500 ${timerState.isPlaying ? 'text-indigo-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '10s' }} />
        <span className="text-xs font-mono font-black text-indigo-300 w-11 text-center">
          {formatTime(timerState.timeLeft)}
        </span>
      </div>
      
      <div className="h-4 w-[1px] bg-slate-800"></div>

      <div className="flex items-center gap-1">
        {timerState.isPlaying ? (
          <button
            onClick={() => handleTimerControl('pause')}
            className="p-1 text-amber-450 hover:text-amber-300 hover:bg-amber-500/10 rounded-md transition-all cursor-pointer active:scale-90"
            title="Pause Countdown"
            aria-label="Pause countdown"
          >
            <Pause className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => handleTimerControl('start')}
            className="p-1 text-emerald-455 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-md transition-all cursor-pointer active:scale-90"
            title="Start Pomodoro"
            aria-label="Start pomodoro"
          >
            <Play className="w-3 h-3 fill-emerald-500" />
          </button>
        )}
        <button
          onClick={() => handleTimerControl('reset', 1500)}
          className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-all cursor-pointer active:scale-90"
          title="Reset to 25:00"
          aria-label="Reset timer to 25 minutes"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
