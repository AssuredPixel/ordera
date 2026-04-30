'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { Order, OrderStatus } from '@/types/ordera';
import { format } from 'date-fns';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Utensils, 
  X,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersManagement() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Real-time Updates
  useRealtime(`branch-${branchId}`, 'order:update', () => {
    queryClient.invalidateQueries({ queryKey: ['branch-orders', branchId] });
  });

  // Fetch Orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['branch-orders', branchId],
    queryFn: async () => {
      const data = await api.get<Order[]>(`/api/orders`);
      return data;
    },
    refetchInterval: 15000,
  });

  // Cancel Order Mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return api.patch(`/api/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['branch-orders', branchId] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order');
    }
  });

  const filteredOrders = orders.filter((order: Order) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'KITCHEN') return order.status === OrderStatus.SENT_TO_KITCHEN || order.status === OrderStatus.IN_PREPARATION;
    return order.status === filterStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">Active Orders</h1>
          <p className="text-gray-500 mt-1">Monitor and manage the restaurant floor in real-time.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search table or waiter..." 
            className="border-none outline-none text-sm bg-transparent w-48 text-muted placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')}>
          All Active
          <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{orders.length}</span>
        </TabButton>
        <TabButton active={filterStatus === OrderStatus.PENDING} onClick={() => setFilterStatus(OrderStatus.PENDING)}>
          <Clock size={14} className="mr-1.5" /> Pending
        </TabButton>
        <TabButton active={filterStatus === 'KITCHEN'} onClick={() => setFilterStatus('KITCHEN')}>
          <ChefHat size={14} className="mr-1.5" /> In Kitchen
        </TabButton>
        <TabButton active={filterStatus === OrderStatus.READY_FOR_PICKUP} onClick={() => setFilterStatus(OrderStatus.READY_FOR_PICKUP)}>
          <CheckCircle2 size={14} className="mr-1.5" /> Ready
        </TabButton>
        <TabButton active={filterStatus === OrderStatus.SERVED} onClick={() => setFilterStatus(OrderStatus.SERVED)}>
          <Utensils size={14} className="mr-1.5" /> Served
        </TabButton>
      </div>

      {/* ── ORDERS GRID ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white rounded-3xl border border-gray-100"></div>)}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order: Order) => (
            <div 
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#C97B2A]/30 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-2xl text-muted leading-none">
                    {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono uppercase">#{order._id.slice(-6)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${getOrderStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Waiter</span>
                  <span className="font-medium text-muted">{order.waiterName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Time</span>
                  <span className="font-medium text-muted">{format(new Date(order.createdAt), 'hh:mm a')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Items</span>
                  <span className="font-medium text-muted">{order.items?.length || 0} items</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between group-hover:border-[#C97B2A]/10 transition-colors mt-auto">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                <span className="font-display text-xl text-[#C97B2A]">
                  ₦{((order.total?.amount || 0) / 100).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-muted">No orders found</h3>
          <p className="text-sm text-gray-400 mt-1">There are no active orders matching this filter.</p>
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-[#1A1A2E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-display text-3xl text-[#1A1A2E]">
                    {selectedOrder.tableNumber ? `Table ${selectedOrder.tableNumber}` : 'Takeaway'}
                  </h2>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${getOrderStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono uppercase">Order #{selectedOrder._id}</p>
                <p className="text-sm text-gray-500 mt-1">Waiter: <span className="font-medium text-muted">{selectedOrder.waiterName}</span></p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Items */}
            <div className="p-8 flex-1 overflow-y-auto min-h-0">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Items</h4>
              <div className="space-y-4">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item._id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-muted">
                        <span className="text-[#C97B2A] mr-2">{item.quantity}x</span>
                        {item.name}
                      </p>
                      {item.selectedAddons?.map((addon: any, idx: number) => (
                        <p key={idx} className="text-xs text-gray-500 mt-0.5">+ {addon.name}</p>
                      ))}
                      {item.notes && (
                        <p className="text-xs text-amber-600 mt-1 italic">Note: {item.notes}</p>
                      )}
                    </div>
                    <p className="font-medium text-muted">
                      ₦{(item.lineTotal.amount / 100).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer: Totals & Actions */}
            <div className="bg-[#1A1A2E] p-8 text-white shrink-0">
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>₦{((selectedOrder.subtotal?.amount || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>VAT (7.5%)</span>
                  <span>₦{((selectedOrder.tax?.amount || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-display text-2xl text-white pt-2 border-t border-white/10 mt-2">
                  <span>Total</span>
                  <span className="text-[#C97B2A]">₦{((selectedOrder.total?.amount || 0) / 100).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                      cancelOrderMutation.mutate(selectedOrder._id);
                    }
                  }}
                  disabled={cancelOrderMutation.isPending || selectedOrder.status === OrderStatus.PAID}
                  className="flex-1 py-3.5 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
        ${active 
          ? 'bg-[#1A1A2E] text-white shadow-lg shadow-[#1A1A2E]/20' 
          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-muted border border-gray-100'}
      `}
    >
      {children}
    </button>
  );
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-gray-100 text-gray-600';
    case OrderStatus.SENT_TO_KITCHEN: return 'bg-blue-100 text-blue-600';
    case OrderStatus.IN_PREPARATION: return 'bg-amber-100 text-amber-600';
    case OrderStatus.READY_FOR_PICKUP: return 'bg-emerald-100 text-emerald-600';
    case OrderStatus.SERVED: return 'bg-purple-100 text-purple-600';
    case OrderStatus.PAID: return 'bg-green-100 text-green-600';
    case OrderStatus.CANCELLED: return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}
