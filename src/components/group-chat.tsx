import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Users, MoreVertical, Camera, X, Info } from 'lucide-react';
import { getGroup, getGroupMessages, sendGroupMessage } from '../utils/groups-storage';
import { supabase } from '../utils/supabase/client';
import { GroupInfoScreen } from './group-info-screen';

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  message: string | null;
  photos: string[];
  created_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
    zone: string;
    profile_image: string | null;
  };
}

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  user_role: string;
  zone: string;
  profile_image: string | null;
}

interface Group {
  id: string;
  name: string;
  icon: string;
  created_by: string;
  created_at: string;
  members: GroupMember[];
  member_count: number;
  user_role: string;
}

interface GroupChatProps {
  groupId: string;
  currentUser: any;
  onBack: () => void;
}

export function GroupChat({ groupId, currentUser, onBack }: GroupChatProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchMessages();
    
    // Poll for new messages every 3 seconds (simple real-time simulation)
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupDetails = async () => {
    try {
      const groupData = await getGroup(groupId, currentUser.id);
      
      if (!groupData) {
        alert('Group not found or you are not a member');
        onBack();
        return;
      }
      
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert('Failed to load group details');
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const messagesData = await getGroupMessages(groupId, currentUser.id, 100, 0);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Please select only image files');
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Each image must be less than 5MB');
      return;
    }

    // Limit to 4 photos
    const photosToAdd = files.slice(0, 4 - selectedPhotos.length);
    setSelectedPhotos([...selectedPhotos, ...photosToAdd]);

    // Create preview URLs
    const newPreviewUrls = photosToAdd.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedPhotos.length === 0) {
      alert('Please write a message or select photos');
      return;
    }

    setSending(true);

    try {
      let photoUrls: string[] = [];

      // For now, skip photo uploads and just send text messages
      // TODO: Implement photo uploads later
      if (selectedPhotos.length > 0) {
        alert('Photo uploads coming soon! For now, please send text messages only.');
        setSending(false);
        return;
      }

      // Send message using Supabase
      await sendGroupMessage(groupId, currentUser.id, newMessage.trim() || null, photoUrls, currentUser);

      // Clear form
      setNewMessage('');
      setSelectedPhotos([]);
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setPhotoPreviewUrls([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh messages
      await fetchMessages(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-500 text-white';
      case 'hq_staff': return 'bg-blue-500 text-white';
      case 'zonal_business_manager': return 'bg-green-500 text-white';
      case 'zonal_sales_manager': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Director';
      case 'hq_staff': return 'HQ';
      case 'zonal_business_manager': return 'ZBM';
      case 'zonal_sales_manager': return 'ZSM';
      default: return 'SE';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load group</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If showing group info, render GroupInfoScreen instead
  if (showGroupInfo) {
    return (
      <GroupInfoScreen
        groupId={groupId}
        currentUser={currentUser}
        onBack={() => setShowGroupInfo(false)}
        onLeaveGroup={() => {
          onBack();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl flex-shrink-0">
            {group.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{group.name}</h2>
            <p className="text-xs text-gray-500">{group.member_count} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(true)}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            <Users className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowGroupInfo(true)}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-6xl mb-4">{group.icon}</div>
            <p className="text-gray-600 font-semibold mb-2">Welcome to {group.name}</p>
            <p className="text-sm text-gray-500">
              This is the beginning of your private intelligence network. Share insights, competitor intel, and collaborate securely.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user_id === currentUser.id;
            const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
            const showName = showAvatar && !isOwnMessage;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {!isOwnMessage && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                    {message.user.full_name.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showName && (
                    <div className="flex items-center gap-2 mb-1 px-3">
                      <span className="text-xs font-semibold text-gray-700">
                        {message.user.full_name}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(message.user.role)}`}>
                        {getRoleLabel(message.user.role)}
                      </span>
                    </div>
                  )}
                  
                  {/* Photos */}
                  {message.photos && message.photos.length > 0 && (
                    <div className={`grid gap-1 mb-1 ${message.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {message.photos.map((photo, photoIndex) => (
                        <img
                          key={photoIndex}
                          src={photo}
                          alt="Shared photo"
                          className="rounded-lg object-cover cursor-pointer"
                          style={{ maxWidth: '200px', maxHeight: '200px' }}
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Text */}
                  {message.message && (
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                  )}

                  <span className="text-xs text-gray-400 mt-1 px-2">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Photo Previews */}
      {photoPreviewUrls.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {photoPreviewUrls.map((url, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedPhotos.length >= 4}
            className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-transparent resize-none outline-none text-sm"
              rows={1}
              style={{ maxHeight: '100px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedPhotos.length === 0) || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1 px-2">
          Press Enter to send • Shift+Enter for new line • Max 4 photos
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">👥 Members ({group.member_count})</h3>
              <button onClick={() => setShowMembers(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {group.members.map((member) => (
                <div key={member.user_id} className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white">
                    {member.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{member.full_name || 'Unknown User'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(member.user_role)}`}>
                        {getRoleLabel(member.user_role)}
                      </span>
                      {member.role === 'admin' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{member.zone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}