import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-sidebar text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Logo light className="mb-6" />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Every table. Every order. Every branch. One platform for the modern restaurant.
            </p>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/#pricing" className="hover:text-brand transition">Pricing</Link></li>
              <li><Link href="/#features" className="hover:text-brand transition">Features</Link></li>
              <li><Link href="/demo" className="hover:text-brand transition disabled opacity-50">Live Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-brand transition">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-brand transition disabled opacity-50">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-brand transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/#" className="hover:text-brand transition">Privacy Policy</Link></li>
              <li><Link href="/#" className="hover:text-brand transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>© 2026 Ordera Platform. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <span>Built by Lawrence</span>
            <span>Based in Lagos, Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
