'use client';

import React from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';
import { Users, User as UserIcon } from 'lucide-react';

interface Thread {
  _id: string;
  name?: string;
  type: 'GROUP' | 'DIRECT';
  memberIds: any[];
  lastMessage?: {
    content: string;
    senderName: string;
    sentAt: string;
  };
  unreadCounts?: Record<string, number>;
}

interface ThreadListProps {
  threads: {
    teams: Thread[];
    personal: Thread[];
  };
  activeThreadId?: string;
  onSelectThread: (threadId: string) => void;
}

export const ThreadList = ({ threads, activeThreadId, onSelectThread }: ThreadListProps) => {
  const { user } = useAuthStore();

  const renderThreadRow = (thread: Thread) => {
    const isActive = thread._id === activeThreadId;
    const unreadCount = thread.unreadCounts?.[user?.userId || ''] || 0;
    
    // For direct threads, find the other member's name
    let displayName = thread.name;
    if (thread.type === 'DIRECT') {
      const otherMember = thread.memberIds.find(m => m._id !== user?.userId);
      displayName = otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : 'Direct Message';
    }

    return (
      <button
        key={thread._id}
        onClick={() => onSelectThread(thread._id)}
        className={`w-full flex items-center gap-4 p-4 transition-all border-l-4 ${
          isActive 
            ? 'bg-amber-50 border-amber-500 shadow-sm' 
            : 'hover:bg-gray-50 border-transparent'
        }`}
      >
        <div className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border ${
          isActive ? 'bg-amber-100 border-amber-200' : 'bg-gray-100 border-gray-100'
        }`}>
          {thread.type === 'GROUP' ? (
            <Users size={20} className={isActive ? 'text-amber-600' : 'text-gray-400'} />
          ) : (
            <UserIcon size={20} className={isActive ? 'text-amber-600' : 'text-gray-400'} />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C97B2A] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-amber-900' : 'text-[#1A1A2E]'}`}>
              {displayName}
            </h4>
            {thread.lastMessage && (
              <span className="text-[10px] text-gray-400 flex-shrink-0 font-medium">
                {formatDistanceToNow(new Date(thread.lastMessage.sentAt), { addSuffix: false })}
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${isActive ? 'text-amber-700/70' : 'text-gray-500'}`}>
            {thread.lastMessage 
              ? `${thread.lastMessage.senderName}: ${thread.lastMessage.content}` 
              : 'No messages yet'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-display text-xl text-[#1A1A2E]">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
        {/* TEAMS SECTION */}
        <div className="mt-4">
          <div className="px-6 mb-2 flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Teams</h3>
          </div>
          <div className="space-y-0.5">
            {threads.teams.map(renderThreadRow)}
          </div>
        </div>

        {/* PERSONAL SECTION */}
        <div className="mt-8">
          <div className="px-6 mb-2 flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Personal</h3>
          </div>
          <div className="space-y-0.5">
            {threads.personal.map(renderThreadRow)}
          </div>
        </div>
      </div>
    </div>
  );
};
