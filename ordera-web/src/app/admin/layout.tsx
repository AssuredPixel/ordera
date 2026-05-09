'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/common/DashboardHeader';
import { IntelligencePanel } from '@/components/ai/IntelligencePanel';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      loadUser();
    }
  }, []);

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

  useEffect(() => {
    // SECURITY CHECK: Log current state for debugging (remove in production)
    console.log('[AdminGuard]', { isAuthenticated, userRole: user?.role, isLoading });

    if (!isLoading) {
      const userRole = user?.role?.toLowerCase();
      
      if (!isAuthenticated || userRole !== 'super_admin') {
        console.warn('[AdminGuard] Unauthorized access attempt, redirecting to login');
        const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.replace(`/login?callbackUrl=${callbackUrl}`);
      } else {
        console.log('[AdminGuard] Access granted for Super Admin');
        setIsAuthorized(true);
      }
    }
  }, [user, isAuthenticated, isLoading, router]);


  if (isLoading || !isAuthorized || !mounted) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1A1A2E] text-white">
        <Loader2 className="animate-spin text-brand mb-4" size={40} />
        <p className="text-sm font-medium animate-pulse uppercase tracking-widest text-brand">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen relative">
      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAiToggle={() => setIsAiOpen(true)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        <DashboardHeader 
          title="Super Admin" 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        <main className="p-4 md:p-8">
          {children}
        </main>
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
