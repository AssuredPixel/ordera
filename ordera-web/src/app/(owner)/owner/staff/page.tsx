'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  Shield,
  UserMinus,
  ArrowLeftRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { InviteStaffModal } from '@/components/owner/InviteStaffModal';

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, branchesRes]: [any, any] = await Promise.all([
        api.get('/api/owner/staff'),
        api.get('/api/owner/dashboard/stats')
      ]);
      setStaff(staffRes);
      setBranches(branchesRes.branchSummaries || []);
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member? They will no longer be able to log in.')) return;
    setActionLoading(staffId);
    try {
      await api.delete(`/api/owner/staff/${staffId}`);
      await fetchData();
    } catch (error) {
      alert('Failed to deactivate staff');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransfer = async (staffId: string, branchId: string) => {
    setActionLoading(staffId);
    try {
      await api.patch(`/api/owner/staff/${staffId}/transfer`, { branchId });
      await fetchData();
    } catch (error) {
      alert('Failed to transfer staff');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStaff = staff.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = (s.email || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'all' || s.branchId === filterBranch;
    return matchesSearch && matchesBranch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage your workforce across all restaurant branches</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Invite New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Staff</p>
            <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Now</p>
            <p className="text-2xl font-bold text-slate-900">{staff.filter(s => s.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Avg. Per Branch</p>
            <p className="text-2xl font-bold text-slate-900">
              {branches.length > 0 ? (staff.length / branches.length).toFixed(1) : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 text-sm" />
            <select
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Current Branch</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 opacity-20" />
                      <p>No staff members found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs overflow-hidden">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            `${s.firstName[0]}${s.lastName[0]}`
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {branches.find(b => b.branchId === s.branchId)?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-50 text-purple-700 uppercase border border-purple-100">
                        {s.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Idle
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="dropdown dropdown-end group/transfer relative">
                          <button
                            onClick={(e) => {
                              // Dropdown logic is handled by CSS hover in this implementation
                            }}
                            className="h-8 w-8 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center rounded-lg transition-colors"
                            disabled={actionLoading === s._id}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 hidden group-hover/transfer:block z-50 bg-white border border-slate-200 rounded-xl shadow-2xl min-w-[180px] p-2">
                            <p className="text-[9px] uppercase font-black text-slate-400 px-3 py-2">Transfer Staff to</p>
                            {branches.filter(b => b.branchId !== s.branchId).map(b => (
                              <button
                                key={b.branchId}
                                onClick={() => handleTransfer(s._id, b.branchId)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors font-medium"
                              >
                                {b.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeactivate(s._id)}
                          className="h-8 w-8 hover:text-red-500 hover:bg-red-50 flex items-center justify-center rounded-lg transition-colors"
                          disabled={actionLoading === s._id || !s.isActive}
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteStaffModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        branches={branches}
        onSuccess={fetchData}
      />
    </div>
  );
}
