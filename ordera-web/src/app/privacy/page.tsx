'use client';

import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32">
        <section className="px-6 py-20 border-b border-gray-100 bg-gray-50/50">
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="font-display text-sidebar text-4xl md:text-5xl">Privacy Policy</h1>
              <p className="text-muted mt-2">Last updated: May 16, 2026</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto prose prose-brand prose-sidebar">
            <div className="space-y-12 text-muted leading-relaxed">
              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">1. Introduction</h2>
                <p>
                  At Ordera (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform and services.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">2. Information We Collect</h2>
                <p className="mb-4">
                  We collect information that you provide directly to us when you create an account, such as:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Business name and contact details</li>
                  <li>User account information (name, email, password)</li>
                  <li>Branch and staff information</li>
                  <li>Transactional data (orders, sales, payment methods)</li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process transactions and generate reports</li>
                  <li>Send technical notices and administrative messages</li>
                  <li>Provide customer support</li>
                  <li>Analyze usage patterns to improve our platform</li>
                </ul>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">4. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your data. This includes encryption of sensitive data at rest and in transit. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="font-display text-2xl text-sidebar mb-4">5. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@ordera.app" className="text-brand font-bold">privacy@ordera.app</a>.
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
