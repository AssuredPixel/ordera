'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Settings as SettingsIcon, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  ChevronRight,
  Save
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BranchStaffTab } from '@/components/owner/BranchStaffTab';
import { BranchShiftsTab } from '@/components/owner/BranchShiftsTab';

export default function BranchDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const branchId = params.id as string;
  const initialTab = searchParams.get('tab') || 'overview';

  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Settings Tab
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetchBranch();
  }, [branchId]);

  const fetchBranch = async () => {
    setIsLoading(true);
    try {
      const data: any = await api.get(`/api/branches/${branchId}`);
      setBranch(data);
      setFormData(data);
    } catch (err) {
      toast.error('Failed to load branch details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/api/branches/${branchId}`, formData);
      toast.success('Branch settings updated');
      fetchBranch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update branch');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
       <Loader2 className="animate-spin text-brand" size={48} />
    </div>
  );

  if (!branch) return (
    <div className="h-screen flex items-center justify-center flex-col gap-4">
       <AlertCircle size={48} className="text-red-400" />
       <p className="text-gray-500 font-medium">Branch not found</p>
       <button onClick={() => router.back()} className="text-brand font-bold">Go Back</button>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'staff', label: 'Staff & Team', icon: Users },
    { id: 'settings', label: 'Configuration', icon: SettingsIcon },
  ];

  if (branch.operatingMode === 'SHIFT_BASED') {
    tabs.push({ id: 'shifts', label: 'Shift Templates', icon: Clock });
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => router.push('/owner/branches')}
            className="p-2 hover:bg-gray-100 rounded-full transition shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
               <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{branch.name}</h1>
               <div className="flex items-center gap-1.5">
                 <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${branch.isActive ? 'bg-success/10 text-success' : 'bg-red-50 text-red-500'}`}>
                    {branch.isActive ? 'ACTIVE' : 'INACTIVE'}
                 </div>
                 {branch.isHeadquarters && (
                   <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[8px] font-bold rounded uppercase tracking-tighter">Principal HQ</span>
                 )}
               </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center gap-1.5">
               <MapPin size={12} className="shrink-0" />
               <span className="truncate">{branch.address.street}, {branch.address.city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
           <button 
             onClick={handleUpdateBranch}
             disabled={isSaving}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 bg-brand text-white rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
           >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span className="whitespace-nowrap">Save Changes</span>
           </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl w-fit flex-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.pushState(null, '', `?tab=${tab.id}`);
                }}
                className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-brand shadow-sm scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COL: INFO */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">Branch Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400">
                               <MapPin size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                               <p className="text-sm font-bold text-gray-700">{branch.address.city}, {branch.address.state}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400">
                               <Clock size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-400 font-bold uppercase">Operating Mode</p>
                               <p className="text-sm font-bold text-gray-700">{branch.operatingMode.replace('_', ' ')}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400">
                               <Phone size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                               <p className="text-sm font-bold text-gray-700">{branch.phone || 'N/A'}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400">
                               <Mail size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                               <p className="text-sm font-bold text-gray-700">{branch.email || 'N/A'}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">Financial Settings</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="p-6 border border-gray-100 rounded-3xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tax & Charges</p>
                            <div className="flex items-center justify-between">
                               <span className="text-sm text-gray-600">VAT Rate</span>
                               <span className="text-xl font-black text-brand">{branch.settings?.taxRate}%</span>
                            </div>
                         </div>
                         <div className="p-6 border border-gray-100 rounded-3xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Reconciliation</p>
                            <div className="flex items-center gap-2">
                               <CheckCircle2 size={16} className="text-success" />
                               <span className="text-sm font-bold text-gray-700">{branch.reconciliationMode.replace('_', ' ')}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* RIGHT COL: QUICK ACTIONS / STATS */}
                <div className="space-y-6">
                   <div className="bg-brand/5 border border-brand/10 p-6 rounded-3xl space-y-4">
                      <p className="text-xs font-bold text-brand uppercase tracking-widest">Branch Manager</p>
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                            <Users size={24} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">None Assigned</p>
                            <button className="text-[10px] font-bold text-brand hover:underline">Select Manager →</button>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Branch Status</p>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Last Session</span>
                            <span className="text-xs font-bold text-gray-900">Yesterday, 11:45 PM</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Staff Count</span>
                            <span className="text-xs font-bold text-gray-900">0 Active</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'staff' && <BranchStaffTab branchId={branchId} />}

        {activeTab === 'settings' && formData && (
          <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SECTION 1: IDENTITY */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Building2 size={18} className="text-brand" />
                      Branch Identity
                   </h4>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Branch Name</label>
                         <input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                            <input 
                               value={formData.phone}
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                            <input 
                               value={formData.email}
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* SECTION 2: ADDRESS */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                       <MapPin size={18} className="text-brand" />
                       Location & Address
                   </h4>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Street Address</label>
                         <input 
                            value={formData.address.street}
                            onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">City</label>
                            <input 
                               value={formData.address.city}
                               onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">State</label>
                            <input 
                               value={formData.address.state}
                               onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* SECTION 3: OPERATIONS */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                       <Clock size={18} className="text-brand" />
                       Operating Mode
                   </h4>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Business Model</label>
                         <select 
                            value={formData.operatingMode}
                            onChange={(e) => setFormData({...formData, operatingMode: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         >
                            <option value="DAY_BASED">Day-Based Sessions</option>
                            <option value="SHIFT_BASED">Shift-Based Sessions</option>
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Default Open (HH:MM)</label>
                            <input 
                               value={formData.defaultOpenTime}
                               onChange={(e) => setFormData({...formData, defaultOpenTime: e.target.value})}
                               placeholder="08:00"
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Default Close (HH:MM)</label>
                            <input 
                               value={formData.defaultCloseTime}
                               onChange={(e) => setFormData({...formData, defaultCloseTime: e.target.value})}
                               placeholder="22:00"
                               className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                            />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Reconciliation Frequency</label>
                         <select 
                            value={formData.reconciliationMode}
                            onChange={(e) => setFormData({...formData, reconciliationMode: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         >
                            <option value="per_day">Per Business Day</option>
                            <option value="per_shift">Per Shift Session</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* SECTION 4: FINANCIALS */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                       <Shield size={18} className="text-brand" />
                       Tax & Receipting
                   </h4>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">VAT Rate (%)</label>
                         <input 
                            type="number"
                            value={formData.settings.taxRate}
                            onChange={(e) => setFormData({...formData, settings: {...formData.settings, taxRate: parseFloat(e.target.value)}})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Receipt Footer</label>
                         <textarea 
                            rows={2}
                            value={formData.settings.receiptFooter}
                            onChange={(e) => setFormData({...formData, settings: {...formData.settings, receiptFooter: e.target.value}})}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'shifts' && <BranchShiftsTab branchId={branchId} />}
      </div>
    </div>
  );
}
