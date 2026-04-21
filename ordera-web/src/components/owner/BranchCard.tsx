'use client';

import { MapPin, Phone, Settings, UserPlus, Power, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BranchCardProps {
  branch: any;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function BranchCard({ branch, onToggleStatus }: BranchCardProps) {
  const isShiftBased = branch.operatingMode === 'SHIFT_BASED';

  return (
    <div className={`bg-white rounded-2xl border ${branch.isActive ? 'border-gray-100' : 'border-red-100 opacity-80'} shadow-sm hover:shadow-md transition-all overflow-hidden group`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">{branch.name}</h3>
              {branch.isHeadquarters && (
                <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase tracking-wider">HQ</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{branch.address.city}, {branch.address.state}</span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${branch.isActive ? 'bg-success/10 text-success' : 'bg-red-50 text-red-500'}`}>
            {branch.isActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Operating Mode</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isShiftBased ? 'bg-blue-400' : 'bg-amber-400'}`} />
              <p className="text-sm font-bold text-gray-700">{isShiftBased ? 'Shift-Based' : 'Day-Based'}</p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Reconciliation</p>
            <p className="text-sm font-bold text-gray-700">{branch.reconciliationMode === 'per_shift' ? 'Per Shift' : 'Per Day'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 py-3 border-y border-gray-50 mb-6">
          <div className="flex items-center gap-1.5">
             <Phone size={14} className="text-gray-400" />
             <span className="text-xs text-gray-600 font-medium">{branch.phone || 'No phone'}</span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1.5">
             <span className="text-xs text-gray-600 font-medium">{branch.settings?.taxRate}% Tax</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link 
              href={`/owner/branches/${branch._id}`}
              className="p-2 bg-gray-50 text-gray-600 hover:bg-brand/10 hover:text-brand rounded-lg transition"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            <Link 
              href={`/owner/branches/${branch._id}?tab=staff`}
              className="p-2 bg-gray-50 text-gray-600 hover:bg-brand/10 hover:text-brand rounded-lg transition"
              title="Invite Manager"
            >
              <UserPlus size={18} />
            </Link>
            <button 
              onClick={() => onToggleStatus(branch._id, branch.isActive)}
              className={`p-2 rounded-lg transition ${branch.isActive ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'bg-success/5 text-success hover:bg-success/10'}`}
              title={branch.isActive ? 'Deactivate' : 'Activate'}
            >
              <Power size={18} />
            </button>
          </div>

          <Link 
             href={`/owner/branches/${branch._id}`}
             className="flex items-center gap-1 text-xs font-bold text-brand hover:gap-2 transition-all"
          >
            View Details
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
