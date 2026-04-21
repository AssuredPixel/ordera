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
    <div className="bg-brand text-white px-4 sm:px-6 py-2.5 sm:py-2 flex sm:flex-row flex-col items-center justify-between gap-3 border-b border-white/10 shadow-sm relative z-40">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="bg-white/20 p-1.5 rounded-full shrink-0">
          <Clock size={16} className="animate-pulse" />
        </div>
        <p className="text-[11px] sm:text-sm font-medium leading-snug">
          You are currently on a <span className="font-bold whitespace-nowrap">14-day Free Trial</span>. 
          Trial ends in <span className="underline decoration-2 underline-offset-4 decoration-amber-300 font-bold whitespace-nowrap">{daysLeft} days</span>.
        </p>
      </div>
      <Link 
        href="https://paystack.shop/pay/ikxflcjpka" 
        target="_blank"
        className="flex items-center justify-center gap-2 px-6 py-1.5 bg-white text-brand rounded-full text-[10px] sm:text-xs font-bold hover:bg-amber-50 transition-all shadow-md w-full sm:w-auto"
      >
        <CreditCard size={14} />
        Upgrade Now
      </Link>
    </div>
  );
}
