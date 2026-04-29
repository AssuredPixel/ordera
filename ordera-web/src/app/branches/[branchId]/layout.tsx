'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ManagerSidebar } from '@/components/branch/ManagerSidebar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Menu, X } from 'lucide-react';

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

    // Check if user is a branch manager and belongs to this branch
    if (userRole !== 'BRANCH_MANAGER' && userRole !== 'OWNER') {
      router.replace('/owner/dashboard');
      return;
    }

    if (userRole === 'BRANCH_MANAGER' && user?.branchId !== branchId) {
      router.replace(`/branches/${user.branchId}/dashboard`);
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
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <ManagerSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        branchName={branch?.name}
      />

      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        {/* MOBILE HEADER */}
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

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
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
