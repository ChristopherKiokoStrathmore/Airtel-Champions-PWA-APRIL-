import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Phone, MapPin, Clock, Send, RefreshCw, LogOut } from 'lucide-react';
import {
  getNetworkIssues,
  updateNetworkIssueStatus,
  getSubmissionThread,
  addThreadMessage,
  formatRelativeTime,
  getIssueDate,
  getRoleLabel,
  NetworkIssue,
  NetworkIssueStatus,
  ThreadMessage,
} from '../lib/network-issues-api';

const STATUS_CONFIG = {
  open: { label: 'Open', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  acknowledged: { label: 'Acknowledged', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
};

function StatusBadge({ status }: { status: NetworkIssueStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function IssueCard({ issue, onClick }: { issue: NetworkIssue; onClick: () => void }) {
  const responses = issue.responses || {};
  const firstEntry = Object.entries(responses)[0];
  const preview = firstEntry ? String(firstEntry[1]).slice(0, 80) : 'No details';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-red-200 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={issue.network_issue_status || 'open'} />
          {issue.reporter_zone && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {issue.reporter_zone}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatRelativeTime(getIssueDate(issue))}
        </span>
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-0.5">{issue.reporter_name}</p>
      <p className="text-xs text-gray-500 mb-2">{issue.program_title}</p>
      <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
    </button>
  );
}

function IssueDetail({
  issue,
  currentUser,
  onBack,
  onStatusChange,
}: {
  issue: NetworkIssue;
  currentUser: any;
  onBack: () => void;
  onStatusChange: (id: string, status: NetworkIssueStatus) => void;
}) {
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<NetworkIssueStatus>(
    issue.network_issue_status || 'open'
  );
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThread();
  }, [issue.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const loadThread = async () => {
    try {
      setLoadingThread(true);
      const msgs = await getSubmissionThread(issue.id);
      setThread(msgs);
    } catch (e) {
      console.error('[NetworkDetail] Failed to load thread:', e);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleStatusChange = async (status: NetworkIssueStatus) => {
    if (status === currentStatus) return;
    try {
      setUpdatingStatus(true);
      await updateNetworkIssueStatus(issue.id, status);
      setCurrentStatus(status);
      onStatusChange(issue.id, status);
    } catch (e) {
      console.error('[NetworkDetail] Status update failed:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSend = async () => {
    const msg = newMessage.trim();
    if (!msg || !currentUser?.id) return;
    try {
      setSending(true);
      await addThreadMessage(issue.id, currentUser.id, msg);
      setNewMessage('');
      await loadThread();
    } catch (e) {
      console.error('[NetworkDetail] Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const responses = issue.responses || {};

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-lg leading-tight">Issue Detail</h2>
            <p className="text-xs text-red-100">{issue.program_title}</p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Reporter Info */}
        <div className="bg-white mx-4 mt-4 rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Reporter</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-lg">
              {issue.reporter_name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{issue.reporter_name}</p>
              <p className="text-xs text-gray-500">
                {issue.reporter_employee_id} · Sales Executive
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {issue.reporter_zone || 'No zone'}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formatRelativeTime(getIssueDate(issue))}
            </div>
          </div>
          {issue.reporter_phone && (
            <a
              href={`tel:${issue.reporter_phone}`}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              <Phone className="w-4 h-4" />
              Call {issue.reporter_name?.split(' ')[0]} — {issue.reporter_phone}
            </a>
          )}
        </div>

        {/* Issue Details */}
        <div className="bg-white mx-4 mt-3 rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Issue Details</h3>
          {Object.entries(responses).length === 0 ? (
            <p className="text-sm text-gray-500">No details captured</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(responses).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-500 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Photos if any */}
          {Array.isArray(issue.photos) && issue.photos.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-2">Photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {issue.photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Update Status */}
        <div className="bg-white mx-4 mt-3 rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Update Status {updatingStatus && <span className="text-gray-400 font-normal">Saving…</span>}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['open', 'acknowledged', 'resolved'] as NetworkIssueStatus[]).map(status => {
              const cfg = STATUS_CONFIG[status];
              const isActive = currentStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updatingStatus}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                    isActive
                      ? `${cfg.bg} ${cfg.text} border-current`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="bg-white mx-4 mt-3 rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Thread {thread.length > 0 && `(${thread.length})`}
          </h3>

          {loadingThread ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : thread.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No messages yet. Start the conversation.
            </p>
          ) : (
            <div className="space-y-3">
              {thread.map(msg => {
                const isNetworkTeam = msg.author_role === 'network_team';
                const isMe = msg.user_id === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isNetworkTeam ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {msg.author_name?.charAt(0) || '?'}
                    </div>
                    <div className={`flex-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {isMe ? 'You' : msg.author_name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded text-white ${
                          isNetworkTeam ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {getRoleLabel(msg.author_role)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-xl text-sm text-gray-800 max-w-[85%] ${
                          isMe
                            ? 'bg-red-600 text-white rounded-tr-none'
                            : 'bg-gray-100 rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NetworkTeamDashboard({ user, userData, onLogout }: any) {
  const [issues, setIssues] = useState<NetworkIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NetworkIssueStatus | 'all'>('all');
  const [selectedIssue, setSelectedIssue] = useState<NetworkIssue | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = userData || user;

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const data = await getNetworkIssues();
      setIssues(data);
    } catch (e) {
      console.error('[NetworkDashboard] Failed to load issues:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = (id: string, status: NetworkIssueStatus) => {
    setIssues(prev =>
      prev.map(i => (i.id === id ? { ...i, network_issue_status: status } : i))
    );
  };

  const filteredIssues =
    statusFilter === 'all'
      ? issues
      : issues.filter(i => (i.network_issue_status || 'open') === statusFilter);

  const counts = {
    all: issues.length,
    open: issues.filter(i => (i.network_issue_status || 'open') === 'open').length,
    acknowledged: issues.filter(i => i.network_issue_status === 'acknowledged').length,
    resolved: issues.filter(i => i.network_issue_status === 'resolved').length,
  };

  if (selectedIssue) {
    return (
      <IssueDetail
        issue={selectedIssue}
        currentUser={currentUser}
        onBack={() => setSelectedIssue(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 pt-4 pb-0 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Network Issues</h1>
            <p className="text-xs text-red-100">
              {currentUser?.full_name || 'Networks Team'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadIssues(true)}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{counts.open}</p>
            <p className="text-xs text-red-100">Open</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{counts.acknowledged}</p>
            <p className="text-xs text-red-100">In Progress</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{counts.resolved}</p>
            <p className="text-xs text-red-100">Resolved</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-white/20">
          {(['all', 'open', 'acknowledged', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-red-200 hover:text-white'
              }`}
            >
              {tab === 'all' ? `All (${counts.all})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse" />
            ))}
          </>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">
              {statusFilter === 'resolved' ? '' : statusFilter === 'open' ? '' : ''}
            </div>
            <p className="text-gray-600 font-semibold">
              {statusFilter === 'all'
                ? 'No network issues reported yet'
                : `No ${statusFilter} issues`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === 'all'
                ? 'Issues reported by field staff will appear here'
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => setSelectedIssue(issue)}
            />
          ))
        )}
      </div>
    </div>
  );
}
