'use client';

import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Building2, Heart, ShieldCheck, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32">
        {/* HERO */}
        <section className="px-6 py-20 bg-sidebar-light">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-sidebar text-5xl md:text-7xl mb-8 leading-tight">
              Reimagining how the world <span className="text-brand">eats and works.</span>
            </h1>
            <p className="text-muted text-xl leading-relaxed max-w-2xl mx-auto">
              Ordera was born out of a simple observation: restaurants are complex, but their tools shouldn&apos;t be. We build the bridge between passion and efficiency.
            </p>
          </div>
        </section>

        {/* MISSION */}
        <section className="px-6 py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-display text-sidebar text-4xl mb-8">Our Mission</h2>
                <div className="space-y-6 text-muted text-lg leading-relaxed">
                  <p>
                    We believe that every restaurant owner deserves to have absolute clarity over their business, whether they run a single local gem or a nationwide chain.
                  </p>
                  <p>
                    Our mission is to empower hospitality teams with intuitive, robust, and beautiful software that disappears into the background, allowing them to focus on what matters most: their guests.
                  </p>
                </div>
              </div>
              <div className="bg-brand/5 rounded-[3rem] p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  {[
                    { icon: Heart, title: 'People First', desc: 'Designed for the humans who use it every day.' },
                    { icon: Zap, title: 'Speed', desc: 'No lag, no downtime. Business moves fast, we move faster.' },
                    { icon: ShieldCheck, title: 'Integrity', desc: 'Every naira and every order accounted for.' },
                    { icon: Building2, title: 'Scale', desc: 'Built to grow with your ambition, from 1 to 100 branches.' }
                  ].map((value, i) => (
                    <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-brand/10">
                      <value.icon className="text-brand mb-4" size={24} />
                      <h4 className="font-display text-sidebar text-lg mb-2">{value.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{value.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="px-6 py-32 bg-sidebar text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-4xl mb-12">The Ordera Story</h2>
            <div className="space-y-8 text-gray-400 text-lg leading-relaxed">
              <p>
                Founded in Lagos, Nigeria, Ordera started as a small project to help a family friend manage their growing restaurant chain. We saw the chaos of paper receipts, the stress of manual reconciliation, and the lack of real-time visibility.
              </p>
              <p>
                We decided to build something better. A platform that wasn&apos;t just a POS, but an operating system for the entire business. Today, we are proud to support restaurants across the continent, providing them with the insights they need to thrive in a digital world.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
