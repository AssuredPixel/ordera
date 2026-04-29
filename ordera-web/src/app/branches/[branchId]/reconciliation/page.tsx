'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Plus, 
  ArrowRight,
  Wallet,
  CreditCard,
  Send,
  User,
  ChevronRight,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES ---
interface Money {
  amount: number;
  currency: string;
}

interface ReconLine {
  waiterId: string;
  waiterName: string;
  expectedCash: Money;
  expectedCard: Money;
  expectedTransfer: Money;
  actualCash: Money;
  actualCard: Money;
  actualTransfer: Money;
  totalExpected: Money;
  totalActual: Money;
  totalDiscrepancy: Money;
  status: 'pending' | 'verified' | 'flagged';
  note?: string;
}

interface Reconciliation {
  _id: string;
  period: 'shift' | 'day';
  status: string;
  totalExpected: Money;
  totalActual: Money;
  totalDiscrepancy: Money;
  hasDiscrepancy: boolean;
  lines: ReconLine[];
  openedAt: string;
  completedAt?: string;
}

export default function ReconciliationPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [selectedReconId, setSelectedReconId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<ReconLine | null>(null);

  // 1. Fetch current open sessions (Shifts/Days)
  const { data: shifts } = useQuery({
    queryKey: ['active-shifts', branchId],
    queryFn: () => api.get<any[]>(`/api/branches/${branchId}/shifts?status=OPEN`)
  });

  const { data: businessDays } = useQuery({
    queryKey: ['active-days', branchId],
    queryFn: () => api.get<any[]>(`/api/branches/${branchId}/business-days?status=OPEN`)
  });

  // 2. Fetch Reconciliations
  const { data: reconciliations, isLoading } = useQuery({
    queryKey: ['reconciliations', branchId],
    queryFn: () => api.get<Reconciliation[]>('/api/reconciliations')
  });

  // Mutations
  const openMutation = useMutation({
    mutationFn: (data: { shiftId?: string; businessDayId?: string }) => 
      api.post('/api/reconciliations/open', data),
    onSuccess: (data: any) => {
      toast.success('Reconciliation session opened');
      setSelectedReconId(data._id);
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to open reconciliation')
  });

  const activeRecon = reconciliations?.find(r => r.status === 'OPEN' || r.status === 'IN_REVIEW');
  const displayRecon = selectedReconId 
    ? reconciliations?.find(r => r._id === selectedReconId) 
    : (activeRecon || (reconciliations && reconciliations.length > 0 ? reconciliations[0] : null));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading reconciliation data...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reconciliation</h1>
          <p className="text-gray-500 mt-1">Audit shift sales and close business sessions</p>
        </div>

        {!activeRecon && (
          <div className="flex gap-2">
            {shifts?.map(s => (
              <button 
                key={s._id}
                onClick={() => openMutation.mutate({ shiftId: s._id })}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-[#2A2A4E] transition-all"
              >
                <Plus size={18} />
                <span>Reconcile {s.name}</span>
              </button>
            ))}
            {businessDays?.map(d => (
              <button 
                key={d._id}
                onClick={() => openMutation.mutate({ businessDayId: d._id })}
                className="flex items-center gap-2 px-4 py-2 bg-[#C97B2A] text-white rounded-xl font-bold hover:bg-[#B86A19] transition-all"
              >
                <Plus size={18} />
                <span>End Business Day</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!displayRecon ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="text-gray-300" size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Active Reconciliation</h2>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">
            Open a shift or business day to start auditing sales and reconciling payments.
          </p>
        </div>
      ) : (
        <>
          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard 
              label="Expected Revenue" 
              value={formatCurrency(displayRecon.totalExpected.amount)}
              icon={Wallet}
              color="blue"
              subtext="System Calculated"
            />
            <SummaryCard 
              label="Actual Revenue" 
              value={formatCurrency(displayRecon.totalActual.amount)}
              icon={CheckCircle2}
              color="indigo"
              subtext="Manually Audited"
            />
            <SummaryCard 
              label="Discrepancy" 
              value={formatCurrency(displayRecon.totalDiscrepancy.amount)}
              icon={displayRecon.hasDiscrepancy ? AlertCircle : CheckCircle2}
              color={displayRecon.totalDiscrepancy.amount < 0 ? 'red' : displayRecon.totalDiscrepancy.amount > 0 ? 'yellow' : 'green'}
              subtext={displayRecon.totalDiscrepancy.amount === 0 ? 'Perfectly Balanced' : 'Action Required'}
            />
          </div>

          {/* ── MAIN AUDIT TABLE ── */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center text-white">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Audit Worksheet</h3>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Breakdown by Waiter</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  displayRecon.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 
                  displayRecon.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {displayRecon.status}
                </span>
                {displayRecon.status !== 'COMPLETED' && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this reconciliation?')) {
                        toast.promise(api.delete(`/api/reconciliations/${displayRecon._id}`), {
                          loading: 'Cancelling...',
                          success: () => {
                            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
                            return 'Reconciliation cancelled';
                          },
                          error: 'Failed to cancel'
                        });
                      }
                    }}
                    className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                    title="Cancel Session"
                  >
                    <Plus className="rotate-45" size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Staff member</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Expected (System)</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actual (Counted)</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Diff</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRecon.lines.map((line) => (
                    <tr key={line.waiterId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            {line.waiterName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{line.waiterName}</p>
                            <p className="text-xs text-gray-400">ID: ...{line.waiterId.slice(-4)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(line.totalExpected.amount)}</p>
                          <div className="flex gap-2">
                            <span className="text-[10px] text-gray-400">C: {formatCurrency(line.expectedCash.amount)}</span>
                            <span className="text-[10px] text-gray-400">P: {formatCurrency(line.expectedCard.amount)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-[#C97B2A]">{formatCurrency(line.totalActual.amount)}</p>
                          {displayRecon.status === 'OPEN' || displayRecon.status === 'IN_REVIEW' ? (
                            <button 
                              onClick={() => setEditingLine(line)}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              Edit Totals
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <span className="text-[10px] text-gray-400">C: {formatCurrency(line.actualCash.amount)}</span>
                              <span className="text-[10px] text-gray-400">P: {formatCurrency(line.actualCard.amount)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`text-sm font-bold ${
                          line.totalDiscrepancy.amount < 0 ? 'text-red-500' : 
                          line.totalDiscrepancy.amount > 0 ? 'text-green-500' : 'text-gray-400'
                        }`}>
                          {line.totalDiscrepancy.amount > 0 ? '+' : ''}{formatCurrency(line.totalDiscrepancy.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          line.status === 'pending' ? 'bg-gray-100 text-gray-500' : 
                          line.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {line.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(displayRecon.status === 'OPEN' || displayRecon.status === 'IN_REVIEW') && line.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => {
                                  toast.promise(api.patch(`/api/reconciliations/${displayRecon._id}/verify-line`, { waiterId: line.waiterId }), {
                                    loading: 'Verifying...',
                                    success: 'Verified',
                                    error: 'Error'
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
                                }}
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                title="Verify"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt('Reason for flagging:');
                                  if (reason) {
                                    toast.promise(api.patch(`/api/reconciliations/${displayRecon._id}/flag-line`, { waiterId: line.waiterId, reason }), {
                                      loading: 'Flagging...',
                                      success: 'Flagged',
                                      error: 'Error'
                                    });
                                    queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
                                  }
                                }}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                title="Flag for Review"
                              >
                                <AlertCircle size={18} />
                              </button>
                            </>
                          )}
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayRecon.status !== 'COMPLETED' && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => {
                    toast.promise(api.patch(`/api/reconciliations/${displayRecon._id}/complete`), {
                      loading: 'Closing reconciliation...',
                      success: () => {
                        queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
                        return 'Reconciliation completed and shift locked';
                      },
                      error: 'Failed to complete reconciliation'
                    });
                  }}
                  className="px-8 py-3 bg-[#1A1A2E] text-white rounded-2xl font-bold shadow-xl shadow-[#1A1A2E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  <span>Finalize & Close Shift</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── HISTORY LIST ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History size={20} />
          Audit History
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reconciliations?.filter(r => r.status === 'COMPLETED').map(recon => (
            <button 
              key={recon._id}
              onClick={() => setSelectedReconId(recon._id)}
              className={`p-5 rounded-3xl border transition-all text-left ${
                selectedReconId === recon._id ? 'bg-[#1A1A2E] border-[#1A1A2E] text-white shadow-xl' : 'bg-white border-gray-100 text-gray-900 hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${selectedReconId === recon._id ? 'bg-white/10' : 'bg-gray-50'}`}>
                  <FileText size={20} className={selectedReconId === recon._id ? 'text-white' : 'text-gray-400'} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  selectedReconId === recon._id ? 'bg-white/10 text-white' : 'bg-green-50 text-green-600'
                }`}>
                  {new Date(recon.openedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="font-bold">End of {recon.period === 'shift' ? 'Shift' : 'Day'}</p>
              <p className={`text-xs mt-1 ${selectedReconId === recon._id ? 'text-white/60' : 'text-gray-500'}`}>
                Revenue: {formatCurrency(recon.totalActual.amount)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {editingLine && displayRecon && (
        <EnterActualsModal 
          reconId={displayRecon._id}
          line={editingLine}
          onClose={() => setEditingLine(null)}
          onSuccess={() => {
            setEditingLine(null);
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
          }}
        />
      )}
    </div>
  );
}

function EnterActualsModal({ reconId, line, onClose, onSuccess }: any) {
  const [cash, setCash] = useState(line.actualCash.amount / 100);
  const [card, setCard] = useState(line.actualCard.amount / 100);
  const [transfer, setTransfer] = useState(line.actualTransfer.amount / 100);
  const [note, setNote] = useState(line.note || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.patch(`/api/reconciliations/${reconId}/enter-actuals`, {
        waiterId: line.waiterId,
        actualCash: Math.round(cash * 100),
        actualCard: Math.round(card * 100),
        actualTransfer: Math.round(transfer * 100),
        note
      });
      toast.success('Totals updated');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update totals');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enter Actual Totals</h2>
            <p className="text-xs text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Staff: {line.waiterName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cash (₦)</label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="number" step="0.01" required autoFocus
                  value={cash} onChange={e => setCash(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-bold"
                />
              </div>
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Card / POS (₦)</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="number" step="0.01" required
                  value={card} onChange={e => setCard(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Transfer (₦)</label>
            <div className="relative">
              <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="number" step="0.01" required
                value={transfer} onChange={e => setTransfer(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Audit Note</label>
            <textarea 
              placeholder="Any comments regarding discrepancies..."
              value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm min-h-[100px]"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-4 bg-[#1A1A2E] text-white rounded-[1.5rem] font-bold shadow-xl shadow-[#1A1A2E]/20 hover:bg-[#2A2A4E] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Update Totals'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, subtext }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  };

  return (
    <div className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${(colors as any)[color]} border`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}
