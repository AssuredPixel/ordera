'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Banknote, 
  MessageSquare, 
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  badge?: number;
  active?: boolean;
}

function NavItem({ href, icon: Icon, label, badge, active }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 p-2 lg:p-3 rounded-2xl transition-all ${
        active 
          ? 'text-[#C97B2A] lg:bg-[#C97B2A]/10' 
          : 'text-gray-400 lg:hover:bg-gray-50 lg:hover:text-muted'
      }`}
    >
      <div className="relative">
        <Icon size={22} className={active ? 'fill-[#C97B2A]/20' : ''} />
        {badge ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white lg:border-none">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] lg:text-sm font-bold uppercase lg:capitalize tracking-wider lg:tracking-normal">
        {label}
      </span>
    </Link>
  );
}

export function WaiterNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname();
  const params = useParams();
  const { logout, user } = useAuthStore();
  const branchId = params.branchId;

  const navItems = [
    { href: `/branches/${branchId}/waiter`, icon: ShoppingBag, label: 'Orders' },
    { href: `/branches/${branchId}/waiter/menu`, icon: UtensilsCrossed, label: 'Menu' },
    { href: `/branches/${branchId}/waiter/bills`, icon: Banknote, label: 'Bills' },
    { href: `/branches/${branchId}/waiter/messages`, icon: MessageSquare, label: 'Chat' },
    { href: `/branches/${branchId}/waiter/notifications`, icon: Bell, label: 'Alerts', badge: unreadNotifications },
  ];

  const isActive = (href: string) => {
    if (href.endsWith('/waiter')) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0,03)]">
        {navItems.map((item) => (
          <NavItem 
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* DESKTOP SIDEBAR (SLIM) */}
      <nav 
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col z-50 transition-transform duration-300"
        style={{ background: '#1A1A2E' }}
      >
        <div className="px-6 pt-8 pb-6 flex flex-col mb-4">
          <h1 className="font-display text-2xl text-white truncate leading-tight">Ordera</h1>
          <div className="mt-1 flex items-center">
            <span className="px-2 py-0.5 rounded-full bg-[#C97B2A]/20 text-[#C97B2A] text-[10px] font-bold uppercase tracking-wider">
              Waiter
            </span>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isAct = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                  ${isAct
                    ? 'bg-[#C97B2A] text-white shadow-lg'
                    : 'text-white/55 hover:text-white hover:bg-white/6'}
                `}
              >
                <div className="relative shrink-0">
                  <Icon size={17} />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span>{item.label}</span>
                {isAct && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            )
          })}
        </div>

        <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: '#C97B2A22' }}
            >
              <span style={{ color: '#C97B2A' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate leading-tight">
                {user?.name || 'Waiter'}
              </p>
              <p className="text-white/35 text-[10px] truncate uppercase tracking-widest">On Shift</p>
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
      </nav>
    </>
  );
}
