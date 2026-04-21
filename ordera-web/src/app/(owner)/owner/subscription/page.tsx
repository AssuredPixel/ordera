'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  LayoutGrid, 
  Users, 
  ArrowRight,
  Loader2,
  Clock,
  ExternalLink,
  ShieldCheck,
  History
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SubscriptionPage() {
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usageData, invoicesData]: [any, any] = await Promise.all([
        api.get('/api/billing/owner/usage'),
        api.get('/api/billing/owner/invoices'),
      ]);
      setUsage(usageData);
      setInvoices(invoicesData);
    } catch (err) {
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, gateway: 'paystack' | 'stripe') => {
    setIsProcessing(true);
    try {
      const endpoint = gateway === 'paystack' 
        ? '/api/billing/paystack/initialize' 
        : '/api/billing/stripe/checkout';
      
      const res: any = await api.post(endpoint, { plan });
      const url = gateway === 'paystack' ? res.authorization_url : res.url;
      
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment initialization failed');
      setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
       <Loader2 className="animate-spin text-brand" size={48} />
    </div>
  );

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '49,000',
      description: 'Perfect for single-location restaurants starting their journey.',
      features: ['1 Branch Location', 'Up to 5 Staff', 'Core POS Features', 'Email Support'],
      limits: { branches: 1, staff: 5 }
    },
    {
      id: 'bread', // Growth
      name: 'Growth',
      price: '99,000',
      description: 'Built for growing businesses with multiple locations.',
      features: ['Up to 3 Branches', 'Up to 15 Staff', 'Advanced Analytics', 'Priority Support'],
      limits: { branches: 3, staff: 15 },
      popular: true
    },
    {
      id: 'feast', // Pro
      name: 'Pro (Feast)',
      price: '199,000',
      description: 'Unlimited power for established restaurant groups.',
      features: ['Unlimited Branches', 'Unlimited Staff', 'AI Insights', 'dedicated Account Manager'],
      limits: { branches: 'Unlimited', staff: 'Unlimited' }
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* PAST DUE BANNER */}
      {usage?.status === 'past_due' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={24} />
              <div>
                 <p className="text-sm font-bold text-amber-900">Payment Required</p>
                 <p className="text-xs text-amber-700">Your last payment failed. Please update your billing info to maintain access.</p>
              </div>
           </div>
           <button className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20">
              Update Billing
           </button>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-4xl font-serif text-gray-900">Subscription & Billing</h1>
           <p className="text-gray-500 font-medium">Manage your plan, billing history, and organization limits.</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-2xl border border-success/20">
           <CheckCircle2 size={18} />
           <span className="text-sm font-bold uppercase tracking-wider">{usage?.status || 'ACTIVE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CURRENT PLAN CARD */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-brand/5">
              <ShieldCheck size={120} />
           </div>
           <div className="space-y-8 relative z-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-brand uppercase tracking-widest">Your Current Plan</p>
                 <h2 className="text-3xl font-serif text-gray-900 capitalize">{usage?.plan || 'Starter'}</h2>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                       <span>Branches</span>
                       <span>{usage?.branches.used} / {usage?.branches.limit}</span>
                    </div>
                    <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-brand rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (usage?.branches.used / (typeof usage?.branches.limit === 'number' ? usage?.branches.limit : 1)) * 100)}%` }} 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                       <span>Team Staff</span>
                       <span>{usage?.staff.used} / {usage?.staff.limit}</span>
                    </div>
                    <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-brand rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (usage?.staff.used / (typeof usage?.staff.limit === 'number' ? usage?.staff.limit : 1)) * 100)}%` }} 
                       />
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                 <Clock className="text-gray-400" size={18} />
                 <p className="text-xs text-gray-500 font-medium">Renews on <span className="text-gray-900 font-bold">April 24, 2026</span></p>
              </div>
           </div>

           <button className="mt-10 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-xl shadow-gray-900/10">
              <CreditCard size={18} />
              Manage Billing Portal
           </button>
        </div>

        {/* PLAN COMPARISON */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
           {plans.filter(p => p.id !== usage?.plan).map((plan) => (
             <div key={plan.id} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm flex flex-col hover:border-brand/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand">
                      <Zap size={24} />
                   </div>
                   {plan.popular && (
                     <span className="px-3 py-1 bg-brand text-white text-[10px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-brand/20">Most Popular</span>
                   )}
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                   <span className="text-3xl font-black text-gray-900">₦{plan.price}</span>
                   <span className="text-gray-500 text-sm font-medium">/month</span>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-6">{plan.description}</p>
                <div className="space-y-3 mb-10 flex-grow">
                   {plan.features.map((f, i) => (
                     <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <CheckCircle2 size={14} className="text-brand shrink-0" />
                        {f}
                     </div>
                   ))}
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => handleUpgrade(plan.id, 'paystack')}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 bg-brand text-white rounded-2xl font-bold text-xs shadow-lg shadow-brand/10 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                   >
                     {isProcessing ? <Loader2 className="animate-spin inline mr-1" size={14} /> : 'Paystack (NGN)'}
                   </button>
                   <button 
                    onClick={() => handleUpgrade(plan.id, 'stripe')}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-bold text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
                   >
                     Stripe (USD)
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* PAYMENT HISTORY */}
      <div className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
               <History size={20} />
            </div>
            <h3 className="text-2xl font-serif text-gray-900">Payment History</h3>
         </div>
         
         {invoices.length > 0 ? (
           <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr>
                     <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest line-clamp-1">Date</th>
                     <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Plan</th>
                     <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Amount</th>
                     <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Receipt</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {invoices.map((inv, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-gray-900">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-900 capitalize">{inv.plan}</td>
                        <td className="px-8 py-6 text-sm font-black text-brand">₦{inv.amount.amount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                           <div className={`px-3 py-1 rounded-full text-[10px] font-black w-fit uppercase ${inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-red-50 text-red-500'}`}>
                              {inv.status}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="text-brand hover:underline p-2">
                              <ExternalLink size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>
         ) : (
           <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[40px] p-20 text-center">
              <p className="text-gray-500 font-medium">No payment history found yet.</p>
           </div>
         )}
      </div>
    </div>
  );
}
