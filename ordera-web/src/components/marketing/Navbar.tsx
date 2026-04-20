'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header 
      className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md py-4 shadow-sm border-b border-border-light"
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link href="/">
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/about" className="text-sm font-medium text-muted hover:text-sidebar transition">About</Link>
          <Link href="/#pricing" className="text-sm font-medium text-muted hover:text-sidebar transition">Pricing</Link>
          <Link href="/contact" className="text-sm font-medium text-muted hover:text-sidebar transition">Contact</Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-sidebar hover:text-brand transition">
              Sign In
            </Link>
            <Link 
              href="/register"
              className="bg-brand text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-opacity-90 transition-all shadow-lg shadow-brand/10"
            >
              Get Started
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-sidebar hover:bg-surface rounded-lg transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border-light shadow-xl animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-6 gap-4">
            <Link href="/about" onClick={closeMenu} className="text-lg font-medium text-sidebar p-2 hover:bg-surface rounded-lg transition">About</Link>
            <Link href="/#pricing" onClick={closeMenu} className="text-lg font-medium text-sidebar p-2 hover:bg-surface rounded-lg transition">Pricing</Link>
            <Link href="/contact" onClick={closeMenu} className="text-lg font-medium text-sidebar p-2 hover:bg-surface rounded-lg transition">Contact</Link>
            <hr className="border-border-light my-2" />
            <Link href="/login" onClick={closeMenu} className="text-lg font-medium text-brand p-2 hover:bg-brand/5 rounded-lg transition">Sign In</Link>
            <Link href="/register" onClick={closeMenu} className="w-full bg-brand text-white text-center py-4 rounded-xl font-bold shadow-lg shadow-brand/10 transition mt-2">
              Start Free Trial
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
