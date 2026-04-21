'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Store, Search, Filter, Loader2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { DashboardHeader } from '@/components/common/DashboardHeader';
import { api } from '@/lib/api';
import { BranchCard } from '@/components/owner/BranchCard';
import { AddBranchModal } from '@/components/owner/AddBranchModal';
import { toast } from 'sonner';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [planStats, setPlanStats] = useState({ active: 0, limit: 1, plan: 'Starter' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const data: any = await api.get('/api/branches');
      setBranches(data);
      
      // Calculate stats (in a real app, this might come from a dedicated stats endpoint)
      const activeCount = data.filter((b: any) => b.isActive).length;
      
      // For now, let's derive plan from the number of branches or handle via a dedicated user endpoint if available.
      // But usually this would come from the organization context.
      setPlanStats(prev => ({ ...prev, active: activeCount }));
    } catch (err) {
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.patch(`/api/branches/${id}`, { isActive: false });
        toast.info('Branch deactivated');
      } else {
        await api.patch(`/api/branches/${id}/activate`, {}); // Our custom activate route handles limits
        toast.success('Branch activated');
      }
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.city.toLowerCase().includes(search.toLowerCase())
  );

  const atLimit = planStats.active >= planStats.limit;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Manage all your business locations and their operations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand/20 transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {/* PLAN LIMIT BANNER */}
      {atLimit && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
               <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Branch limit reached ({planStats.limit}/{planStats.limit})</p>
              <p className="text-xs text-amber-700">You've reached the branch limit for your <span className="font-bold underline">{planStats.plan}</span> plan. Upgrade to add more locations.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition">
             Upgrade Plan
             <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Search branches by name or city..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand shadow-sm text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
           <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shrink-0">
             <Filter size={14} />
             All Status
           </button>
           <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shrink-0">
             Active Only
           </button>
        </div>
      </div>

      {/* GRID */}
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="animate-spin text-brand" size={32} />
             <p className="text-sm text-gray-500 font-medium">Loading your branches...</p>
          </div>
        </div>
      ) : filteredBranches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <BranchCard 
              key={branch._id} 
              branch={branch} 
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
             <Store size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No branches found</h3>
          <p className="text-gray-500 max-w-sm mb-8">
            {search ? `We couldn't find any branches matching "${search}"` : "You haven't added any branches to your organization yet. Get started by creating your first location."}
          </p>
          {!search && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-105 transition"
            >
              Add Your First Branch
            </button>
          )}
        </div>
      )}

      <AddBranchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBranches}
      />
    </div>
  );
}
