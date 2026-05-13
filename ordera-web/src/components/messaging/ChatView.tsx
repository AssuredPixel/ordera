'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Send, Paperclip, MoreVertical, Search, Phone } from 'lucide-react';
import { useRealtime } from '@/lib/realtime-hook';

interface Message {
  _id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

interface ChatViewProps {
  threadId: string;
  threadName?: string;
}

export const ChatView = ({ threadId, threadName }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<{ userId: string; userName: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  // 1. Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get<Message[]>(`/api/messages/threads/${threadId}/history`);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };
    fetchHistory();
    // Mark as read when opening
    api.patch(`/api/messages/threads/${threadId}/read`, {}).catch(() => {});
  }, [threadId]);

  // 2. Real-time Subscriptions (Pusher)
  useRealtime(`thread-${threadId}`, 'message:receive', (data: { message: Message }) => {
    if (data.message.threadId === threadId) {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find(m => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      // Mark as read automatically if we are looking at the thread
      api.patch(`/api/messages/threads/${threadId}/read`, {}).catch(() => {});
    }
  });

  useRealtime(`thread-${threadId}`, 'typing:start', (data: { threadId: string; userId: string; userName: string }) => {
    if (data.threadId === threadId && data.userId !== user?.userId) {
      setOtherUserTyping({ userId: data.userId, userName: data.userName });
    }
  });

  useRealtime(`thread-${threadId}`, 'typing:stop', (data: { threadId: string; userId: string }) => {
    if (data.threadId === threadId) {
      setOtherUserTyping(null);
    }
  });

  // 3. Scroll to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherUserTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    handleTyping(false);

    try {
      await api.post(`/api/messages/threads/${threadId}/messages`, {
        content: text
      });
    } catch (err) {
      console.error('Failed to send message', err);
      // Revert if failed? Or just toast
    }
  };

  const handleTyping = async (typing: boolean) => {
    if (isTyping === typing) return;
    setIsTyping(typing);
    
    try {
      await api.post(`/api/messages/threads/${threadId}/typing`, { isTyping: typing });
    } catch (err) {
      // Ignore typing errors
    }

    if (typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => handleTyping(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      {/* HEADER */}
      <div className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center text-[#1A1A2E] font-bold shadow-sm">
            {threadName?.charAt(0) || 'T'}
          </div>
          <div>
            <h3 className="font-bold text-[#1A1A2E] leading-none mb-1">{threadName || 'Thread'}</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-all"><Search size={18} /></button>
          <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-all"><Phone size={18} /></button>
          <button className="p-2.5 rounded-xl hover:bg-gray-100 text-[#1A1A2E] border border-gray-100 shadow-sm transition-all"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.map((m) => {
          const isMe = m.senderId === user?.userId;
          return (
            <div
              key={m._id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {!isMe && (
                <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-tighter">
                  {m.senderName}
                </span>
              )}
              <div
                className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm transition-all ${
                  isMe
                    ? 'bg-[#C97B2A] text-white rounded-tr-none'
                    : 'bg-white text-[#1A1A2E] border border-gray-100 rounded-tl-none'
                }`}
              >
                {m.content}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-1">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        
        {otherUserTyping && (
          <div className="flex flex-col items-start">
             <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
             </div>
             <span className="text-[9px] text-gray-400 mt-1 ml-1 font-medium">{otherUserTyping.userName} is typing...</span>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-8 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-[#C97B2A]/10 focus-within:border-[#C97B2A] transition-all">
          <button className="p-2.5 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping(true);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write a message..."
            className="flex-1 bg-transparent border-none text-sm focus:outline-none px-2 h-10"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-[#C97B2A] text-white rounded-full flex items-center justify-center hover:bg-[#B06B25] transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
