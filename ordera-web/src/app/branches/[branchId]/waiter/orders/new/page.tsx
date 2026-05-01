'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Users, 
  Hash, 
  User, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewOrderPage() {
  const { branchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    tableNumber: '',
    guestCount: 1,
    customerName: '',
    type: 'DINE_IN'
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/orders', data),
    onSuccess: (order: any) => {
      queryClient.invalidateQueries({ queryKey: ['waiter-active-orders', branchId] });
      queryClient.invalidateQueries({ queryKey: ['waiter-stats', branchId] });
      toast.success('Order created successfully');
      router.push(`/branches/${branchId}/waiter/orders/${order._id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create order');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate(formData);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-muted transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-[#1A1A2E]">New Order</h1>
          <p className="text-gray-500">Enter table details to begin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Table Number */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Table Number
            </label>
            <input 
              type="text"
              required
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              placeholder="e.g. 5, 12, VIP-1"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-lg font-bold text-muted placeholder:text-gray-300 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Guests
              </label>
              <input 
                type="number"
                min={1}
                required
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value ? parseInt(e.target.value) : '' as any })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-lg font-bold text-muted transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Type
              </label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm font-bold text-muted transition-all appearance-none"
              >
                <option value="DINE_IN">Dine In</option>
                <option value="TAKEAWAY">Takeaway</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Customer Name (Optional)
            </label>
            <input 
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-lg font-bold text-muted placeholder:text-gray-300 transition-all"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={createOrderMutation.isPending}
          className="w-full bg-[#1A1A2E] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#1A1A2E]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {createOrderMutation.isPending ? 'Creating...' : 'Continue to Menu'} <ArrowRight size={22} />
        </button>
      </form>
    </div>
  );
}
