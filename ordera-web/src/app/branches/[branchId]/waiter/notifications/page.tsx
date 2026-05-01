'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, 
  ChefHat, 
  CheckCircle2, 
  Clock, 
  Trash2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function WaiterNotificationsPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  // 1. Fetch Notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', branchId],
    queryFn: () => api.get<any[]>('/api/notifications'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', branchId] })
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete(`/api/notifications/clear-all?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', branchId] });
      toast.success('All notifications cleared');
    }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">Alerts</h1>
          <p className="text-gray-500 mt-1">Stay updated with kitchen and system alerts.</p>
        </div>
        <button 
          onClick={() => clearAllMutation.mutate()}
          className="text-gray-400 hover:text-red-500 flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <Trash2 size={18} /> Clear All
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-20 text-center animate-pulse">Loading alerts...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif: any) => (
            <div 
              key={notif._id}
              className={`p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-6 transition-all ${!notif.isRead ? 'border-l-4 border-l-[#C97B2A]' : ''}`}
            >
              <div className={`w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center ${
                notif.type === 'ORDER_READY' ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'
              }`}>
                {notif.type === 'ORDER_READY' ? <ChefHat size={32} /> : <Bell size={32} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-lg ${!notif.isRead ? 'text-[#1A1A2E]' : 'text-gray-500'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{notif.body}</p>
                
                {!notif.isRead && (
                  <button 
                    onClick={() => markReadMutation.mutate(notif._id)}
                    className="text-[#C97B2A] text-xs font-bold uppercase tracking-widest hover:underline"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell size={32} className="text-gray-300" />
            </div>
            <h4 className="font-display text-2xl text-muted">All caught up!</h4>
            <p className="text-gray-400 mt-2">No new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
