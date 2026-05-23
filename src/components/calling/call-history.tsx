import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  status: string;
  call_type: 'audio' | 'video';
  started_at: string;
  duration_seconds: number | null;
  caller_name: string;
  callee_name: string;
  direction: 'incoming' | 'outgoing';
}

interface CallHistoryProps {
  userId: string;
  onClose: () => void;
  onCallBack: (userId: string, userName: string) => void;
}

export function CallHistory({ userId, onClose, onCallBack }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missed' | 'answered'>('all');

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);

      // Load calls where user is caller or callee
      const { data: callsData, error } = await supabase
        .from('call_sessions')
        .select('*')
        .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      callsData?.forEach(call => {
        userIds.add(call.caller_id);
        userIds.add(call.callee_id);
      });

      // Load user names
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, full_name')
        .in('id', Array.from(userIds));

      const userMap = new Map(usersData?.map(u => [u.id, u.full_name]) || []);

      // Transform calls with user names and direction
      const transformedCalls = callsData?.map(call => ({
        ...call,
        caller_name: userMap.get(call.caller_id) || 'Unknown',
        callee_name: userMap.get(call.callee_id) || 'Unknown',
        direction: call.caller_id === userId ? 'outgoing' : 'incoming' as 'incoming' | 'outgoing',
      })) || [];

      setCalls(transformedCalls);
      console.log('[CallHistory] Loaded', transformedCalls.length, 'calls');
    } catch (err) {
      console.error('[CallHistory] Error loading calls:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    if (filter === 'missed') return call.status === 'missed' || call.status === 'rejected';
    if (filter === 'answered') return call.status === 'active' || call.status === 'ended';
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }
    return call.direction === 'incoming' ? (
      <PhoneIncoming className="w-5 h-5 text-green-500" />
    ) : (
      <PhoneOutgoing className="w-5 h-5 text-blue-500" />
    );
  };

  const getStatusText = (call: CallRecord) => {
    if (call.status === 'missed') return 'Missed';
    if (call.status === 'rejected') return 'Declined';
    if (call.status === 'failed') return 'Failed';
    return call.direction === 'incoming' ? 'Incoming' : 'Outgoing';
  };

  const getOtherUserName = (call: CallRecord) => {
    return call.direction === 'incoming' ? call.caller_name : call.callee_name;
  };

  const getOtherUserId = (call: CallRecord) => {
    return call.direction === 'incoming' ? call.caller_id : call.callee_id;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📞 Call History</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All ({calls.length})
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'missed'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Missed ({calls.filter(c => c.status === 'missed' || c.status === 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'answered'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Answered ({calls.filter(c => c.status === 'active' || c.status === 'ended').length})
            </button>
          </div>
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
              ))}
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📞</div>
              <div className="text-xl font-semibold text-gray-800 mb-2">No Call History</div>
              <p className="text-gray-600">Your call history will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCalls.map(call => (
                <div
                  key={call.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Call Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {getCallIcon(call)}
                    </div>

                    {/* Call Info */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {getOtherUserName(call)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`${
                          call.status === 'missed' ? 'text-red-600 font-semibold' : ''
                        }`}>
                          {getStatusText(call)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{call.call_type}</span>
                        {call.duration_seconds ? (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(call.duration_seconds)}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Time & Call Back */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(call.started_at)}
                      </span>
                      <button
                        onClick={() => onCallBack(getOtherUserId(call), getOtherUserName(call))}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
                        title="Call Back"
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
