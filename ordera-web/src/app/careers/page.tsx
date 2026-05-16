'use client';

import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Sparkles, Mail } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32">
        <section className="px-6 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles size={14} /> Join the revolution
            </div>
            <h1 className="font-display text-sidebar text-5xl md:text-7xl mb-8">
              Build the future of <span className="text-brand">hospitality.</span>
            </h1>
            <p className="text-muted text-xl leading-relaxed max-w-2xl mx-auto mb-16">
              We&apos;re always looking for brilliant minds in engineering, design, and operations who are passionate about building tools that people love to use.
            </p>

            <div className="bg-sidebar rounded-[2.5rem] p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-brand/5 pointer-events-none" />
              <h2 className="font-display text-3xl mb-4 relative z-10">Currently growing our core team.</h2>
              <p className="text-gray-400 mb-10 relative z-10 max-w-lg mx-auto">
                While we don&apos;t have any open listings at this exact moment, we always prioritize candidates from our talent pool when new roles open up.
              </p>
              
              <div className="flex flex-col items-center gap-4 relative z-10">
                <p className="text-sm font-bold text-brand uppercase tracking-widest">Send your CV to</p>
                <a 
                  href="mailto:careers@ordera.app" 
                  className="text-2xl md:text-4xl font-display text-white hover:text-brand transition flex items-center gap-3"
                >
                  <Mail size={32} /> careers@ordera.app
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            {[
              { title: 'Work from anywhere', desc: 'We are a remote-first company with a core hub in Lagos.' },
              { title: 'Modern Stack', desc: 'We use the latest tools: Next.js, TypeScript, NestJS, and more.' },
              { title: 'Impact', desc: 'Your work will be used by thousands of staff and owners every day.' }
            ].map((benefit, i) => (
              <div key={i} className="text-center md:text-left">
                <h4 className="font-display text-xl text-sidebar mb-3">{benefit.title}</h4>
                <p className="text-muted text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
