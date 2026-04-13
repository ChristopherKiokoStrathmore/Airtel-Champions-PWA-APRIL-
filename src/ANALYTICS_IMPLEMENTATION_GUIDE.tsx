/**
 * AIRTEL CHAMPIONS - ANALYTICS IMPLEMENTATION GUIDE
 * 
 * This file shows how to implement analytics tracking throughout the app.
 * Copy these patterns into your existing components.
 */

// ============================================
// 1. AUTOMATIC PAGE TRACKING
// ============================================

// Add this to ANY component to automatically track page views and time spent:

import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function DashboardComponent() {
  // ✅ This line automatically tracks this page
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  return <div>Dashboard content...</div>;
}

export function ExploreFeedComponent() {
  usePageTracking(ANALYTICS_PAGES.EXPLORE);
  return <div>Explore feed...</div>;
}

export function ProgramsComponent() {
  usePageTracking(ANALYTICS_PAGES.PROGRAMS);
  return <div>Programs...</div>;
}

export function LeaderboardComponent() {
  usePageTracking(ANALYTICS_PAGES.LEADERBOARD);
  return <div>Leaderboard...</div>;
}

export function ProfileComponent() {
  usePageTracking(ANALYTICS_PAGES.PROFILE);
  return <div>Profile...</div>;
}

export function SettingsComponent() {
  usePageTracking(ANALYTICS_PAGES.SETTINGS);
  return <div>Settings...</div>;
}

export function GroupsComponent() {
  usePageTracking(ANALYTICS_PAGES.GROUPS);
  return <div>Groups...</div>;
}

export function GroupChatComponent() {
  usePageTracking(ANALYTICS_PAGES.GROUP_CHAT);
  return <div>Group chat...</div>;
}

// ============================================
// 2. TRACKING USER ACTIONS
// ============================================

import { trackAction, ANALYTICS_ACTIONS } from '../utils/analytics';

// Example: Track program submission
export function ProgramSubmitModal() {
  const handleSubmit = async (programData: any) => {
    try {
      // Submit program to database
      const result = await submitProgram(programData);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
        program_id: result.id,
        program_title: programData.title,
        program_type: programData.type,
        submission_method: 'manual',
      });
      
      alert('Program submitted!');
    } catch (error) {
      console.error(error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}

// Example: Track shop verification
export function ShopVerificationComponent() {
  const handleVerifyShop = async (shopData: any) => {
    try {
      // Verify shop
      const result = await verifyShop(shopData);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.VERIFY_SHOP, {
        shop_code: shopData.code,
        shop_name: shopData.name,
        gps_location: {
          latitude: shopData.lat,
          longitude: shopData.lng,
        },
        verification_method: 'gps_auto',
      });
      
      alert('Shop verified!');
    } catch (error) {
      console.error(error);
    }
  };
  
  return <button onClick={handleVerifyShop}>Verify Shop</button>;
}

