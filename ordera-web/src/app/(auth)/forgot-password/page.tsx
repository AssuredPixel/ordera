'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration attacks
      // But if it's a network/server error, show that
      if (err.message?.includes('timed out') || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        // Treat as success regardless (security best practice)
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-sidebar transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </Link>

        {isSubmitted ? (
          /* ── SUCCESS STATE ── */
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-brand" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-sidebar">Check your inbox</h1>
              <p className="text-sm text-muted leading-relaxed">
                If an account exists for <span className="font-semibold text-sidebar">{email}</span>,
                we sent a password reset link. It expires in 1 hour.
              </p>
            </div>
            <div className="bg-surface border border-border-light rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-sidebar">Didn't receive it?</p>
              <ul className="text-xs text-muted space-y-1">
                <li>• Check your spam or promotions folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait up to 2 minutes for delivery</li>
              </ul>
            </div>
            <button
              onClick={() => { setIsSubmitted(false); setEmail(''); }}
              className="text-sm text-brand hover:underline font-medium"
            >
              Try a different email
            </button>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4">
                <ShieldAlert size={24} className="text-brand" />
              </div>
              <h1 className="text-2xl font-bold text-sidebar">Forgot your password?</h1>
              <p className="text-sm text-muted">
                No worries. Enter your registered email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-sidebar uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sidebar placeholder:text-muted"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending reset link…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-muted">
              Remembered it?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
