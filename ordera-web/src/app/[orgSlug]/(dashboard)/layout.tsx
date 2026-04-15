"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  MessageSquare,
  Receipt,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Menu", href: "/food-drinks", icon: UtensilsCrossed },
  { name: "Orders", href: "/orders", icon: ChevronRight },
  { name: "Bills", href: "/bills", icon: Receipt },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { orgSlug } = useParams();
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check session data if store is empty but we have a cookie
    if (!user) {
      api.get("/auth/me")
        .then((data: any) => {
          // Update store with fetched user
          useAuthStore.setState({ user: data, isAuthenticated: true });
        })
        .catch(() => {
          // If fetch fails, force logout
          logout();
        });
    }
  }, [user, logout]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-navy text-white flex flex-col shrink-0">
        {/* Branding */}
        <div className="p-8">
          <Link href={`/${orgSlug}/dashboard`} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-display text-white italic">O</div>
            <span className="text-xl font-display tracking-tight">Ordera</span>
          </Link>
          <div className="mt-4 px-2 py-1 bg-white/5 rounded-md border border-white/5 inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 capitalize">{orgSlug}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const fullHref = `/${orgSlug}${item.href}`;
            const isActive = pathname === fullHref || (item.href !== "/dashboard" && pathname.startsWith(fullHref));
            
            return (
              <Link
                key={item.href}
                href={fullHref}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name || "Loading..."}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full mt-4 px-4 py-3 text-sm text-gray-400 hover:text-danger hover:bg-danger/5 rounded-xl transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest text-[10px]">Current Location</h2>
            <p className="font-display text-navy text-xl">Main Branch</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-10 h-10 flex items-center justify-center bg-surface hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-navy">
              <Bell size={20} />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-gray-100" />
            <div className="flex items-center gap-3">
               <div className="text-right">
                  <p className="text-xs font-bold text-navy truncate">{user?.salesId}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Shift Active</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-surface border border-gray-100 flex items-center justify-center font-bold text-navy">
                 {user?.firstName?.[0]}{user?.lastName?.[0]}
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
