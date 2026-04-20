'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitBranch, 
  Menu as MenuIcon, 
  Settings, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface OwnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/owner/dashboard' },
  { icon: GitBranch, label: 'Branches', href: '/owner/branches' },
  { icon: MenuIcon, label: 'Menu Builder', href: '/owner/menu' },
  { icon: Settings, label: 'Settings', href: '/owner/settings' },
];

export function OwnerSidebar({ isOpen, onClose }: OwnerSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className={`
      w-[260px] h-screen bg-sidebar text-white flex flex-col fixed left-0 top-0 overflow-hidden z-50 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 flex items-center justify-between">
        <div className="font-display text-2xl tracking-tight">Dashboard</div>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/60 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
