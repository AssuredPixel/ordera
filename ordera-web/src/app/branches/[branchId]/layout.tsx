'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ManagerSidebar } from '@/components/branch/ManagerSidebar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Menu, X, User } from 'lucide-react';
import { WaiterNav } from '@/components/branch/WaiterNav';
import { NotificationSystem } from '@/components/branch/NotificationSystem';

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const branchId = params.branchId as string;

  // 1. RBAC Guard
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const userRole = (user?.role || '').toUpperCase();

    // Allowed roles for branch-level access
    const allowedRoles = ['BRANCH_MANAGER', 'OWNER', 'WAITER', 'KITCHEN_STAFF', 'CASHIER'];

    if (!allowedRoles.includes(userRole)) {
      router.replace('/owner/dashboard');
      return;
    }

    // Branch matching check
    if (userRole !== 'OWNER' && user?.branchId !== branchId) {
      const targetPath = userRole === 'WAITER' ? 'waiter' : userRole === 'KITCHEN_STAFF' ? 'kitchen' : userRole === 'CASHIER' ? 'cashier' : 'dashboard';
      router.replace(`/branches/${user?.branchId}/${targetPath}`);
      return;
    }

    // Redirect staff away from manager dashboard
    if (window.location.pathname.endsWith('/dashboard')) {
      if (userRole === 'WAITER') router.replace(`/branches/${branchId}/waiter`);
      if (userRole === 'KITCHEN_STAFF') router.replace(`/branches/${branchId}/kitchen`);
      if (userRole === 'CASHIER') router.replace(`/branches/${branchId}/cashier`);
    }
  }, [user, branchId, isAuthenticated, router]);

  // 2. Fetch Branch Info
  const { data: branch } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const data = await api.get<any>(`/api/branches/${branchId}`);
      return data;
    },
    enabled: !!branchId && isAuthenticated,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hydration safeguard: return a consistent loading state on server and first client render
  if (!mounted) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center animate-pulse" />;
  }

  if (!isAuthenticated) return null;

  const userRole = user?.role?.toUpperCase();
  const isWaiter = userRole === 'WAITER';
  const isKitchen = userRole === 'KITCHEN_STAFF';
  const isCashier = userRole === 'CASHIER';

  // KITCHEN & CASHIER FULL-SCREEN LAYOUT
  if (isKitchen || isCashier) {
    return (
      <div className={`min-h-screen ${isKitchen ? 'bg-[#111111]' : 'bg-[#F8F9FA]'}`}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {isWaiter ? (
        <WaiterNav />
      ) : (
        <ManagerSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          branchName={branch?.name}
        />
      )}

      <div className={`${isWaiter ? 'lg:ml-[240px]' : 'lg:ml-[240px]'} flex flex-col min-h-screen`}>
        {/* MOBILE HEADER */}
        {!isWaiter && (
          <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl text-muted">{branch?.name || 'Ordera'}</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-gray-50 text-muted hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          </header>
        )}

        {/* WAITER MOBILE HEADER */}
        {isWaiter && (
          <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
            <h1 className="font-display text-xl text-[#1A1A2E]">{branch?.name || 'Ordera'}</h1>
            <div className="flex items-center gap-4">
              <NotificationSystem />
              <div className="w-8 h-8 rounded-lg bg-[#C97B2A]/10 flex items-center justify-center text-[#C97B2A]">
                <User size={16} />
              </div>
            </div>
          </header>
        )}

        {/* WAITER DESKTOP HEADER */}
        {isWaiter && (
          <header className="hidden lg:flex h-20 bg-transparent items-center justify-end px-10 pt-6 sticky top-0 z-40 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <NotificationSystem />
            </div>
          </header>
        )}

        {/* PAGE CONTENT */}
        <main className={`flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full ${isWaiter ? 'pb-24 lg:pb-10' : ''}`}>
          {children}
        </main>
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
