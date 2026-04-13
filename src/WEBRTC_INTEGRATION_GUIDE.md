# 📞 WebRTC Calling - Complete Integration Guide

## ✅ What We've Built

### 1. **Backend Infrastructure**
- ✅ Database tables (`user_call_status`, `call_sessions`, `call_signals`)
- ✅ Real-time subscriptions via Supabase
- ✅ Signaling system for WebRTC

### 2. **Core Hook**
- ✅ `useWebRTC` - Complete WebRTC management
- ✅ Peer connection handling
- ✅ Media stream management
- ✅ Call state management

### 3. **UI Components**
- ✅ `IncomingCallModal` - Beautiful incoming call screen
- ✅ `ActiveCallScreen` - Full-featured call interface
- ✅ `UserDirectory` - Searchable user list with online status
- ✅ `CallHistory` - Complete call log with filters

---

## 🚀 Step-by-Step Setup

### **Step 1: Install Dependencies**

```bash
npm install simple-peer
```

Or add to your imports (if using CDN):
```typescript
import SimplePeer from 'simple-peer';
```

---

### **Step 2: Create Database Tables**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL from `/DATABASE_CALLING_SCHEMA.md`
3. Verify tables created in **Table Editor**

**Tables to create:**
- `user_call_status` - User online/offline status
- `call_sessions` - Call history
- `call_signals` - WebRTC signaling

**Enable Realtime:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_call_status;
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
```

---

### **Step 3: Integration into App.tsx**

Add to your App.tsx imports:
```typescript
import { useWebRTC } from './hooks/useWebRTC';
import { IncomingCallModal } from './components/calling/incoming-call-modal';
import { ActiveCallScreen } from './components/calling/active-call-screen';
import { UserDirectory } from './components/calling/user-directory';
import { CallHistory } from './components/calling/call-history';
```

Add state variables:
```typescript
const [showUserDirectory, setShowUserDirectory] = useState(false);
const [showCallHistory, setShowCallHistory] = useState(false);
```

Initialize WebRTC hook:
```typescript
const webrtc = useWebRTC({
  userId: user.id,
  userName: user.full_name,
});

// Set user online when app loads
useEffect(() => {
  if (user?.id) {
    webrtc.goOnline();
  }
  return () => {
    webrtc.goOffline();
  };
}, [user]);
```

Add to your JSX (before closing div):
```typescript
{/* Incoming Call Modal */}
{webrtc.incomingCall && (
  <IncomingCallModal
    callerName={webrtc.incomingCall.caller.name}
    callerRole={webrtc.incomingCall.caller.role}
    callType={webrtc.incomingCall.session.call_type}
    onAccept={webrtc.answerCall}
    onReject={webrtc.rejectCall}
  />
)}

{/* Active Call Screen */}
{webrtc.activeCall && (
  <ActiveCallScreen
    remoteName={webrtc.activeCall.remoteUser.name}
    remoteRole={webrtc.activeCall.remoteUser.role}
    localStream={webrtc.activeCall.localStream}
    remoteStream={webrtc.activeCall.remoteStream}
    callType={webrtc.activeCall.session.call_type}
    isMuted={webrtc.isMuted}
    isVideoEnabled={webrtc.isVideoEnabled}
    callStatus={webrtc.callStatus}
    onEndCall={() => webrtc.endCall('completed')}
    onToggleMute={webrtc.toggleMute}
    onToggleVideo={webrtc.toggleVideo}
  />
)}

{/* User Directory Modal */}
{showUserDirectory && (
  <UserDirectory
    currentUserId={user.id}
    onClose={() => setShowUserDirectory(false)}
    onCallUser={async (userId, userName, callType) => {
      setShowUserDirectory(false);
      try {
        await webrtc.initiateCall(userId, userName, callType);
      } catch (err: any) {
        alert(err.message);
      }
    }}
  />
)}

{/* Call History Modal */}
{showCallHistory && (
  <CallHistory
    userId={user.id}
    onClose={() => setShowCallHistory(false)}
    onCallBack={async (userId, userName) => {
      setShowCallHistory(false);
      try {
        await webrtc.initiateCall(userId, userName, 'audio');
      } catch (err: any) {
        alert(err.message);
      }
    }}
  />
)}
```

---

### **Step 4: Add Call Button to Navigation**

Add a floating call button or navigation item:

```typescript
{/* Call Icon in Top Navigation */}
<button
  onClick={() => setShowUserDirectory(true)}
  className="relative w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
  title="Make a Call"
>
  <Phone className="w-6 h-6" />
  {webrtc.isOnline && (
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
  )}
