/**
 * Client Order Tracker - Customer-facing order tracking
 * Shows personalized order journey for HBB clients (not agents)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, User, Calendar, MapPin, Phone, Star,
  MessageSquare, AlertTriangle, Navigation, Home, Wifi,
  ChevronRight, RefreshCw, Package, ThumbsUp, ThumbsDown,
  Send, History, ArrowLeft, LogOut, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const ACCENT = '#E60000';

// ─── Stage Definitions ───────────────────────────────────────────────────────
interface Stage {
  id: string;
  label: string;
  sublabel: string;
  icon: any;
  color: string;
}

const STAGES: Stage[] = [
  {
    id: 'verification',
    label: 'Verification',
    sublabel: 'Your order is being reviewed',
    icon: Clock,
    color: '#3B82F6',
  },
  {
    id: 'assigned',
    label: 'Installer Assigned',
    sublabel: 'Technician details available',
    icon: User,
    color: '#8B5CF6',
  },
  {
    id: 'enroute',
    label: 'On The Way',
    sublabel: 'Installer is coming to you',
    icon: Navigation,
    color: '#F59E0B',
  },
  {
    id: 'arrived',
    label: 'Installer Arrived',
    sublabel: 'Technician is at your location',
    icon: MapPin,
    color: '#10B981',
  },
  {
    id: 'complete',
    label: 'Installation Complete',
    sublabel: 'Please rate your experience',
    icon: CheckCircle2,
    color: '#10B981',
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
  jobId: string;
  customerName: string;
  customerPhone: string;
  onBackToHome?: () => void;
  onLogout?: () => void;
}

interface Installer {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalJobs: number;
  photo?: string;
}

interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ClientOrderTracker({ jobId, customerName, customerPhone, onBackToHome, onLogout }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [job, setJob] = useState<any>(null);
  const [installer, setInstaller] = useState<Installer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  
  // Issue reporting state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueHistory, setIssueHistory] = useState<any[]>([]);
  
  // Installer location for map
  const [installerLocation, setInstallerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ─── Fetch Job Details ─────────────────────────────────────────────────────
  const fetchJobDetails = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (jobError) throw jobError;
      setJob(jobData);
      
      // Map job status to stage
      const stageMap: { [key: string]: number } = {
        'scheduled': 0,
        'verification': 0,
        'assigned': 1,
        'enroute': 2,
        'arrived': 3,
        'in_progress': 3,
        'complete': 4,
        'completed': 4,
      };
      setCurrentStage(stageMap[jobData.status] ?? 0);
      
      // Fetch installer details if assigned
      if (jobData.installer_id) {
        const { data: installerData } = await supabase
          .from('installers')
          .select('id, name, phone')
          .eq('id', jobData.installer_id)
          .single();

        if (installerData) {
          setInstaller({
            id: String(installerData.id),
            name: installerData.name || 'Technician',
            phone: installerData.phone || 'N/A',
            rating: 4.5,
            totalJobs: 0,
            photo: undefined,
          });
          
          // Fetch installer location
          const { data: locationData } = await supabase
            .from('installer_locations')
            .select('*')
            .eq('installer_id', jobData.installer_id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          if (locationData) {
            setInstallerLocation({
              lat: locationData.lat,
              lng: locationData.lng,
            });
          }
        }
      }
      
      // Fetch issue history
      const { data: issues } = await supabase
        .from('job_issues')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      
      setIssueHistory(issues || []);
      
    } catch (err) {
      console.error('[Client Tracker] Error:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Auto-refresh every 30 seconds for live tracking
  useEffect(() => {
    const interval = setInterval(() => fetchJobDetails(true), 30000);
    return () => clearInterval(interval);
  }, [fetchJobDetails]);

  // ─── Submit Rating ─────────────────────────────────────────────────────────
  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('job_reviews')
        .insert({
          job_id: jobId,
          installer_id: installer?.id,
          rating,
          comment: review,
          customer_phone: customerPhone,
        });
      
      if (error) throw error;
      
      toast.success('Thank you for your feedback!');
      setShowRatingModal(false);
      fetchJobDetails(true);
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  // ─── Submit Issue ──────────────────────────────────────────────────────────
  const submitIssue = async () => {
    if (!issueType || !issueDescription) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('job_issues')
        .insert({
          job_id: jobId,
          customer_phone: customerPhone,
          issue_type: issueType,
          description: issueDescription,
          status: 'open',
        });
      
      if (error) throw error;
      
      toast.success('Issue reported. We will contact you shortly.');
      setShowIssueModal(false);
      setIssueType('');
      setIssueDescription('');
      fetchJobDetails(true);
    } catch (err) {
      toast.error('Failed to report issue');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Loading your order...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-y-auto">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Center - Welcome Message */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Welcome</p>
              <h1 className="text-lg font-bold text-gray-900">{customerName}</h1>
            </div>

            {/* Right Side - Profile & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchJobDetails(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <User className="w-5 h-5 text-red-600" />
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    >
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          toast.info('Profile modification coming soon');
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Edit Profile</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-2 my-1" />
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout?.();
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Order Status Card ──────────────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div 
          className="rounded-2xl overflow-hidden shadow-lg text-white p-5"
          style={{ 
            background: currentStage >= 4 
              ? 'linear-gradient(135deg, #10B981, #059669)' 
              : 'linear-gradient(135deg, #E60000, #B30000)' 
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                Order Status
              </p>
              <h2 className="text-xl font-black">{STAGES[currentStage]?.label}</h2>
              <p className="text-white/80 text-sm mt-1">{STAGES[currentStage]?.sublabel}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            <span className="text-white/70 text-xs">Order #:</span>
            <span className="text-white font-mono font-bold">{jobId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ─── Progress Timeline ─────────────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Order Progress</h3>
        
        <div className="space-y-0">
          {STAGES.map((stage, index) => {
            const isDone = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;
            const Icon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3"
              >
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone ? 'bg-green-500' : isCurrent ? 'bg-red-500 ring-4 ring-red-200' : 'bg-gray-200'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  {index < STAGES.length - 1 && (
                    <div
                      className="w-0.5 flex-1 min-h-[40px] rounded-full"
                      style={{ background: isDone ? '#10B981' : '#E5E7EB' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-5 ${index === STAGES.length - 1 ? 'pb-2' : ''}`}>
                  <div
                    className={`rounded-xl px-4 py-3 ${
                      isCurrent ? 'bg-red-50 border border-red-200' : 'bg-white'
                    }`}
                  >
                    <p className={`font-bold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                      {stage.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isPending ? 'text-gray-300' : 'text-gray-500'}`}>
                      {stage.sublabel}
                    </p>

                    {/* Installer Details - Stage 2 */}
                    {isCurrent && stage.id === 'assigned' && installer && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            {installer.photo ? (
                              <img src={installer.photo} alt={installer.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{installer.name}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span>{installer.rating}</span>
                              <span>({installer.totalJobs} jobs)</span>
                            </div>
                          </div>
                          <a
                            href={`tel:${installer.phone}`}
                            className="p-2 bg-green-500 rounded-full"
                          >
                            <Phone className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Map View - Stage 3 */}
                    {isCurrent && stage.id === 'enroute' && (
                      <div className="mt-3">
                        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center relative overflow-hidden">
                          {installerLocation ? (
                            <div className="text-center">
                              <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Live tracking active</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Installer is on the way
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                              <p className="text-sm text-gray-500">Installer is en route</p>
                            </div>
                          )}
                        </div>
                        {installer && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{installer.name}</span>
                            <span className="text-gray-300">|</span>
                            <a href={`tel:${installer.phone}`} className="text-red-500">
                              {installer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Arrived Confirmation - Stage 4 */}
                    {isCurrent && stage.id === 'arrived' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-bold">Installer has arrived!</span>
                        </div>
                        {installer && (
                          <p className="text-sm text-gray-600 mt-2">
                            {installer.name} is at your location and will begin installation shortly.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rating - Stage 5 */}
                    {isCurrent && stage.id === 'complete' && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowRatingModal(true)}
                          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <Star className="w-5 h-5" />
                          Rate Your Experience
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Issue Reporting Section ───────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              Need Help?
            </h3>
            <button
              onClick={() => setShowIssueModal(true)}
              className="text-sm text-red-500 font-semibold"
            >
              Report Issue
            </button>
          </div>

          {issueHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Previous Issues</p>
              {issueHistory.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 bg-gray-50 rounded-lg flex items-start gap-2"
                >
                  <History className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{issue.issue_type}</p>
                    <p className="text-xs text-gray-500">{issue.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          issue.status === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {issue.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 text-center">
              📞 Call{' '}
              <a href="tel:0800724000" className="font-bold underline">
                0800 724 000
              </a>{' '}
              for immediate assistance
            </p>
          </div>
        </div>
      </div>

      {/* ─── Rating Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-center mb-2">Rate Your Experience</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                How was your installation with {installer?.name}?
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Review Text */}
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience (optional)"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
                rows={3}
              />

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100"
                >
                  Skip
                </button>
                <button
                  onClick={submitRating}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Issue Report Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showIssueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold mb-4">Report an Issue</h3>

              {/* Issue Type */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Issue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Connection Problem', 'Speed Issue', 'Billing', 'Installer Conduct', 'Other'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setIssueType(type)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        issueType === type
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe your issue..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
                rows={4}
              />

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={submitIssue}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClientOrderTracker;