'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [salesId, setSalesId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!salesId || !password) {
      setError('Sales ID and Password are required');
      toast.error('Sales ID and Password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(salesId, password);
      toast.success('Signed in successfully! Redirecting...');
    } catch (err: any) {
      const message = err.message || 'Invalid credentials';
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex h-screen w-full">
        {/* LEFT PANEL: Brand Narrative (40%) */}
        <section className="hidden lg:flex lg:w-[40%] bg-[#1A1A2E] flex-col justify-between p-12 relative overflow-hidden">
          {/* Brand Identity */}
          <div className="z-10 flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <span className="font-serif text-4xl font-bold text-white leading-none">O</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C97B2A] rounded-full shadow-[0_0_10px_#C97B2A]"></div>
            </div>
            <span className="font-serif text-2xl font-bold text-white tracking-tight">Ordera</span>
          </div>

          {/* Editorial Illustration Area */}
          <div className="z-10 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-12">
              {/* Abstract Restaurant Motif */}
              <div className="absolute w-64 h-64 border border-[#C97B2A]/20 rounded-full"></div>
              <div className="absolute w-48 h-48 border border-[#C97B2A]/40 rounded-full animate-pulse"></div>
              <div className="relative z-20 flex flex-col gap-4 items-center">
                {/* Fallback to simple circle and line if Material Symbols are missing */}
                <div className="w-16 h-16 rounded-full bg-[#C97B2A]/20 flex items-center justify-center border border-[#C97B2A]">
                   <span className="text-2xl text-[#C97B2A]">🍴</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="w-12 h-1 bg-[#C97B2A] rounded-full"></div>
                  <div className="w-4 h-1 bg-white/20 rounded-full"></div>
                  <div className="w-4 h-1 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-left space-y-4 max-w-md">
              <h1 className="font-serif text-4xl text-white leading-tight">Run every table. Know every number.</h1>
              <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-sm">
                Ordera gives your team the tools to serve better and faster — powered by intelligence.
              </p>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="z-10 flex gap-2">
            <div className="w-8 h-1.5 bg-[#C97B2A] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
          </div>

          {/* Subtle background texture */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C97B2A]/5 rounded-full blur-3xl -mb-32 -mr-32"></div>
        </section>

        {/* RIGHT PANEL: Authentication (60%) */}
        <section className="w-full lg:w-[60%] bg-white flex flex-col relative">
          {/* Desktop Top Right Meta */}
          <div className="absolute top-8 right-12 text-[#9CA3AF] text-xs font-medium tracking-wider hidden lg:block">
            © 2026 ORDERA
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 max-w-2xl mx-auto w-full">
            <header className="mb-10">
              <h2 className="font-serif text-[32px] text-[#1A1A2E] leading-tight mb-2">Welcome back.</h2>
              <p className="text-[#6B7280] text-sm">Sign in to continue.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              {/* Input: Sales ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#534437] block">Sales ID number</label>
                <div className="relative group">
                  <input
                    value={salesId}
                    onChange={(e) => setSalesId(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#8A4D00]/10 focus:border-[#8A4D00] transition-all outline-none text-[#191C1D] placeholder:text-gray-300"
                    placeholder="Enter your ID (e.g. 1001)"
                    type="text"
                    required
                  />
                </div>
              </div>

              {/* Input: Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#534437] block">Password</label>
                <div className="relative group">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#8A4D00]/10 focus:border-[#8A4D00] transition-all outline-none text-[#191C1D] placeholder:text-gray-300"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[44px] bg-[#C97B2A] text-white font-semibold rounded-lg hover:bg-[#B06822] active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <a className="text-[13px] text-[#C97B2A] font-medium hover:underline cursor-pointer">
                  Forgot password?
                </a>
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-[#E5E7EB]"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-medium uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-[#E5E7EB]"></div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 h-10 border border-[#E5E7EB] rounded-lg bg-white hover:bg-gray-50 transition-colors text-xs font-semibold text-[#1A1A2E]">
                  <img alt="" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAySn1Rq45S9W7OOYMpA8YxbwnfIAyZCeezH1spIWWeY7LL2P_jzazOkTOKXNQo1O5ckxhx9T034NGlKpKqbKzqez0D2Jp-qa0k0yNSYXU-j1d7JE5ldQ3XbXh6DdW3_5uuzMajPlZOiQJcwznlT7xr7Dt0mhYY8GaXIn88_UcX_FrfOnEAfXKAMuApC4G2fetH535fv9TfpSh5EAIaYZaT9ss1cWcynRnkvd8KGfFv-iNtTzZylbFhO6gpmqZ95-1-t279ApMLFm0O" />
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 h-10 border border-[#E5E7EB] rounded-lg bg-white hover:bg-gray-50 transition-colors text-xs font-semibold text-[#1A1A2E]">
                  <span className="text-[#1877F2] font-bold text-lg leading-none">f</span>
                  Facebook
                </button>
              </div>
            </form>

            <footer className="mt-12 text-center">
              <p className="text-sm text-[#6B7280]">
                Don't have an account?{' '}
                <a className="text-[#C97B2A] font-semibold hover:underline ml-1 cursor-pointer">Go to Registration</a>
              </p>
            </footer>
          </div>

          {/* Bottom decorative element */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C97B2A]/20 to-transparent"></div>
        </section>
      </main>

      {/* Visual Hint for Tablet Optimization */}
      <div className="lg:hidden fixed inset-0 flex items-center justify-center bg-white p-6 text-center z-50">
        <div className="max-w-xs space-y-4">
          <div className="relative w-12 h-12 flex items-center justify-center mx-auto">
            <span className="font-serif text-5xl font-bold text-[#1A1A2E] leading-none">O</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#C97B2A] rounded-full"></div>
          </div>
          <h1 className="font-serif text-3xl text-[#1A1A2E]">Ordera Mobile</h1>
          <p className="text-[#534437] text-sm">Please rotate your device or use a larger screen to experience the full POS editor dashboard.</p>
        </div>
      </div>
    </>
  );
}
