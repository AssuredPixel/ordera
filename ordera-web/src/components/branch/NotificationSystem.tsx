'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { 
  Bell, 
  X, 
  Clock, 
  ChefHat, 
  Utensils,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function NotificationSystem() {
  const { branchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<any | null>(null);

  // 1. Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', branchId],
    queryFn: () => api.get<any[]>('/api/notifications'),
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Real-time listener for ORDER_READY
  useRealtime(`branch-${branchId}`, 'notification:new', (notif) => {
    queryClient.invalidateQueries({ queryKey: ['notifications', branchId] });
    
    if (notif.type === 'ORDER_READY') {
      setActiveOverlay(notif);
      // Play a subtle sound?
    } else {
      toast(notif.title, { description: notif.body });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', branchId] })
  });

  return (
    <>
      {/* ── BELL ICON ── */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-2xl transition-all ${
            isOpen ? 'bg-[#1A1A2E] text-white' : 'bg-white border border-gray-100 text-gray-400 hover:text-muted'
          }`}
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* ── SLIDE DOWN PANEL ── */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 lg:absolute lg:inset-auto lg:right-0 lg:top-16 lg:w-[400px]" onClick={() => setIsOpen(false)} />
            <div className="fixed inset-x-4 top-20 lg:absolute lg:inset-auto lg:right-0 lg:top-16 lg:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-display text-xl text-[#1A1A2E]">Alerts</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {notifications.length > 0 ? (
                  notifications.map((notif: any) => (
                    <button
                      key={notif._id}
                      onClick={() => {
                        markReadMutation.mutate(notif._id);
                        if (notif.relatedOrderId) {
                          setActiveOverlay(notif);
                        }
                        setIsOpen(false);
                      }}
                      className={`w-full p-6 text-left flex gap-4 hover:bg-gray-50 transition-all ${!notif.isRead ? 'bg-amber-50/30' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'ORDER_READY' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {notif.type === 'ORDER_READY' ? <ChefHat size={22} /> : <Bell size={22} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-bold text-sm truncate ${!notif.isRead ? 'text-[#1A1A2E]' : 'text-gray-500'}`}>{notif.title}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(notif.createdAt))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{notif.body}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-400 italic text-sm">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ORDER READY OVERLAY ── */}
      {activeOverlay && (
        <OrderReadyOverlay 
          notification={activeOverlay} 
          onClose={() => setActiveOverlay(null)} 
        />
      )}
    </>
  );
}

function OrderReadyOverlay({ notification, onClose }: { notification: any, onClose: () => void }) {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const { data: order } = useQuery({
    queryKey: ['order', notification.relatedOrderId],
    queryFn: () => api.get<any>(`/api/orders/${notification.relatedOrderId}`),
    enabled: !!notification.relatedOrderId
  });

  const pickUpMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${order._id}/picked-up`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', order._id] });
      toast.success('Order picked up! 🍽');
      onClose();
    }
  });

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-amber-500 flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-500">
      <div className="absolute top-10 right-10">
        <button onClick={onClose} className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all">
          <X size={32} />
        </button>
      </div>

      <div className="max-w-lg w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-2xl animate-bounce">
            <ChefHat size={48} />
          </div>
          <h1 className="font-display text-5xl">Order Ready! 🍽</h1>
          <p className="text-xl opacity-90">Table {order.tableNumber} is waiting for their food.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-[3rem] p-10 border border-white/20 text-left space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="font-bold text-lg">Table {order.tableNumber}</span>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">{order.items?.length || 0} Items</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                <span className="font-bold">{item.quantity}x {item.name}</span>
                <span className="text-sm opacity-70">Ready</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => pickUpMutation.mutate()}
          disabled={pickUpMutation.isPending}
          className="w-full bg-white text-amber-600 py-8 rounded-[2.5rem] font-bold text-2xl shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {pickUpMutation.isPending ? 'Processing...' : (
            <>Mark as Picked Up <CheckCircle2 size={32} /></>
          )}
        </button>

        <p className="text-sm opacity-60">Dismiss to pick up later</p>
      </div>
    </div>
  );
}
