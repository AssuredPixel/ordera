'use client';

import { useEffect, useState } from 'react';
import { Clock, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

export function TrialBanner() {
  const { organization } = useAuthStore();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (organization?.subscriptionId?.status === 'trial' && organization?.subscriptionId?.trialEnd) {
      const end = new Date(organization.subscriptionId.trialEnd);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days > 0 ? days : 0);
    }
  }, [organization]);

  if (daysLeft === null || organization?.subscriptionId?.status !== 'trial') {
    return null;
  }

  return (
    <div className="bg-brand text-white px-6 py-2 flex items-center justify-between border-b border-white/10 shadow-sm relative z-40">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-1.5 rounded-full">
          <Clock size={16} className="animate-pulse" />
        </div>
        <p className="text-sm font-medium">
          You are currently on a <span className="font-bold">14-day Free Trial</span>. 
          Your trial ends in <span className="underline decoration-2 underline-offset-4 decoration-amber-300 font-bold">{daysLeft} days</span>.
        </p>
      </div>
      <Link 
        href="https://paystack.shop/pay/ikxflcjpka" // Default to Pro or show upgrade page if available
        target="_blank"
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-brand rounded-full text-xs font-bold hover:bg-amber-50 transition-all shadow-md"
      >
        <CreditCard size={14} />
        Upgrade Now
      </Link>
    </div>
  );
}
