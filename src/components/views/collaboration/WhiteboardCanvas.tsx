import React from 'react';
import { 
  Video,
  VideoOff,
  MicOff,
  VolumeX,
  Mic,
  Headphones,
  Laptop
} from 'lucide-react';
import { CoStudyingPartner, RoomInfo } from './interfaces';

interface WhiteboardCanvasProps {
  coStudyingPartners: CoStudyingPartner[];
  isLocalVideoOn: boolean;
  toggleCamera: () => void;
  isMuted: boolean;
  handleToggleMute: () => void;
  isDeafened: boolean;
  handleToggleDeafen: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  peerStreams?: Record<string, MediaStream>;
  studyStatusText: string;
  setStudyStatusText: (v: string) => void;
  activeRoomDetail: RoomInfo | undefined;
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}

function renderAvatar(avatar: string | undefined, name: string) {
  if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />;
  }
  if (avatar && avatar.length <= 4) {
    return <span>{avatar}</span>;
  }
  return <span className="font-bold text-sm text-indigo-300">{name ? name.charAt(0).toUpperCase() : '🎓'}</span>;
}

export default function WhiteboardCanvas({
  coStudyingPartners,
  isLocalVideoOn,
  toggleCamera,
  isMuted,
  handleToggleMute,
  isDeafened,
  handleToggleDeafen,
  localVideoRef,
  peerStreams = {},
  studyStatusText,
  setStudyStatusText,
  activeRoomDetail
}: WhiteboardCanvasProps) {
  return (
    <div className="w-full md:w-3/5 border-b md:border-b-0 md:border-r border-slate-850/80 min-h-0 flex flex-col p-2 sm:p-4 space-y-2 sm:space-y-3 justify-between overflow-y-auto bg-slate-950/80">
      
      {/* Header inside of Focusmate camera grid */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Study Grid ({coStudyingPartners.length} Active)
        </span>
      </div>

      {/* Cameras Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 min-h-[160px] sm:min-h-[280px] content-start overflow-y-auto pr-1">
        {coStudyingPartners.map((member) => {
          const remoteStream = !member.isMe ? peerStreams[member.email] : null;

          return (
            <div
              key={member.email}
              className={`relative rounded-xl border aspect-video overflow-hidden group shadow-md transition-all flex flex-col items-center justify-center ${
                member.isMe
                  ? 'border-indigo-500/40 ring-1 ring-indigo-500/20 bg-slate-900'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {member.isMe && member.videoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : remoteStream ? (
                <RemoteVideo stream={remoteStream} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 relative bg-gradient-to-b from-slate-900/60 to-slate-950">
                  {member.videoEnabled ? (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-950/25"></div>
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg">
                        {renderAvatar(member.avatar, member.name)}
                      </div>
                      <span className="absolute text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded-md top-2 right-2 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Live Cam
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner relative">
                        {renderAvatar(member.avatar, member.name)}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-800 rounded-full border border-slate-900 flex items-center justify-center text-[9px] text-slate-400">
                          <VideoOff className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 font-semibold bg-slate-950/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Camera Off
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Device Overlay Indicators on individual cards */}
              <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                <span className={`px-1.5 py-0.5 text-xs font-bold rounded flex items-center gap-0.5 ${
                  member.isMe 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-950/80 text-slate-300'
                }`}>
                  {member.isMe ? 'YOU' : 'STUDENT'}
                </span>
                
                {member.isMuted && (
                  <span className="bg-rose-950/90 text-rose-400 p-0.5 rounded text-xs" title="Microphone Muted">
                    <MicOff className="w-2.5 h-2.5" />
                  </span>
                )}
                {member.isDeafened && (
                  <span className="bg-slate-950/90 text-slate-400 p-0.5 rounded text-xs" title="Audio Deafened">
                    <VolumeX className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Footer Info overlay on stream */}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 border-t border-slate-900 px-2 py-1.5 flex flex-col justify-center min-h-10 z-10">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-100 truncate">{member.name}</span>
                  <span className="text-xs text-slate-500 shrink-0 uppercase tracking-widest">{member.stream}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Laptop className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                  <span className="text-xs text-indigo-300 font-medium truncate italic" title={member.status}>
                    {member.status}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom device controller (Focusmate panel) */}
      <div className="p-2 sm:p-3 bg-slate-900 border border-slate-800/80 rounded-2xl shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between shadow-sm">
        {/* Device controls */}
        <div className="flex items-center gap-2">
            <button
            onClick={toggleCamera}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border ${
              isLocalVideoOn 
                ? 'bg-emerald-600 text-white border-emerald-500/30 hover:bg-emerald-500 shadow-sm' 
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700 border-slate-850'
            }`}
            aria-label={isLocalVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isLocalVideoOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-rose-455" />}
            <span className="hidden sm:inline">{isLocalVideoOn ? 'Camera Active' : 'Start Camera'}</span>
            <span className="sm:hidden">{isLocalVideoOn ? 'Cam On' : 'Camera'}</span>
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 border ${
              isMuted 
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500/30 shadow-sm' 
                : 'bg-slate-950 hover:bg-slate-850 text-emerald-400 border-slate-850 hover:border-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleDeafen}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 border ${
              isDeafened 
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/30 shadow-sm' 
                : 'bg-slate-950 hover:bg-slate-850 text-indigo-400 border-slate-850 hover:border-slate-700'
            }`}
            title={isDeafened ? 'Undeafen audio' : 'Deafen audio huddle'}
            aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
          </button>
        </div>

        {/* Study status focus update (what you're doing) */}
        <div className="w-full sm:w-auto flex-1 max-w-sm flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0">Focusing On:</span>
          <input
            type="text"
            value={studyStatusText}
            onChange={(e) => setStudyStatusText(e.target.value)}
            placeholder="What are you focusing on?"
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-850 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500/40"
          />
        </div>
      </div>

    </div>
  );
}
