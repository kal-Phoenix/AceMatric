import { useState } from 'react';
import { ExternalLink, Check, Youtube, Play } from 'lucide-react';

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const JUNK_IDS = ['placeholder', 'dQw4w9WgXcQ'];

export function extractYouTubeId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw || JUNK_IDS.includes(raw)) return null;
  if (YT_ID.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || '';
      return YT_ID.test(id) ? id : null;
    }
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && YT_ID.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const i = parts.findIndex((p) => ['embed', 'shorts', 'v', 'live'].includes(p));
      const candidate = i >= 0 ? parts[i + 1] || '' : '';
      return YT_ID.test(candidate) ? candidate : null;
    }
  } catch {
    /* not a url */
  }
  return null;
}

export function extractYouTubeVideoId(input: string): string {
  return extractYouTubeId(input) || '';
}

interface VideoPlayerProps {
  videoId: string;
  title: string;
  duration: string;
  isWatched?: boolean;
  onMarkWatched?: () => void;
}

export default function VideoPlayer({ videoId, title, duration, isWatched, onMarkWatched }: VideoPlayerProps) {
  const id = extractYouTubeId(videoId);
  const raw = (videoId || '').trim();
  const watchUrl = id
    ? `https://www.youtube.com/watch?v=${id}`
    : raw.startsWith('http')
    ? raw
    : null;

  if (!id && !watchUrl) return null;

  return (
    <div className="bg-[#141920] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <PlayerArea videoId={id} rawUrl={watchUrl} title={title} />

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
          {watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white flex items-center space-x-1.5 transition-all text-xs font-bold"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerArea({ videoId, rawUrl, title }: { videoId: string | null; rawUrl: string | null; title: string }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playing = !!videoId && playingId === videoId;

  if (playing && videoId) {
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => videoId && setPlayingId(videoId)}
      className="group relative block w-full aspect-video bg-[#0A0E14] overflow-hidden cursor-pointer"
      aria-label={`Play video: ${title}`}
    >
      {videoId ? (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = '1';
              img.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
            } else {
              img.style.display = 'none';
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E14] to-[#141920]" />
      )}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform">
          <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white ml-1" fill="currentColor" />
        </span>
      </span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-[11px] font-semibold text-white tracking-wide">
        Click to play in-page
      </span>
      {!videoId && rawUrl && (
        <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] text-slate-400">
          Video preview unavailable — use Watch on YouTube
        </span>
      )}
    </button>
  );
}
