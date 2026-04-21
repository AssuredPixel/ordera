'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuthStore();
  
  const callbackUrl = searchParams.get('callbackUrl');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleRedirect = (user: any) => {
    // 1. If we have a callback URL from a previous redirect, use it
    if (callbackUrl) {
      router.push(callbackUrl);
      return;
    }

    // 2. Otherwise, use role-based redirection
    const role = (user.role || '').toUpperCase();
    
    if (role === 'SUPER_ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'OWNER') {
      router.push('/owner/dashboard');
    } else {
      // Default fallback to home instead of /dashboard (404)
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast.success('Signed in successfully');
      handleRoleRedirect(user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const result = await loginWithGoogle(tokenResponse.access_token);
        if (result?.requiresRegistration) {
          router.push(`/register?prefill=${encodeURIComponent(JSON.stringify(result.data))}`);
        } else if (result?.user) {
          toast.success('Signed in with Google');
          handleRoleRedirect(result.user);
        }
      } catch (err: any) {
        toast.error(err.message || 'Google sign-in failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error('Google login failed'),
  });

  return (
    <AuthSplitLayout>
      <div className="mb-8 sm:mb-10 text-center lg:text-left">
        <h1 className="font-display text-2xl sm:text-[28px] text-sidebar">Welcome back.</h1>
        <p className="text-muted text-sm sm:text-base mt-2">Sign in to your Ordera account.</p>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-border-light p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-sidebar">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" 
              className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-sidebar">Password</label>
              <Link href="/forgot-password" className="text-xs text-brand hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
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

          {error && <p className="text-danger text-sm">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light"></div>
          </div>
          <span className="relative bg-white px-4 text-sm text-muted">or</span>
        </div>

        <button 
          type="button"
          onClick={() => googleLogin()}
          disabled={isLoading}
          className="w-full h-[44px] border border-border-light text-sidebar rounded-lg font-medium hover:bg-surface transition flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-1.48 0-2.84.43-3.99 1.18L4.35 15.02c-.22.66-.35 1.36-.35 2.09 0 1.78.43 3.45 1.18 4.93l3.66-2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>

          Continue with Google
        </button>

        <div className="mt-8 text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Register
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
