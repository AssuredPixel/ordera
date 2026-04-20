'use client';

import { useState } from 'react';
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner';
import { TrialBanner } from '@/components/common/TrialBanner';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { DashboardHeader } from '@/components/common/DashboardHeader';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative">
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
        
        <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
          <DashboardHeader 
            title="Business Owner" 
            onMenuClick={() => setIsSidebarOpen(true)} 
          />
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
