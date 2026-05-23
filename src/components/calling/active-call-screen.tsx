import { useEffect, useState, useRef } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';

interface ActiveCallScreenProps {
  remoteName: string;
  remoteRole: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callType: 'audio' | 'video';
  isMuted: boolean;
  isVideoEnabled: boolean;
  callStatus: 'calling' | 'ringing' | 'connected';
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export function ActiveCallScreen({
  remoteName,
  remoteRole,
  localStream,
  remoteStream,
  callType,
  isMuted,
  isVideoEnabled,
  callStatus,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: ActiveCallScreenProps) {
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'connected') return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  // Attach remote stream to video/audio element
  useEffect(() => {
    if (remoteStream) {
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-50 flex flex-col">
      {/* Video Call Layout */}
      {callType === 'video' ? (
        <div className="flex-1 relative">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            {remoteStream && isVideoEnabled ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <User className="w-16 h-16 text-white" />
                </div>
                <p className="text-white text-xl font-semibold">{remoteName}</p>
                <p className="text-blue-200">{remoteRole}</p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {localStream && (
            <div className="absolute top-6 right-6 w-32 h-40 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Call Info Overlay */}
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md rounded-2xl px-6 py-4 text-white">
            <div className="text-xl font-bold mb-1">{remoteName}</div>
            <div className="text-blue-200 text-sm mb-2">{remoteRole}</div>
            <div className="text-lg font-mono">
              {callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
            </div>
          </div>
        </div>
      ) : (
        /* Audio Call Layout */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Hidden audio element for remote stream */}
          <audio ref={remoteAudioRef} autoPlay />

          {/* Caller Avatar */}
          <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <User className="w-20 h-20 text-white" />
          </div>

          {/* Caller Info */}
          <h2 className="text-3xl font-bold text-white mb-2">{remoteName}</h2>
          <p className="text-blue-200 text-lg mb-6">{remoteRole}</p>

          {/* Call Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
            <p className="text-white text-xl font-mono">
              {callStatus === 'connected' ? formatDuration(callDuration) : 
               callStatus === 'calling' ? 'Calling...' : 
               'Ringing...'}
            </p>
          </div>

          {/* Audio Wave Animation (when connected) */}
          {callStatus === 'connected' && (
            <div className="flex items-center gap-1 h-16">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-blue-400 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 40}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md p-6 pb-8">
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <Phone className="w-9 h-9 text-white transform rotate-135" />
          </button>

          {/* Video Toggle (if video call) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                !isVideoEnabled 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <VideoOff className="w-7 h-7 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Button Labels */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="text-white/70 text-xs w-16 text-center">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
          <span className="text-white/70 text-xs w-20 text-center">End Call</span>
          {callType === 'video' && (
            <span className="text-white/70 text-xs w-16 text-center">
              {isVideoEnabled ? 'Camera' : 'Camera'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
