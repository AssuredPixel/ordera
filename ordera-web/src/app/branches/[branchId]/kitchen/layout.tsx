'use client';

import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ChefHat, Package, MessageSquare, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const { branchId } = useParams();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const isMessages = pathname?.includes('/messages');

  const navItems = [
    { href: `/branches/${branchId}/kitchen`, icon: ChefHat, label: 'Orders' },
    { href: `/branches/${branchId}/kitchen/messages`, icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#0D0D1A', fontFamily: 'Inter, sans-serif' }}>

      {/* ── DESKTOP LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-white/5" style={{ background: '#1A1A2E' }}>
        {/* Brand */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C97B2A] flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Kitchen</span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#C97B2A]">KDS — Display System</span>
          </div>
        </div>

        {/* Live badge */}
        <div className="mx-4 mb-6 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">Live Feed</span>
        </div>

        {/* Nav */}
        <div className="px-4 space-y-1 flex-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== `/branches/${branchId}/kitchen` && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-[#C97B2A] text-white' : 'text-white/55 hover:text-white hover:bg-white/6'
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User card */}
        <div className="px-4 pb-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-[#C97B2A]/20">
              <span className="text-[#C97B2A]">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'K'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.name || 'Kitchen Staff'}</p>
              <p className="text-white/35 text-[10px] uppercase tracking-widest">Kitchen</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/45 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <p className="text-center text-white/15 text-[10px] pt-3 tracking-widest uppercase">
            Powered by Ordera
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden shrink-0 border-b border-white/5" style={{ background: '#1A1A2E' }}>
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C97B2A] flex items-center justify-center shadow-lg shadow-[#C97B2A]/20">
                <ChefHat size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block leading-none">Kitchen KDS</span>
                <span className="text-[10px] text-[#C97B2A] font-bold uppercase tracking-wider">Ordera Platform</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Live</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden shrink-0 h-16 border-t border-white/5 flex items-center justify-around px-2" style={{ background: '#1A1A2E' }}>
          <Link href={`/branches/${branchId}/kitchen`} className={`flex flex-col items-center gap-1 px-3 ${!pathname?.includes('/messages') ? 'text-[#C97B2A]' : 'text-gray-500'}`}>
            <ChefHat size={20} />
            <span className="text-[10px] font-bold">Orders</span>
          </Link>
          <Link 
            href={`/branches/${branchId}/kitchen?stock=open`}
            className="flex flex-col items-center gap-1 text-gray-500 px-3"
          >
            <Package size={20} />
            <span className="text-[10px] font-bold">Stock</span>
          </Link>
          <Link href={`/branches/${branchId}/kitchen/messages`} className={`flex flex-col items-center gap-1 px-3 ${pathname?.includes('/messages') ? 'text-[#C97B2A]' : 'text-gray-500'}`}>
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Chat</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
