'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Phone, Mail, Settings, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBranchModal({ isOpen, onClose, onSuccess }: AddBranchModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'NG'
    },
    phone: '',
    email: '',
    operatingMode: 'DAY_BASED',
    reconciliationMode: 'per_day',
    settings: {
      taxRate: 7.5,
      acceptsCash: true,
      acceptsCard: true,
      acceptsTransfer: true,
      transferAccountName: '',
      transferAccountNumber: '',
      transferBankName: '',
      receiptFooter: 'Thank you for choosing us!'
    }
  });

  // Shift Template Builder State
  const [shifts, setShifts] = useState([
    { name: 'Morning', startTime: '08:00', endTime: '16:00', crossesMidnight: false },
    { name: 'Afternoon', startTime: '16:00', endTime: '00:00', crossesMidnight: true },
  ]);

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newForm = { ...prev };
      let current: any = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  const addShift = () => {
    setShifts([...shifts, { name: 'Night', startTime: '00:00', endTime: '08:00', crossesMidnight: false }]);
  };

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const updateShift = (index: number, field: string, value: any) => {
    const newShifts = [...shifts];
    (newShifts[index] as any)[field] = value;
    setShifts(newShifts);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // 1. Create Branch
      const branch: any = await api.post('/api/branches', formData);
      
      // 2. Create Shifts if Shift-Based
      if (formData.operatingMode === 'SHIFT_BASED' && shifts.length > 0) {
        await Promise.all(shifts.map(s => 
          api.post(`/api/branches/${branch._id}/shift-templates`, s)
        ));
      }

      toast.success('Branch created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
            <p className="text-xs text-gray-500 mt-0.5">Setup branch details, operations & settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* STEP INDICATOR */}
        <div className="px-6 py-3 bg-gray-50 flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-brand' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        {/* SCROLLABLE FORM AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">1</span>
                  Basic Information
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Name</label>
                  <input 
                    placeholder="e.g. Wuse II Branch"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                      placeholder="+234..."
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Official Email</label>
                    <input 
                      placeholder="branch@ordera.app"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-gray-700">Street Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      placeholder="Plot 1234..."
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <input 
                      placeholder="Abuja"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <input 
                      placeholder="FCT"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: OPERATION MODE */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">2</span>
                  Operating Model
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleInputChange('operatingMode', 'DAY_BASED')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.operatingMode === 'DAY_BASED' ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white'}`}
                  >
                    <Clock size={20} className={formData.operatingMode === 'DAY_BASED' ? 'text-brand' : 'text-gray-400'} />
                    <p className="font-bold text-sm mt-3">Day-Based</p>
                    <p className="text-[10px] text-gray-500 mt-1">Single business session per day. Unified totals.</p>
                  </div>
                  <div 
                    onClick={() => handleInputChange('operatingMode', 'SHIFT_BASED')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.operatingMode === 'SHIFT_BASED' ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white'}`}
                  >
                    <Settings size={20} className={formData.operatingMode === 'SHIFT_BASED' ? 'text-brand' : 'text-gray-400'} />
                    <p className="font-bold text-sm mt-3">Shift-Based</p>
                    <p className="text-[10px] text-gray-500 mt-1">Multiple sessions (Morning, etc.). Per-shift reconciliation.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-gray-700">Reconciliation Mode</label>
                  <select 
                    value={formData.reconciliationMode}
                    onChange={(e) => handleInputChange('reconciliationMode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="per_day">Reconcile per Day</option>
                    <option value="per_shift">Reconcile per Shift</option>
                  </select>
                </div>

                {formData.operatingMode === 'SHIFT_BASED' && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-gray-900">Configure Default Shifts</p>
                      <button 
                        type="button"
                        onClick={addShift}
                        className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Shift
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {shifts.map((shift, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <input 
                            className="text-xs font-bold w-full bg-transparent border-none outline-none"
                            value={shift.name}
                            onChange={(e) => updateShift(idx, 'name', e.target.value)}
                          />
                          <input 
                            type="time" 
                            className="text-xs outline-none bg-gray-50 p-1 rounded"
                            value={shift.startTime}
                            onChange={(e) => updateShift(idx, 'startTime', e.target.value)}
                          />
                          <span className="text-[10px] text-gray-400">to</span>
                          <input 
                            type="time" 
                            className="text-xs outline-none bg-gray-50 p-1 rounded"
                            value={shift.endTime}
                            onChange={(e) => updateShift(idx, 'endTime', e.target.value)}
                          />
                          <button onClick={() => removeShift(idx)} className="text-red-400 hover:text-red-600 ml-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: SETTINGS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">3</span>
                  Financials & Receipting
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">VAT / Tax Rate (%)</label>
                  <input 
                    type="number"
                    value={formData.settings.taxRate}
                    onChange={(e) => handleInputChange('settings.taxRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-gray-700">Accepted Payment Methods</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'Card', 'Transfer'].map(m => (
                      <label key={m} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={(formData.settings as any)[`accepts${m}`]}
                          onChange={(e) => handleInputChange(`settings.accepts${m}`, e.target.checked)}
                          className="w-4 h-4 rounded text-brand focus:ring-brand"
                        />
                        <span className="text-xs font-medium">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.settings.acceptsTransfer && (
                  <div className="p-4 bg-brand/5 border border-brand/10 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-brand">Bank Transfer Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Bank Name"
                        value={formData.settings.transferBankName}
                        onChange={(e) => handleInputChange('settings.transferBankName', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-brand/20 rounded-lg bg-white outline-none"
                      />
                      <input 
                        placeholder="Account Number"
                        value={formData.settings.transferAccountNumber}
                        onChange={(e) => handleInputChange('settings.transferAccountNumber', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-brand/20 rounded-lg bg-white outline-none"
                      />
                    </div>
                    <input 
                      placeholder="Account Name (e.g. Ordera Ltd - Wuse)"
                      value={formData.settings.transferAccountName}
                      onChange={(e) => handleInputChange('settings.transferAccountName', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-brand/20 rounded-lg bg-white outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-gray-700">Receipt Footer Message</label>
                  <textarea 
                    rows={2}
                    placeholder="Thank you for choosing us!"
                    value={formData.settings.receiptFooter}
                    onChange={(e) => handleInputChange('settings.receiptFooter', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-50 rounded-xl transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand/20 transition-all"
            >
              Next Step
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand/20 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Branch'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
