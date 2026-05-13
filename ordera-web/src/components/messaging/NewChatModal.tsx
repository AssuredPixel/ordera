'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, User, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NewChatModalProps {
  branchId: string;
  onClose: () => void;
  onChatCreated: (threadId: string) => void;
}

export const NewChatModal = ({ branchId, onClose, onChatCreated }: NewChatModalProps) => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch Staff
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: () => api.get<{ active: any[]; pending: any[] }>(`/api/branches/${branchId}/staff`),
  });

  // 2. Create Thread Mutation
  const createThreadMutation = useMutation({
    mutationFn: (recipientId: string) => 
      api.post<{ _id: string }>('/api/messages/threads', { recipientId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['message-threads', branchId] });
      onChatCreated(data._id);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start chat');
    }
  });

  const filteredStaff = staffData?.active.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E]">New Message</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a staff member to start a chat</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97B2A]/10 focus:border-[#C97B2A] transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-[#C97B2A]" size={24} />
              <p className="text-xs text-gray-400 font-medium">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No staff found matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredStaff.map((staff) => (
                <button
                  key={staff._id}
                  onClick={() => createThreadMutation.mutate(staff._id)}
                  disabled={createThreadMutation.isPending}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-amber-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1A2E] truncate">{staff.firstName} {staff.lastName}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{staff.role.replace('_', ' ')}</p>
                  </div>
                  {createThreadMutation.isPending && createThreadMutation.variables === staff._id ? (
                    <Loader2 className="animate-spin text-[#C97B2A]" size={16} />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
