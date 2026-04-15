"use client";

import { useAuthStore } from "@/stores/auth";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock,
  ArrowUpRight,
  Plus
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: "Today's Revenue", value: "₦0.00", change: "+0%", icon: TrendingUp },
    { label: "Active Orders", value: "0", change: "Synced", icon: ShoppingBag },
    { label: "Live Customers", value: "0", change: "0 today", icon: Users },
    { label: "Avg. Ticket", value: "₦0.00", change: "Steady", icon: Clock },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display text-navy">
            Welcome back, <span className="text-brand">{user?.firstName}</span>
          </h1>
          <p className="text-gray-500 font-sans text-sm">
            Everything is set up. We're ready for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-6 py-3 border border-gray-100 bg-white hover:bg-gray-50 text-navy font-bold text-sm rounded-xl transition-all active:scale-95">
            Shift Report
          </button>
          <button className="px-6 py-3 bg-brand hover:bg-brand/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand/10 transition-all flex items-center gap-2 active:scale-95">
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-gray-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={10} />
                {stat.change}
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-display text-navy">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed/Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[400px] rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-4">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 shadow-sm">
                <ShoppingBag size={32} />
             </div>
             <div className="space-y-1">
                <h4 className="text-lg font-display text-navy">No Orders Yet</h4>
                <p className="text-sm text-gray-400 max-w-xs">Once you start taking orders in Phase 3, your live sales feed will appear here.</p>
             </div>
          </div>
        </div>

        {/* Sidebar info/Placeholder */}
        <div className="space-y-6">
           <div className="p-6 bg-navy rounded-3xl text-white space-y-4 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <h4 className="text-lg font-display">System Check</h4>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Database Connection</span>
                      <span className="text-success font-bold">Active</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Cloud AI Context</span>
                      <span className="text-gray-500 font-bold italic">Phase 6 Only</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Real-time Gateway</span>
                      <span className="text-brand font-bold">Connecting...</span>
                   </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full" />
           </div>

           <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-navy uppercase tracking-widest text-[10px]">Upcoming Tasks</h4>
              <div className="space-y-4">
                 {[
                   { t: "Phase 2: Menu Building", s: "Next Up" },
                   { t: "Phase 3: Live Orders", s: "Scheduled" },
                   { t: "Phase 4: Billing & Taxes", s: "Scheduled" },
                 ].map((task, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-10 bg-gray-100 rounded-full" />
                      <div className="space-y-0.5">
                         <p className="text-sm font-medium text-navy">{task.t}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{task.s}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
