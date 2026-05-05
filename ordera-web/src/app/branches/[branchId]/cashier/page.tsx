'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowLeft,
  Plus,
  ArrowRight,
  Wallet,
  CreditCard,
  Send,
  Flag,
  Check,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  Reconciliation, 
  ReconciliationLine, 
  ReconciliationStatus, 
  ReconciliationLineStatus 
} from '@/types/ordera';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';

export default function CashierDashboard() {
  const { branchId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  // Local state for actual amounts (inputs)
  const [inputValues, setInputValues] = useState<Record<string, { cash: number; card: number; transfer: number }>>({});
  const [flagModal, setFlagModal] = useState<{ isOpen: boolean; waiterId: string; waiterName: string; reason: string }>({
    isOpen: false,
    waiterId: '',
    waiterName: '',
    reason: ''
  });

  // 1. Fetch Active Reconciliation
  const { data: activeRecon, isLoading: isLoadingActive } = useQuery({
    queryKey: ['active-reconciliation', branchId],
    queryFn: () => api.get<Reconciliation>(`/api/reconciliations/branch/${branchId}/active`),
  });

  // 2. Fetch Reconciliation History
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['reconciliation-history', branchId],
    queryFn: () => api.get<Reconciliation[]>(`/api/reconciliations/branch/${branchId}/history`),
    enabled: activeTab === 'history'
  });

  // Mutations
  const openReconMutation = useMutation({
    mutationFn: () => api.post('/api/reconciliations/open', { branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-reconciliation', branchId] });
    }
  });

  const verifyLineMutation = useMutation({
    mutationFn: ({ reconId, waiterId, actuals }: { reconId: string; waiterId: string; actuals: { cash: number; card: number; transfer: number } }) => 
      api.patch(`/api/reconciliations/${reconId}/verify-line`, { waiterId, actuals }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-reconciliation', branchId] });
    }
  });

  const flagLineMutation = useMutation({
    mutationFn: ({ reconId, waiterId, reason }: { reconId: string; waiterId: string; reason: string }) => 
      api.patch(`/api/reconciliations/${reconId}/flag-line`, { waiterId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-reconciliation', branchId] });
      setFlagModal({ isOpen: false, waiterId: '', waiterName: '', reason: '' });
    }
  });

  const completeReconMutation = useMutation({
    mutationFn: (reconId: string) => api.patch(`/api/reconciliations/${reconId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-reconciliation', branchId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-history', branchId] });
      setActiveTab('history');
    }
  });

  // Initialize input values from active reconciliation
  useEffect(() => {
    if (activeRecon?.lines) {
      const initial: Record<string, { cash: number; card: number; transfer: number }> = {};
      activeRecon.lines.forEach(l => {
        initial[l.waiterId] = {
          cash: l.actualCash.amount / 100,
          card: l.actualCard.amount / 100,
          transfer: l.actualTransfer.amount / 100
        };
      });
      setInputValues(initial);
    }
  }, [activeRecon]);

  const handleInputChange = (waiterId: string, field: 'cash' | 'card' | 'transfer', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputValues(prev => ({
      ...prev,
      [waiterId]: {
        ...prev[waiterId],
        [field]: numValue
      }
    }));
  };

  const calculateDiscrepancy = (line: ReconciliationLine) => {
    const actuals = inputValues[line.waiterId] || { cash: 0, card: 0, transfer: 0 };
    const totalActual = (actuals.cash + actuals.card + actuals.transfer) * 100;
    return totalActual - line.expectedTotal.amount;
  };

  const getDiscrepancyColor = (amount: number) => {
    if (amount > 0) return 'text-emerald-500';
    if (amount < 0) return 'text-rose-500';
    return 'text-gray-400';
  };

  const allProcessed = activeRecon?.lines?.every(l => l.status !== ReconciliationLineStatus.PENDING) ?? false;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ── TOP NAV ── */}
      <nav className="bg-white border-b border-gray-100 px-6 lg:px-10 h-20 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-2xl text-[#1A1A2E]">Reconciliation</h1>
            <p className="text-xs text-[#C97B2A] font-bold uppercase tracking-wider">
              {activeRecon ? `${activeRecon.businessDayName}` : 'No Active Session'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'current' ? 'bg-[#1A1A2E] text-white shadow-lg' : 'text-gray-400 hover:text-[#1A1A2E]'
            }`}
          >
            Daily Reconciliation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'history' ? 'bg-[#1A1A2E] text-white shadow-lg' : 'text-gray-400 hover:text-[#1A1A2E]'
            }`}
          >
            History
          </button>
        </div>
      </nav>

      <main className="p-4 lg:p-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100/50 min-h-[800px] overflow-hidden">
          <div className="p-6 lg:p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'current' ? (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {!activeRecon ? (
                <div className="bg-white rounded-[2.5rem] p-16 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-[#C97B2A]/10 flex items-center justify-center text-[#C97B2A]">
                    <Wallet size={48} />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-3xl font-display text-[#1A1A2E]">Ready to Reconcile?</h2>
                    <p className="text-gray-500 mt-2">
                      Start the daily reconciliation process to verify cash, card, and transfer payments across all waiters.
                    </p>
                  </div>
                  <button
                    onClick={() => openReconMutation.mutate()}
                    disabled={openReconMutation.isPending}
                    className="flex items-center gap-3 px-10 py-5 bg-[#C97B2A] text-white rounded-[1.5rem] font-bold shadow-xl shadow-[#C97B2A]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {openReconMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                    Open Today's Session
                  </button>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className={`p-8 rounded-3xl border flex items-center justify-between transition-all ${
                    activeRecon.status === ReconciliationStatus.FLAGGED ? 'bg-rose-50 border-rose-100 text-rose-600' :
                    activeRecon.status === ReconciliationStatus.COMPLETED ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    'bg-gray-50/50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-6">
                      <div className={`p-5 rounded-2xl ${
                        activeRecon.status === ReconciliationStatus.FLAGGED ? 'bg-rose-600 text-white' :
                        activeRecon.status === ReconciliationStatus.COMPLETED ? 'bg-emerald-600 text-white' :
                        'bg-[#C97B2A] text-white'
                      } shadow-lg shadow-black/5`}>
                        {activeRecon.status === ReconciliationStatus.FLAGGED ? <AlertTriangle size={28} /> :
                         activeRecon.status === ReconciliationStatus.COMPLETED ? <CheckCircle2 size={28} /> :
                         <Loader2 className="animate-spin" size={28} />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-60`}>Session Status</p>
                        <p className="text-2xl font-display mt-0.5">
                          {activeRecon.status === ReconciliationStatus.OPEN ? 'Active & Verifying' : activeRecon.status}
                        </p>
                      </div>
                    </div>

                    {allProcessed && activeRecon?.status !== ReconciliationStatus.COMPLETED && (
                      <button
                        onClick={() => activeRecon?._id && completeReconMutation.mutate(activeRecon._id)}
                        disabled={completeReconMutation.isPending}
                        className="px-10 py-4 bg-[#1A1A2E] text-white rounded-2xl font-bold hover:bg-[#C97B2A] transition-all shadow-xl shadow-black/10"
                      >
                        {completeReconMutation.isPending ? 'Finalizing...' : 'Close & Finalize Session'}
                      </button>
                    )}
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50/30 p-8 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5 group">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Expected Total</p>
                      <p className="text-3xl font-display text-[#1A1A2E]">₦{((activeRecon?.totalExpected?.amount || 0) / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50/30 p-8 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5 group">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Actual Collected</p>
                      <p className="text-3xl font-display text-[#C97B2A]">₦{((activeRecon?.totalActual?.amount || 0) / 100).toLocaleString()}</p>
                    </div>
                    <div className={`p-8 rounded-3xl border shadow-sm transition-all ${
                      (activeRecon?.totalDiscrepancy?.amount || 0) < 0 ? 'bg-rose-50 border-rose-100' : 
                      (activeRecon?.totalDiscrepancy?.amount || 0) > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'
                    }`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Net Discrepancy</p>
                      <p className={`text-3xl font-display ${
                        (activeRecon?.totalDiscrepancy?.amount || 0) < 0 ? 'text-rose-600' : 
                        (activeRecon?.totalDiscrepancy?.amount || 0) > 0 ? 'text-emerald-600' : 'text-gray-600'
                      }`}>
                        {(activeRecon?.totalDiscrepancy?.amount || 0) === 0 ? 'Balanced' : `₦${((activeRecon?.totalDiscrepancy?.amount || 0) / 100).toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Waiter Summary Table */}
                  <div className="bg-gray-50/20 rounded-[2rem] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[1000px]">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-10 py-6">Waiter Details</th>
                            <th className="px-6 py-6 text-center">System Expected</th>
                            <th className="px-6 py-6">Input Actuals</th>
                            <th className="px-6 py-6 text-center">Status</th>
                            <th className="px-10 py-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activeRecon?.lines?.map((line) => {
                            const discrepancy = calculateDiscrepancy(line);
                            const inputs = inputValues[line.waiterId] || { cash: 0, card: 0, transfer: 0 };
                            const isVerified = line.status === ReconciliationLineStatus.VERIFIED;
                            const isFlagged = line.status === ReconciliationLineStatus.FLAGGED;

                            return (
                              <tr key={line.waiterId} className={`group hover:bg-gray-50/20 transition-colors ${
                                isFlagged ? 'bg-rose-50/30' : isVerified ? 'bg-emerald-50/10' : ''
                              }`}>
                                <td className="px-10 py-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#1A1A2E] font-bold text-lg border border-gray-100">
                                      {line.waiterName[0]}
                                    </div>
                                    <div>
                                      <p className="font-bold text-[#1A1A2E] text-lg">{line.waiterName}</p>
                                      <p className="text-xs text-gray-400 font-bold">Total: ₦{(line.expectedTotal.amount / 100).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-8">
                                  <div className="flex flex-col gap-1.5 max-w-[180px] mx-auto">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-gray-400">Cash:</span>
                                      <span className="text-[#1A1A2E]">₦{(line.expectedCash.amount / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-gray-400">Card:</span>
                                      <span className="text-[#1A1A2E]">₦{(line.expectedCard.amount / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-gray-400">Transfer:</span>
                                      <span className="text-[#1A1A2E]">₦{(line.expectedTransfer.amount / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-8">
                                  <div className="grid grid-cols-3 gap-3 min-w-[360px]">
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cash</label>
                                      <input
                                        type="number"
                                        disabled={isVerified}
                                        value={inputs.cash}
                                        onChange={(e) => handleInputChange(line.waiterId, 'cash', e.target.value)}
                                        className="w-full h-12 px-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C97B2A] outline-none font-bold text-sm transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Card</label>
                                      <input
                                        type="number"
                                        disabled={isVerified}
                                        value={inputs.card}
                                        onChange={(e) => handleInputChange(line.waiterId, 'card', e.target.value)}
                                        className="w-full h-12 px-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C97B2A] outline-none font-bold text-sm transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Transfer</label>
                                      <input
                                        type="number"
                                        disabled={isVerified}
                                        value={inputs.transfer}
                                        onChange={(e) => handleInputChange(line.waiterId, 'transfer', e.target.value)}
                                        className="w-full h-12 px-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C97B2A] outline-none font-bold text-sm transition-all"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-8 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase ${
                                      isFlagged ? 'bg-rose-100 text-rose-600' :
                                      isVerified ? 'bg-emerald-100 text-emerald-600' :
                                      'bg-gray-100 text-gray-400'
                                    }`}>
                                      {line.status}
                                    </span>
                                    <p className={`text-sm font-bold ${getDiscrepancyColor(discrepancy)}`}>
                                      {discrepancy === 0 ? 'Balanced' : `₦${(discrepancy / 100).toLocaleString()}`}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    {!isVerified && (
                                      <>
                                        <button
                                          onClick={() => activeRecon?._id && verifyLineMutation.mutate({ reconId: activeRecon._id, waiterId: line.waiterId, actuals: inputs })}
                                          disabled={verifyLineMutation.isPending}
                                          className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                          title="Verify & Save"
                                        >
                                          <Check size={20} />
                                        </button>
                                        <button
                                          onClick={() => activeRecon?._id && setFlagModal({ isOpen: true, waiterId: line.waiterId, waiterName: line.waiterName, reason: '' })}
                                          className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                          title="Flag for Review"
                                        >
                                          <Flag size={20} />
                                        </button>
                                      </>
                                    )}
                                    {isVerified && (
                                      <button
                                        onClick={() => activeRecon?._id && verifyLineMutation.mutate({ reconId: activeRecon._id, waiterId: line.waiterId, actuals: inputs })}
                                        className="px-6 py-3 rounded-xl text-[#C97B2A] font-bold hover:bg-[#C97B2A]/5 transition-all"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {isLoadingHistory ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 bg-white rounded-[2.5rem] animate-pulse border border-gray-100" />
                ))
              ) : history.length > 0 ? (
                history.map((recon) => (
                  <div key={recon._id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:shadow-xl hover:border-[#C97B2A]/20 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase ${
                        recon.status === ReconciliationStatus.FLAGGED ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {recon.status}
                      </div>
                      <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-[#C97B2A]/10 group-hover:text-[#C97B2A] transition-all">
                        <History size={20} />
                      </div>
                    </div>
                    
                    <h3 className="font-display text-2xl text-[#1A1A2E] mb-2">{recon.businessDayName}</h3>
                    <p className="text-xs text-gray-400 font-bold mb-8">{format(new Date(recon.createdAt), 'MMMM dd, yyyy')}</p>
                    
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Actual</p>
                        <p className="text-xl font-display text-[#1A1A2E]">₦{(recon.totalActual.amount / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Discrepancy</p>
                        <p className={`text-xl font-display ${getDiscrepancyColor(recon.totalDiscrepancy.amount)}`}>
                          {recon.totalDiscrepancy.amount === 0 ? 'Balanced' : `₦${(recon.totalDiscrepancy.amount / 100).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History size={32} className="text-gray-300" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-400">No History Found</h4>
                  <p className="text-gray-500 mt-1">Complete your first reconciliation to see it here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Flag Modal */}
      <AnimatePresence>
        {flagModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A1A2E]/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-display text-[#1A1A2E]">Flag Issue</h3>
                  <p className="text-sm text-gray-400 mt-1 font-bold">Waiter: {flagModal.waiterName}</p>
                </div>
                <button 
                  onClick={() => setFlagModal({ ...flagModal, isOpen: false })}
                  className="p-3 rounded-2xl hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <p className="text-sm text-rose-600 font-medium leading-relaxed">
                    Flagging this line will mark it for management review. Please provide a clear reason for the discrepancy.
                  </p>
                </div>

                <textarea
                  autoFocus
                  className="w-full h-40 p-5 rounded-[1.5rem] border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-sm font-medium resize-none"
                  placeholder="e.g. Waiter reported ₦500 shortfall due to change issues..."
                  value={flagModal.reason}
                  onChange={(e) => setFlagModal({ ...flagModal, reason: e.target.value })}
                />

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setFlagModal({ ...flagModal, isOpen: false })}
                    className="flex-1 px-6 py-5 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => activeRecon?._id && flagLineMutation.mutate({ 
                      reconId: activeRecon._id, 
                      waiterId: flagModal.waiterId, 
                      reason: flagModal.reason 
                    })}
                    disabled={!flagModal.reason || flagLineMutation.isPending}
                    className="flex-1 px-6 py-5 bg-rose-600 text-white rounded-2xl font-bold shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                  >
                    {flagLineMutation.isPending ? 'Processing...' : 'Flag Line'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
