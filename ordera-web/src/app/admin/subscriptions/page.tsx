'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  Download,
  Calendar,
  Zap,
  Clock,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Subscription {
  _id: string;
  organizationId: string;
  plan: string;
  status: string;
  gateway: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  notes?: string;
  organization?: {
    name: string;
    slug: string;
  };
}

interface PaginatedResponse {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [gateway, setGateway] = useState('');
  const [page, setPage] = useState(1);
  
  // Management State
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        plan,
        status,
        gateway,
        page: page.toString(),
        limit: '10'
      });
      const res = await api.get<PaginatedResponse>(`/api/platform/subscriptions?${query.toString()}`);
      setData(res);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, plan, status, gateway, page]);

  const handleExtend = async () => {
    if (!selectedSub) return;
    setIsUpdating(true);
    try {
      await api.patch(`/api/platform/subscriptions/${selectedSub._id}/extend`, { days: extendDays });
      toast.success(`Subscription extended by ${extendDays} days`);
      setShowExtendModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to extend subscription');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedSub) return;
    setIsUpdating(true);
    try {
      let endpoint = '';
      if (action === 'activate') endpoint = `/api/platform/subscriptions/${selectedSub._id}/activate`;
      if (action === 'cancel') endpoint = `/api/platform/subscriptions/${selectedSub._id}/cancel`;
      
      await api.patch(endpoint, {});
      toast.success(`Subscription ${action}d successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} subscription`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-10">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-display text-[32px] text-sidebar">Subscriptions</h1>
          <p className="text-muted text-sm mt-1">Monitor recurring revenue and manage tenant access</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg text-sm font-medium text-sidebar hover:bg-white transition-all shadow-sm">
            <Download size={16} />
            Revenue Report
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 bg-white p-4 rounded-xl border border-border-light shadow-sm">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text"
            placeholder="Search by restaurant name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border-light rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
          />
        </div>

        <select 
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium text-sidebar outline-none"
        >
          <option value="">All Plans</option>
          <option value="STARTER">Starter</option>
          <option value="BREAD">Growth</option>
          <option value="FEAST">Pro</option>
          <option value="FREE">Free</option>
        </select>

        <select 
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium text-sidebar outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="suspended">Suspended</option>
          <option value="canceled">Canceled</option>
          <option value="trial">Trialing</option>
        </select>

        <select 
          value={gateway}
          onChange={(e) => { setGateway(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium text-sidebar outline-none"
        >
          <option value="">All Gateways</option>
          <option value="paystack">Paystack</option>
          <option value="stripe">Stripe</option>
          <option value="manual">Manual / Cash</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-border-light text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Plan & Gateway</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Current Period</th>
                <th className="px-6 py-4">MRR</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-12 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-muted">No subscriptions found.</td>
                </tr>
              ) : (
                data?.data.map((sub) => {
                  const isActive = sub.status === 'active';
                  const isTrial = sub.status === 'trial' || sub.status === 'trialing';
                  
                  return (
                    <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sidebar">{sub.organization?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-muted truncate max-w-[150px]">{sub.organizationId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-tight text-xs text-brand">{sub.plan}</span>
                          <span className="text-muted text-[10px]">•</span>
                          <span className="text-muted text-[11px] uppercase">{sub.gateway}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wide ${
                          isActive ? 'bg-emerald-100 text-emerald-700' :
                          isTrial ? 'bg-blue-100 text-blue-700' :
                          sub.status === 'past_due' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sidebar font-medium">
                          <Clock size={14} className="text-muted" />
                          <span>{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {sub.cancelAtPeriodEnd && (
                          <div className="text-[10px] text-red-500 font-bold mt-1">Cancelling at end of period</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-sidebar">
                        ₦{sub.plan === 'starter' ? '49,000' : sub.plan === 'bread' ? '99,000' : sub.plan === 'feast' ? '199,000' : '0'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setSelectedSub(sub); setShowExtendModal(true); }}
                            className="p-1.5 hover:bg-brand/10 hover:text-brand transition-colors rounded text-muted"
                            title="Extend Validity"
                          >
                            <Calendar size={16} />
                          </button>
                          <button 
                             onClick={() => router.push(`/admin/organizations/${sub.organizationId}`)}
                             className="p-1.5 hover:bg-sidebar/10 hover:text-sidebar transition-colors rounded text-muted"
                             title="View Organization"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
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
            Showing <span className="text-sidebar font-bold">{data?.data?.length || 0}</span> of <span className="text-sidebar font-bold">{data?.total || 0}</span> subscriptions
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
              Page {page}
            </div>
            <button 
              disabled={!data || (data.data?.length || 0) < 10 || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="p-1 border border-border-light rounded-md hover:bg-surface disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* EXTEND MODAL */}
      {showExtendModal && selectedSub && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sidebar/60 backdrop-blur-sm" onClick={() => setShowExtendModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-6">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold text-sidebar mb-2">Extend Subscription</h3>
              <p className="text-muted text-sm mb-6">
                Manually push the renewal date for <span className="text-sidebar font-bold">{selectedSub.organization?.name}</span>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-sidebar uppercase mb-1.5 block">Number of Days</label>
                  <input 
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-surface border border-border-light rounded-xl focus:ring-2 focus:ring-brand outline-none font-bold"
                  />
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex gap-3 text-emerald-800">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">New Expiry Date</p>
                      <p className="text-xs opacity-80">
                        {new Date((selectedSub.currentPeriodEnd ? new Date(selectedSub.currentPeriodEnd).getTime() : Date.now()) + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-muted rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExtend}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-brand text-sidebar rounded-xl font-bold hover:shadow-lg hover:shadow-brand/20 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? 'Updating...' : 'Extend Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
