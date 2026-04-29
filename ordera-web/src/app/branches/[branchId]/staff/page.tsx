'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  BarChart3, 
  MoreHorizontal, 
  RefreshCw,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { InviteStaffModal } from '@/components/owner/InviteStaffModal';
import { toast } from 'sonner';
import { StaffMember, Invitation, StaffPerformance } from '@/types/ordera';
import { useRealtime } from '@/lib/realtime-hook';

export default function StaffManagement() {
  const { branchId } = useParams();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Real-time Updates
  useRealtime(`branch-${branchId}`, 'order:update', () => {
    queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
  });

  useRealtime(`branch-${branchId}`, 'bill:paid', () => {
    queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
  });

  // 1. Fetch Staff Data (Active + Pending)
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: async () => {
      const data = await api.get<any>(`/api/branches/${branchId}/staff`);
      return data;
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/api/invitations/${id}/resend`),
    onSuccess: () => toast.success('Invitation resent successfully'),
    onError: (err: any) => toast.error(err.message || 'Failed to resend')
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/invitations/${id}/revoke`),
    onSuccess: () => {
      toast.success('Invitation revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['branch-staff', branchId] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to revoke')
  });

  // 2. Fetch Dashboard Stats (for performance table)
  const { data: statsData } = useQuery({
    queryKey: ['branch-stats', branchId],
    queryFn: async () => {
      const data = await api.get<any>(`/api/dashboard/branch/${branchId}/stats`);
      return data;
    },
  });

  const activeStaff = staffData?.active || [];
  const pendingInvites = staffData?.pending || [];
  const performance = statsData?.performance || [];

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A2E]">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage team members and monitor performance.</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#C97B2A] text-white rounded-2xl font-bold shadow-lg shadow-[#C97B2A]/20 hover:bg-[#B86A19] transition-all"
        >
          <UserPlus size={20} />
          Invite Staff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── PERFORMANCE TABLE (Main focus) ── */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Live Performance" icon={BarChart3}>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Staff member</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Orders</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Revenue Today</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right text-transparent">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {performance.length > 0 ? performance.map((p: StaffPerformance) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-muted uppercase">
                            {p.waiterName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-muted">{p.waiterName}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tight">Active</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">
                        {p.ordersCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-display text-[#C97B2A]">
                          \u20A6{(p.revenue / 100).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">
                        No transactional data for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Active List */}
          <Section title="Team Directory" icon={Users}>
            <div className="bg-white rounded-3xl border border-gray-100 p-2 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeStaff.map((member: StaffMember) => (
                <div key={member._id} className="p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1A2E]/5 text-[#1A1A2E] flex items-center justify-center font-bold text-xl">
                    {member.firstName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-muted truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Shield size={10} /> {member.role.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN: Invitations ── */}
        <div className="space-y-8">
          <div className="p-6 rounded-3xl bg-[#1A1A2E] text-white shadow-xl">
            <h3 className="font-display text-2xl flex items-center gap-2 mb-6">
              <Mail className="text-[#C97B2A]" size={20} /> Pending
            </h3>

            <div className="space-y-4">
              {pendingInvites.length > 0 ? pendingInvites.map((invite: Invitation) => (
                <div key={invite._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{invite.firstName} {invite.lastName}</p>
                      <p className="text-xs text-white/40 truncate">{invite.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => resendMutation.mutate(invite._id)}
                        disabled={resendMutation.isPending}
                        title="Resend Invitation"
                        className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-[#C97B2A] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => revokeMutation.mutate(invite._id)}
                        disabled={revokeMutation.isPending}
                        title="Revoke Invitation"
                        className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold uppercase text-white/60">
                      {invite.role}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                      <Clock size={10} /> Pending
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-center text-white/20 text-xs py-10">No pending invitations</p>
              )}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-muted mb-4 uppercase tracking-widest text-center">Help Center</h4>
            <p className="text-xs text-gray-500 leading-relaxed text-center">
              Invite staff to assign them roles. They will receive an email to complete their registration.
              Only managers and owners can manage team members.
            </p>
          </div>
        </div>
      </div>

      <InviteStaffModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        branchId={branchId as string}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branch-staff', branchId] });
          toast.success('Staff member invited successfully');
        }}
      />
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-display text-2xl text-[#1A1A2E]">
        <Icon className="text-gray-400" size={24} /> {title}
      </h3>
      {children}
    </div>
  );
}
