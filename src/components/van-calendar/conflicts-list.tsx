// Conflicts List Component
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Conflict {
  type: string;
  date: string;
  day: string;
  site_name: string;
  time_slot: string;
  conflicting_van: string;
  conflicting_zsm: string;
  conflicting_zsm_phone: string;
}

interface ConflictsListProps {
  conflicts: Conflict[];
}

export function ConflictsList({ conflicts }: ConflictsListProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mt-6">
      <h3 className="text-red-800 font-bold text-xl mb-4 flex items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        ⚠️ {conflicts.length} Conflict(s) Detected
      </h3>

      {conflicts.map((conflict, idx) => (
        <div key={`conflict-${conflict.date}-${conflict.site_name}-${idx}`} className="bg-white p-4 rounded-lg mb-3 border border-red-300">
          <p className="font-semibold text-red-700">
            {conflict.day}, {conflict.date}
          </p>
          <p className="text-gray-800 mt-2">
            📍 Site: <strong>{conflict.site_name}</strong>
          </p>
          <p className="text-gray-700 mt-1">
            ❌ Already scheduled for Van <strong>{conflict.conflicting_van}</strong>
          </p>
          <p className="text-gray-700">
            👤 By ZSM: <strong>{conflict.conflicting_zsm}</strong>
          </p>
          <p className="text-gray-600 text-sm">
            📞 Contact: {conflict.conflicting_zsm_phone}
          </p>
        </div>
      ))}

      <p className="text-red-700 font-semibold mt-4">
        ⛔ Cannot submit plan until conflicts are resolved
      </p>
    </div>
  );
}
