'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/api/auth/reset-password', { token, password });
      setIsSuccess(true);
      toast.success('Password reset successfully');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-sidebar">Password reset!</h1>
          <p className="text-sm text-muted leading-relaxed">
            Your password has been successfully updated. Redirecting you to login...
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block w-full py-3.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4">
          <ShieldCheck size={24} className="text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-sidebar">Set new password</h1>
        <p className="text-sm text-muted">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-sidebar uppercase tracking-wide">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-12 py-3 bg-surface border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sidebar"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-sidebar transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-sidebar uppercase tracking-wide">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-12 py-3 bg-surface border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sidebar"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !token || !password || !confirmPassword}
          className="w-full py-3.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Updating password…
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted hover:text-sidebar transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Login
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout>
      <div className="w-full max-w-sm mx-auto">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <p className="text-sm text-muted">Loading reset form...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthSplitLayout>
  );
}
