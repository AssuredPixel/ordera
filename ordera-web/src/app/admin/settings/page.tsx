'use client';

import { useEffect, useState } from 'react';
import { 
  Settings,
  CreditCard,
  Mail,
  Megaphone,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Zap,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/api/platform/settings');
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load platform settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/api/platform/settings', settings);
      toast.success('Platform settings updated successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-display text-[32px] text-sidebar">Platform Settings</h1>
          <p className="text-muted text-sm mt-1">Configure global pricing, payment gateways, and system notifications</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand text-sidebar rounded-xl font-bold hover:shadow-lg hover:shadow-brand/20 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Platform Changes
        </button>
      </div>

      <div className="flex gap-8">
        {/* TABS SIDEBAR */}
        <div className="w-64 shrink-0 space-y-1">
          {[
            { id: 'plans', label: 'Subscription Plans', icon: Globe },
            { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
            { id: 'ai', label: 'AI Engine Config', icon: Zap },
            { id: 'emails', label: 'Email Templates', icon: Mail },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand text-sidebar shadow-md' 
                  : 'text-muted hover:bg-gray-100 hover:text-sidebar'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-8">
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-sidebar">Subscription Plans</h3>
                  <button className="text-xs font-bold text-brand bg-brand/5 px-3 py-1.5 rounded-lg border border-brand/20 flex items-center gap-1.5 hover:bg-brand/10 transition-all">
                    <Plus size={14} /> Add Plan
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {settings.plans.map((plan: any, idx: number) => (
                    <div key={idx} className="p-4 border border-border-light rounded-xl bg-surface/50 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          <input 
                            value={plan.name}
                            onChange={(e) => {
                              const newPlans = [...settings.plans];
                              newPlans[idx].name = e.target.value;
                              setSettings({...settings, plans: newPlans});
                            }}
                            className="bg-transparent font-bold text-sidebar outline-none border-b border-transparent focus:border-brand"
                          />
                          {plan.isPopular && <span className="bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Popular</span>}
                        </div>
                        <div className="flex gap-2">
                           <button className="p-1.5 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Price (NGN)</label>
                          <input 
                            type="number"
                            value={plan.price}
                            onChange={(e) => {
                              const newPlans = [...settings.plans];
                              newPlans[idx].price = Number(e.target.value);
                              setSettings({...settings, plans: newPlans});
                            }}
                            className="w-full bg-white border border-border-light rounded-lg px-3 py-1.5 text-sm font-bold text-sidebar"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Branch Limit</label>
                          <input 
                            type="number"
                            value={plan.branchLimit}
                            onChange={(e) => {
                              const newPlans = [...settings.plans];
                              newPlans[idx].branchLimit = Number(e.target.value);
                              setSettings({...settings, plans: newPlans});
                            }}
                            className="w-full bg-white border border-border-light rounded-lg px-3 py-1.5 text-sm font-bold text-sidebar"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Staff Limit</label>
                          <input 
                            type="number"
                            value={plan.staffLimit}
                            onChange={(e) => {
                              const newPlans = [...settings.plans];
                              newPlans[idx].staffLimit = Number(e.target.value);
                              setSettings({...settings, plans: newPlans});
                            }}
                            className="w-full bg-white border border-border-light rounded-lg px-3 py-1.5 text-sm font-bold text-sidebar"
                          />
                        </div>
                        <div className="flex items-end pb-1.5">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={plan.isPopular}
                                onChange={(e) => {
                                  const newPlans = [...settings.plans];
                                  newPlans[idx].isPopular = e.target.checked;
                                  setSettings({...settings, plans: newPlans});
                                }}
                                className="w-4 h-4 rounded text-brand accent-brand" 
                              />
                              <span className="text-xs font-bold text-sidebar">Most Popular</span>
                           </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-10">
                {/* PAYSTACK */}
                <div className="p-6 border border-border-light rounded-2xl">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center font-bold text-emerald-600">P</div>
                        <h4 className="font-bold text-sidebar">Paystack Gateway</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.gateways?.paystack?.isEnabled} 
                          className="sr-only peer" 
                          onChange={(e) => {
                             setSettings({
                               ...settings, 
                               gateways: { 
                                 ...settings.gateways, 
                                 paystack: { ...settings.gateways.paystack, isEnabled: e.target.checked }
                               }
                             });
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                   </div>
                   
                   <div className="grid gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1.5">Public Key</label>
                        <input 
                          type="text"
                          value={settings.gateways?.paystack?.publicKey || ''}
                          className="w-full bg-surface border border-border-light rounded-xl px-4 py-2.5 text-sm font-mono"
                          placeholder="pk_live_..."
                          onChange={(e) => {
                            setSettings({
                              ...settings, 
                              gateways: { 
                                ...settings.gateways, 
                                paystack: { ...settings.gateways.paystack, publicKey: e.target.value }
                              }
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1.5">Secret Key</label>
                        <input 
                          type="password"
                          value={settings.gateways?.paystack?.secretKey || ''}
                          className="w-full bg-surface border border-border-light rounded-xl px-4 py-2.5 text-sm font-mono"
                          placeholder="sk_live_..."
                          onChange={(e) => {
                            setSettings({
                              ...settings, 
                              gateways: { 
                                ...settings.gateways, 
                                paystack: { ...settings.gateways.paystack, secretKey: e.target.value }
                              }
                            });
                          }}
                        />
                      </div>
                   </div>
                </div>

                {/* STRIPE */}
                <div className="p-6 border border-border-light rounded-2xl opacity-60">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600">S</div>
                        <div>
                          <h4 className="font-bold text-sidebar">Stripe Gateway</h4>
                          <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Global Payments</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-muted bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div className="p-6 bg-brand/5 border border-brand/20 rounded-2xl flex gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-sidebar shrink-0 shadow-lg">
                    <Zap size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-sidebar mb-2">AI Cost Controls</h4>
                    <p className="text-sm text-sidebar/70 max-w-lg mb-6 leading-relaxed">
                      Configure the raw cost factors for AI query processing. These values directly affect the estimated cost analytics across all organization usage dashboards.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-xl border border-brand/10 shadow-sm">
                        <label className="text-[10px] font-bold text-muted uppercase block mb-2">Cost per 1k Tokens (NGN)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-sidebar">₦</span>
                          <input 
                            type="number"
                            step="0.001"
                            value={settings.aiTokenPrice}
                            onChange={(e) => setSettings({...settings, aiTokenPrice: Number(e.target.value)})}
                            className="bg-transparent text-xl font-bold text-sidebar outline-none w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'emails' && (
              <div className="space-y-6">
                 <p className="text-sm text-muted">Update raw HTML templates for platform emails. Use double braces for variables like <code>{`{{name}}`}</code>.</p>
                 <div className="grid gap-6">
                    {['Welcome Email', 'Subscription Failure', 'Invoice Receipt'].map((name) => (
                      <div key={name}>
                        <label className="text-[11px] font-bold text-sidebar uppercase tracking-wider mb-2 block">{name}</label>
                        <textarea 
                          rows={10}
                          placeholder="<html>...</html>"
                          className="w-full bg-surface border border-border-light rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="space-y-10">
                 <div className="p-8 border-2 border-dashed border-border-light rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Megaphone size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sidebar tracking-tight">System-Wide Banner</h4>
                            <p className="text-xs text-muted">Pinned to the top of all tenant dashboards</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.announcement?.isActive}
                          onChange={(e) => {
                             setSettings({
                               ...settings,
                               announcement: { ...settings.announcement, isActive: e.target.checked }
                             });
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    <textarea 
                       rows={4}
                       placeholder="e.g. Platform maintenance scheduled for tomorrow at 2 AM GMT..."
                       value={settings.announcement?.text || ''}
                       onChange={(e) => {
                          setSettings({
                            ...settings,
                            announcement: { ...settings.announcement, text: e.target.value, version: Date.now() }
                          });
                       }}
                       className="w-full bg-surface border border-border-light rounded-xl p-4 text-sm font-medium text-sidebar outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                        <ShieldCheck size={14} className="text-orange-500" />
                        Announcement will be reset for all users if content is changed.
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
