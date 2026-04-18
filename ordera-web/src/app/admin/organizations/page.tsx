'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  MoreVertical,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  country: string;
  createdAt: string;
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

interface PaginatedResponse {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        plan,
        status,
        page: page.toString(),
        limit: '10'
      });
      const res = await api.get<PaginatedResponse>(`/api/organizations?${query.toString()}`);
      setData(res);
    } catch (error) {
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [search, plan, status, page]);

  return (
    <div className="p-10">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-display text-[32px] text-sidebar">Organizations</h1>
          <p className="text-muted text-sm mt-1">Manage all restaurant businesses on the platform</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg text-sm font-medium text-sidebar hover:bg-white transition-all shadow-sm">
          <Download size={16} />
          Export Data
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-border-light shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text"
            placeholder="Search organizations by name or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted" />
          <select 
            value={plan}
            onChange={(e) => { setPlan(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium text-sidebar outline-none"
          >
            <option value="">All Plans</option>
            <option value="STARTER">Starter</option>
            <option value="BREAD">Growth</option>
            <option value="FEAST">Pro</option>
          </select>

          <select 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium text-sidebar outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-border-light text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-6 h-16 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 size={40} className="text-gray-200" />
                      <p>No organizations found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.data.map((org) => {
                  const subStatus = org.subscription?.status?.toUpperCase() || 'TRIAL';
                  return (
                    <tr 
                      key={org._id} 
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/admin/organizations/${org._id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sidebar group-hover:text-brand transition-colors">{org.name}</div>
                        <div className="text-xs text-muted">{org.slug}.ordera.app</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-sidebar">
                          {org.owner?.firstName} {org.owner?.lastName}
                        </div>
                        <div className="text-[11px] text-muted leading-tight">{org.owner?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-tight">
                          {org.subscription?.plan || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          subStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          subStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                          subStatus === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {subStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{org.country}</td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {new Date(org.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-brand transition-colors" />
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
            Showing <span className="text-sidebar font-bold">{data?.data?.length || 0}</span> of <span className="text-sidebar font-bold">{data?.total || 0}</span> organizations
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || isLoading}
              onClick={() => setPage(p => p - 1)}
              className="p-1 border border-border-light rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-xs font-bold px-4 py-1.5 border border-brand bg-brand/5 text-brand rounded-md">
              Page {page}
            </div>
            <button 
              disabled={!data || (data.data?.length || 0) < 10 || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="p-1 border border-border-light rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
