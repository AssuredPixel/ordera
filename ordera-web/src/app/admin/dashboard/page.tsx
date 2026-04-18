'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  ChevronRight,
  Download,
  Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PlatformStats {
  activeSubscriptions: number;
  mrr: { amount: number; currency: string };
  pastDueCount: number;
  newThisMonth: number;
  trends: {
    active: number;
    mrr: number;
    pastDue: number;
    newOrgs: number;
  };
}

interface Organization {
  _id: string;
  name: string;
  slug: string;
  country: string;
  createdAt: string;
  ownerUserId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subscriptionId?: {
    plan: string;
    status: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, orgsData] = await Promise.all([
          api.get<PlatformStats>('/api/platform/stats'),
          api.get<{ data: Organization[] }>('/api/organizations'),
        ]);
        setStats(statsData);
        setOrganizations(orgsData.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-10 space-y-8 animate-pulse text-sidebar-light">
        <div className="h-10 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const pastDueOrgs = organizations.filter(org => org.subscriptionId?.status === 'PAST_DUE' || org.subscriptionId?.status === 'past_due');

  return (
    <div className="p-10">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="font-display text-[28px] text-sidebar">Platform Dashboard</h1>
          <p className="text-muted text-sm mt-1">Ordera SaaS — Live overview</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg text-sm font-medium text-sidebar hover:bg-white transition-all shadow-sm">
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Active Subscriptions" 
          value={stats?.activeSubscriptions || 0} 
          trend={stats?.trends.active || 0}
          icon={<CreditCard className="text-brand" size={20} />}
        />
        <StatCard 
          title="Monthly Revenue (MRR)" 
          value={formatCurrency(stats?.mrr.amount || 0)} 
          trend={stats?.trends.mrr || 0}
          icon={<TrendingUp className="text-brand" size={20} />}
          isCurrency
        />
        <StatCard 
          title="Past Due" 
          value={stats?.pastDueCount || 0} 
          trend={stats?.trends.pastDue || 0}
          icon={<AlertCircle className="text-red-500" size={20} />}
          isAlert
        />
        <StatCard 
          title="New This Month" 
          value={stats?.newThisMonth || 0} 
          trend={stats?.trends.newOrgs || 0}
          icon={<Building2 className="text-brand" size={20} />}
        />
      </div>

      {/* RECENT ORGANIZATIONS TABLE */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm mb-10 overflow-hidden">
        <div className="p-6 border-b border-border-light flex justify-between items-center bg-gray-50/50">
          <h2 className="font-display text-xl text-sidebar">Recent Organizations</h2>
          <Link href="/admin/organizations" className="text-brand text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Owner</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Plan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Country</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted">Joined</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {organizations.slice(0, 10).map((org) => {
                const status = org.subscriptionId?.status?.toUpperCase() || 'TRIAL';
                const isPastDue = status === 'PAST_DUE';
                
                return (
                  <tr 
                    key={org._id} 
                    className={`hover:bg-gray-50/50 transition-colors ${isPastDue ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sidebar">{org.name}</div>
                      <div className="text-xs text-muted">{org.slug}.ordera.app</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm">
                      {org.ownerUserId?.firstName} {org.ownerUserId?.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-brand/10 text-brand text-[10px] font-bold uppercase">
                        {org.subscriptionId?.plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{org.country}</td>
                    <td className="px-6 py-4 text-xs text-muted">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/organizations/${org._id}`}
                        className="text-brand font-bold text-xs hover:underline flex items-center justify-end gap-1"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT FAILURES BLOCK */}
      {pastDueOrgs.length > 0 && (
        <div className="bg-red-50/50 border border-red-100 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="font-display text-xl text-red-900">Payment Failures — Action Required</h2>
          </div>
          <div className="divide-y divide-red-100">
            {pastDueOrgs.map((org) => (
              <div key={org._id} className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-red-900">{org.name}</h3>
                  <p className="text-sm text-red-700">
                    Plan: <span className="font-bold uppercase">{org.subscriptionId?.plan}</span> • 
                    Status: <span className="font-bold">PAST DUE</span>
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right mr-4">
                    <p className="text-xs text-red-600 font-medium">Days Overdue</p>
                    <p className="font-display text-lg text-red-900">4 days</p>
                  </div>
                  <button 
                    onClick={() => toast.success(`Reminder sent to ${org.ownerUserId?.email}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    <Mail size={16} />
                    Contact Owner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon, isCurrency = false, isAlert = false }: any) {
  const isPositive = trend > 0;
  
  return (
    <div className="bg-white p-6 rounded-xl border border-border-light border-l-4 border-l-brand shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">{title}</p>
        <div className="bg-brand/5 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col">
        <h3 className={`font-display text-[32px] leading-none mb-2 ${isAlert ? 'text-red-900' : 'text-sidebar'}`}>
          {value}
        </h3>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? '+' : ''}{trend}%
          </div>
          <span className="text-[10px] text-muted font-medium">vs last month</span>
        </div>
      </div>
      
      {isAlert && (
          <p className="text-[10px] font-bold text-red-600 mt-2 uppercase tracking-wider">Needs attention</p>
      )}
    </div>
  );
}
