'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner';
import { TrialBanner } from '@/components/common/TrialBanner';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { DashboardHeader } from '@/components/common/DashboardHeader';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }
      if (user.role !== 'owner') {
        // Redirect non-owners to their appropriate area
        if (user.role === 'super_admin') router.replace('/admin/dashboard');
        else router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // Show nothing while auth is being determined
  if (isLoading || !user || user.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A2E' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C97B2A] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative max-w-full overflow-x-hidden">
      <AnnouncementBanner />
      <TrialBanner />

      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 bg-surface relative">
        <OwnerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* 240px sidebar width */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px]">
          <DashboardHeader
            title="Owner Dashboard"
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
