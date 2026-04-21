'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface OwnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',     href: '/owner/dashboard' },
  { icon: GitBranch,       label: 'Branches',     href: '/owner/branches' },
  { icon: Users,           label: 'Staff',        href: '/owner/staff' },
  { icon: CreditCard,      label: 'Subscription', href: '/owner/subscription' },
  { icon: Settings,        label: 'Settings',     href: '/owner/settings' },
];

export function OwnerSidebar({ isOpen, onClose }: OwnerSidebarProps) {
  const pathname = usePathname();
  const { logout, user, organization } = useAuthStore();

  // Org initials avatar
  const orgName: string = organization?.name || user?.firstName || 'Org';
  const initials = orgName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      style={{ background: '#1A1A2E', width: 240 }}
      className={`
        h-screen text-white flex flex-col fixed left-0 top-0 overflow-hidden z-50
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* ── ORG IDENTITY ── */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {organization?.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={orgName}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: '#C97B2A', color: '#fff' }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">{orgName}</p>
            <p className="text-white/40 text-xs mt-0.5 truncate">{user?.email}</p>
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

      {/* ── BOTTOM: user card + branding ── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-1">
        {/* Owner user card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
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
            <p className="text-white/35 text-[10px] truncate">Owner</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/45 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>

        {/* Branding */}
        <p className="text-center text-white/20 text-[10px] pt-1 tracking-widest uppercase">
          Powered by Ordera
        </p>
      </div>
    </aside>
  );
}
