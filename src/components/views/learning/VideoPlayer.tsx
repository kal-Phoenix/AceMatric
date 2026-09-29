import { ExternalLink, Check, Youtube } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  duration: string;
  isWatched?: boolean;
  onMarkWatched?: () => void;
}

export default function VideoPlayer({ videoId, title, duration, isWatched, onMarkWatched }: VideoPlayerProps) {
  if (!videoId) return null;

  return (
    <div className="bg-[#141920] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-[#0A0E14] overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
        <div className="space-y-0.5 text-left">
          <h4 className="text-xs sm:text-sm font-bold text-white">
            {title}
          </h4>
          <p className="text-[11px] text-slate-400 font-mono">
            Duration: {duration} • High-Yield Topic Masterclass
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onMarkWatched && (
            <button
              onClick={onMarkWatched}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all text-xs font-bold cursor-pointer ${
                isWatched
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
            </button>
          )}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white flex items-center space-x-1.5 transition-all text-xs font-bold"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