// Example: Track social interactions
export function SocialFeedComponent() {
  const handleLikePost = async (postId: string) => {
    try {
      // Like the post
      await likePost(postId);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.LIKE_POST, {
        post_id: postId,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleCreatePost = async (postContent: string) => {
    try {
      // Create post
      const result = await createPost(postContent);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.CREATE_POST, {
        post_id: result.id,
        content_length: postContent.length,
        has_media: false,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Social feed...</div>;
}

// Example: Track group interactions
export function GroupChatComponent() {
  const handleSendMessage = async (message: string, groupId: string) => {
    try {
      // Send message
      await sendMessage(groupId, message);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.SEND_MESSAGE, {
        group_id: groupId,
        message_length: message.length,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Group chat...</div>;
}

// Example: Track calling actions
export function CallingComponent() {
  const handleStartCall = async (userId: string) => {
    try {
      // Start call
      await startCall(userId);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.START_CALL, {
        callee_id: userId,
        call_type: 'voice',
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleEndCall = async (callDuration: number) => {
    try {
      // End call
      await endCall();
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.END_CALL, {
        duration_seconds: callDuration,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Calling...</div>;
}

// Example: Track profile updates
export function ProfileEditComponent() {
  const handleUpdateProfile = async (profileData: any) => {
    try {
      // Update profile
      await updateProfile(profileData);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.UPDATE_PROFILE, {
        fields_updated: Object.keys(profileData),
      });
      
      alert('Profile updated!');
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleUploadProfilePicture = async (file: File) => {
    try {
      // Upload picture
      const result = await uploadProfilePicture(file);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.UPLOAD_PROFILE_PICTURE, {
        file_size: file.size,
        file_type: file.type,
      });
      
      alert('Profile picture uploaded!');
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Profile edit...</div>;
}

// Example: Track leaderboard views
export function LeaderboardComponent() {
  usePageTracking(ANALYTICS_PAGES.LEADERBOARD);
  
  const handleViewLeaderboard = async (timeframe: string) => {
    // ✅ Track leaderboard view with timeframe
    await trackAction(ANALYTICS_ACTIONS.VIEW_LEADERBOARD, {
      timeframe,
      view_type: 'full',
    });
  };
  
  useEffect(() => {
    handleViewLeaderboard('weekly');
  }, []);
  
  return <div>Leaderboard...</div>;
}

// Example: Track director actions
export function SubmissionReviewComponent() {
  const handleApproveSubmission = async (submissionId: string) => {
    try {
      // Approve submission
      await approveSubmission(submissionId);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.APPROVE_SUBMISSION, {
        submission_id: submissionId,
      });
      
      alert('Submission approved!');
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    try {
      // Reject submission
      await rejectSubmission(submissionId, reason);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.REJECT_SUBMISSION, {
        submission_id: submissionId,
        rejection_reason: reason,
      });
      
      alert('Submission rejected!');
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Submission review...</div>;
}

// Example: Track export actions
export function DataExportComponent() {
  const handleExportData = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Export data
      await exportData(format);
      
      // ✅ Track the action
      await trackAction(ANALYTICS_ACTIONS.EXPORT_DATA, {
        export_format: format,
        data_type: 'submissions',
      });
      
      alert('Data exported!');
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>Data export...</div>;
}

// ============================================
// 3. NAVIGATION TRACKING (AUTOMATIC)
// ============================================

// The usePageTracking hook automatically tracks:
// - When user enters a page
// - How long they stay on the page
// - When they leave the page

// Example: Dashboard with automatic tracking
export function DashboardWithTracking() {
  // ✅ Automatically tracks:
  // - Entry time
  // - Exit time
  // - Duration (calculated on exit)
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>All user activity on this page is automatically tracked!</p>
    </div>
  );
}

// ============================================
// 4. CUSTOM ACTION TYPES
// ============================================

// If you need to track custom actions not in ANALYTICS_ACTIONS:

export function CustomFeatureComponent() {
  const handleCustomAction = async () => {
    try {
      // Do something custom
      await doCustomThing();
      
      // ✅ Track with custom action type
      await trackAction('custom_feature_usage', {
        feature_name: 'my_custom_feature',
        success: true,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  return <button onClick={handleCustomAction}>Custom Action</button>;
}

// ============================================
// 5. SILENT FAILURE
// ============================================

// All analytics functions fail silently, so they never break your app:
// - If the user is offline, the action won't be tracked
// - If the database is down, the action won't be tracked
// - The app continues to work normally

// ============================================
// 6. RECOMMENDED TRACKING LOCATIONS
// ============================================

/**
 * WHERE TO ADD TRACKING:
 * 
 * ✅ Add usePageTracking to:
 * - /components/role-dashboards.tsx (all dashboard components)
 * - /components/explore-feed-local.tsx
 * - /components/programs/programs-list.tsx
 * - /components/leaderboard-enhanced-unified.tsx
 * - /components/profile-screen-enhanced.tsx
 * - /components/settings-screen.tsx
 * - /components/groups-list-screen.tsx
 * - /components/group-chat.tsx
 * - /components/calling/user-directory.tsx
 * - /components/announcements-feed.tsx
 * - /components/director-line.tsx
 * - /components/reporting-structure-new.tsx
 * 
 * ✅ Add trackAction to:
 * - Program submission buttons
 * - Shop verification buttons
 * - Like/comment/share buttons
 * - Message send buttons
 * - Call start/end buttons
 * - Profile update buttons
 * - Approval/rejection buttons
 * - Export buttons
 * - Any important user interactions
 */

// ============================================
// 7. QUERYING ANALYTICS DATA (HQ Dashboard)
// ============================================

// In your HQ Dashboard, query the analytics:

import { supabase } from '../utils/supabase/client';

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  const loadAnalytics = async () => {
    // Get today's active users
    const { data: todayUsers } = await supabase
      .from('daily_active_users')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();
    
    // Get popular pages
    const { data: popularPages } = await supabase
      .from('popular_pages')
      .select('*')
      .limit(10);
    
    // Get top actions
    const { data: topActions } = await supabase
      .from('top_actions')
      .select('*')
      .limit(10);
    
    // Get user engagement scores
    const { data: engagement } = await supabase
      .from('user_engagement_scores')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(20);
    
    // Get session summary
    const { data: summary } = await supabase
      .from('session_analytics_summary')
      .select('*')
      .single();
    
    setStats({
      todayUsers,
      popularPages,
      topActions,
      engagement,
      summary,
    });
  };
  
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}

export default AnalyticsDashboard;