</button>

{/* Call History Icon */}
<button
  onClick={() => setShowCallHistory(true)}
  className="relative w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
  title="Call History"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
</button>
```

---

## 🎯 Key Features

### ✅ **Automatic Features:**
1. **User Presence** - Auto-updates online/offline status
2. **Real-time Signaling** - WebRTC offer/answer via Supabase
3. **Call History** - Auto-logs all calls
4. **Status Updates** - Shows who's online/busy/in_call

### ✅ **Manual Controls:**
1. **Mute/Unmute** - Toggle microphone
2. **Video On/Off** - Toggle camera
3. **End Call** - Hang up
4. **Accept/Reject** - Answer or decline incoming calls

---

## 📱 Mobile Considerations (Capacitor)

For production mobile deployment:

### 1. **Permissions** (Add to capacitor.config.ts)
```json
{
  "plugins": {
    "Camera": {
      "permissions": ["camera", "microphone"]
    }
  }
}
```

### 2. **Background Mode** (Keep calls alive)
```bash
npm install @capacitor-community/background-mode
```

### 3. **Push Notifications** (Incoming call alerts)
```bash
npm install @capacitor/push-notifications
```

---

## 🐛 Troubleshooting

### **Issue: "Could not access microphone/camera"**
**Solution:** 
- Ensure HTTPS (WebRTC requires secure context)
- Check browser permissions
- Test with: `navigator.mediaDevices.getUserMedia({ audio: true })`

### **Issue: "No remote stream"**
**Solution:**
- Check STUN server connectivity
- Verify both users are online
- Check browser console for peer errors

### **Issue: "Signaling not working"**
**Solution:**
- Verify Realtime is enabled in Supabase
- Check RLS policies allow inserts
- Monitor Supabase logs for errors

### **Issue: "Calls drop on cellular"**
**Solution:**
- Add TURN server for NAT traversal
- Use free TURN: `stun:global.turn.twilio.com:3478`
- Or self-host `coturn` server

---

## 🔧 Advanced Configuration

### **Add TURN Server (for better connectivity)**

Update `useWebRTC.tsx`:
```typescript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { 
    urls: 'turn:your-turn-server.com:3478',
    username: 'user',
    credential: 'pass'
  },
];
```

### **Call Recording** (Future enhancement)
- Use MediaRecorder API
- Store recordings in Supabase Storage
- Add to `activeCall` state

### **Group Calls** (3+ participants)
- Create mesh topology (each peer connects to others)
- Or use SFU architecture (recommended for 5+ users)

---

## 📊 Performance Optimization

### **For 2G/3G Networks:**
1. **Default to audio-only** calls
2. **Reduce video quality:**
   ```typescript
   video: {
     width: { ideal: 320 },
     height: { ideal: 240 },
     frameRate: { max: 15 }
   }
   ```
3. **Monitor network quality** and auto-downgrade

### **Battery Optimization:**
1. Stop video when app backgrounded
2. Use audio-only for long calls
3. End idle calls after timeout

---

## 🎨 UI Customization

All components use Tailwind CSS and can be customized:

- **Colors:** Change gradient classes
- **Icons:** Use lucide-react or custom SVGs
- **Animations:** Modify transition classes
- **Layout:** Responsive by default

---

## 📈 Analytics & Monitoring

Track these metrics:
- Total calls made/received
- Call duration average
- Success rate (connected vs failed)
- Network quality scores

Add to Supabase:
```sql
-- Analytics view
CREATE VIEW call_analytics AS
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_calls,
  AVG(duration_seconds) as avg_duration,
  COUNT(CASE WHEN status = 'ended' THEN 1 END) as successful_calls
FROM call_sessions
GROUP BY DATE(started_at);
```

---

## ✅ Testing Checklist

- [ ] Database tables created
- [ ] Realtime enabled
- [ ] Simple-peer installed
- [ ] WebRTC hook integrated
- [ ] UI components render
- [ ] Microphone permission works
- [ ] Camera permission works (video calls)
- [ ] Can initiate audio call
- [ ] Can receive incoming call
- [ ] Can accept/reject calls
- [ ] Mute/unmute works
- [ ] Video toggle works
- [ ] End call works
- [ ] Call history logs
- [ ] User directory shows online status

---

## 🚀 Go Live!

Your WebRTC calling system is ready! Users can now:
1. ✅ See who's online
2. ✅ Make audio/video calls
3. ✅ Receive incoming calls
4. ✅ View call history
5. ✅ Call back from history

**Total cost: $0** (using free STUN servers and Supabase free tier)

🎉 **Happy Calling!**
