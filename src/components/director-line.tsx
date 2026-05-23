import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

interface DirectorLineProps {
  user: any;
  userData: any;
  onClose: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  category: string;
  is_anonymous: boolean;
  attachments: string[];
  status: 'sent' | 'delivered' | 'read' | 'unread';
  created_at: string;
  ashish_reaction?: string;  // Database column name
  ashish_reply?: string;
  ashish_reply_time?: string;
}

export function DirectorLine({ user, userData, onClose }: DirectorLineProps) {
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadDirectors();
    
    // Poll for new messages and status updates every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reload messages when selected director changes
    if (selectedDirectorId) {
      loadMessages();
    }
  }, [selectedDirectorId]);

  useEffect(() => {
    // AI categorization based on message content
    if (message.length > 20) {
      categorizeMessage(message);
    }
  }, [message]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDirectors = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('id, full_name, zone')
        .eq('role', 'director')
        .order('full_name', { ascending: true });

      if (data && data.length > 0) {
        setDirectors(data);
        // Auto-select first director
        setSelectedDirectorId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading directors:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedDirectorId) return; // Don't load if no director selected
    
    try {
      console.log('[DirectorLine] Loading messages for:', {
        userId: userData?.id,
        userName: userData?.full_name,
        selectedDirectorId: selectedDirectorId,
        selectedDirectorName: directors.find(d => d.id === selectedDirectorId)?.full_name
      });
      
      // Fetch ALL messages and filter client-side (more reliable than complex JSONB queries)
      const { data, error } = await supabase
        .from('director_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[DirectorLine] ❌ Query error:', error);
        return;
      }

      if (data) {
        console.log('[DirectorLine] Raw messages from database:', data.length);
        
        // Filter messages for this specific director conversation
        const filteredMessages = data.filter(msg => {
          // Include messages sent BY this SE TO the selected director
          if (msg.sender_id === userData?.id) {
            if (!msg.visible_to) return false;
            
            let visibleToArray = msg.visible_to;
            if (typeof msg.visible_to === 'string') {
              try {
                visibleToArray = JSON.parse(msg.visible_to);
              } catch (e) {
                return false;
              }
            }
            
            if (Array.isArray(visibleToArray) && visibleToArray.includes('all')) {
              return false;
            }
            
            const included = Array.isArray(visibleToArray) && visibleToArray.includes(selectedDirectorId);
            if (included) {
              console.log('[DirectorLine] ✅ Including SE message:', msg.id, msg.message.substring(0, 20));
            }
            return included;
          }
          
          // Include messages sent BY the director TO this SE
          if (msg.sender_role === 'director' && msg.sender_id === selectedDirectorId) {
            if (!msg.visible_to) {
              console.log('[DirectorLine] ❌ Director message has no visible_to:', msg.id);
              return false;
            }
            
            let visibleToArray = msg.visible_to;
            if (typeof msg.visible_to === 'string') {
              try {
                visibleToArray = JSON.parse(msg.visible_to);
              } catch (e) {
                console.log('[DirectorLine] ❌ Failed to parse visible_to:', msg.visible_to);
                return false;
              }
            }
            
            const included = Array.isArray(visibleToArray) && visibleToArray.includes(userData?.id);
            console.log('[DirectorLine] Director message check:', {
              msgId: msg.id,
              message: msg.message.substring(0, 20),
              senderRole: msg.sender_role,
              senderId: msg.sender_id,
              expectedDirectorId: selectedDirectorId,
              match: msg.sender_id === selectedDirectorId,
              visibleTo: visibleToArray,
              includesUser: visibleToArray?.includes(userData?.id),
              included: included ? '✅' : '❌'
            });
            return included;
          }
          
          return false;
        });

        console.log(`[DirectorLine] ✅ Loaded ${filteredMessages.length} messages in conversation with ${directors.find(d => d.id === selectedDirectorId)?.full_name}`);
        
        // Ensure attachments is always an array
        const normalizedMessages = filteredMessages.map(msg => {
          let attachments = msg.attachments;
          
          // Parse if it's a JSON string
          if (typeof attachments === 'string') {
            try {
              attachments = JSON.parse(attachments);
            } catch (e) {
              console.warn('[DirectorLine] Failed to parse attachments:', e);
              attachments = [];
            }
          }
          
          // Ensure it's an array
          if (!Array.isArray(attachments)) {
            attachments = [];
          }
          
          return { ...msg, attachments };
        });
        
        setMessages(normalizedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const categorizeMessage = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency')) {
      setSuggestedCategory('🚨 Urgent');
    } else if (lower.includes('corruption') || lower.includes('malpractice') || lower.includes('unethical')) {
      setSuggestedCategory('🔒 Confidential');
    } else if (lower.includes('idea') || lower.includes('suggest') || lower.includes('improve')) {
      setSuggestedCategory('💡 Idea');
    } else if (lower.includes('help') || lower.includes('support') || lower.includes('need')) {
      setSuggestedCategory('🤝 Support');
    } else if (lower.includes('market') || lower.includes('competitor') || lower.includes('customer')) {
      setSuggestedCategory('📈 Intelligence');
    } else {
      setSuggestedCategory('💬 Message');
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedFiles([...selectedFiles, file]);
      setUploadedPhotoUrls([...uploadedPhotoUrls, base64String]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedFiles([...selectedFiles, file]);
      setUploadedPhotoUrls([...uploadedPhotoUrls, base64String]);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setUploadedPhotoUrls(uploadedPhotoUrls.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && uploadedPhotoUrls.length === 0) return;
    if (!selectedDirectorId) {
      alert('Please select a director to send the message to');
      return;
    }

    setIsSending(true);

    try {
      const messageData = {
        sender_id: userData?.id,
        sender_name: isAnonymous ? 'Anonymous SE' : userData?.full_name,
        sender_role: userData?.role,
        sender_zone: userData?.zone,
        message: message.trim(),
        category: suggestedCategory || '💬 Message',
        is_anonymous: isAnonymous,
        status: 'unread',
        created_at: new Date().toISOString(),
        actual_sender_id: userData?.id,
        visible_to: JSON.stringify([selectedDirectorId]), // Stringify array for JSONB
        attachments: uploadedPhotoUrls.length > 0 ? JSON.stringify(uploadedPhotoUrls) : null
      };

      console.log('[DirectorLine] Sending message:', messageData);

      const { data, error } = await supabase
        .from('director_messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('[DirectorLine] Insert error:', error);
        throw error;
      }

      console.log('[DirectorLine] Message sent successfully:', data);

      const selectedDirector = directors.find(d => d.id === selectedDirectorId);
      console.log(`[Analytics] Director Message Sent: ${suggestedCategory} by ${isAnonymous ? 'Anonymous' : userData?.full_name} to Director ${selectedDirector?.full_name}`);;

      // Clear form
      setMessage('');
      setIsAnonymous(false);
      setSelectedFiles([]);
      setUploadedPhotoUrls([]);
      setSuggestedCategory('');
      
      // Reload messages with a slight delay to ensure DB consistency
      setTimeout(() => loadMessages(), 500);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('❌ Error sending message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-red-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold">
            👔
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl text-white">
              {directors.find(d => d.id === selectedDirectorId)?.full_name || 'Director'}
            </h2>
            <p className="text-sm text-orange-100">Director</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Direct Line to {directors.find(d => d.id === selectedDirectorId)?.full_name?.split(' ')[0] || 'Director'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              "Your voice matters. I'm listening." - {directors.find(d => d.id === selectedDirectorId)?.full_name?.split(' ')[0] || 'Director'}
            </p>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl px-6 py-4 max-w-md mx-auto">
              <p className="font-semibold text-gray-900">
                💬 Open communication builds great teams! Share your ideas.
              </p>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {/* Check if this is a Director's message or SE's message */}
            {msg.sender_role === 'director' ? (
              /* Director's Reply - RIGHT SIDE (WhatsApp style) */
              <div className="flex justify-end">
                <div className="max-w-[75%]">
                  <div className="flex items-center gap-2 mb-1 mr-2 justify-end">
                    <span className="text-xs text-gray-500">Director</span>
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white text-xs">
                      👔
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                    <p className="text-white">{msg.message}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <span className="text-xs text-orange-100">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* User's Message - LEFT SIDE (WhatsApp style) */
              <>
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-200 relative">
                    {msg.category && (
                      <div className="text-xs text-gray-600 mb-1 font-medium">
                        {msg.category}
                      </div>
                    )}
                    <p className="text-gray-800">{msg.message}</p>
                    
                    {/* Attachments */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((attachment, idx) => (
                          <div key={idx}>
                            {attachment.startsWith('data:image') ? (
                              <img 
                                src={attachment} 
                                alt="Attachment" 
                                className="rounded-lg max-w-full h-auto border-2 border-gray-100"
                              />
                            ) : (
                              <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                <span>📄</span>
                                <span className="text-sm text-gray-700">File attachment</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-start gap-2 mt-2">
                      <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                      <div className="flex items-center">
                        {msg.status === 'sent' && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {msg.status === 'delivered' && (
                          <div className="flex">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <svg className="w-4 h-4 text-gray-400 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {msg.status === 'read' && (
                          <div className="flex">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <svg className="w-4 h-4 text-blue-500 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Director's Reaction - Positioned ABOVE the message bubble */}
                    {msg.ashish_reaction && (
                      <div className="absolute -top-3 -right-3 bg-white rounded-full shadow-lg p-1 border-2 border-orange-500 z-10">
                        <span className="text-2xl">{msg.ashish_reaction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Area - Always Visible */}
      <div className="bg-white border-t border-gray-200 p-4 space-y-3">
        {/* Director Selector */}
        {directors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-semibold">To:</span>
            <select
              value={selectedDirectorId}
              onChange={(e) => setSelectedDirectorId(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-800 font-medium"
              style={{ fontSize: '16px' }}
            >
              {directors.map((director) => (
                <option key={director.id} value={director.id}>
                  Director {director.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Badge */}
        {suggestedCategory && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
              {suggestedCategory}
            </span>
          </div>
        )}

        {/* File Previews */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative">
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={uploadedPhotoUrls[idx]} 
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="relative bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2 border-2 border-gray-200">
                    <span>📄</span>
                    <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Anonymous Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-600">
            Send anonymously
          </label>
        </div>

        {/* Message Input */}
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          <button 
            onClick={() => photoInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Type a message to ${directors.find(d => d.id === selectedDirectorId)?.full_name?.split(' ')[0] || 'Director'}...`}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none max-h-32"
            style={{ fontSize: '16px' }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={isSending || (!message.trim() && uploadedPhotoUrls.length === 0)}
            className="p-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}