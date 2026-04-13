import { Trophy, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SubmissionDetails } from './submit-handler';
import { SubmissionReport } from './submission-report';

interface SubmissionSuccessModalProps {
  pointsEarned: number;
  newTotalPoints: number;
  programTitle: string;
  submissionDetails?: SubmissionDetails;
  onClose: () => void;
}

export function SubmissionSuccessModal({
  pointsEarned,
  newTotalPoints,
  programTitle,
  submissionDetails,
  onClose,
}: SubmissionSuccessModalProps) {
  const [show, setShow] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 10);
  }, []);

  // If viewing the report, render it full screen
  if (showReport && submissionDetails) {
    return (
      <SubmissionReport
        details={submissionDetails}
        pointsEarned={pointsEarned}
        newTotalPoints={newTotalPoints}
        onClose={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl max-w-md w-full p-8 transform transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Success Icon with Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing background circles */}
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
            
            {/* Main icon */}
            <div className="relative bg-green-500 rounded-full p-6">
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Success!
        </h2>
        <p className="text-center text-gray-600 mb-2">
          Your submission for <span className="font-semibold">{programTitle}</span> has been recorded
        </p>
        
        {/* Date & Time Stamp */}
        <div className="flex justify-center mb-6">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })} &bull; {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* Points Display */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-red-600" />
            <div className="text-center">
              <div className="text-sm text-gray-600">Points Earned</div>
              <div className="text-4xl font-bold text-red-600">+{pointsEarned}</div>
            </div>
          </div>

          <div className="border-t border-red-200 pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New Total:</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-bold text-gray-900 text-lg">
                  {newTotalPoints.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 text-center">
            Keep it up! Your field intelligence is helping Airtel Kenya dominate the market!
          </p>
        </div>

        {/* View Report Button */}
        {submissionDetails && (
          <button
            onClick={() => setShowReport(true)}
            className="w-full mb-3 bg-white border-2 border-red-200 text-red-600 py-3.5 px-6 rounded-xl font-bold text-base hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2.5 group"
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            View Report
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
