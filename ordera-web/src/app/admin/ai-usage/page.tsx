'use client';

import { useEffect, useState } from 'react';
import { 
  Zap, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Download,
  AlertTriangle,
  Flame,
  TrendingUp,
  Coins,
  Cpu
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AIUsageRecord {
  _id: string;
  organizationId: string;
  month: number;
  year: number;
  queryCount: number;
  totalTokens: number;
  estimatedCost: number;
  organization: {
    name: string;
    slug: string;
    subscriptionId?: {
      plan: string;
    }
  };
}

interface PaginatedResponse {
  data: AIUsageRecord[];
  total: number;
  page: number;
  limit: number;
}

export default function AIUsageDashboard() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString()
      });
      const res = await api.get<PaginatedResponse>(`/api/platform/ai-usage?${query.toString()}`);
      setData(res);
    } catch (error) {
      toast.error('Failed to load AI usage analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page]);

  const exportCSV = () => {
    if (!data?.data) return;
    
    const headers = ['Organization', 'Month', 'Year', 'Queries', 'Tokens', 'Est. Cost (NGN)'];
    const rows = data.data.map(row => [
      row.organization.name,
      row.month,
      row.year,
      row.queryCount,
      row.totalTokens,
      row.estimatedCost
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ai_usage_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLimitForPlan = (plan: string = 'free') => {
    const limits: any = {
      'free': 100,
      'starter': 1000,
      'bread': 5000,
      'feast': 50000,
      'custom': 1000000
    };
    return limits[plan.toLowerCase()] || 100;
  };

  return (
    <div className="p-10">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-display text-[32px] text-sidebar">AI Engine Analytics</h1>
          <p className="text-muted text-sm mt-1">Monitor token consumption and estimated OpEx costs</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg text-sm font-medium text-sidebar hover:bg-white transition-all shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* QUICK STATS (AGGREGATES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-brand/10 text-brand">
              <Zap size={24} />
            </div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-sidebar">
            {data?.data.reduce((acc, curr) => acc + curr.totalTokens, 0).toLocaleString() || 0}
          </div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider mt-1">Total Tokens Consumed</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Cpu size={24} />
            </div>
            <Flame size={20} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-sidebar">
            {data?.data.reduce((acc, curr) => acc + curr.queryCount, 0).toLocaleString() || 0}
          </div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider mt-1">Global Query Count</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <Coins size={24} />
            </div>
            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">est.</div>
          </div>
          <div className="text-2xl font-bold text-sidebar">
            ₦{data?.data.reduce((acc, curr) => acc + curr.estimatedCost, 0).toLocaleString() || 0}
          </div>
          <div className="text-xs font-medium text-muted uppercase tracking-wider mt-1">Platform-wide AI Cost</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input 
          type="text"
          placeholder="Filter by organization name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm shadow-sm"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-border-light text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Usage Volume</th>
                <th className="px-6 py-4">Capacity Status</th>
                <th className="px-6 py-4">Est. Cost</th>
                <th className="px-6 py-4">Current Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-sm">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-12 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted">No usage data found for this period.</td>
                </tr>
              ) : (
                data?.data.map((row) => {
                  const limit = getLimitForPlan(row.organization.subscriptionId?.plan);
                  const usagePercent = (row.queryCount / limit) * 100;
                  const isHigh = usagePercent > 80;
                  const isDanger = usagePercent > 95;

                  return (
                    <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sidebar">{row.organization.name}</div>
                        <div className="text-[10px] text-muted flex gap-2 items-center mt-1">
                          <span className="uppercase font-bold text-brand bg-brand/5 px-1.5 rounded tracking-tighter">
                            {row.organization.subscriptionId?.plan || 'trial'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sidebar font-bold">{row.queryCount.toLocaleString()} <span className="text-muted font-normal text-xs">queries</span></div>
                        <div className="text-[11px] text-muted">{row.totalTokens.toLocaleString()} tokens</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-40">
                          <div className="flex justify-between items-center mb-1 text-[10px] font-bold uppercase tracking-tight">
                            <span className={isDanger ? 'text-red-600' : isHigh ? 'text-orange-600' : 'text-emerald-600'}>
                              {usagePercent.toFixed(1)}% Usage
                            </span>
                            <span className="text-muted">{limit} Limit</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDanger ? 'bg-red-500' : isHigh ? 'bg-orange-500' : 'bg-brand'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          {isDanger && (
                            <div className="flex gap-1 items-center mt-1.5 text-red-600 font-bold text-[9px] uppercase animate-pulse">
                              <AlertTriangle size={10} />
                              Approaching Limit
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sidebar font-bold">₦{row.estimatedCost.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted font-medium bg-gray-100 px-2 py-1 rounded">
                          {new Date(row.year, row.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-border-light flex items-center justify-between">
          <p className="text-xs text-muted font-medium">
            Showing <span className="text-sidebar font-bold">{data?.data?.length || 0}</span> organizations
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || isLoading}
              onClick={() => setPage(p => p - 1)}
              className="p-1 border border-border-light rounded-md hover:bg-surface disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-xs font-bold px-4 py-1.5 border border-brand bg-brand/5 text-brand rounded-md">
              {page}
            </div>
            <button 
              disabled={!data || (data.data?.length || 0) < limit || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="p-1 border border-border-light rounded-md hover:bg-surface disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
