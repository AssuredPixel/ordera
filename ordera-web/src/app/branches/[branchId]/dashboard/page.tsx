'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Timer,
  AlertTriangle,
  BarChart3,
  Clock,
  CheckCircle2,
  PackageX,
  CreditCard,
  Banknote,
  Repeat
} from 'lucide-react';
import { format } from 'date-fns';
import { BranchStats, StockAlert, StaffPerformance, BillSummary } from '@/types/ordera';
import { XCircle } from 'lucide-react';
import { useRealtime } from '@/lib/realtime-hook';

export default function BranchDashboard() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  // Real-time Updates: Refresh dashboard when orders/bills change
  useRealtime(`branch-${branchId}`, 'order:update', () => {
    queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
  });

  useRealtime(`branch-${branchId}`, 'bill:paid', () => {
    queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
  });

  // 1. Fetch Dashboard Stats
  const { data, isLoading } = useQuery({
    queryKey: ['branch-stats', branchId],
    queryFn: async () => {
      const data = await api.get<any>(`/api/dashboard/branch/${branchId}/stats`);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // 2. Close Business Day Mutation
  const closeDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      return api.patch(`/api/business-days/${dayId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
    }
  });

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
    <div className="grid grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
    </div>
  </div>;

  const { kpis, businessDay, stockAlerts, performance, recentBills } = data || {};
  const isDayOpen = businessDay?.status === 'open';

  return (
    <div className="space-y-8 pb-12">
      {/* ── TOP BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">
            {businessDay?.branchName || 'Daily Operations'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
              {businessDay?.operatingMode || 'Day-Based'}
            </span>
            {isDayOpen ? (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active • Since {businessDay?.actualOpen ? format(new Date(businessDay.actualOpen), 'hh:mm a') : '--:--'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                <XCircle size={14} /> Closed
              </span>
            )}
          </div>
        </div>

        {isDayOpen && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to close the business day? All active shifts will be finalized.')) {
                closeDayMutation.mutate(businessDay._id);
              }
            }}
            disabled={closeDayMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-[#1A1A2E] text-white font-bold text-sm shadow-xl shadow-[#1A1A2E]/10 hover:bg-[#2A2A4E] transition-all disabled:opacity-50"
          >
            Close Business Day
          </button>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem
          title="Revenue Today"
          value={`\u20A6${(kpis?.revenue / 100).toLocaleString()}`}
          icon={TrendingUp}
          color="#C97B2A"
        />
        <KPIItem
          title="Orders Today"
          value={kpis?.ordersToday || 0}
          icon={ShoppingBag}
          color="#3B82F6"
        />
        <KPIItem
          title="Staff On Shift"
          value={kpis?.staffOnShift || 0}
          icon={Users}
          color="#10B981"
        />
        <KPIItem
          title="Open Orders"
          value={kpis?.openOrders || 0}
          icon={Timer}
          color="#F59E0B"
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Orders & Staff */}
        <div className="lg:col-span-2 space-y-8">

          {/* Live Orders (Placeholder) */}
          <Section title="Live Orders" icon={Clock}>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Waiter</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Data would go here if we had a separate live-orders fetch */}
                  <tr className="hover:bg-gray-50/50">
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                      Table view for active orders...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Performance Table */}
          <Section title="Staff Performance Today" icon={BarChart3}>
            <div className="bg-white rounded-2xl border border-gray-100 p-2">
              <table className="w-full text-sm">
                <thead className="text-gray-400 font-medium border-b border-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Staff</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {performance?.map((p: StaffPerformance) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-muted">{p.waiterName}</td>
                      <td className="px-4 py-4 text-center">{p.ordersCount}</td>
                      <td className="px-4 py-4 text-right font-bold text-[#C97B2A]">
                        \u20A6{(p.revenue / 100).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

        </div>

        {/* Right Column: Inventory & Bills */}
        <div className="space-y-8">

          {/* Stock Alerts */}
          <div className="bg-[#1A1A2E] text-white rounded-3xl p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 font-display text-xl mb-6">
              <AlertTriangle className="text-amber-400" size={20} /> Stock Alerts
            </h3>
            <div className="space-y-4">
              {stockAlerts?.length > 0 ? stockAlerts.map((item: StockAlert) => (
                <div key={item._id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-tight">{item.categoryId?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item.stockStatus === 'low' ? 'bg-amber-400/20 text-amber-400' : 'bg-red-500/20 text-red-500'
                    }`}>
                    {item.stockStatus === 'low' ? 'LOW' : 'FINISHED'}
                  </span>
                </div>
              )) : (
                <p className="text-center text-white/30 text-xs py-10">No critical stock alerts</p>
              )}
            </div>
            {stockAlerts?.length > 0 && (
              <button className="w-full mt-6 py-3 rounded-xl border border-white/20 text-xs font-bold hover:bg-white hover:text-[#1A1A2E] transition-all">
                ACTION REQUIRED: Manage All Stock
              </button>
            )}
          </div>

          {/* Recent Bills */}
          <Section title="Recent Bills" icon={Banknote}>
            <div className="space-y-3">
              {recentBills?.map((bill: BillSummary) => (
                <div key={bill._id} className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 text-muted">
                      {bill.payment?.method === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted">Table {bill.tableNumber}</p>
                      <p className="text-[10px] text-gray-400">{format(new Date(bill.createdAt), 'hh:mm a')}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A2E]">
                    \u20A6{(bill.total.amount / 100).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

interface KPIProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

function KPIItem({ title, value, icon: Icon, color }: KPIProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display text-muted mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-display text-2xl text-muted">
        <Icon className="text-gray-400" size={24} /> {title}
      </h3>
      {children}
    </div>
  );
}
