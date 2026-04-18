'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar flex-col p-12 justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />

        <div>
          <Link href="/" className="inline-block mb-20 transition-opacity hover:opacity-80">
            <Image
              src="/logo/logo-light.svg"
              alt="Ordera Logo"
              width={120}
              height={36}
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>



          <h2 className="font-display text-white text-5xl leading-tight mb-6">
            Your restaurants.<br />
            Your numbers. <span className="text-brand italic font-serif">Your control.</span>
          </h2>

          <p className="text-gray-400 text-lg">
            Join hundreds of restaurant owners across Nigeria.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Check key={i} size={14} className="text-brand fill-brand" />
            ))}
          </div>
          <p className="text-white font-medium mb-1">"The visibility I now have across my 4 branches is incredible. Ordera changed how we run our business."</p>
          <p className="text-gray-500 text-sm">— Emeka, Healthy Meals CEO</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto relative">
        <div className="w-full max-w-[480px]">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted hover:text-sidebar transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back to Website</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
