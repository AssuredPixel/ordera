'use client';

import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32">
        <section className="px-6 py-20 border-b border-gray-100 bg-gray-50/50">
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="font-display text-sidebar text-4xl md:text-5xl">Terms of Service</h1>
              <p className="text-muted mt-2">Last updated: May 16, 2026</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12 text-muted leading-relaxed">
              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the Ordera platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">2. Description of Service</h2>
                <p>
                  Ordera provides a cloud-based restaurant management platform, including POS systems, branch management, and reporting tools. We reserve the right to modify or discontinue any part of the service at any time.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">3. User Accounts</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">4. Payment and Subscriptions</h2>
                <p>
                  Certain features of the service require a paid subscription. Fees are billed in advance on a monthly or annual basis and are non-refundable unless otherwise required by law.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">5. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Ordera shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">6. Governing Law</h2>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
