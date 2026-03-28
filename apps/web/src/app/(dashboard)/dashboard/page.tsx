'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import DashboardSkeleton from './DashboardSkeleton';

const CATEGORY_COLORS = {
  dineIn: '#C97B2A',
  takeaway: '#1A1A2E',
  delivery: '#9CA3AF'
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Today');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/stats?period=${period.toLowerCase()}`);
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [period]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const pieData = [
    { name: 'Dine-in', value: data.totalRevenue.dineIn, color: CATEGORY_COLORS.dineIn },
    { name: 'Takeaway', value: data.totalRevenue.takeaway, color: CATEGORY_COLORS.takeaway },
    { name: 'Delivery', value: data.totalRevenue.delivery, color: CATEGORY_COLORS.delivery },
  ];

  const formatCurrency = (amt: number) => `₦${amt.toLocaleString()}`;

  return (
    <div className="p-10 space-y-10">
      {/* PAGE HEADER */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[#6B7280] text-sm font-sans flex items-center gap-2">
            Dashboard <span className="text-gray-300">/</span> Sales statistics
          </p>
          <h1 className="font-serif text-[28px] text-[#1A1A2E] leading-tight font-bold">Dashboard</h1>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
            {['Yesterday', 'Today', 'Week', 'Month', 'Year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${
                  period === p 
                    ? 'bg-white text-[#C97B2A] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* WIDGET ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-sans font-semibold text-[15px] text-[#1A1A2E]">Daily Sales</h3>
            <div className="flex gap-4">
               {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{key}</span>
                </div>
               ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales}>
                <CartesianGrid vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="dineIn" 
                  stroke={CATEGORY_COLORS.dineIn} 
                  strokeWidth={3} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="takeaway" 
                  stroke={CATEGORY_COLORS.takeaway} 
                  strokeWidth={3} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="delivery" 
                  stroke={CATEGORY_COLORS.delivery} 
                  strokeWidth={3} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview - Split Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Pie Chart Widget */}
          <div className="col-span-2 bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm flex flex-col items-center">
            <div className="w-full flex justify-between mb-2">
               <h3 className="font-sans font-semibold text-[15px] text-[#1A1A2E]">Total Revenue</h3>
               <ArrowUpRight className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="relative w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                <span className="font-serif text-2xl font-bold text-[#C97B2A]">
                  {formatCurrency(data.totalRevenue.total)}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-4 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1A1A2E]">
                    {Math.round((item.value / data.totalRevenue.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${data.stats.totalOrders.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {data.stats.totalOrders.isPositive ? '+' : ''}{data.stats.totalOrders.change}%
              </div>
            </div>
            <p className="font-serif text-4xl font-bold text-[#1A1A2E]">{data.stats.totalOrders.value}</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[10px] font-bold uppercase tracking-wider">New Customers</span>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${data.stats.newCustomers.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {data.stats.newCustomers.isPositive ? '+' : ''}{data.stats.newCustomers.change}%
              </div>
            </div>
            <p className="font-serif text-4xl font-bold text-[#1A1A2E]">{data.stats.newCustomers.value}</p>
          </div>
        </div>
      </div>

      {/* WIDGET ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* Best Employees Table */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-2xl text-[#1A1A2E]">Best Employees</h3>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#C97B2A]">
              Today <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.bestEmployees.map((emp: any) => (
                <tr key={emp.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">{emp.avatar}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1A1A2E]">{emp.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{emp.role}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right align-middle">
                    <span className="text-sm font-bold text-[#C97B2A]">{formatCurrency(emp.revenue)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trending Dishes Table */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-2xl text-[#1A1A2E]">Trending Dishes</h3>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</th>
                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.trendingDishes.map((dish: any) => (
                <tr key={dish.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <div className="bg-[#F5ECD9] text-[#C97B2A] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {dish.category}
                      </div>
                      <span className="text-sm font-bold text-[#1A1A2E]">{dish.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right align-middle">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-[#1A1A2E]">{dish.orders}</span>
                      <span className="text-[10px] text-emerald-500 font-bold">+12%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
