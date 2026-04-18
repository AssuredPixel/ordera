'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

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


  if (isLoading || !isAuthorized) {
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
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-[240px]">
        {children}
      </main>
    </div>
  );
}
