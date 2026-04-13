"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  UtensilsCrossed,
  MessageSquare,
  Receipt,
  Settings,
  Bell,
  LifeBuoy,
  Sparkles,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Food & Drinks", href: "/food-drinks", icon: UtensilsCrossed },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Bills", href: "/bills", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
];

const otherItems = [
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Support", href: "/support", icon: LifeBuoy },
  { name: "AI Assistant", href: "/ai", icon: Sparkles },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const token = Cookies.get("ordera_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);
  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar: 200px Fixed */}
      <aside className="w-[200px] flex-shrink-0 bg-sidebar text-white flex flex-col">
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo-dark.svg"
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-display text-brand">Ordera</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 space-y-8 mt-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${isActive
                    ? "bg-brand/10 text-brand border-l-3 border-brand rounded-l-none"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/5">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              Utilities
            </p>
            <nav className="space-y-1">
              {otherItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name || "Employee"}</p>
              <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role?.toLowerCase() || "Role"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all uppercase tracking-tighter"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div className="text-sm font-medium text-gray-500">
            {user?.branchId ? "Main Branch" : "Loading..."}
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600"><Bell size={20} /></button>
          </div>
        </header>
        <section className="flex-1 overflow-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
}
