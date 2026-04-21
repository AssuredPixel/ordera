'use client';

import { useState } from 'react';
import { X, Mail, User, Shield, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  branches?: any[];
  onSuccess: () => void;
}

export function InviteStaffModal({ isOpen, onClose, branchId, onSuccess }: InviteStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'cashier',
    branchId: branchId || '',
  });

  const roles = [
    { value: 'branch_manager', label: 'Branch Manager', desc: 'Full control over this branch' },
    { value: 'supervisor', label: 'Supervisor', desc: 'Can manage shifts and orders' },
    { value: 'cashier', label: 'Cashier', desc: 'Primary order entry and payments' },
    { value: 'waiter', label: 'Waiter', desc: 'Entry of orders from tables' },
    { value: 'kitchen_staff', label: 'Kitchen', desc: 'Viewing and processing tickets' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/api/invitations', {
        ...formData,
        branchId: branchId || formData.branchId,
      });
      toast.success(`Invitation sent to ${formData.email}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Invite Staff Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required
                  placeholder="John"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Last Name</label>
              <input 
                required
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                required
                type="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
              />
            </div>
          </div>

          {!branchId && branches && branches.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Assign to Branch</label>
              <select
                required
                value={formData.branchId}
                onChange={e => setFormData({...formData, branchId: e.target.value})}
                className="w-full px-4 py-2 bg-gray-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand text-sm"
              >
                <option value="">Select a branch...</option>
                {branches.map(b => (
                  <option key={b.branchId || b._id} value={b.branchId || b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Assign Role</label>
            <div className="space-y-2">
              {roles.map(role => (
                <label 
                  key={role.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.role === role.value ? 'border-brand bg-brand/5' : 'border-gray-50 hover:bg-gray-50'}`}
                >
                  <input 
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.role === role.value ? 'border-brand' : 'border-gray-300'}`}>
                    {formData.role === role.value && <div className="w-2 h-2 bg-brand rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{role.label}</p>
                    <p className="text-[10px] text-gray-500">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand/20 transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Send size={18} />
                Send Invitation
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
