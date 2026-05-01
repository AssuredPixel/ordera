'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Banknote, 
  Clock, 
  CreditCard, 
  Smartphone,
  ChevronRight,
  Search,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function WaiterBillsPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  // 1. Fetch Bills
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['waiter-bills', branchId],
    queryFn: () => api.get<any[]>('/api/bills'), // Filtering is handled on backend for WAITER role
    refetchInterval: 30000,
  });

  const chargeMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/bills/${selectedBill._id}/charge`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-bills', branchId] });
      toast.success('Payment processed successfully!');
      setSelectedBill(null);
    },
    onError: (err: any) => toast.error(err.message || 'Payment failed')
  });

  const filteredBills = bills.filter(b => 
    b.tableNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b._id.slice(-6).includes(search)
  );

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div>
        <h1 className="font-display text-4xl text-[#1A1A2E]">My Bills</h1>
        <p className="text-gray-500 mt-1">Settle payments for your tables.</p>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
        <input 
          type="text"
          placeholder="Search by table or bill ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] shadow-sm font-medium"
        />
      </div>

      {/* ── BILLS LIST ── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-20 text-center animate-pulse">Loading bills...</div>
        ) : filteredBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBills.map((bill) => (
              <BillCard 
                key={bill._id} 
                bill={bill} 
                onCharge={() => setSelectedBill(bill)} 
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote size={24} className="text-gray-300" />
            </div>
            <h4 className="font-bold text-muted">No bills found</h4>
            <p className="text-sm text-gray-400 mt-1">Serve an order to generate a bill.</p>
          </div>
        )}
      </div>

      {/* ── CHARGE MODAL ── */}
      {selectedBill && (
        <ChargeModal 
          bill={selectedBill} 
          onClose={() => setSelectedBill(null)} 
          onConfirm={(data) => chargeMutation.mutate(data)}
          isLoading={chargeMutation.isPending}
        />
      )}
    </div>
  );
}

function BillCard({ bill, onCharge }: { bill: any, onCharge: () => void }) {
  const isPaid = bill.status === 'PAID';

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-display text-2xl text-[#1A1A2E]">
            {bill.tableNumber ? `Table ${bill.tableNumber}` : 'Takeaway'}
          </h4>
          <p className="text-[10px] text-gray-400 font-mono mt-1">BILL #{bill._id.slice(-6).toUpperCase()}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
          isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {bill.status}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Amount Due</p>
          <p className="text-2xl font-display text-[#C97B2A]">₦{(bill.total.amount / 100).toLocaleString()}</p>
        </div>
        
        {isPaid ? (
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <CheckCircle2 size={18} /> Settle
          </div>
        ) : (
          <button 
            onClick={onCharge}
            className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#2A2A4E] transition-all"
          >
            Charge <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChargeModal({ bill, onClose, onConfirm, isLoading }: any) {
  const [method, setMethod] = useState('CASH');
  const [tip, setTip] = useState(0);

  const totalWithTip = bill.total.amount + (tip * 100);

  const methods = [
    { id: 'CASH', icon: Banknote, label: 'Cash' },
    { id: 'CARD', icon: CreditCard, label: 'Card' },
    { id: 'TRANSFER', icon: Smartphone, label: 'Transfer' },
  ];

  return (
    <div className="fixed inset-0 bg-[#1A1A2E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="font-display text-3xl text-[#1A1A2E]">Settle Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Table {bill.tableNumber} — Bill #{bill._id.slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Method */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Select Payment Method</h4>
            <div className="grid grid-cols-3 gap-4">
              {methods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                      method === m.id 
                        ? 'border-[#C97B2A] bg-[#C97B2A]/5 text-[#C97B2A]' 
                        : 'border-gray-50 text-gray-400 hover:border-gray-100'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tip */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              Optional Tip <span>₦{(tip).toLocaleString()}</span>
            </h4>
            <div className="flex items-center gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTip(amt)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                    tip === amt ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'border-gray-100 text-muted hover:border-gray-200'
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
              <button 
                onClick={() => setTip(0)}
                className="p-3 text-gray-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 bg-[#1A1A2E] rounded-3xl text-white space-y-4">
            <div className="flex justify-between text-sm text-white/60">
              <span>Bill Amount</span>
              <span>₦{(bill.total.amount / 100).toLocaleString()}</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between text-sm text-white/60">
                <span>Gratuity</span>
                <span>₦{tip.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-display pt-4 border-t border-white/10">
              <span>Total Paid</span>
              <span className="text-[#C97B2A]">₦{(totalWithTip / 100).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0">
          <button 
            onClick={() => onConfirm({ 
              method, 
              tipValue: tip * 100, 
              tipType: 'flat',
              amountPaid: totalWithTip 
            })}
            disabled={isLoading}
            className="w-full bg-[#C97B2A] text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-[#C97B2A]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add missing X icon import if needed, but it's used in ChargeModal
import { X } from 'lucide-react';
