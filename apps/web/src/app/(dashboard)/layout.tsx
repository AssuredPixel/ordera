'use client';

import { useAuth } from '@/hooks/useAuth';
import { 
  LogOut, 
  LayoutDashboard, 
  UtensilsCrossed, 
  ClipboardList, 
  Users, 
  MessageSquare, 
  Settings,
  ChevronRight,
  Bell
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#C97B2A]/20 border-t-[#C97B2A] animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Loading Ordera...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard', active: pathname === '/dashboard' },
    { icon: UtensilsCrossed, label: 'Menu Editor', href: '/dashboard/menu', active: pathname === '/dashboard/menu' },
    { icon: ClipboardList, label: 'Order List', href: '/dashboard/orders', active: pathname === '/dashboard/orders' },
    { icon: Users, label: 'Team Directory', href: '/dashboard/team', active: pathname === '/dashboard/team' },
    { icon: MessageSquare, label: 'Internal Comms', href: '/dashboard/messages', active: pathname === '/dashboard/messages' },
    { icon: Settings, label: 'System Settings', href: '/dashboard/settings', active: pathname === '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#FDFCFB]">
      {/* SIDE NAVIGATION */}
      <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col shadow-2xl z-30 flex-shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="relative w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 group cursor-pointer transition-all hover:border-[#C97B2A]/50">
            <span className="font-serif text-3xl font-bold text-white leading-none group-hover:text-[#C97B2A] transition-colors">O</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C97B2A] rounded-full shadow-[0_0_12px_#C97B2A]"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-white tracking-tight leading-none">Ordera</span>
            <span className="text-[10px] text-gray-400 tracking-[0.2em] font-bold mt-1 uppercase">v1.0 PREMIUM</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 mb-4">Core Essentials</p>
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                item.active 
                  ? 'bg-gradient-to-r from-[#C97B2A] to-[#E5984A] text-white shadow-lg shadow-[#C97B2A]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-gray-500 group-hover:text-white'} transition-colors`} />
                {item.label}
              </div>
              {item.active && <ChevronRight className="w-4 h-4 opacity-50" />}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/10">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
          >
            <LogOut className="w-5 h-5" />
            End Shift
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR / USER BAR */}
        <header className="h-16 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-10 z-20 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1A1A2E] leading-none">{user.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] border-2 border-white shadow-sm flex items-center justify-center text-white text-lg font-serif">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE SURFACE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}
