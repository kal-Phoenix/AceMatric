import { ExternalLink, Check } from 'lucide-react';

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
    <div className="bg-[#141920] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-[#0A0E14]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-white">
            {title}
          </h4>
          <p className="text-[10px] text-slate-400 font-mono">
            {duration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onMarkWatched && (
            <button
              onClick={onMarkWatched}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all text-[10px] font-bold cursor-pointer ${
                isWatched
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
            </button>
          )}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 flex items-center space-x-1.5 transition-all text-[10px] font-bold"
          >
            <ExternalLink className="w-3 h-3" />
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}
