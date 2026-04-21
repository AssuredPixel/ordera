'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const data = await api.get<any>('/api/platform/public/announcement');
        if (data?.isActive && data?.text) {
          const dismissedVersion = localStorage.getItem('ordera_announcement_dismissed');
          if (dismissedVersion !== data.version?.toString()) {
            setAnnouncement(data);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to load announcement');
      }
    }
    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('ordera_announcement_dismissed', announcement.version.toString());
      setIsVisible(false);
    }
  };

  if (!isVisible || !announcement) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-2.5 flex sm:flex-row flex-col items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-top duration-500 shadow-lg relative z-50">
      <div className="flex items-center gap-3 max-w-4xl mx-auto w-full sm:w-auto">
        <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
          <Megaphone size={16} />
        </div>
        <p className="text-xs sm:text-sm font-bold leading-tight line-clamp-2 sm:line-clamp-none">
          {announcement.text}
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 hover:bg-white/20 rounded-md transition-all shrink-0"
      >
        <X size={18} />
      </button>
    </div>
  );
}
