'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  GitBranch,
  Users,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Phone,
  ChevronRight,
  Building2,
  RefreshCw,
} from 'lucide-react';

// ─────────────────────────── TYPES ─────────────────────────────────────────────
interface Money {
  amount: number;
  currency: string;
}

interface BranchSummary {
  branchId: string;
  name: string;
  slug: string;
  isHeadquarters: boolean;
  isActive: boolean;
  operatingMode: 'day_based' | 'shift_based';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  phone?: string;
  settings?: { taxRate?: number };
  revenue: Money;
  orders: number;
}

interface DashboardStats {
  totalBranches: number;
  activeBranches: number;
  totalStaff: number;
  totalRevenueToday: Money;
  totalOrdersToday: number;
  branchSummaries: BranchSummary[];
}

// ─────────────────────────── HELPERS ───────────────────────────────────────────
function formatNaira(amount: number) {
  if (amount === 0) return '₦0';
  return '₦' + new Intl.NumberFormat('en-NG').format(amount);
}

// ─────────────────────────── KPI CARD ──────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent ? `${accent}18` : '#F5ECD9' }}
      >
        <Icon size={20} style={{ color: accent || '#C97B2A' }} />
      </div>
      <div>
        <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-[#6B7280] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────── BRANCH CARD ───────────────────────────────────────
function BranchCard({ branch }: { branch: BranchSummary }) {
  const addressLine = [branch.address?.street, branch.address?.city]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {branch.isHeadquarters && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: '#F5ECD9', color: '#C97B2A' }}
              >
                HQ
              </span>
            )}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{
                background: branch.operatingMode === 'shift_based' ? '#EEF2FF' : '#F0FDF4',
                color: branch.operatingMode === 'shift_based' ? '#4F46E5' : '#15803D',
              }}
            >
              {branch.operatingMode === 'shift_based' ? 'Shift-Based' : 'Day-Based'}
            </span>
          </div>

          {/* Branch name in DM Serif Display 18px */}
          <h3
            className="text-[18px] leading-snug text-gray-900 truncate"
            style={{ fontFamily: 'var(--font-display, serif)', fontWeight: 400 }}
          >
            {branch.name}
          </h3>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: branch.isActive ? '#10B981' : '#9CA3AF' }}
          />
          <span className="text-xs font-medium" style={{ color: branch.isActive ? '#10B981' : '#9CA3AF' }}>
            {branch.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Address */}
      {addressLine && (
        <div className="flex items-start gap-2 text-[#6B7280] text-[13px]">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>{addressLine}</span>
        </div>
      )}
      {branch.phone && (
        <div className="flex items-center gap-2 text-[#6B7280] text-[13px] -mt-2">
          <Phone size={13} className="shrink-0" />
          <span>{branch.phone}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#F3F4F6]">
        <div className="text-center">
          <p className="text-xs text-[#6B7280] mb-0.5">Revenue Today</p>
          <p className="text-sm font-semibold text-gray-900">{formatNaira(branch.revenue.amount)}</p>
        </div>
        <div className="text-center border-x border-[#F3F4F6]">
          <p className="text-xs text-[#6B7280] mb-0.5">Orders Today</p>
          <p className="text-sm font-semibold text-gray-900">{branch.orders} orders</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#6B7280] mb-0.5">Staff</p>
          <p className="text-sm font-semibold text-gray-900">— </p>
        </div>
      </div>

      {/* Manage link */}
      <Link
        href={`/owner/branches/${branch.branchId}`}
        className="flex items-center justify-between group mt-auto pt-3 border-t border-[#F3F4F6]"
      >
        <span
          className="text-sm font-semibold group-hover:underline transition-all"
          style={{ color: '#C97B2A' }}
        >
          Manage Branch
        </span>
        <ChevronRight
          size={16}
          style={{ color: '#C97B2A' }}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </Link>
    </div>
  );
}

// ─────────────────────────── SKELETON ──────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
  );
}

// ─────────────────────────── PAGE ──────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const { organization, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DashboardStats>('/api/owner/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const orgName = organization?.name || user?.firstName ? `${user?.firstName}'s Organisation` : 'Your Organisation';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate max-w-[calc(100vw-40px)] sm:max-w-none">{orgName}</h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-xl hover:border-[#C97B2A] hover:text-[#C97B2A] transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm flex items-center gap-3">
          <span className="font-semibold">Error:</span> {error}
          <button onClick={fetchStats} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* ── KPI ROW (4 cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))
        ) : (
          <>
            <KpiCard
              icon={Building2}
              label="Total Branches"
              value={stats?.totalBranches ?? 0}
              sub={`${stats?.activeBranches ?? 0} active`}
            />
            <KpiCard
              icon={Users}
              label="Total Staff"
              value={stats?.totalStaff ?? 0}
              sub="All branches"
              accent="#6366F1"
            />
            <KpiCard
              icon={TrendingUp}
              label="Revenue Today"
              value={formatNaira(stats?.totalRevenueToday.amount ?? 0)}
              sub="Across all branches"
              accent="#F59E0B"
            />
            <KpiCard
              icon={ShoppingBag}
              label="Orders Today"
              value={stats?.totalOrdersToday ?? 0}
              sub="All branches combined"
              accent="#10B981"
            />
          </>
        )}
      </div>

      {/* ── BRANCHES SECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Branches</h2>
            <p className="text-[#6B7280] text-sm mt-0.5">
              Click into a branch to view schedules, staff, and performance
            </p>
          </div>
          <Link
            href="/owner/branches"
            className="text-sm font-semibold flex items-center gap-1 hover:underline"
            style={{ color: '#C97B2A' }}
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px]" />
            ))}
          </div>
        ) : stats?.branchSummaries.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <GitBranch size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No branches yet</p>
            <p className="text-sm mt-1">Add your first branch to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stats?.branchSummaries.map((branch) => (
              <BranchCard key={branch.branchId} branch={branch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
