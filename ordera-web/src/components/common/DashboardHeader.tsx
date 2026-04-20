'use client';

import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-border-light bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-surface rounded-lg transition text-sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold text-sidebar md:text-xl truncate max-w-[200px] md:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center relative">
          <Search className="absolute left-3 text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-surface border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 w-40 md:w-64"
          />
        </div>
        
        <button className="p-2 text-muted hover:text-sidebar hover:bg-surface rounded-lg transition relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-[1px] bg-border-light mx-1 hidden xs:block" />

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden xs:block text-right">
            <p className="text-xs font-bold text-sidebar line-clamp-1">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xs font-bold">
            {user?.firstName?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
