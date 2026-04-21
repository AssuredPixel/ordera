'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, Loader2, Save, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function BranchShiftsTab({ branchId }: { branchId: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newShift, setNewShift] = useState({
    name: 'New Shift',
    startTime: '09:00',
    endTime: '17:00',
    crossesMidnight: false
  });

  useEffect(() => {
    fetchTemplates();
  }, [branchId]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data: any = await api.get(`/api/branches/${branchId}/shift-templates`);
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load shift templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddShift = async () => {
    try {
      await api.post(`/api/branches/${branchId}/shift-templates`, newShift);
      toast.success('Shift template added');
      setIsAdding(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add shift');
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift template?')) return;
    try {
      await api.delete(`/api/shift-templates/${id}`);
      toast.success('Shift template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete shift');
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
           <h3 className="text-lg font-bold text-gray-900">Shift Templates</h3>
           <p className="text-xs text-gray-500">Define recurring shifts for this branch.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand/20 transition-all w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((shift) => (
          <div key={shift._id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
             <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                   <Clock size={20} />
                </div>
                <button 
                  onClick={() => handleDeleteShift(shift._id)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   <Trash2 size={16} />
                </button>
             </div>
             <h4 className="text-sm font-bold text-gray-900 mb-1">{shift.name}</h4>
             <p className="text-xs text-gray-500 font-medium">
                {shift.startTime} — {shift.endTime}
                {shift.crossesMidnight && <span className="ml-2 text-brand font-bold">(Ends Next Day)</span>}
             </p>
          </div>
        ))}

        {isAdding && (
          <div className="bg-brand/5 border-2 border-dashed border-brand/20 rounded-3xl p-6 space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-brand uppercase">New Template</p>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                   <X size={16} />
                </button>
             </div>
             <input 
               placeholder="Shift Name"
               value={newShift.name}
               onChange={e => setNewShift({...newShift, name: e.target.value})}
               className="w-full px-4 py-2.5 text-sm bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand"
             />
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Start</label>
                   <input 
                     type="time"
                     value={newShift.startTime}
                     onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                     className="w-full px-2 py-1.5 text-xs bg-white rounded border border-gray-100 outline-none"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">End</label>
                   <input 
                     type="time"
                     value={newShift.endTime}
                     onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                     className="w-full px-2 py-1.5 text-xs bg-white rounded border border-gray-100 outline-none"
                   />
                </div>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                   type="checkbox" 
                   checked={newShift.crossesMidnight}
                   onChange={e => setNewShift({...newShift, crossesMidnight: e.target.checked})}
                   className="w-3 h-3 text-brand rounded"
                />
                <span className="text-[10px] font-bold text-gray-500">Ends after midnight</span>
             </label>
             <button 
                onClick={handleAddShift}
                className="w-full py-2 bg-brand text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-brand/20 transition"
             >
                Save Template
             </button>
          </div>
        )}
      </div>

      {templates.length === 0 && !isAdding && (
         <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <Clock size={32} className="text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium">No shift templates defined for this branch.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-4 text-brand text-sm font-bold hover:underline"
            >
              + Create your first template
            </button>
         </div>
      )}
    </div>
  );
}
