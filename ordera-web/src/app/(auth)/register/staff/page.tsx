'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Shield, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

function StaffRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response: any = await api.get(`/api/invitations/validate/${token}`);
        if (response.valid) {
          setInvitation(response.data);
        } else {
          toast.error('Invitation link is invalid or has expired');
        }
      } catch (err) {
        toast.error('Failed to validate invitation link');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/register-staff', {
        token,
        password: formData.password,
      });
      
      toast.success('Account created successfully!');
      
      // Redirect based on role
      if (invitation.role === 'branch_manager') {
        router.push('/branches');
      } else {
        router.push(`/branches/${invitation.branchId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand mb-4" size={32} />
        <p className="text-muted text-sm font-medium">Validating your invitation...</p>
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <AuthSplitLayout>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <div>
            <h1 className="font-display text-2xl text-sidebar">Invalid Link</h1>
            <p className="text-muted mt-2">This invitation link is invalid, expired, or has already been used.</p>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="w-full h-11 bg-brand text-white rounded-xl font-medium hover:bg-opacity-90 transition"
          >
            Back to Login
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="mb-10">
        <h1 className="font-display text-[28px] text-sidebar">Welcome to Ordera</h1>
        <p className="text-muted mt-2">
          Hi {invitation.firstName}, you've been invited as a 
          <span className="text-brand font-bold uppercase text-xs mx-1 px-2 py-0.5 bg-brand/5 rounded-full border border-brand/10">
            {invitation.role.replace('_', ' ')}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-border-light p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl border border-border-light">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-border-light">
            <Shield className="text-brand" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Account Security</p>
            <p className="text-sm font-medium text-sidebar">Set your secure password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-sidebar uppercase ml-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-sidebar"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-sidebar uppercase ml-1">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-brand text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-brand/20 transition flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Check size={20} />
                Complete Setup
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-muted px-4 leading-relaxed">
        By completing this setup, you agree to Ordera's Terms of Service and Privacy Policy.
      </p>
    </AuthSplitLayout>
  );
}

export default function StaffRegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    }>
      <StaffRegisterContent />
    </Suspense>
  );
}
