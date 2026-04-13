import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';

// ============================================================================
// WebRTC Calling Hook - Native RTCPeerConnection (zero external dependencies)
// Updated: 2026-03-05-v2 - Uses only browser-native WebRTC APIs
// Uses POLLING MODE ONLY (No Realtime WebSocket)
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
    peer: RTCPeerConnection;
    remoteUser: CallUser;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'polling' | 'disconnected'>('disconnected');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callSignalChannelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckedCallIdRef = useRef<string | null>(null);
  const signalPollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckedSignalIdRef = useRef<string | null>(null);
  const hasStartedPollingRef = useRef(false);
  const realtimeAttemptedRef = useRef(false);
  
  // Track tab visibility to reduce polling when app is in background
  const [isTabVisible, setIsTabVisible] = useState(true);
  const pollingIntervalTimeRef = useRef(5000);

  // STUN/TURN servers configuration
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  // Helper: create a new RTCPeerConnection with common handlers wired up
  const createPeerConnection = (
    sessionId: string,
    remoteUserId: string,
    localStream: MediaStream,
    onRemoteStream: (stream: MediaStream) => void,
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });

    // Add local tracks
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Send ICE candidates to remote peer via Supabase
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate');
        await supabase.from('call_signals').insert({
          call_session_id: sessionId,
          from_user_id: userId,
          to_user_id: remoteUserId,
          signal_type: 'ice_candidate',
          signal_data: { candidate: event.candidate.toJSON() },
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        endCall('failed');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'closed') {
        endCall('ended');
      }
    };

    return pc;
  };
  
  // Listen for tab visibility changes to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log(`[WebRTC] Tab visibility changed: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
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
        console.log('[WebRTC] User is now online');
      }
    } catch (err) {
      console.error('[WebRTC] Error in goOnline:', err);
    }
  }, [userId]);

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
        console.log('[WebRTC] User is now offline');
      }
    } catch (err) {
      console.error('[WebRTC] Error in goOffline:', err);
    }
  }, [userId]);

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
      console.log('[WebRTC] Got user media stream');
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.log('[WebRTC] Microphone/camera access not granted by user');
        setPermissionStatus('denied');
      } else {
        console.error('[WebRTC] Error getting user media:', err);
        setPermissionStatus('denied');
      }
      throw new Error('Could not access microphone/camera. Please grant permissions.');
    }
  };

  // Request microphone permissions proactively
  const requestPermissions = async (): Promise<boolean> => {
    try {
      console.log('[WebRTC] Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      console.log('[WebRTC] Microphone permission granted!');
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.log('[WebRTC] User declined microphone permission');
      } else {
        console.error('[WebRTC] Permission error:', err.message);
      }
      setPermissionStatus('denied');
      return false;
    }
  };

  // Initiate a call
  const initiateCall = async (calleeId: string, calleeName: string, callType: 'audio' | 'video' = 'audio') => {
    try {
      console.log('[WebRTC] Initiating call to:', calleeName, 'Type:', callType);
      
      if (permissionStatus === 'denied') {
        console.log('[WebRTC] Cannot initiate call - microphone permission denied');
        alert('Microphone permission is required to make calls. Please enable it in your browser settings.');
        return;
      }
      
      setCallStatus('calling');

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

      // Get user media
      let stream: MediaStream;
      try {
        stream = await getUserMedia(callType === 'video');
        setIsVideoEnabled(callType === 'video');
      } catch (mediaErr: any) {
        await supabase.from('call_sessions').update({ status: 'failed' }).eq('id', session.id);
        console.log('[WebRTC] Could not access microphone/camera');
        alert('Could not access microphone/camera. Please check your browser permissions.');
        setCallStatus('idle');
        return;
      }

      // Create native RTCPeerConnection as initiator
      const pc = createPeerConnection(session.id, calleeId, stream, (remoteStream) => {
        console.log('[WebRTC] Received remote stream');
        setActiveCall({
          session,
          peer: pc,
          remoteUser: { id: calleeId, name: calleeName, employee_id: '', role: '' },
          localStream: stream,
          remoteStream,
        });
        setCallStatus('connected');
      });

      peerRef.current = pc;

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[WebRTC] Sending offer signal');
      await supabase.from('call_signals').insert({
        call_session_id: session.id,
        from_user_id: userId,
        to_user_id: calleeId,
        signal_type: 'offer',
        signal_data: { sdp: pc.localDescription },
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
      
      if (permissionStatus === 'denied') {
        console.log('[WebRTC] Cannot answer call - microphone permission denied');
        alert('Microphone permission is required to answer calls. Please enable it in your browser settings.');
        await rejectCall();
        return;
      }
      
      setCallStatus('connected');

      // Get user media
      let stream: MediaStream;
      try {
        stream = await getUserMedia(incomingCall.session.call_type === 'video');
        setIsVideoEnabled(incomingCall.session.call_type === 'video');
      } catch (mediaErr: any) {
        console.log('[WebRTC] Could not access microphone/camera while answering');
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

      // Create native RTCPeerConnection as receiver
      const pc = createPeerConnection(incomingCall.session.id, incomingCall.caller.id, stream, (remoteStream) => {
        console.log('[WebRTC] Received remote stream');
        setActiveCall({
          session: incomingCall.session,
          peer: pc,
          remoteUser: incomingCall.caller,
          localStream: stream,
          remoteStream,
        });
      });

      peerRef.current = pc;

      // Set remote description from offer
      await pc.setRemoteDescription(new RTCSessionDescription(offerSignal.signal_data.sdp));

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('[WebRTC] Sending answer signal');
      await supabase.from('call_signals').insert({
        call_session_id: incomingCall.session.id,
        from_user_id: userId,
        to_user_id: incomingCall.caller.id,
        signal_type: 'answer',
        signal_data: { sdp: pc.localDescription },
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

      // Close peer connection (native API uses .close(), not .destroy())
      if (peerRef.current) {
        peerRef.current.close();
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
    console.log('[WebRTC] Polling for call signals (1s interval)');

    signalPollingIntervalRef.current = setInterval(async () => {
      try {
        const { data: signals, error } = await supabase
          .from('call_signals')
          .select('*')
          .eq('call_session_id', sessionId)
          .eq('to_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5); // Fetch a few recent signals to catch ICE candidates

        if (error) {
          console.error('[WebRTC] Signal polling error:', error);
          return;
        }

        if (signals && signals.length > 0) {
          for (const signal of signals) {
            // Only process new signals
            if (lastCheckedSignalIdRef.current === signal.id) continue;
            lastCheckedSignalIdRef.current = signal.id;

            console.log('[WebRTC] Received signal:', signal.signal_type);

            if (!peerRef.current) {
              console.warn('[WebRTC] No peer connection to signal');
              return;
            }

            try {
              if (signal.signal_type === 'answer' && signal.signal_data?.sdp) {
                await peerRef.current.setRemoteDescription(
                  new RTCSessionDescription(signal.signal_data.sdp)
                );
              } else if (signal.signal_type === 'ice_candidate' && signal.signal_data?.candidate) {
                await peerRef.current.addIceCandidate(
                  new RTCIceCandidate(signal.signal_data.candidate)
                );
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
    }, 1000);
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!userId || !isOnline) return;

    console.log('[WebRTC] Starting polling mode for incoming calls');
    setConnectionMode('polling');
    
    const startPolling = () => {
      const pollInterval = isTabVisible ? 5000 : 30000;
      pollingIntervalTimeRef.current = pollInterval;
      
      console.log(`[WebRTC] Polling interval: ${pollInterval}ms (tab ${isTabVisible ? 'visible' : 'hidden'})`);
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
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
            
            if (lastCheckedCallIdRef.current !== session.id) {
              lastCheckedCallIdRef.current = session.id;
              
              console.log('[WebRTC] Incoming call from:', session.caller_id);

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
  }, [userId, isOnline, isTabVisible]);

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
        peerRef.current.close();
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