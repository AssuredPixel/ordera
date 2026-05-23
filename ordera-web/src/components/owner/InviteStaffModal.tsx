'use client';

import { useState } from 'react';
import {
  X, Mail, User, Loader2, Send, CheckCircle2, Copy, Link2, 
  MessageCircle, Shield, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  branches?: any[];
  onSuccess: () => void;
}

export function InviteStaffModal({ isOpen, onClose, branchId, branches, onSuccess }: InviteStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [inviteLink, setInviteLink] = useState('');
  const [invitedName, setInvitedName] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'cashier',
    branchId: branchId || '',
  });

  const roles = [
    { value: 'branch_manager', label: 'Branch Manager', desc: 'Full control over this branch', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: 'supervisor', label: 'Supervisor', desc: 'Can manage shifts and orders', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { value: 'cashier', label: 'Cashier', desc: 'Primary order entry and payments', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { value: 'waiter', label: 'Waiter', desc: 'Entry of orders from tables', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { value: 'kitchen_staff', label: 'Kitchen Staff', desc: 'Viewing and processing tickets', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response: any = await api.post('/api/invitations', {
        ...formData,
        branchId: branchId || formData.branchId,
      });

      const link = `${window.location.origin}/register/staff?token=${response.token}`;
      setInviteLink(link);
      setInvitedName(formData.firstName);
      setStep('success');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!', {
        description: 'Share it via WhatsApp, SMS, or any channel.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep('form');
    setFormData({ firstName: '', lastName: '', email: '', role: 'cashier', branchId: branchId || '' });
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  const handleInviteAnother = () => {
    setStep('form');
    setFormData({ firstName: '', lastName: '', email: '', role: 'cashier', branchId: branchId || '' });
    setInviteLink('');
    setCopied(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* ── STICKY HEADER ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                {step === 'success'
                  ? <CheckCircle2 size={16} className="text-brand" />
                  : <User size={16} className="text-brand" />
                }
              </div>
              <h2 className="text-base font-bold text-gray-900">
                {step === 'success' ? 'Invitation Sent!' : 'Invite Staff Member'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-900"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="overflow-y-auto flex-1 min-h-0">

            {/* ──── SUCCESS STEP ──── */}
            {step === 'success' && (
              <div className="p-6 space-y-5">
                {/* Success banner */}
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={22} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Invitation sent to {invitedName}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      An email has been dispatched. You can also share the link below directly.
                    </p>
                  </div>
                </div>

                {/* Link box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                    <Link2 size={12} />
                    Invitation Link
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-600 flex-1 truncate font-mono">{inviteLink}</p>
                  </div>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-brand text-white hover:shadow-lg hover:shadow-brand/20'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Invite Link
                    </>
                  )}
                </button>

                {/* WhatsApp share hint */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <MessageCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Tip:</strong> Copy the link above and send it via WhatsApp. Your staff member
                    clicks it to set their password and join your branch instantly — no email required.
                  </p>
                </div>
              </div>
            )}

            {/* ──── FORM STEP ──── */}
            {step === 'form' && (
              <form id="invite-staff-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        placeholder="John"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Last Name</label>
                    <input
                      required
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="email"
                      placeholder="staff@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm transition"
                    />
                  </div>
                </div>

                {/* Branch selector (only shown when no branchId is pre-set) */}
                {!branchId && branches && branches.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Assign to Branch</label>
                    <select
                      required
                      value={formData.branchId}
                      onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm transition"
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

                {/* Role picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                    <Shield size={12} />
                    Assign Role
                  </label>
                  <div className="space-y-1.5">
                    {roles.map(role => {
                      const isSelected = formData.role === role.value;
                      return (
                        <label
                          key={role.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? `${role.border} ${role.bg}`
                              : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={isSelected}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? role.border : 'border-gray-300'}`}>
                            {isSelected && <div className={`w-2 h-2 rounded-full ${role.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${isSelected ? role.color : 'text-gray-800'}`}>{role.label}</p>
                            <p className="text-[10px] text-gray-500 truncate">{role.desc}</p>
                          </div>
                          {isSelected && <ChevronRight size={14} className={`ml-auto shrink-0 ${role.color}`} />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── STICKY FOOTER ── */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-3xl">
            {step === 'success' ? (
              <div className="flex gap-3">
                <button
                  onClick={handleInviteAnother}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition"
                >
                  Invite Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                type="submit"
                form="invite-staff-form"
                disabled={isLoading}
                className="w-full py-3 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={16} />
                    Send Invitation
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
