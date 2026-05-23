import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  callerRole: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ 
  callerName, 
  callerRole, 
  callType, 
  onAccept, 
  onReject 
}: IncomingCallModalProps) {
  const [ringing, setRinging] = useState(false);

  // 🔥 Ringtone with Web Audio API
  useEffect(() => {
    const interval = setInterval(() => {
      setRinging(prev => !prev);
    }, 1000);

    // Create ringtone using Web Audio API
    let audioContext: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let isPlaying = false;

    const playRingtone = () => {
      try {
        // Create audio context
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a pleasant two-tone ringtone (800Hz and 1000Hz)
        const playTone = (frequency: number, duration: number, delay: number = 0) => {
          setTimeout(() => {
            if (!audioContext) return;
            
            oscillator = audioContext.createOscillator();
            gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Sine wave for pleasant sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            
            // Volume envelope (fade in/out)
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          }, delay);
        };

        // Ring pattern: two beeps, pause, repeat
        const ringPattern = () => {
          if (!isPlaying) return;
          playTone(800, 0.4, 0);      // First beep (800Hz)
          playTone(1000, 0.4, 500);   // Second beep (1000Hz)
          setTimeout(ringPattern, 2000); // Repeat every 2 seconds
        };

        isPlaying = true;
        ringPattern();
        
        console.log('[Ringtone] 🔔 Playing ringtone');
      } catch (err) {
        console.log('[Ringtone] Could not play ringtone:', err);
      }
    };

    // Start ringtone
    playRingtone();

    return () => {
      clearInterval(interval);
      isPlaying = false;
      
      // Cleanup audio
      if (oscillator) {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch (e) {
          // Already stopped
        }
      }
      if (gainNode) {
        gainNode.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      
      console.log('[Ringtone] 🔕 Stopped ringtone');
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 z-50 flex flex-col items-center justify-center p-6">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl transition-transform duration-1000 ${ringing ? 'scale-100' : 'scale-150'}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl transition-transform duration-1000 ${ringing ? 'scale-150' : 'scale-100'}`}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Caller Avatar */}
        <div className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${ringing ? 'scale-110 shadow-2xl' : 'scale-100 shadow-xl'}`}>
          <User className="w-16 h-16 text-white" />
        </div>

        {/* Caller Info */}
        <div className="text-center mb-2">
          <h2 className="text-3xl font-bold text-white mb-2">
            {callerName}
          </h2>
          <p className="text-blue-200 text-lg mb-1">
            {callerRole}
          </p>
        </div>

        {/* Call Type Badge */}
        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
          <div className="flex items-center gap-2 text-white">
            {callType === 'video' ? (
              <>
                <Video className="w-5 h-5" />
                <span className="font-semibold">Video Call</span>
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Voice Call</span>
              </>
            )}
          </div>
        </div>

        {/* Ringing Text */}
        <div className={`text-white text-xl mb-12 transition-opacity duration-500 ${ringing ? 'opacity-100' : 'opacity-60'}`}>
          📞 Incoming call...
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-8">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className={`w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${ringing ? 'animate-pulse' : ''}`}
          >
            <Phone className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* Action Labels */}
        <div className="flex items-center gap-8 mt-4">
          <span className="text-white/80 text-sm w-20 text-center">Decline</span>
          <span className="text-white/80 text-sm w-20 text-center">Accept</span>
        </div>
      </div>
    </div>
  );
}