// Van Calendar Feature Toggle - For HQ/Directors Only
import React, { useState, useEffect } from 'react';
import { X, Power, PowerOff, Check, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeatureToggleProps {
  onClose: () => void;
}

export default function VanCalendarFeatureToggle({ onClose }: FeatureToggleProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/feature/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setEnabled(result.enabled);
        console.log('[FeatureToggle] ✅ Current status:', result.enabled ? 'ENABLED' : 'DISABLED');
      }
    } catch (error: any) {
      console.error('[FeatureToggle] ❌ Error checking status:', error);
      setMessage('Error checking feature status');
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleFeature = async (enable: boolean) => {
    try {
      setLoading(true);
      setMessage('');

      const endpoint = enable ? 'enable' : 'disable';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/feature/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setEnabled(enable);
        setMessage(`✅ Van Calendar ${enable ? 'ENABLED' : 'DISABLED'} successfully!`);
        console.log('[FeatureToggle] ✅', result.message);
        
        // Reload page after 2 seconds to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('[FeatureToggle] ❌ Error toggling feature:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">🚐 Van Calendar Feature</h2>
            <p className="text-sm text-blue-100">Enable or disable for all users</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {statusLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Checking feature status...</p>
            </div>
          ) : (
            <>
              {/* Current Status */}
              <div className="mb-6">
                <div className={`p-4 rounded-xl border-2 ${
                  enabled 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center gap-3">
                    {enabled ? (
                      <Power className="w-8 h-8 text-green-600" />
                    ) : (
                      <PowerOff className="w-8 h-8 text-red-600" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${
                        enabled ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {enabled ? 'Feature is ENABLED' : 'Feature is DISABLED'}
                      </h3>
                      <p className={`text-sm ${
                        enabled ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {enabled 
                          ? 'Van Calendar is visible to all users'
                          : 'Van Calendar is hidden from all users'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">No APK Update Required</h4>
                    <p className="text-sm text-blue-700">
                      Changes take effect immediately for all users without deploying a new APK. 
                      Users may need to refresh the app.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => toggleFeature(true)}
                  disabled={loading || enabled}
                  className={`py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    enabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <Power className="w-5 h-5" />
                  ENABLE
                </button>

                <button
                  onClick={() => toggleFeature(false)}
                  disabled={loading || !enabled}
                  className={`py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    !enabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <PowerOff className="w-5 h-5" />
                  DISABLE
                </button>
              </div>

              {/* Message */}
              {message && (
                <div className={`mt-4 p-4 rounded-xl ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-900 border-2 border-green-200'
                    : 'bg-red-50 text-red-900 border-2 border-red-200'
                }`}>
                  <p className="font-semibold text-center">{message}</p>
                </div>
              )}

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-semibold">Processing...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t-2 border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Test the feature with a small group before enabling for all 662 SEs
          </p>
        </div>
      </div>
    </div>
  );
}
