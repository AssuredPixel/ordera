'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  ChefHat, 
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function WaiterMessagesPage() {
  const { branchId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // 1. Fetch Threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['chat-threads', branchId],
    queryFn: () => api.get<any[]>('/api/messages/threads'),
    refetchInterval: 30000,
  });

  // 2. Fetch Messages for selected thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedThreadId],
    queryFn: () => api.get<any[]>(`/api/messages/threads/${selectedThreadId}/history`),
    enabled: !!selectedThreadId,
  });

  // Real-time listener for new messages
  useRealtime(`branch-${branchId}`, 'message:new', (msg) => {
    queryClient.invalidateQueries({ queryKey: ['chat-threads', branchId] });
    if (msg.threadId === selectedThreadId) {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedThreadId] });
    } else {
      toast(`New message from ${msg.senderName}`, {
        description: msg.content,
        onClick: () => setSelectedThreadId(msg.threadId)
      });
    }
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/api/messages/threads/${selectedThreadId}/messages`, {
      content,
    }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads', branchId] });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedThreadId) return;
    sendMutation.mutate(message);
  };

  const getThreadName = (thread: any) => {
    if (thread.name) return thread.name;
    // For DIRECT chats, find the other participant (memberIds is populated)
    const other = thread.memberIds?.find((m: any) => m._id !== (user as any)?.userId);
    return other ? `${other.firstName} ${other.lastName}` : 'Staff Chat';
  };

  const selectedThread = threads.find((t: any) => t._id === selectedThreadId);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-6">
      {/* ── THREADS LIST ── */}
      <div className={`w-full lg:w-96 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden ${selectedThreadId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-display text-2xl text-[#1A1A2E] mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threadsLoading ? (
            <div className="p-10 text-center animate-pulse">Loading chats...</div>
          ) : threads.length > 0 ? (
            threads.map((thread: any) => (
              <button
                key={thread._id}
                onClick={() => setSelectedThreadId(thread._id)}
                className={`w-full p-6 text-left flex gap-4 transition-all hover:bg-gray-50 border-b border-gray-50 ${selectedThreadId === thread._id ? 'bg-[#1A1A2E]/5 border-l-4 border-l-[#C97B2A]' : ''}`}
              >
                <div className="w-12 h-12 bg-[#1A1A2E] text-white rounded-2xl flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-sm truncate">{getThreadName(thread)}</p>
                    <span className="text-[10px] text-gray-400">
                      {thread.lastMessage?.sentAt ? formatDistanceToNow(new Date(thread.lastMessage.sentAt), { addSuffix: false }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{thread.lastMessage?.content || 'No messages yet'}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 italic text-sm">
              No conversations yet.
            </div>
          )}
        </div>
      </div>

      {/* ── CHAT WINDOW ── */}
      <div className={`flex-1 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden ${!selectedThreadId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedThreadId ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedThreadId(null)} className="lg:hidden text-gray-400">
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E]">{getThreadName(selectedThread)}</h3>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-gray-300" size={32} />
                </div>
              ) : messages.map((msg: any, i: number) => {
                const isMe = msg.isMe; // Assuming backend provides this
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-3xl ${
                      isMe 
                        ? 'bg-[#1A1A2E] text-white rounded-tr-none shadow-lg shadow-[#1A1A2E]/10' 
                        : 'bg-white text-[#1A1A2E] rounded-tl-none border border-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-2 ${isMe ? 'text-white/40' : 'text-gray-400'}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-50">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#C97B2A] transition-all"
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || sendMutation.isPending}
                  className="w-14 h-14 bg-[#1A1A2E] text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={32} className="text-gray-300" />
            </div>
            <h3 className="font-display text-2xl text-muted">Select a chat</h3>
            <p className="text-gray-400 mt-2 max-w-xs">Communicate with the kitchen staff or manager in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';
