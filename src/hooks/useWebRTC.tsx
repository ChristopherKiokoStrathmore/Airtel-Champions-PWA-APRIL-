import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import SimplePeer from 'simple-peer';

// ============================================================================
// WebRTC Calling Hook - POLLING MODE ONLY (No Realtime WebSocket)
// Updated: 2026-01-17 - Removed all Realtime dependencies for reliability
// ============================================================================

interface CallUser {
  id: string;
  name: string;
  employee_id: string;
  role: string;
}

interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected' | 'failed';
  call_type: 'audio' | 'video';
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

interface UseWebRTCProps {
  userId: string;
  userName: string;
}

export function useWebRTC({ userId, userName }: UseWebRTCProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    session: CallSession;
    caller: CallUser;
  } | null>(null);
  const [activeCall, setActiveCall] = useState<{
    session: CallSession;
    peer: SimplePeer.Instance;
    remoteUser: CallUser;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'polling' | 'disconnected'>('disconnected');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callSignalChannelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedCallIdRef = useRef<string | null>(null);
  const signalPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedSignalIdRef = useRef<string | null>(null);
  const hasStartedPollingRef = useRef(false); // Track if polling has started
  const realtimeAttemptedRef = useRef(false); // Track if we've tried Realtime once
  
  // NEW: Track tab visibility to reduce polling when app is in background
  const [isTabVisible, setIsTabVisible] = useState(true);
  const pollingIntervalTimeRef = useRef(5000); // Dynamic polling interval (starts at 5s)

  // STUN/TURN servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];
  
  // 🔥 NEW: Listen for tab visibility changes to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log(`[WebRTC] 👁️ Tab visibility changed: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
      setIsTabVisible(isVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update user status to online
  const goOnline = useCallback(async () => {
    try {
      console.log('[WebRTC] Setting user status to online:', userId);
      
      const { error } = await supabase
        .from('user_call_status')
        .upsert({
          user_id: userId,
          status: 'online',
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('[WebRTC] Error setting online status:', error);
      } else {
        setIsOnline(true);
        console.log('[WebRTC] ✅ User is now online');
      }
    } catch (err) {
      console.error('[WebRTC] Error in goOnline:', err);
    }
  }, [userId, supabase]);

  // Update user status to offline
  const goOffline = useCallback(async () => {
    try {
      console.log('[WebRTC] Setting user status to offline:', userId);
      
      const { error } = await supabase
        .from('user_call_status')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[WebRTC] Error setting offline status:', error);
      } else {
        setIsOnline(false);
        console.log('[WebRTC] ✅ User is now offline');
      }
    } catch (err) {
      console.error('[WebRTC] Error in goOffline:', err);
    }
  }, [userId, supabase]);

  // Get user media (audio/video)
  const getUserMedia = async (video: boolean = false): Promise<MediaStream> => {
    try {
      console.log('[WebRTC] Requesting user media, video:', video);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        } : false,
      });
      
      localStreamRef.current = stream;
      setPermissionStatus('granted');
      console.log('[WebRTC] ✅ Got user media stream');
      return stream;
    } catch (err: any) {
      // Only log as error if it's NOT a permission denial
      if (err.name === 'NotAllowedError') {
        console.log('[WebRTC] ℹ️ Microphone/camera access not granted by user');
        setPermissionStatus('denied');
      } else {
        console.error('[WebRTC] Error getting user media:', err);
        setPermissionStatus('denied');
      }
      throw new Error('Could not access microphone/camera. Please grant permissions.');
    }
  };

  // 🔥 NEW: Request microphone permissions proactively (call this before going online)
  const requestPermissions = async (): Promise<boolean> => {
    try {
      console.log('[WebRTC] 🎤 Requesting microphone permissions...');
      
      // Request audio only - just to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      
      // Immediately stop the stream - we just wanted the permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      console.log('[WebRTC] ✅ Microphone permission granted!');
      return true;
    } catch (err: any) {
      // Only show error for non-permission issues
      if (err.name === 'NotAllowedError') {
        console.log('[WebRTC] ℹ️ User declined microphone permission');
      } else {
        console.error('[WebRTC] ❌ Permission error:', err.message);
      }
      setPermissionStatus('denied');
      return false;
    }
  };

  // Initiate a call
  const initiateCall = async (calleeId: string, calleeName: string, callType: 'audio' | 'video' = 'audio') => {
    try {
      console.log('[WebRTC] Initiating call to:', calleeName, 'Type:', callType);
      
      // Check permissions first
      if (permissionStatus === 'denied') {
        console.log('[WebRTC] ⚠️ Cannot initiate call - microphone permission denied');
        alert('Microphone permission is required to make calls. Please enable it in your browser settings.');
        return;
      }
      
      setCallStatus('calling');

      // 🔥 REMOVED: Online check - allow calling offline users too
      // They will receive the call when they come online or via notification
      console.log('[WebRTC] ✅ Calling user (online status not required)');

      // Create call session
      const { data: session, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: userId,
          callee_id: calleeId,
          status: 'ringing',
          call_type: callType,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('[WebRTC] Call session created:', session.id);

      // Get user media with error handling
      let stream: MediaStream;
      try {
        stream = await getUserMedia(callType === 'video');
        setIsVideoEnabled(callType === 'video');
      } catch (mediaErr: any) {
        // Clean up the call session if we can't get media
        await supabase
          .from('call_sessions')
          .update({ status: 'failed' })
          .eq('id', session.id);
        
        console.log('[WebRTC] ⚠️ Could not access microphone/camera');
        alert('Could not access microphone/camera. Please check your browser permissions.');
        setCallStatus('idle');
        return;
      }

      // Create peer as initiator
      const peer = new SimplePeer({
        initiator: true,
        stream,
        trickle: true,
        config: { iceServers },
      });

      peerRef.current = peer;

      // Handle peer events
      peer.on('signal', async (signal) => {
        console.log('[WebRTC] Sending offer signal');
        
        // Send offer through Supabase
        await supabase.from('call_signals').insert({
          call_session_id: session.id,
          from_user_id: userId,
          to_user_id: calleeId,
          signal_type: 'offer',
          signal_data: signal,
        });
      });

      peer.on('stream', (remoteStream) => {
        console.log('[WebRTC] ✅ Received remote stream');
        setActiveCall({
          session,
          peer,
          remoteUser: { id: calleeId, name: calleeName, employee_id: '', role: '' },
          localStream: stream,
          remoteStream,
        });
        setCallStatus('connected');
      });

      peer.on('error', (err) => {
        console.error('[WebRTC] Peer error:', err);
        endCall('failed');
      });

      peer.on('close', () => {
        console.log('[WebRTC] Peer connection closed');
        endCall('ended');
      });

      // Listen for answer signal
      subscribeToCallSignals(session.id, calleeId);

      // Update status to in_call
      await supabase
        .from('user_call_status')
        .update({ status: 'in_call', current_call_id: session.id })
        .eq('user_id', userId);

    } catch (err: any) {
      console.error('[WebRTC] Error initiating call:', err);
      setCallStatus('idle');
      throw err;
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('[WebRTC] Answering call:', incomingCall.session.id);
      
      // Check permissions first
      if (permissionStatus === 'denied') {
        console.log('[WebRTC] ⚠️ Cannot answer call - microphone permission denied');
        alert('Microphone permission is required to answer calls. Please enable it in your browser settings.');
        await rejectCall();
        return;
      }
      
      setCallStatus('connected');

      // Get user media with error handling
      let stream: MediaStream;
      try {
        stream = await getUserMedia(incomingCall.session.call_type === 'video');
        setIsVideoEnabled(incomingCall.session.call_type === 'video');
      } catch (mediaErr: any) {
        console.log('[WebRTC] ⚠️ Could not access microphone/camera while answering');
        alert('Could not access microphone/camera. Please check your browser permissions.');
        await rejectCall();
        return;
      }

      // Update session status
      await supabase
        .from('call_sessions')
        .update({
          status: 'active',
          answered_at: new Date().toISOString(),
        })
        .eq('id', incomingCall.session.id);

      // Get the offer signal
      const { data: offerSignal } = await supabase
        .from('call_signals')
        .select('signal_data')
        .eq('call_session_id', incomingCall.session.id)
        .eq('signal_type', 'offer')
        .single();

      if (!offerSignal) throw new Error('No offer signal found');

      // Create peer as receiver
      const peer = new SimplePeer({
        initiator: false,
        stream,
        trickle: true,
        config: { iceServers },
      });

      peerRef.current = peer;

      // Signal the offer
      peer.signal(offerSignal.signal_data);

      // Handle peer events
      peer.on('signal', async (signal) => {
        console.log('[WebRTC] Sending answer signal');
        
        await supabase.from('call_signals').insert({
          call_session_id: incomingCall.session.id,
          from_user_id: userId,
          to_user_id: incomingCall.caller.id,
          signal_type: 'answer',
          signal_data: signal,
        });
      });

      peer.on('stream', (remoteStream) => {
        console.log('[WebRTC] ✅ Received remote stream');
        setActiveCall({
          session: incomingCall.session,
          peer,
          remoteUser: incomingCall.caller,
          localStream: stream,
          remoteStream,
        });
      });

      peer.on('error', (err) => {
        console.error('[WebRTC] Peer error:', err);
        endCall('failed');
      });

      peer.on('close', () => {
        console.log('[WebRTC] Peer connection closed');
        endCall('ended');
      });

      // Subscribe to ICE candidates
      subscribeToCallSignals(incomingCall.session.id, incomingCall.caller.id);

      // Update status
      await supabase
        .from('user_call_status')
        .update({ status: 'in_call', current_call_id: incomingCall.session.id })
        .eq('user_id', userId);

      setIncomingCall(null);

    } catch (err) {
      console.error('[WebRTC] Error answering call:', err);
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('[WebRTC] Rejecting call:', incomingCall.session.id);

      await supabase
        .from('call_sessions')
        .update({
          status: 'rejected',
          ended_at: new Date().toISOString(),
          ended_reason: 'rejected',
        })
        .eq('id', incomingCall.session.id);

      setIncomingCall(null);
      setCallStatus('idle');
    } catch (err) {
      console.error('[WebRTC] Error rejecting call:', err);
    }
  };

  // End active call
  const endCall = async (reason: string = 'completed') => {
    try {
      console.log('[WebRTC] Ending call, reason:', reason);

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Destroy peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      // Update session if exists
      if (activeCall) {
        const duration = activeCall.session.answered_at
          ? Math.floor((Date.now() - new Date(activeCall.session.answered_at).getTime()) / 1000)
          : 0;

        await supabase
          .from('call_sessions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            ended_reason: reason,
            duration_seconds: duration,
          })
          .eq('id', activeCall.session.id);
      }

      // Update user status back to online
      await supabase
        .from('user_call_status')
        .update({ status: 'online', current_call_id: null })
        .eq('user_id', userId);

      // Stop signal polling
      if (signalPollingIntervalRef.current) {
        clearInterval(signalPollingIntervalRef.current);
        signalPollingIntervalRef.current = null;
      }
      lastCheckedSignalIdRef.current = null;

      // Unsubscribe from signals (legacy)
      if (callSignalChannelRef.current) {
        callSignalChannelRef.current.unsubscribe();
        callSignalChannelRef.current = null;
      }

      setActiveCall(null);
      setCallStatus('idle');
      setIsMuted(false);
      setIsVideoEnabled(false);

    } catch (err) {
      console.error('[WebRTC] Error ending call:', err);
    }
  };

  // Subscribe to call signals (offer, answer, ICE candidates) using POLLING
  const subscribeToCallSignals = (sessionId: string, remoteUserId: string) => {
    console.log('[WebRTC] 🔄 OPTIMIZED polling for call signals (1s interval)');

    // 🔥 OPTIMIZED: Signal polling reduced from 500ms to 1000ms (50% reduction)
    // This is acceptable for WebRTC signaling as ICE candidates can tolerate slight delays
    signalPollingIntervalRef.current = setInterval(async () => {
      try {
        // Check for new signals for this call session
        const { data: signals, error } = await supabase
          .from('call_signals')
          .select('*')
          .eq('call_session_id', sessionId)
          .eq('to_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[WebRTC] Signal polling error:', error);
          return;
        }

        if (signals && signals.length > 0) {
          const signal = signals[0];
          
          // Only process if it's a new signal we haven't seen
          if (lastCheckedSignalIdRef.current !== signal.id) {
            lastCheckedSignalIdRef.current = signal.id;
            
            console.log('[WebRTC] Received signal:', signal.signal_type);

            if (!peerRef.current) {
              console.warn('[WebRTC] No peer connection to signal');
              return;
            }

            try {
              if (signal.signal_type === 'answer' || signal.signal_type === 'ice_candidate') {
                peerRef.current.signal(signal.signal_data);
              } else if (signal.signal_type === 'hang_up') {
                endCall('remote_hangup');
              }
            } catch (err) {
              console.error('[WebRTC] Error processing signal:', err);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal polling error:', err);
      }
    }, 1000); // OPTIMIZED: Changed from 500ms to 1000ms
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!userId || !isOnline) return;

    console.log('[WebRTC] 🔄 Starting OPTIMIZED polling mode for incoming calls');
    setConnectionMode('polling');
    
    // 🔥 OPTIMIZED: Smart polling with tab visibility detection
    // - 5 seconds when tab is ACTIVE (down from 1s = 80% reduction)
    // - 30 seconds when tab is HIDDEN (background)
    const startPolling = () => {
      const pollInterval = isTabVisible ? 5000 : 30000;
      pollingIntervalTimeRef.current = pollInterval;
      
      console.log(`[WebRTC] 📊 Polling interval: ${pollInterval}ms (tab ${isTabVisible ? 'visible' : 'hidden'})`);
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // Check for new incoming calls
          const { data: calls, error } = await supabase
            .from('call_sessions')
            .select('*, caller:app_users!caller_id(id, full_name, employee_id, role)')
            .eq('callee_id', userId)
            .eq('status', 'ringing')
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('[WebRTC] Polling error:', error);
            return;
          }

          if (calls && calls.length > 0) {
            const session = calls[0];
            
            // Only process if it's a new call we haven't seen
            if (lastCheckedCallIdRef.current !== session.id) {
              lastCheckedCallIdRef.current = session.id;
              
              console.log('[WebRTC] 📞 Incoming call from:', session.caller_id);

              const caller = session.caller as any;
              if (caller) {
                setIncomingCall({
                  session,
                  caller: {
                    id: caller.id,
                    name: caller.full_name,
                    employee_id: caller.employee_id,
                    role: caller.role,
                  },
                });
                setCallStatus('ringing');
              }
            }
          }
        } catch (err) {
          console.error('[WebRTC] Polling error:', err);
        }
      }, pollInterval);
    };
    
    startPolling();

    return () => {
      console.log('[WebRTC] Cleaning up incoming calls listener');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      lastCheckedCallIdRef.current = null;
    };
  }, [userId, isOnline, isTabVisible]); // Re-run when tab visibility changes

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (callSignalChannelRef.current) {
        callSignalChannelRef.current.unsubscribe();
      }
      if (signalPollingIntervalRef.current) {
        clearInterval(signalPollingIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    goOnline,
    goOffline,
    incomingCall,
    activeCall,
    callStatus,
    isMuted,
    isVideoEnabled,
    connectionMode,
    permissionStatus,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    requestPermissions,
  };
}