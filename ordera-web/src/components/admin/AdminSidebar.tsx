'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Zap,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Building2, label: 'Organizations', href: '/admin/organizations' },
  { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' },
  { icon: Zap, label: 'AI Usage', href: '/admin/ai-usage' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-[240px] h-screen bg-[#1A1A2E] flex flex-col fixed left-0 top-0 overflow-hidden border-r border-white/5">
      {/* LOGO */}
      <div className="p-6 mb-4">
        <Image
          src="/logo/logo-light.svg"
          alt="Ordera"
          width={100}
          height={30}
          priority
          className="h-8 w-auto"
        />
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                h-12 flex items-center px-4 gap-3 rounded-lg transition-all group
                ${isActive
                  ? 'bg-brand/10 border-l-4 border-brand text-brand'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}
              `}
            >
              <item.icon size={20} className={isActive ? 'text-brand' : 'group-hover:text-white'} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ADMIN USER CARD */}
      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-bold">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand text-sidebar mt-1">
              Super Admin
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
