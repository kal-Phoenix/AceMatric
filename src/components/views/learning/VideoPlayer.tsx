import { ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  duration: string;
}

export default function VideoPlayer({ videoId, title, duration }: VideoPlayerProps) {
  if (!videoId) return null;

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-[#0F172A]">
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
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 flex items-center space-x-1.5 transition-all text-[10px] font-bold"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Watch on YouTube</span>
        </a>
      </div>
    </div>
  );
}
