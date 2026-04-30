'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar,
  ChevronDown,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const { branchId } = useParams();
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const getDates = () => {
    let start = subDays(new Date(), 7);
    if (dateRange === '30d') start = subDays(new Date(), 30);
    if (dateRange === '90d') start = subDays(new Date(), 90);
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    };
  };

  const dates = getDates();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports-summary', branchId, dateRange],
    queryFn: () => api.get<any>(`/api/reports/summary?branchId=${branchId}&startDate=${dates.start}&endDate=${dates.end}`)
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse">Analyzing branch data...</div>;

  const { revenueTrend, topItems, staffLeaderboard, summary } = reportsData || {};

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER & FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Deep dive into your branch's financial and operational performance.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dateRange === range 
                    ? 'bg-[#1A1A2E] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={`₦${(summary?.totalRevenue / 100).toLocaleString()}`} 
          trend="+12.5%" 
          positive={true}
          icon={TrendingUp}
          color="amber"
        />
        <KPICard 
          title="Total Orders" 
          value={summary?.totalOrders} 
          trend="+5.2%" 
          positive={true}
          icon={ShoppingBag}
          color="blue"
        />
        <KPICard 
          title="Avg. Order Value" 
          value={`₦${(summary?.avgOrderValue / 100).toLocaleString()}`} 
          trend="-2.1%" 
          positive={false}
          icon={BarChart3}
          color="indigo"
        />
      </div>

      {/* ── MAIN CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REVENUE TREND */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-[#1A1A2E]">Revenue Growth</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Calendar size={14} /> {format(new Date(dates.start), 'MMM d')} - {format(new Date(dates.end), 'MMM d')}
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C97B2A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C97B2A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(val) => `₦${(val / 100000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`₦${(val / 100).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#C97B2A" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STAFF LEADERBOARD */}
        <div className="bg-[#1A1A2E] rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col">
          <h3 className="font-display text-2xl mb-8">Staff Leaderboard</h3>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {staffLeaderboard?.map((staff: any, idx: number) => (
              <div key={staff._id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-[#C97B2A]">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm">{staff.waiterName || 'Anonymous'}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{staff.billsCount} Bills Settled</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[#C97B2A]">₦{(staff.revenue / 100).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
            View All Performance
          </button>
        </div>
      </div>

      {/* ── TOP ITEMS ── */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl text-[#1A1A2E]">Most Popular Items</h3>
          <button className="text-sm font-bold text-[#C97B2A] hover:underline flex items-center gap-2">
            Detailed Menu Analytics <ChevronDown size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topItems?.slice(0, 4).map((item: any) => (
            <div key={item._id} className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 space-y-4 hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1A1A2E] shadow-sm">
                  <ShoppingBag size={24} />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#C97B2A]/10 text-[#C97B2A] text-[10px] font-bold uppercase tracking-widest">
                  Top Seller
                </span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                <p className="text-xs text-gray-400">{item.quantity} units sold</p>
              </div>
              <p className="text-xl font-display text-[#1A1A2E]">₦{(item.revenue / 100).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function KPICard({ title, value, trend, positive, icon: Icon, color }: any) {
  const colors: any = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-3xl font-display text-[#1A1A2E] mt-1">{value}</h2>
      </div>
    </motion.div>
  );
}
