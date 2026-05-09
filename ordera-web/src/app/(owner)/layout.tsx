'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner';
import { TrialBanner } from '@/components/common/TrialBanner';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { DashboardHeader } from '@/components/common/DashboardHeader';
import { IntelligencePanel } from '@/components/ai/IntelligencePanel';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show nothing while auth is being determined
  if (isLoading || !user || user.role !== 'owner' || !mounted) {
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
          onAiToggle={() => setIsAiOpen(true)}
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

      <IntelligencePanel isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      
      {isAiOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsAiOpen(false)}
        />
      )}
    </div>
  );
}
