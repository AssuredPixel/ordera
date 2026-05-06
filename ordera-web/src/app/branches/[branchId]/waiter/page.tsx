'use client';

import { useState } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  Plus,
  ArrowRight,
  TrendingUp,
  Timer,
  Receipt,
  CreditCard,
  Banknote,
  Send,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Bill, BillStatus, PaymentMethod, Order, OrderStatus } from '@/types/ordera';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { 
  useWaiterStats, 
  useActiveOrders, 
  useBills, 
  useChargeBill 
} from '@/lib/api-hooks';

export default function WaiterDashboard() {
  const queryClient = useQueryClient();
  const { branchId } = useParams();
  const [activeTab, setActiveTab] = useState<'tables' | 'billing'>('tables');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // 1. Fetch Waiter Stats
  const { data: stats, isLoading: isLoadingStats } = useWaiterStats(branchId as string);

  // 2. Fetch Active Orders
  const { data: orders = [], isLoading: isLoadingOrders } = useActiveOrders();

  // 3. Fetch Active Bills
  const { data: bills = [], isLoading: isLoadingBills } = useBills(branchId as string);

  useRealtime(`branch-${branchId}`, 'order:ready', () => {
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (err) {
      console.warn('Audio playback failed:', err);
    }
    queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
    queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
  });

  useRealtime(`branch-${branchId}`, 'order:update', () => {
    queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
    queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
  });

  useRealtime(`branch-${branchId}`, 'bill:paid', () => {
    queryClient.invalidateQueries({ queryKey: ['waiter-active-bills', branchId] });
    queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
  });

  return (
    <div className="space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">My Floor</h1>
          <p className="text-gray-500 mt-1">Manage tables and process payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'tables' ? 'bg-[#1A1A2E] text-white shadow-md' : 'text-gray-400 hover:text-[#1A1A2E]'}`}
            >
              Active Tables
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'billing' ? 'bg-[#1A1A2E] text-white shadow-md' : 'text-gray-400 hover:text-[#1A1A2E]'}`}
            >
              Billing
              {bills.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center animate-pulse">
                  {bills.length}
                </span>
              )}
            </button>
          </div>
          <Link 
            href={`/branches/${branchId}/waiter/orders/new`}
            className="bg-[#C97B2A] text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#C97B2A]/20 hover:scale-105 active:scale-95 transition-all ml-2"
          >
            <Plus size={20} /> New Order
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Revenue Today" 
          value={`₦${((stats?.revenueToday || 0) / 100).toLocaleString()}`} 
          icon={TrendingUp}
          color="text-emerald-500"
          loading={isLoadingStats}
        />
        <StatCard 
          title="Orders Taken" 
          value={stats?.ordersToday || 0} 
          icon={ShoppingBag}
          color="text-blue-500"
          loading={isLoadingStats}
        />
        <StatCard 
          title="Unpaid Bills" 
          value={bills.length} 
          icon={Receipt}
          color="text-red-500"
          loading={isLoadingBills}
        />
      </div>

      {/* ── CONTENT AREA ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'tables' ? (
          <motion.div 
            key="tables"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-muted">Active Tables</h3>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
                {orders.length} Active
              </span>
            </div>

            {isLoadingOrders ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map((order: Order) => (
                  <OrderCard key={order._id} order={order} branchId={branchId as string} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={24} className="text-gray-300" />
                </div>
                <h4 className="font-bold text-muted">No active orders</h4>
                <p className="text-sm text-gray-400 mt-1">Start a new order to see it here.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-muted">Pending Bills</h3>
              <span className="px-3 py-1 bg-red-50 rounded-lg text-xs font-bold text-red-500">
                {bills.length} Unpaid
              </span>
            </div>

            {isLoadingBills ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
              </div>
            ) : bills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bills.map((bill: Bill) => (
                  <BillCard key={bill._id} bill={bill} onPay={() => setSelectedBill(bill)} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt size={24} className="text-gray-300" />
                </div>
                <h4 className="font-bold text-muted">All clear!</h4>
                <p className="text-sm text-gray-400 mt-1">No pending bills to settle.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL ── */}
      <AnimatePresence>
        {selectedBill && (
          <PaymentModal 
            bill={selectedBill} 
            branchId={branchId as string}
            onClose={() => setSelectedBill(null)} 
            onSuccess={() => {
              setSelectedBill(null);
              queryClient.invalidateQueries({ queryKey: ['waiter-active-bills', branchId] });
              queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
              queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BillCard({ bill, onPay }: { bill: Bill, onPay: () => void }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl text-[#1A1A2E]">
              {bill.tableNumber ? `Table ${bill.tableNumber}` : 'Takeaway'}
            </h4>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1 uppercase">#{bill._id.slice(-6)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Bill</p>
          <p className="text-2xl font-display text-[#1A1A2E] mt-0.5">
            ₦{(bill.total.amount / 100).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {bill.items.slice(0, 3).map((item, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden">
                {item.name[0]}
              </div>
            ))}
            {bill.items.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                +{bill.items.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">{bill.items.length} items</span>
        </div>
        
        <button 
          onClick={onPay}
          className="bg-[#1A1A2E] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#C97B2A] transition-all flex items-center gap-2"
        >
          Collect ₦{(bill.total.amount / 100).toLocaleString()}
        </button>
      </div>
    </div>
  );
}

function PaymentModal({ bill, branchId, onClose, onSuccess }: { bill: Bill, branchId: string, onClose: () => void, onSuccess: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [reference, setReference] = useState('');
  const { mutate: charge, isPending: isSubmitting } = useChargeBill();

  const handleCharge = async () => {
    charge({
      billId: bill._id,
      data: {
        method,
        reference,
        tipType: 'fixed',
        tipValue: tipAmount ? Number(tipAmount) * 100 : 0,
      }
    }, {
      onSuccess: () => {
        toast.success('Payment recorded successfully!');
        onSuccess();
      },
      onError: (err: any) => {
        toast.error(err.message || 'Payment failed');
      }
    });
  };

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
          <div>
            <h2 className="text-xl font-bold text-gray-900">Settle Bill</h2>
            <p className="text-xs text-gray-500 mt-1">Table {bill.tableNumber || 'N/A'} • #{bill._id.slice(-6)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Total */}
          <div className="text-center py-6 bg-gray-50 rounded-3xl">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount Due</p>
            <p className="text-5xl font-display text-[#1A1A2E] mt-2">
              ₦{(bill.total.amount / 100).toLocaleString()}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: PaymentMethod.CASH, icon: Banknote, label: 'Cash' },
                { id: PaymentMethod.CARD, icon: CreditCard, label: 'Card' },
                { id: PaymentMethod.TRANSFER, icon: Send, label: 'Transfer' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    method === m.id ? 'border-[#C97B2A] bg-[#C97B2A]/5 text-[#C97B2A]' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <m.icon size={20} />
                  <span className="text-[10px] font-bold uppercase">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extra Info */}
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
              <input 
                type="number"
                placeholder="Add tip (optional)"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-medium"
              />
            </div>
            {method !== PaymentMethod.CASH && (
              <input 
                type="text"
                placeholder="Transaction Reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-medium"
              />
            )}
          </div>

          <button 
            onClick={handleCharge}
            disabled={isSubmitting}
            className="w-full bg-[#1A1A2E] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#C97B2A] shadow-xl shadow-[#1A1A2E]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Processing...' : `Confirm Payment`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-display text-muted mt-1">
          {loading ? '...' : value}
        </p>
      </div>
    </div>
  );
}

function OrderCard({ order, branchId }: { order: Order, branchId: string }) {
  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-gray-100 text-gray-600',
    [OrderStatus.SENT_TO_KITCHEN]: 'bg-blue-100 text-blue-600',
    [OrderStatus.IN_PREPARATION]: 'bg-amber-100 text-amber-600',
    [OrderStatus.READY_FOR_PICKUP]: 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 animate-pulse',
    [OrderStatus.PICKED_UP]: 'bg-purple-100 text-purple-600',
    [OrderStatus.SERVED]: 'bg-indigo-100 text-indigo-600',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-600',
    [OrderStatus.BILLED]: 'bg-gray-100 text-gray-500',
  };

  return (
    <Link 
      href={`/branches/${branchId}/waiter/orders/${order._id}`}
      className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C97B2A]/30 transition-all block group"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl text-[#1A1A2E]">
              {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
            </h4>
            {order.status === OrderStatus.READY_FOR_PICKUP && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1 uppercase">#{order._id.slice(-6)}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={14} className="text-[#C97B2A]" />
            {formatDistanceToNow(new Date(order.createdAt))} ago
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShoppingBag size={14} className="text-[#C97B2A]" />
            {order.items?.length || 0} items
          </div>
        </div>
        <ArrowRight size={20} className="text-gray-300 group-hover:text-[#C97B2A] group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
