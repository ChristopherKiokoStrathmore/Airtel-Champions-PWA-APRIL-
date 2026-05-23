import { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronLeft } from 'lucide-react';
import {
  getMyNetworkIssues,
  getSubmissionThread,
  addThreadMessage,
  formatRelativeTime,
  getIssueDate,
  getRoleLabel,
  NetworkIssue,
  ThreadMessage,
} from '../lib/network-issues-api';

const STATUS_CONFIG = {
  open: { label: 'Open', bg: 'bg-red-100 text-red-700' },
  acknowledged: { label: 'Acknowledged', bg: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Resolved', bg: 'bg-green-100 text-green-700' },
};

function ThreadView({ submission, currentUser }: { submission: NetworkIssue; currentUser: any }) {
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [submission.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionThread(submission.id);
      setThread(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const msg = newMessage.trim();
    if (!msg || !currentUser?.id) return;
    try {
      setSending(true);
      await addThreadMessage(submission.id, currentUser.id, msg);
      setNewMessage('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const status = submission.network_issue_status || 'open';
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const responses = submission.responses || {};

  return (
    <div className="flex flex-col h-full">
      {/* Issue summary */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-500">
            Submitted {formatRelativeTime(getIssueDate(submission))}
          </p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
        </div>
        {Object.entries(responses).slice(0, 2).map(([k, v]) => (
          <p key={k} className="text-sm text-gray-700 line-clamp-1">
            <span className="font-medium capitalize">{k.replace(/_/g, ' ')}: </span>
            {String(v)}
          </p>
        ))}
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : thread.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No updates from the Networks team yet.</p>
            <p className="text-xs text-gray-400 mt-1">You can add more context below.</p>
          </div>
        ) : (
          thread.map(msg => {
            const isMe = msg.user_id === currentUser?.id;
            const isNetworkTeam = msg.author_role === 'network_team';
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isNetworkTeam ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {msg.author_name?.charAt(0) || '?'}
                </div>
                <div className={`flex-1 flex flex-col ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">
                      {isMe ? 'You' : msg.author_name}
                    </span>
                    {isNetworkTeam && (
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                        Networks
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(msg.created_at)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Add more context or ask a question…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NetworkIssueThreadModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [issues, setIssues] = useState<NetworkIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<NetworkIssue | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tai_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
    load();
  }, [userId]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getMyNetworkIssues(userId);
      setIssues(data);
    } catch (e) {
      console.error('[NetworkIssueThread] load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const status = (s?: string) => (s as keyof typeof STATUS_CONFIG) || 'open';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-[480px] sm:rounded-2xl sm:h-[85vh] h-[92vh] flex flex-col rounded-t-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center gap-3 flex-shrink-0">
          {selectedIssue ? (
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-base">
              {selectedIssue ? 'Issue Thread' : 'My Network Reports'}
            </h2>
            <p className="text-xs text-blue-100">
              {selectedIssue
                ? 'Communicate with the Networks team'
                : `${issues.length} report${issues.length !== 1 ? 's' : ''} submitted`}
            </p>
          </div>
        </div>

        {selectedIssue ? (
          <ThreadView submission={selectedIssue} currentUser={currentUser} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <>
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </>
            ) : issues.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 font-medium">No network issue reports yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Submit a Network Issues report to start tracking
                </p>
              </div>
            ) : (
              issues.map(issue => {
                const cfg =
                  STATUS_CONFIG[status(issue.network_issue_status)] || STATUS_CONFIG.open;
                const responses = issue.responses || {};
                const preview = String(Object.values(responses)[0] || '').slice(0, 80);
                return (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(getIssueDate(issue))}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{issue.program_title}</p>
                    {preview && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{preview}</p>
                    )}
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Tap to view thread →
                    </p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
