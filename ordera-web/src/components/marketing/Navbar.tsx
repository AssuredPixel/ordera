'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-sidebar hover:text-brand transition">
            Sign In
          </Link>
          <Link 
            href="/pricing"
            className="bg-brand text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-opacity-90 transition-all shadow-lg shadow-brand/10"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
