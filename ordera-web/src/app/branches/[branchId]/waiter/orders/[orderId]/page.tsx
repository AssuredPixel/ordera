'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { Order, OrderStatus } from '@/types/ordera';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  ChefHat,
  Clock,
  Utensils
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { branchId, orderId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch Order
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<Order>(`/api/orders/${orderId}`),
  });

  // Real-time updates
  useRealtime(`branch-${branchId}`, 'order:update', (data) => {
    if (data.orderId === orderId) {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }
  });

  // 2. Mutations
  const removeItemMutation = useMutation({
    mutationFn: (index: number) => api.delete(`/api/orders/${orderId}/items/${index}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Item removed');
    }
  });

  const sendToKitchenMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${orderId}/send-to-kitchen`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
      queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
      toast.success('Order sent to kitchen! 👨‍🍳');
      router.push(`/branches/${branchId}/waiter`);
    }
  });

  const pickUpMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${orderId}/picked-up`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
      toast.success('Order picked up!');
    }
  });

  const serveMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${orderId}/served`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
      toast.success('Order served to customer! 🍽️');
    }
  });

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading order...</div>;
  if (!order) return <div className="p-20 text-center">Order not found</div>;

  const isEditable = order.status === OrderStatus.PENDING;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/branches/${branchId}/waiter`)}
            className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-muted transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-display text-3xl text-[#1A1A2E]">
              {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
            </h1>
            <p className="text-xs text-gray-400 font-mono uppercase">#{order._id.slice(-6)}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* ── ITEMS ── */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-muted flex items-center gap-2">
            <Utensils size={18} className="text-[#C97B2A]" /> Items ({order.items?.length || 0})
          </h3>
          {isEditable && (
            <Link 
              href={`/branches/${branchId}/waiter/menu?orderId=${orderId}`}
              className="text-[#C97B2A] text-sm font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add More
            </Link>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="p-6 flex items-start justify-between group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[#C97B2A]">
                  {item.quantity}x
                </div>
                <div>
                  <p className="font-bold text-muted">{item.name}</p>
                  {item.selectedAddons?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.selectedAddons.map((a: any) => a.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-600 mt-1 italic">Note: {item.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-muted">₦{(item.lineTotal.amount / 100).toLocaleString()}</p>
                {isEditable && (
                  <button 
                    onClick={() => removeItemMutation.mutate(idx)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {(!order.items || order.items.length === 0) && (
            <div className="p-12 text-center text-gray-400 italic">
              No items added yet.
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50/50 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>₦{(order.subtotal.amount / 100).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>VAT (7.5%)</span>
            <span>₦{(order.tax.amount / 100).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-display text-2xl text-[#1A1A2E] pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-[#C97B2A]">₦{(order.total.amount / 100).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── STATUS HISTORY (SMALL) ── */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock size={14} /> Created {format(new Date(order.createdAt), 'hh:mm a')}
        </div>
        {order.sentToKitchenAt && (
          <div className="flex items-center gap-1.5">
            <ChefHat size={14} /> Kitchen {format(new Date(order.sentToKitchenAt), 'hh:mm a')}
          </div>
        )}
      </div>

      {/* ── ACTIONS ── */}
      {(isEditable || order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.PICKED_UP) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 lg:static lg:bg-transparent lg:border-none lg:p-0">
          {isEditable && (
            <button 
              onClick={() => sendToKitchenMutation.mutate()}
              disabled={!order.items?.length || sendToKitchenMutation.isPending}
              className="w-full bg-[#1A1A2E] text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#1A1A2E]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {sendToKitchenMutation.isPending ? 'Sending...' : 'Send to Kitchen'} <ChefHat size={22} />
            </button>
          )}

          {order.status === OrderStatus.READY_FOR_PICKUP && (
            <button 
              onClick={() => pickUpMutation.mutate()}
              disabled={pickUpMutation.isPending}
              className="w-full bg-[#C97B2A] text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#C97B2A]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {pickUpMutation.isPending ? 'Processing...' : 'Pick Up Order'}
            </button>
          )}

          {order.status === OrderStatus.PICKED_UP && (
            <button 
              onClick={() => serveMutation.mutate()}
              disabled={serveMutation.isPending}
              className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {serveMutation.isPending ? 'Processing...' : 'Mark as Served'} <Utensils size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
