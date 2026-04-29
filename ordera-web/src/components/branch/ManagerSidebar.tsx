'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Calculator,
  MessageSquare,
  BarChart3,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface ManagerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  branchName?: string;
}

export function ManagerSidebar({ isOpen, onClose, branchName }: ManagerSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { logout, user } = useAuthStore();
  const branchId = params.branchId as string;

  const navItems = [
    { icon: LayoutDashboard,  label: 'Dashboard',      href: `/branches/${branchId}/dashboard` },
    { icon: ShoppingBag,      label: 'Orders',         href: `/branches/${branchId}/orders` },
    { icon: Users,            label: 'Staff',          href: `/branches/${branchId}/staff` },
    { icon: UtensilsCrossed,  label: 'Menu & Stock',   href: `/branches/${branchId}/menu` },
    { icon: Calculator,       label: 'Reconciliation', href: `/branches/${branchId}/reconciliation` },
    { icon: MessageSquare,    label: 'Messages',       href: `/branches/${branchId}/messages` },
    { icon: BarChart3,        label: 'Reports',        href: `/branches/${branchId}/reports` },
  ];

  return (
    <aside
      style={{ background: '#1A1A2E', width: 240 }}
      className={`
        h-screen text-white flex flex-col fixed left-0 top-0 overflow-hidden z-50
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* ── BRANCH IDENTITY ── */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg truncate leading-tight">
              {branchName || 'My Branch'}
            </h2>
          </div>
          <div className="mt-1 flex items-center">
            <span className="px-2 py-0.5 rounded-full bg-[#C97B2A]/20 text-[#C97B2A] text-[10px] font-bold uppercase tracking-wider">
              Manager
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── NAV ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                ${isActive
                  ? 'bg-[#C97B2A] text-white shadow-lg'
                  : 'text-white/55 hover:text-white hover:bg-white/6'}
              `}
            >
              <item.icon size={17} className="shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── BOTTOM: user card ── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: '#C97B2A22' }}
          >
            <span style={{ color: '#C97B2A' }}>
              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-white/35 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/45 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>

        <p className="text-center text-white/20 text-[10px] pt-1 tracking-widest uppercase">
          Powered by Ordera
        </p>
      </div>
    </aside>
  );
}
