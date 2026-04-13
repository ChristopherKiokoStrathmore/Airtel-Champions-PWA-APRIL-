// Van Calendar ZSM Checklist - Shows which ZSMs have submitted
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAuthHeaders } from '../utils/api-helper';
import { CheckCircle, XCircle } from 'lucide-react';

interface ZSMStatus {
  zsm_id: string;
  zsm_name: string;
  zone: string;
  phone: string;
  has_submitted: boolean;
  plans_count: number;
  vans: string[];
  total_sites: number;
}

interface Props {
  weekStart: string;
}

export default function VanCalendarZSMChecklist({ weekStart }: Props) {
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ZSMStatus[]>([]);
  const [stats, setStats] = useState({
    total_zsms: 0,
    submitted: 0,
    pending: 0,
    completion_rate: 0
  });

  useEffect(() => {
    if (weekStart) {
      loadChecklist();
    }
  }, [weekStart]);

  async function loadChecklist() {
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/zsm-checklist/${weekStart}`,
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setChecklist(result.data.checklist);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-600">Loading ZSM checklist...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        📋 ZSM Submission Status
      </h2>

      {/* Summary Stats */}
      <div className="mb-6 flex items-center gap-6">
        <div className="text-3xl font-bold text-gray-900">
          {stats.submitted} / {stats.total_zsms} ZSMs Submitted
        </div>
        <div
          className={`text-2xl font-bold ${
            stats.completion_rate === 100 ? 'text-green-600' : 'text-orange-600'
          }`}
        >
          ({stats.completion_rate}% complete)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${
              stats.completion_rate === 100 ? 'bg-green-600' : 'bg-orange-500'
            } transition-all duration-500`}
            style={{ width: `${stats.completion_rate}%` }}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklist.map((zsm) => (
          <div
            key={zsm.zsm_id}
            className={`p-4 rounded-lg border-2 ${
              zsm.has_submitted
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              {zsm.has_submitted ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-bold text-gray-900">{zsm.zsm_name}</div>
                <div className="text-sm text-gray-600">{zsm.zone}</div>
              </div>
            </div>

            {/* Details */}
            {zsm.has_submitted ? (
              <div className="text-sm space-y-1">
                <div className="text-gray-700">
                  📝 <strong>{zsm.plans_count}</strong> plan(s) submitted
                </div>
                <div className="text-gray-700">
                  🚐 Vans: <strong>{zsm.vans.join(', ')}</strong>
                </div>
                <div className="text-gray-700">
                  📍 <strong>{zsm.total_sites}</strong> sites planned
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  📞 {zsm.phone}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="text-red-700 font-semibold">
                  ⚠️ No plans submitted yet
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  📞 {zsm.phone}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {checklist.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No ZSMs found in the system
        </div>
      )}
    </div>
  );
}