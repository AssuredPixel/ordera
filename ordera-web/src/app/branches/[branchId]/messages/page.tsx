'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ThreadList } from '@/components/messaging/ThreadList';
import { ChatView } from '@/components/messaging/ChatView';
import { MessageSquare, Plus } from 'lucide-react';

export default function MessagingPage() {
  const { branchId } = useParams();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // 1. Fetch Threads
  const { data: threads, isLoading } = useQuery({
    queryKey: ['message-threads', branchId],
    queryFn: () => api.get<{ teams: any[]; personal: any[] }>('/api/messages/threads'),
  });

  const selectedThread = 
    threads?.teams.find(t => t._id === selectedThreadId) || 
    threads?.personal.find(t => t._id === selectedThreadId);

  return (
    <div className="flex-1 flex bg-white overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm mb-4 lg:mb-0">
      
      {/* ── THREAD LIST (LEFT) ── */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C97B2A]"></div>
          </div>
        ) : (
          <ThreadList 
            threads={threads || { teams: [], personal: [] }} 
            activeThreadId={selectedThreadId || undefined}
            onSelectThread={(id) => setSelectedThreadId(id)}
          />
        )}
      </div>

      {/* ── CHAT WINDOW (RIGHT) ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedThreadId ? 'flex' : 'hidden md:flex'}`}>
        {!selectedThreadId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-gray-200 mb-6 shadow-sm border border-gray-100">
              <MessageSquare size={48} />
            </div>
            <h2 className="font-display text-2xl text-[#1A1A2E]">Select a conversation</h2>
            <p className="text-gray-400 max-w-xs mt-3 text-sm leading-relaxed">
              Choose a team channel or a direct message from the left to start collaborating with your staff.
            </p>
          </div>
        ) : (
          <ChatView 
            threadId={selectedThreadId} 
            threadName={selectedThread?.name || 'Direct Message'} 
          />
        )}
      </div>
    </div>
  );
}
