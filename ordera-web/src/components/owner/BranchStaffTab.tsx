'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Shield, MoreVertical, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { InviteStaffModal } from './InviteStaffModal';

export function BranchStaffTab({ branchId }: { branchId: string }) {
  const [data, setData] = useState<{ active: any[], pending: any[] }>({ active: [], pending: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [branchId]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/api/branches/${branchId}/staff`);
      setData(res);
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await api.delete(`/api/invitations/${id}`);
      toast.success('Invitation revoked');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to revoke invitation');
    }
  };

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-brand" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-bold text-gray-900">Branch Staff</h3>
           <p className="text-xs text-gray-500">Manage employees and invitations for this location.</p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand/20 transition-all w-full sm:w-auto"
        >
          <UserPlus size={18} />
          Invite Staff
        </button>
      </div>

      <div className="space-y-6">
        {/* PENDING INVITATIONS */}
        {data.pending.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Pending Invitations ({data.pending.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.pending.map((inv) => (
                <div key={inv._id} className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                       <Mail size={18} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">{inv.firstName} {inv.lastName}</p>
                       <div className="flex items-center gap-2 mt-0.5">
                         <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[9px] font-bold rounded uppercase">{inv.role.replace('_', ' ')}</span>
                         <span className="text-[10px] text-gray-400 font-medium">{inv.email}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                       onClick={() => handleRevokeInvitation(inv._id)}
                       className="p-2 text-gray-400 hover:text-red-500 transition"
                       title="Revoke invitation"
                    >
                       <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE STAFF */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Active Staff ({data.active.length})</h4>
          {data.active.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.active.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center text-brand font-bold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-[10px] text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg uppercase">
                             {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-gray-600">{user.email}</p>
                            <p className="text-[10px] text-gray-400">{user.phoneNumber || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-success" />
                             <span className="text-[10px] font-bold text-success">ACTIVE</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                              <MoreVertical size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
             <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
               <p className="text-sm text-gray-500 font-medium">No active staff members yet.</p>
             </div>
          )}
        </div>
      </div>

      <InviteStaffModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        branchId={branchId}
        onSuccess={fetchStaff}
      />
    </div>
  );
}
