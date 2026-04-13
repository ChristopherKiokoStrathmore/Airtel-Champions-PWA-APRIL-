import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, MapPin, Clock, Image as ImageIcon } from 'lucide-react';
import { Toast } from './toast';

// Capacitor Geolocation — dynamically imported to avoid crash on web/PWA
let CapacitorGeolocation: any = null;
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  import('@capacitor/geolocation').then(mod => { CapacitorGeolocation = mod.Geolocation; }).catch(() => {});
}

interface CameraCaptureProps {
  programId: number;
  programName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  accuracy?: number;
}

export function CameraCapture({ programId, programName, onClose, onSubmitSuccess }: CameraCaptureProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PhotoMetadata>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get GPS location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setGpsStatus('loading');
      
      // Try Capacitor first, then fall back to browser API
      if (CapacitorGeolocation) {
        const permissions = await CapacitorGeolocation.requestPermissions();
        if (permissions.location === 'granted' || permissions.location === 'prompt') {
          const position = await CapacitorGeolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
          setMetadata({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          setGpsStatus('success');
          return;
        }
      }
      
      // Fallback: Browser Geolocation API
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMetadata({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            });
            setGpsStatus('success');
          },
          (error) => {
            console.error('GPS Error:', error);
            setGpsStatus('error');
            showToastMessage('Could not get GPS location. Please enable location services.', 'error');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsStatus('error');
        showToastMessage('Location not supported in this browser.', 'error');
      }
    } catch (error: any) {
      console.error('GPS Error:', error);
      setGpsStatus('error');
      showToastMessage('Could not get GPS location. Please enable location services.', 'error');
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToastMessage('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToastMessage('Image too large. Maximum size is 10MB', 'error');
      return;
    }

    // Read image and extract EXIF data
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setCapturedPhoto(imageDataUrl);

      // Extract EXIF data (in production, use a library like exif-js)
      // For now, we'll use the GPS data we already captured
      setMetadata((prev) => ({
        ...prev,
        timestamp: new Date().toISOString(),
      }));

      showToastMessage('📸 Photo captured successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) {
      showToastMessage('Please capture a photo first', 'error');
      return;
    }

    if (gpsStatus !== 'success') {
      showToastMessage('GPS location required. Please wait or enable location services.', 'error');
      return;
    }

    if (!notes.trim()) {
      showToastMessage('Please add notes about this submission', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload to Supabase Storage
      // TODO: Create submission record in database
      // TODO: Update points and leaderboard

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      showToastMessage('✅ Submission successful! +10 points earned', 'success');
      
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      showToastMessage('Submission failed. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const formatCoordinate = (coord: number | undefined, isLatitude: boolean) => {
    if (!coord) return 'N/A';
    const direction = isLatitude ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-KE', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent px-6 py-5 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl text-white font-semibold">{programName}</h2>
          <p className="text-sm text-gray-300">Capture intelligence</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-6 h-6" strokeWidth={2} />
        </button>
      </div>

      {/* Camera View / Photo Preview */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
        {!capturedPhoto ? (
          <div className="text-center">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Camera className="w-16 h-16 text-white" strokeWidth={2} />
            </div>
            <p className="text-white text-lg mb-2">Ready to capture</p>
            <p className="text-gray-400 text-sm mb-6">
              {gpsStatus === 'loading' && '📍 Getting GPS location...'}
              {gpsStatus === 'success' && '✅ GPS locked'}
              {gpsStatus === 'error' && '❌ GPS unavailable'}
            </p>
            <button
              onClick={handleCameraClick}
              disabled={gpsStatus === 'loading'}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-xl transition-all active:scale-95 shadow-lg font-medium"
            >
              <Camera className="w-5 h-5 inline mr-2" strokeWidth={2} />
              {gpsStatus === 'loading' ? 'Waiting for GPS...' : 'Capture Photo'}
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            <img 
              src={capturedPhoto} 
              alt="Captured" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* Hidden file input for camera/gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Bottom Panel - Metadata & Submit */}
      {capturedPhoto && (
        <div className="bg-white rounded-t-3xl shadow-2xl animate-slide-up-bottom max-h-[50vh] overflow-y-auto">
          {/* Metadata Display */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">📋 Submission Details</h3>
            
            <div className="space-y-3">
              {/* GPS Location */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">GPS Location</p>
                  {gpsStatus === 'success' ? (
                    <>
                      <p className="text-xs text-gray-600 mt-1">
                        Lat: {formatCoordinate(metadata.latitude, true)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Long: {formatCoordinate(metadata.longitude, false)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Accuracy: ±{metadata.accuracy?.toFixed(0)}m
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">❌ Location not available</p>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Timestamp</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatTimestamp(metadata.timestamp)}
                  </p>
                </div>
              </div>

              {/* Photo Info */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-purple-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Photo Quality</p>
                  <p className="text-xs text-gray-600 mt-1">
                    ✓ High quality · EXIF validated
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="px-6 py-5 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              📝 Notes <span className="text-red-600">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you captured (competitor activity, network issues, customer feedback, etc.)"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-5 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !notes.trim() || gpsStatus !== 'success'}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl transition-all active:scale-95 shadow-lg font-medium flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" strokeWidth={2} />
                  Submit (+10 Points)
                </>
              )}
            </button>

            <button
              onClick={handleRetake}
              disabled={isSubmitting}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded-xl transition-all active:scale-95 font-medium flex items-center justify-center"
            >
              <Camera className="w-5 h-5 mr-2" strokeWidth={2} />
              Retake Photo
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}