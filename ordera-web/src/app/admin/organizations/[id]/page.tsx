'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  User
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  contactEmail: string;
  contactPhone: string;
  mrrContribution: number;
  ownerUserId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subscriptionId?: {
    _id: string;
    plan: string;
    status: string;
    gateway: string;
    currentPeriodEnd: string;
  };
}

interface Invoice {
  _id: string;
  plan: string;
  amount: { amount: number; currency: string };
  status: string;
  paidAt?: string;
  createdAt: string;
}

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [forcedPlan, setForcedPlan] = useState('');

  const fetchData = async () => {
    try {
      const [orgData, invData] = await Promise.all([
        api.get<Organization>(`/api/organizations/${id}`),
        api.get<Invoice[]>(`/api/platform/invoices/${id}`)
      ]);
      setOrg(orgData);
      setInvoices(invData);
      setForcedPlan(orgData.subscriptionId?.plan || '');
    } catch (error) {
      toast.error('Failed to load organization details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSuspend = async () => {
    if (confirmName !== org?.name) {
      toast.error('Organization name does not match');
      return;
    }

    setIsSuspending(true);
    try {
      await api.patch(`/api/organizations/${org._id}/suspend`);
      toast.success('Organization suspended');
      setShowSuspendModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to suspend organization');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await api.patch(`/api/organizations/${org?._id}/reactivate`);
      toast.success('Organization reactivated');
      fetchData();
    } catch (error) {
      toast.error('Failed to reactivate');
    }
  };

  const handleForcePlanChange = async (newPlan: string) => {
    if (!org?.subscriptionId?._id) return;
    try {
      await api.patch(`/api/platform/subscriptions/${org.subscriptionId._id}/force-plan`, { plan: newPlan });
      toast.success(`Plan updated to ${newPlan}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-muted uppercase tracking-widest text-[10px] font-bold">
        <Loader2 className="animate-spin text-brand mb-4" size={32} />
        Loading Organization Profile...
      </div>
    );
  }

  if (!org) return <div>Organization not found</div>;

  const status = org.subscriptionId?.status?.toUpperCase() || 'TRIAL';

  return (
    <div className="p-10 max-w-7xl mx-auto pb-20">
      {/* NAVIGATION */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted hover:text-sidebar transition-colors mb-8 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Back to Organizations</span>
      </button>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-[40px] text-sidebar leading-tight">
              {org.name}
            </h1>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              org.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {org.isActive ? 'Active Org' : 'Suspended'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand`}>
                {org.subscriptionId?.plan || 'Free'}
              </span>
            </div>
            <div className="text-sm text-muted flex items-center gap-1.5">
              <span>🇳🇬 {org.country}</span>
              <span className="text-gray-300">•</span>
              <span>Since {new Date(org.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {org.isActive ? (
            <button 
              onClick={() => setShowSuspendModal(true)}
              className="px-6 py-2.5 bg-white border-2 border-red-500 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
            >
              Suspend Organization
            </button>
          ) : (
            <button 
              onClick={handleReactivate}
              className="px-6 py-2.5 bg-white border-2 border-emerald-500 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all active:scale-95"
            >
              Reactivate Organization
            </button>
          )}
        </div>
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <InfoCard 
          icon={<User className="text-brand" size={18} />} 
          label="Owner" 
          value={`${org.ownerUserId?.firstName} ${org.ownerUserId?.lastName}`} 
          subValue={org.ownerUserId?.email}
        />
        <InfoCard 
          icon={<Phone className="text-brand" size={18} />} 
          label="Contact" 
          value={org.contactPhone} 
          subValue={org.contactEmail}
        />
        <InfoCard 
          icon={<Calendar className="text-brand" size={18} />} 
          label="Member Since" 
          value={new Date(org.createdAt).toLocaleDateString()} 
          subValue="Onboarding complete"
        />
        <ClockCard label="Last Active" date={org.updatedAt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SUBSCRIPTION & MRR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sidebar uppercase tracking-widest text-[11px]">Subscription</h3>
              <CreditCard className="text-muted" size={18} />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-border-light pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted mb-1">Current Plan</p>
                  <p className="text-2xl font-display text-sidebar">{org.subscriptionId?.plan || 'N/A'}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted mb-1">Renewal Date</p>
                  <p className="text-sm font-bold text-sidebar">
                    {org.subscriptionId?.currentPeriodEnd ? new Date(org.subscriptionId.currentPeriodEnd).toLocaleDateString() : 'Manual'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted mb-1">Gateway</p>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#00457C] text-white p-0.5 rounded text-[7px] font-black">PAYSTACK</div>
                    <span className="text-sm font-bold text-sidebar">{org.subscriptionId?.gateway || 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">MRR Contribution</p>
                <p className="text-3xl font-display text-emerald-900 leading-none">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(org.mrrContribution)}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase text-muted mb-3">Force Plan Change (Admin Override)</p>
                <select 
                  value={forcedPlan}
                  onChange={(e) => {
                    if (confirm(`Change plan to ${e.target.value}?`)) {
                      handleForcePlanChange(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 bg-surface border-2 border-border-light rounded-lg text-sm font-bold text-sidebar focus:border-brand outline-none transition-all cursor-pointer"
                >
                  <option value="STARTER">STARTER</option>
                  <option value="BREAD">GROWTH (BREAD)</option>
                  <option value="FEAST">PRO (FEAST)</option>
                  <option value="FREE">FREE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* INVOICE HISTORY */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-border-light bg-gray-50/30 flex justify-between items-center">
              <h3 className="font-bold text-sidebar uppercase tracking-widest text-[11px]">Invoice History</h3>
              <p className="text-[10px] text-muted font-medium">All historical billing</p>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border-light text-[10px] font-black uppercase tracking-widest text-muted">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted italic text-xs">
                        No billing history available.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-sidebar">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-muted uppercase">{inv.plan}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-sidebar">
                          {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(inv.amount.amount / 100)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {inv.status === 'paid' ? (
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : inv.status === 'failed' ? (
                              <XCircle size={14} className="text-red-500" />
                            ) : (
                                <Clock size={14} className="text-amber-500" />
                            )}
                            <span className={`text-[10px] font-bold uppercase ${
                              inv.status === 'paid' ? 'text-emerald-700' : inv.status === 'failed' ? 'text-red-700' : 'text-amber-700'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-mono text-muted">
                          #INV-{inv._id.substring(org._id.length - 6).toUpperCase()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="mt-12 group">
        <div className="bg-white border-2 border-l-8 border-red-500 rounded-2xl p-8 shadow-sm group-hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert size={20} />
                <h3 className="font-bold uppercase tracking-widest text-[11px]">Danger Zone</h3>
              </div>
              <p className="text-sidebar font-bold text-lg">Suspend this organization</p>
              <p className="text-sm text-muted max-w-md">
                Suspending an organization immediately revokes access for all users. The subscription status will be set to suspended.
              </p>
            </div>
            <button 
              onClick={() => setShowSuspendModal(true)}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Suspend Now
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-sidebar/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-red-100 slide-in-from-bottom-4 animate-in duration-300">
            <div className="p-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-sidebar mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-muted mb-8 leading-relaxed">
                This action will disable <span className="font-bold text-sidebar">{org.name}</span> instantly.
                Please type the organization name below to confirm.
              </p>

              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder={org.name}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-border-light rounded-xl font-bold text-sidebar outline-none focus:border-red-500 transition-colors"
                />
                
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleSuspend}
                    disabled={confirmName !== org.name || isSuspending}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-100"
                  >
                    {isSuspending ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Confirm Suspension"}
                  </button>
                  <button 
                    onClick={() => { setShowSuspendModal(false); setConfirmName(''); }}
                    className="w-full py-4 text-muted font-bold text-sm hover:text-sidebar transition-colors"
                  >
                    Cancel and keep active
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, subValue }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm flex items-start gap-4">
      <div className="p-2.5 bg-brand/5 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-muted mb-1 tracking-wider">{label}</p>
        <p className="font-bold text-sidebar leading-tight mb-0.5">{value}</p>
        <p className="text-[10px] text-muted truncate max-w-[140px]">{subValue}</p>
      </div>
    </div>
  );
}

function ClockCard({ label, date }: { label: string, date: string }) {
  const getRelativeTime = (d: string) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = new Date(d).getTime() - new Date().getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (Math.abs(days) < 1) return 'Today';
    return rtf.format(days, 'day');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-border-light shadow-sm flex items-start gap-4">
      <div className="p-2.5 bg-brand/5 rounded-xl">
        <Clock className="text-brand" size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-muted mb-1 tracking-wider">{label}</p>
        <p className="font-bold text-sidebar leading-tight mb-0.5">{getRelativeTime(date)}</p>
        <p className="text-[10px] text-muted">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}
