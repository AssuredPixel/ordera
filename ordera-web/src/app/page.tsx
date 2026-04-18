'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import { api } from '@/lib/api';
import { 
  Building2, 
  Users2, 
  BarChart3, 
  CheckCircle2, 
  ChevronRight,
  ArrowDown,
  Loader2
} from 'lucide-react';

export default function MarketingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await api.get<any[]>('/api/platform/public/plans');
        setPlans(data);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* SECTION 1 — HERO */}
      <section className="bg-sidebar pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-brand text-xs font-bold tracking-widest uppercase">
                Restaurant Management, Reimagined
              </span>
            </div>
          </div>

          <h1 className="font-display text-white text-6xl md:text-8xl leading-[0.9] mb-8 max-w-4xl mx-auto tracking-tight">
            Every table. Every order.<br />
            Every branch. <span className="text-brand">One platform.</span>
          </h1>

          <p className="text-gray-400 text-xl max-w-xl mx-auto mb-10 leading-relaxed font-sans">
            Ordera gives restaurant owners complete visibility across every branch — 
            and gives their staff the simplest POS system they have ever used.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link 
              href="/register" 
              className="h-14 px-10 bg-brand text-white rounded-xl font-bold flex items-center justify-center hover:bg-opacity-90 transition-all shadow-xl shadow-brand/20"
            >
              Start Free Trial
            </Link>
            <button className="h-14 px-10 border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
              See How It Works <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* HERO VISUAL — Tilted Dashboard Mock */}
          <div className="relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="absolute inset-0 bg-brand/20 blur-[120px] rounded-full scale-75 -z-10" />
            <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-2 shadow-2xl transform -rotate-1 skew-x-1">
              <div className="bg-sidebar-light rounded-xl overflow-hidden aspect-[16/9] border border-white/5 relative">
                {/* Mock UI Elements */}
                <div className="absolute top-0 left-0 w-full h-12 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                  </div>
                  <div className="mx-auto bg-white/5 px-20 py-1 rounded-md text-[10px] text-gray-500 font-mono">
                    dashboard.ordera.app/healthymeals
                  </div>
                </div>
                {/* Dashboard Surface Placeholder */}
                <div className="mt-12 p-6 grid grid-cols-4 gap-4 h-full bg-[#0F0F1E]">
                  <div className="col-span-1 border border-white/5 rounded-lg p-4 bg-white/[0.02]" />
                  <div className="col-span-3 grid grid-rows-3 gap-4">
                    <div className="row-span-1 grid grid-cols-3 gap-4">
                      <div className="bg-brand/10 border border-brand/20 rounded-lg" />
                      <div className="bg-white/5 border border-white/5 rounded-lg" />
                      <div className="bg-white/5 border border-white/5 rounded-lg" />
                    </div>
                    <div className="row-span-2 bg-white/[0.02] border border-white/5 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — TRUST BAR */}
      <section className="bg-white py-16 border-b border-border-light">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted text-sm font-bold uppercase tracking-widest mb-10">
            Trusted by restaurants across Nigeria
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-12">
            {['Healthy Meals', 'Mama Chidi Kitchen', 'Taste of Owerri'].map((name) => (
              <div 
                key={name}
                className="px-6 py-3 border border-brand/20 rounded-full font-display text-sidebar hover:bg-brand/5 transition cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="features" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-sidebar text-4xl md:text-5xl mb-20 max-w-2xl">
            Built for how restaurants actually work.
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Set up your organization',
                desc: 'Register your restaurant, set up branches, invite your team.',
                icon: Building2
              },
              {
                step: '02',
                title: 'Your team gets to work',
                desc: 'Waiters take orders, kitchen prepares, cashier reconciles.',
                icon: Users2
              },
              {
                step: '03',
                title: 'You stay in control',
                desc: 'See every branch, every sale, every staff member — in real time.',
                icon: BarChart3
              }
            ].map((item, i) => (
              <div key={i} className="relative p-10 bg-white border border-brand/10 rounded-3xl group hover:border-brand/40 transition-colors">
                <div className="absolute top-0 left-10 -translate-y-1/2 bg-brand text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-brand/20">
                  {item.step}
                </div>
                <item.icon className="w-10 h-10 text-brand mb-8" />
                <h3 className="font-display text-2xl text-sidebar mb-4">{item.title}</h3>
                <p className="text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — BENEFITS (DARK) */}
      <section className="bg-sidebar py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[150px] -z-1" />
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-white text-4xl md:text-5xl mb-20">
            Everything your restaurant needs.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { title: 'Real-time tracking', desc: 'Kitchen gets orders instantly. Waiters know when to pick up.' },
              { title: 'Smart reconciliation', desc: 'Every naira accounted for. Cash, card, transfer — all verified.' },
              { title: 'Role-based dashboards', desc: 'Owner, manager, waiter, kitchen — each sees only what they need.' },
              { title: 'Multi-branch overview', desc: 'One login. All your branches. Complete visibility.' },
              { title: 'AI-powered insights', desc: 'Ask Ordera anything about your restaurant performance.' },
              { title: 'Stock management', desc: 'Know when items run low before customers notice.' }
            ].map((benefit, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="font-display text-xl text-white mb-2 group-hover:text-brand transition-colors">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — PRICING */}
      <section id="pricing" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="font-display text-sidebar text-4xl md:text-5xl mb-4">
            Simple, honest pricing.
          </h2>
          <p className="text-muted text-lg">No hidden fees. Cancel anytime.</p>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-20">
              <Loader2 className="animate-spin text-brand" size={40} />
            </div>
          ) : plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative p-10 rounded-[2rem] border transition-all hover:-translate-y-1 ${
                plan.isPopular 
                  ? 'border-brand bg-white shadow-2xl shadow-brand/10' 
                  : 'border-border-light bg-surface'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              <div className="text-sidebar font-bold text-sm uppercase tracking-widest mb-6">{plan.name}</div>
              <div className="font-display text-5xl text-sidebar mb-2">
                ₦{plan.price?.toLocaleString()}
                <span className="text-sm font-sans text-muted">/mo</span>
              </div>
              <div className="text-sm text-muted mb-8 italic">Billed monthly</div>
              
              <ul className="space-y-4 mb-10 text-sidebar font-medium text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand" /> 
                  {plan.branchLimit === 999 ? 'Unlimited' : plan.branchLimit} Branch{plan.branchLimit !== 1 && 'es'}
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand" /> 
                  {plan.staffLimit === 9999 ? 'Unlimited' : plan.staffLimit} Staff Members
                </li>
                {plan.features?.map((f: any, j: number) => (
                  <li key={j} className="flex items-center gap-3">
                    <CheckCircle2 className={`${f.included ? 'text-brand' : 'text-gray-200'} w-4 h-4`} /> 
                    <span className={f.included ? '' : 'text-muted line-through'}>{f.name}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href={`/register?plan=${plan.id}`}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                  plan.isPopular ? 'bg-brand text-white' : 'bg-sidebar text-white'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="bg-brand py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-white text-4xl md:text-5xl mb-6 max-w-2xl mx-auto">
            Ready to take control of your restaurant?
          </h2>
          <p className="text-white/80 text-xl mb-12">Join restaurants across Nigeria using Ordera.</p>
          <Link 
            href="/register" 
            className="inline-flex h-16 items-center px-12 bg-white text-brand rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
