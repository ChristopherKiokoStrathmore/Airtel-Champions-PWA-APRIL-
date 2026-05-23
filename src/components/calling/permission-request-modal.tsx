import { Mic, X } from 'lucide-react';

interface PermissionRequestModalProps {
  onGrant: () => void;
  onDeny: () => void;
}

export function PermissionRequestModal({ onGrant, onDeny }: PermissionRequestModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Microphone Permission</h2>
            <button 
              onClick={onDeny}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-10 h-10 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Allow Airtel Champions to use your microphone
          </h3>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            To make and receive calls with other Sales Executives, we need access to your microphone. 
            This permission is required for the calling feature to work.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onGrant}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold 
                hover:bg-red-700 active:scale-95 transition-all shadow-lg"
            >
              Allow Microphone Access
            </button>
            
            <button
              onClick={onDeny}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold 
                hover:bg-gray-200 active:scale-95 transition-all"
            >
              Not Now
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            You can change this permission anytime in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
}
