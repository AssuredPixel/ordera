'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtime } from '@/lib/realtime-hook';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  CheckCircle2,
  X,
  Package,
  Search,
  Clock,
  AlertTriangle,
  Flame,
  MessageSquare,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function ElapsedTimer({ from }: { from: string | null }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!from) return;
    const update = () => {
      const mins = differenceInMinutes(new Date(), new Date(from));
      setElapsed(`${mins}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [from]);
  return <span>{elapsed}</span>;
}

const STATUS_COLORS: Record<string, string> = {
  SENT_TO_KITCHEN: 'border-red-500',
  IN_PREPARATION: 'border-amber-400',
  READY_FOR_PICKUP: 'border-emerald-500',
};

const STOCK_BADGE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/20 text-emerald-400',
  LOW: 'bg-amber-500/20 text-amber-400',
  FINISHED: 'bg-red-500/20 text-red-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const { branchId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isStockOpen, setIsStockOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('stock') === 'open') {
      setIsStockOpen(true);
      // Clean up the URL
      const newPath = window.location.pathname;
      router.replace(newPath);
    }
  }, [searchParams, router]);
  const [activeTab, setActiveTab] = useState<'new'|'prep'|'ready'>('new');

  useEffect(() => {
    const handler = () => setIsStockOpen(true);
    window.addEventListener('open-stock', handler);
    return () => window.removeEventListener('open-stock', handler);
  }, []);

  // ── Fetch orders ──
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders', branchId],
    queryFn: () => api.get<any[]>('/api/orders'),
    refetchInterval: 20000,
  });

  // ── Real-time ──
  useRealtime(`branch-${branchId}`, 'order:new', (newOrder) => {
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (err) {
      console.warn('Audio playback failed:', err);
    }

    queryClient.setQueryData(['kitchen-orders', branchId], (old: any[] = []) => {
      // Avoid duplicates
      if (old.some(o => o._id === newOrder._id)) return old;
      return [newOrder, ...old];
    });
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['kitchen-orders', branchId] });
  }, [queryClient, branchId]);

  useRealtime(`branch-${branchId}`, 'order:update', invalidate);

  // ── Kanban columns ──
  const newOrders  = orders.filter(o => o.status === 'SENT_TO_KITCHEN');
  const prepOrders = orders.filter(o => o.status === 'IN_PREPARATION');
  const readyOrders= orders.filter(o => o.status === 'READY_FOR_PICKUP');

  const preparedCount = orders.filter(o =>
    ['READY_FOR_PICKUP','PICKED_UP','SERVED'].includes(o.status)
  ).length;
  const lastOrderTime = orders.length > 0 ? orders[0].createdAt : null;

  return (
    <>
      {/* Mobile tabs (specific to Orders page) */}
      <div className="lg:hidden flex border-b border-white/5 shrink-0" style={{ background: '#1A1A2E' }}>
        {([
          { key: 'new',   label: 'New',       count: newOrders.length,   color: 'text-red-400',     active: 'border-red-500' },
          { key: 'prep',  label: 'Preparing', count: prepOrders.length,  color: 'text-amber-400',   active: 'border-amber-400' },
          { key: 'ready', label: 'Ready',     count: readyOrders.length, color: 'text-emerald-400', active: 'border-emerald-500' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-bold flex flex-col items-center gap-0.5 border-b-2 transition-all ${
              activeTab === tab.key ? `${tab.active} text-white` : 'border-transparent text-gray-500'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-base font-black leading-none ${tab.color}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ────────────────── KANBAN ────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: 3-column layout */}
        <div className="hidden lg:flex h-full gap-4 p-6 overflow-x-auto" style={{ background: '#0D0D1A' }}>
          <KanbanColumn title="New Orders"      badge={newOrders.length}   badgeColor="bg-red-500/20 text-red-400"     accentColor="#ef4444" orders={newOrders} />
          <KanbanColumn title="In Preparation"  badge={prepOrders.length}  badgeColor="bg-amber-500/20 text-amber-400" accentColor="#f59e0b" orders={prepOrders} />
          <KanbanColumn title="Ready for Pickup" badge={readyOrders.length} badgeColor="bg-emerald-500/20 text-emerald-400" accentColor="#10b981" orders={readyOrders} />
        </div>
        {/* Mobile: single active tab */}
        <div className="lg:hidden h-full overflow-y-auto p-3 pb-24 space-y-3" style={{ background: '#111122' }}>
          {activeTab === 'new'   && (newOrders.length   === 0 ? <EmptyCol /> : newOrders.map((o: any)   => <OrderCard key={o._id} order={o} />))}
          {activeTab === 'prep'  && (prepOrders.length  === 0 ? <EmptyCol /> : prepOrders.map((o: any)  => <OrderCard key={o._id} order={o} />))}
          {activeTab === 'ready' && (readyOrders.length === 0 ? <EmptyCol /> : readyOrders.map((o: any) => <OrderCard key={o._id} order={o} />))}
        </div>
      </div>

      {/* ────────────────── SHIFT BAR (desktop) ────────────────── */}
      <footer className="hidden lg:flex h-10 shrink-0 border-t border-white/5 items-center justify-between px-6 text-[11px] text-gray-500 font-bold uppercase tracking-widest" style={{ background: '#0A0A14' }}>
        <div className="flex gap-6">
          <span>Shift prepared: <span className="text-white">{preparedCount}</span></span>
          <span>Last order: <span className="text-white">{lastOrderTime ? formatDistanceToNow(new Date(lastOrderTime), { addSuffix: true }) : '—'}</span></span>
        </div>
        <button
          onClick={() => setIsStockOpen(true)}
          className="flex items-center gap-2 px-4 h-full hover:bg-white/5 transition-colors border-l border-white/5 text-[#C97B2A]"
        >
          <Package size={14} />
          <span>Manage Stock & Items</span>
        </button>
      </footer>



      {/* ────────────────── STOCK PANEL ────────────────── */}
      <AnimatePresence>
        {isStockOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsStockOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-[#11111E] flex flex-col shadow-2xl border-l border-white/5 overflow-hidden"
            >
              <StockPanel
                branchId={branchId as string}
                onClose={() => setIsStockOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY COLUMN
// ─────────────────────────────────────────────────────────────────────────────
function EmptyCol() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
      <ChefHat size={28} />
      <span className="text-xs font-medium">Nothing here</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR STAT
// ─────────────────────────────────────────────────────────────────────────────
function SidebarStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/4">
      <span className="text-xs text-white/50 font-medium">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KANBAN COLUMN
// ─────────────────────────────────────────────────────────────────────────────
function KanbanColumn({ title, badge, badgeColor, accentColor, orders }: any) {
  return (
    <div className="flex-1 min-w-[300px] max-w-[420px] flex flex-col rounded-2xl border border-white/5 overflow-hidden">
      {/* Column header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5" style={{ background: '#1A1A2E' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: '#111122' }}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
            <ChefHat size={28} />
            <span className="text-xs font-medium">Nothing here</span>
          </div>
        ) : orders.map((order: any) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: any }) {
  const queryClient = useQueryClient();
  const { branchId } = useParams();

  const ackMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${order._id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', branchId] });
      toast.success('Order started!');
    },
    onError: () => toast.error('Failed to update order'),
  });

  const readyMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${order._id}/mark-ready`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders', branchId] });
      toast.success('Waiter notified!');
    },
    onError: () => toast.error('Failed to update order'),
  });

  const prepMins = order.sentToKitchenAt
    ? differenceInMinutes(new Date(), new Date(order.sentToKitchenAt))
    : 0;
  const isUrgent = prepMins > 15 && order.status !== 'READY_FOR_PICKUP';

  return (
    <div className={`rounded-2xl border-l-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ${STATUS_COLORS[order.status] || 'border-gray-600'}`}
      style={{ background: '#1C1C30' }}>

      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-white leading-none">
            {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
          </h4>
          <p className="text-[10px] text-gray-500 font-mono mt-1">
            #{order._id.slice(-5).toUpperCase()} · Waiter: {order.waiterName || 'N/A'}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
          {isUrgent && <Flame size={11} />}
          <Clock size={11} />
          <ElapsedTimer from={order.sentToKitchenAt || order.createdAt} />
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map((item: any, i: number) => (
          <div key={i}>
            <div className="flex items-baseline gap-2">
              <span className="text-[#C97B2A] font-black text-lg leading-none">×{item.quantity}</span>
              <span className="text-white font-semibold text-sm leading-tight">{item.name}</span>
            </div>
            {item.selectedAddons?.length > 0 && (
              <p className="text-[11px] text-gray-500 ml-7 mt-0.5">
                + {item.selectedAddons.map((a: any) => a.name).join(', ')}
              </p>
            )}
            {item.notes && (
              <div className="ml-7 mt-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 italic">
                {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kitchen note */}
      {order.kitchenNote && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 items-start">
          <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300 italic">{order.kitchenNote}</p>
        </div>
      )}

      {/* Guest info */}
      <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
        <span>{order.guestCount || 1} guest{order.guestCount > 1 ? 's' : ''}</span>
        {order.customerName && <span>· {order.customerName}</span>}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-1">
        {order.status === 'SENT_TO_KITCHEN' && (
          <button
            onClick={() => ackMutation.mutate()}
            disabled={ackMutation.isPending}
            className="w-full h-[50px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            {ackMutation.isPending ? 'Starting…' : (<><Flame size={18} /> Start Preparing</>)}
          </button>
        )}

        {order.status === 'IN_PREPARATION' && (
          <div className="space-y-2">
            <p className="text-center text-[11px] font-bold text-amber-500 uppercase tracking-widest">
              Preparing for {prepMins}m
            </p>
            <button
              onClick={() => readyMutation.mutate()}
              disabled={readyMutation.isPending}
              className="w-full h-[50px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#d97706', color: '#fff' }}
            >
              {readyMutation.isPending ? 'Updating…' : (<><CheckCircle2 size={18} /> Mark Ready for Pickup</>)}
            </button>
          </div>
        )}

        {order.status === 'READY_FOR_PICKUP' && (
          <div className="w-full h-[50px] rounded-xl font-bold text-base flex items-center justify-center gap-2"
            style={{ background: '#052e16', color: '#4ade80', border: '1px solid #16a34a44' }}>
            <CheckCircle2 size={18} /> Awaiting Pickup
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK PANEL
// ─────────────────────────────────────────────────────────────────────────────
function StockPanel({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', branchId],
    queryFn: () => api.get<any[]>(`/api/menu/categories?branchId=${branchId}`),
  });

  // Fetch stock overview (returns { AVAILABLE: [], LOW: [], FINISHED: [] })
  const { data: stock, isLoading } = useQuery({
    queryKey: ['stock-overview', branchId],
    queryFn: () => api.get<any>(`/api/menu/stock-overview?branchId=${branchId}`),
  });

  // Flatten all items
  const allItems: any[] = [
    ...(stock?.AVAILABLE || []),
    ...(stock?.LOW || []),
    ...(stock?.FINISHED || []),
  ];

  // Group by category
  const grouped = categories.map((cat: any) => ({
    ...cat,
    items: allItems.filter(i =>
      i.categoryId?.toString() === cat._id?.toString() &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.items.length > 0);

  // Unmatched items (no category match found)
  const ungrouped = allItems.filter(i =>
    !categories.some((c: any) => c._id?.toString() === i.categoryId?.toString()) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: '' });
  const stockMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      api.patch(`/api/menu/items/${itemId}/stock`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-overview', branchId] });
    },
    onError: () => toast.error('Failed to update stock'),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/menu/items?branchId=${branchId}`, { 
      ...data, 
      price: { amount: Number(data.price), currency: 'NGN' } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-overview', branchId] });
      setIsAddingItem(false);
      setNewItem({ name: '', price: '', categoryId: '' });
      toast.success('Item added successfully');
    },
    onError: () => toast.error('Failed to add item'),
  });

  return (
    <>
      {/* Panel header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Stock Management</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Tap a status to update instantly</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingItem(!isAddingItem)}
            className={`p-2 rounded-xl transition-all ${
              isAddingItem ? 'bg-red-500/20 text-red-400' : 'bg-[#C97B2A]/20 text-[#C97B2A]'
            }`}
          >
            {isAddingItem ? <X size={18} /> : <Plus size={18} />}
          </button>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {isAddingItem && (
        <div className="px-4 py-4 border-b border-white/5 bg-white/2 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Add Today&apos;s Special</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Item Name (e.g. Special Jollof)"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full bg-[#0A0A14] text-white border border-white/8 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C97B2A]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                className="flex-1 bg-[#0A0A14] text-white border border-white/8 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C97B2A]"
              />
              <select
                value={newItem.categoryId}
                onChange={e => setNewItem({ ...newItem, categoryId: e.target.value })}
                className="flex-1 bg-[#0A0A14] text-white border border-white/8 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C97B2A] appearance-none"
              >
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (!newItem.name || !newItem.price || !newItem.categoryId) {
                  return toast.error('Please fill all fields');
                }
                addItemMutation.mutate(newItem);
              }}
              disabled={addItemMutation.isPending}
              className="w-full bg-[#C97B2A] hover:bg-[#B06A20] text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {addItemMutation.isPending ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/5 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0A0A14] text-white border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C97B2A] placeholder-gray-600"
          />
        </div>
      </div>

      {/* Summary badges */}
      <div className="px-4 py-3 flex gap-2 border-b border-white/5 shrink-0">
        {[
          { label: 'Available', key: 'AVAILABLE', cls: 'bg-emerald-500/15 text-emerald-400' },
          { label: 'Low', key: 'LOW', cls: 'bg-amber-500/15 text-amber-400' },
          { label: 'Finished', key: 'FINISHED', cls: 'bg-red-500/15 text-red-400' },
        ].map(s => (
          <div key={s.key} className={`flex-1 text-center py-2 rounded-xl text-xs font-bold ${s.cls}`}>
            {s.label} <span className="font-black">{stock?.[s.key]?.length ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">Loading…</div>
        ) : (
          <>
            {grouped.map((cat: any) => (
              <div key={cat._id}>
                <h4 className="text-[10px] font-black text-[#C97B2A] uppercase tracking-widest mb-3 px-1">{cat.name}</h4>
                <div className="space-y-2">
                  {cat.items.map((item: any) => (
                    <StockRow
                      key={item._id}
                      item={item}
                      onUpdate={(status: string) => stockMutation.mutate({ itemId: item._id, status })}
                      isUpdating={stockMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Other</h4>
                <div className="space-y-2">
                  {ungrouped.map((item: any) => (
                    <StockRow
                      key={item._id}
                      item={item}
                      onUpdate={(status: string) => stockMutation.mutate({ itemId: item._id, status })}
                      isUpdating={stockMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
            {grouped.length === 0 && ungrouped.length === 0 && (
              <div className="text-center py-20 text-gray-600 text-sm">No items found</div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK ROW
// ─────────────────────────────────────────────────────────────────────────────
function StockRow({ item, onUpdate, isUpdating }: { item: any; onUpdate: (s: string) => void; isUpdating: boolean }) {
  const statuses = [
    { id: 'AVAILABLE', label: 'Avail', activeClass: 'bg-emerald-600 text-white' },
    { id: 'LOW',       label: 'Low',   activeClass: 'bg-amber-500 text-white' },
    { id: 'FINISHED',  label: 'Out',   activeClass: 'bg-red-600 text-white' },
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-white/5" style={{ background: '#0D0D1A' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate">{item.name}</p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${STOCK_BADGE[item.stockStatus]}`}>
          {item.stockStatus}
        </span>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {statuses.map(s => (
          <button
            key={s.id}
            onClick={() => onUpdate(s.id)}
            disabled={isUpdating || item.stockStatus === s.id}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 disabled:cursor-default ${
              item.stockStatus === s.id
                ? s.activeClass
                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
