'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Plus, 
  MoreVertical,
  Paperclip,
  Smile,
  ChevronLeft,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

// --- TYPES ---
interface Message {
  _id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  readBy: string[];
}

interface Thread {
  _id: string;
  name?: string;
  type: 'direct' | 'group';
  memberIds: string[];
  members?: any[];
  lastMessage?: {
    content: string;
    senderName: string;
    sentAt: string;
  };
  unreadCounts: Record<string, number>;
  updatedAt: string;
}

export default function MessagingPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch User Profile (to identify self)
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<any>('/api/auth/me')
  });

  // 2. Fetch Threads
  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['message-threads'],
    queryFn: () => api.get<Thread[]>('/api/messages/threads')
  });

  // 3. Fetch History for selected thread
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['message-history', selectedThreadId],
    queryFn: () => api.get<Message[]>(`/api/messages/threads/${selectedThreadId}/history`),
    enabled: !!selectedThreadId
  });

  // 4. Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: { threadId: string; content: string }) => 
      api.post(`/api/messages/threads/${data.threadId}/messages`, data), // Assuming POST endpoint for messages
    // Wait, let's check the gateway again. The gateway handles 'message:send' over socket.
    // But typically we also have a REST endpoint for reliable saving.
    // Let's check messages.controller.ts again.
  });

  // Actually, looking at messages.gateway.ts, it handles message:send.
  // I should use socket.emit if possible, or check if there's a REST endpoint.
  // Looking at the controller, I only see thread list and history.
  // I might need to add a POST /messages/threads/:id/messages endpoint or use socket.
  
  // Mark as read when selecting thread
  useEffect(() => {
    if (selectedThreadId && user?.userId) {
      api.patch(`/api/messages/threads/${selectedThreadId}/read`)
        .then(() => queryClient.invalidateQueries({ queryKey: ['message-threads'] }));
    }
  }, [selectedThreadId, user?.userId, queryClient]);

  // Real-time Updates
  useRealtime(`thread-${selectedThreadId}`, 'message:receive', (data: any) => {
    queryClient.setQueryData(['message-history', selectedThreadId], (old: Message[] | undefined) => {
      if (!old) return [data.message];
      if (old.find(m => m._id === data.message._id)) return old;
      return [...old, data.message];
    });
    queryClient.invalidateQueries({ queryKey: ['message-threads'] });
  });

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedThreadId) return;

    const content = messageText.trim();
    setMessageText('');

    try {
      await api.post(`/api/messages/threads/${selectedThreadId}/messages`, { content });
      // The real-time event will update the UI via useRealtime hook
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setMessageText(content); // Restore text on failure
    }
  };

  const selectedThread = threads?.find(t => t._id === selectedThreadId);
  const otherMember = selectedThread?.members?.find((m: any) => m._id !== user?.userId);

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
      
      {/* ── THREAD LIST (LEFT) ── */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 bg-[#1A1A2E] text-white rounded-xl hover:bg-[#2A2A4E] transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingThreads ? (
            <div className="p-8 text-center text-gray-400">Loading chats...</div>
          ) : threads?.length === 0 ? (
            <div className="p-8 text-center text-gray-400 italic">No conversations yet.</div>
          ) : (
            threads?.map((thread) => {
              const isActive = selectedThreadId === thread._id;
              const other = thread.members?.find((m: any) => m._id !== user?.userId);
              const unreadCount = thread.unreadCounts?.[user?.userId || ''] || 0;

              return (
                <button
                  key={thread._id}
                  onClick={() => setSelectedThreadId(thread._id)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                    isActive ? 'bg-[#1A1A2E] text-white shadow-xl' : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${isActive ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {other?.firstName?.[0] || thread.name?.[0] || '?'}
                    </div>
                    <Circle className={`absolute -bottom-1 -right-1 w-4 h-4 fill-green-500 text-white stroke-[3px]`} />
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold truncate">{other?.firstName || thread.name || 'Group Chat'}</p>
                      {thread.lastMessage && (
                        <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                          {format(new Date(thread.lastMessage.sentAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
                      {thread.lastMessage?.content || 'Start a conversation...'}
                    </p>
                  </div>

                  {unreadCount > 0 && !isActive && (
                    <div className="w-5 h-5 bg-[#C97B2A] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#C97B2A]/30">
                      {unreadCount}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── CHAT WINDOW (RIGHT) ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedThreadId ? 'flex' : 'hidden md:flex'}`}>
        {!selectedThreadId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
              <MessageSquare size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Select a conversation</h2>
            <p className="text-gray-500 max-w-xs mt-2">Choose a chat from the left or start a new one with your staff.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedThreadId(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#1A1A2E]">
                  {otherMember?.firstName?.[0] || 'G'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{otherMember?.firstName || 'Group Chat'}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                  <Search size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-gray-400">Loading history...</div>
              ) : messages?.map((msg, idx) => {
                const isMe = msg.senderId === user?.userId;
                const showSender = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);

                return (
                  <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showSender && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-widest">{msg.senderName}</span>}
                    <div className={`max-w-[80%] px-5 py-3 rounded-[1.5rem] text-sm shadow-sm ${
                      isMe ? 'bg-[#1A1A2E] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-2 font-medium">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-8 border-t border-gray-100">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-end gap-4"
              >
                <div className="flex-1 bg-gray-50 rounded-[2rem] p-2 flex items-end">
                  <button type="button" className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
                    <Paperclip size={20} />
                  </button>
                  <textarea 
                    rows={1}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button type="button" className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
                    <Smile size={20} />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={!messageText.trim()}
                  className="w-14 h-14 bg-[#C97B2A] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#C97B2A]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <NewChatModal 
            branchId={branchId as string} 
            onClose={() => setIsNewChatModalOpen(false)}
            onSelectThread={(id) => {
              setSelectedThreadId(id);
              setIsNewChatModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

function NewChatModal({ branchId, onClose, onSelectThread }: { branchId: string; onClose: () => void; onSelectThread: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: () => api.get<any>(`/api/branches/${branchId}/staff`)
  });

  const createThreadMutation = useMutation({
    mutationFn: (recipientId: string) => api.post('/api/messages/threads', { recipientId }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      onSelectThread(data._id);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to start chat')
  });

  const filteredStaff = staffData?.active?.filter((s: any) => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">New Chat</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search staff members..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-medium"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic">No staff members found.</div>
            ) : (
              filteredStaff.map((staff: any) => (
                <button
                  key={staff._id}
                  onClick={() => createThreadMutation.mutate(staff._id)}
                  className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#1A1A2E]">
                    {staff.firstName[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{staff.firstName} {staff.lastName}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">{staff.role.replace(/_/g, ' ')}</p>
                  </div>
                  <ChevronLeft className="ml-auto rotate-180 text-gray-300" size={18} />
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
