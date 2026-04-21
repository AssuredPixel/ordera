'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Eye, EyeOff, Loader2, Check, ArrowLeft, Building2, User, CreditCard } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '49,000', branches: '1 Branch', staff: '5 Staff' },
  { id: 'bread', name: 'Growth', price: '99,000', branches: '3 Branches', staff: '15 Staff' },
  { id: 'feast', name: 'Pro', price: '199,000', branches: 'Unlimited Branches', staff: 'Unlimited Staff' },
];

import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loginWithGoogle } = useAuthStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    country: 'NG',
    contactPhone: '',
    plan: 'bread',
    gateway: 'paystack',
  });

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && PLANS.find(p => p.id === planParam)) {
      setFormData(prev => ({ ...prev, plan: planParam }));
    }

    const prefillParam = searchParams.get('prefill');
    if (prefillParam) {
      try {
        const data = JSON.parse(decodeURIComponent(prefillParam));
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
        }));
      } catch (e) {
        console.error('Failed to parse prefill data');
      }
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast.error('Please fill all account details');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    } else if (step === 2) {
      if (!formData.businessName || !formData.contactPhone || !formData.country) {
        toast.error('Please fill all business details');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      await register(payload);
      toast.success('Registration successful! Welcome to your 14-day trial.');
      router.push('/owner/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
          setFormData(prev => ({
            ...prev,
            firstName: result.data.firstName || '',
            lastName: result.data.lastName || '',
            email: result.data.email || '',
          }));
          toast.info('Google account linked. Please complete your details.');
        } else if (result?.user) {
          toast.success('Signed in with Google');
          router.push('/owner/dashboard');
        }
      } catch (err: any) {
        toast.error(err.message || 'Google sign-in failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <AuthSplitLayout>
      <div className="mb-8 sm:mb-10 text-center lg:text-left">
        <h1 className="font-display text-2xl sm:text-[28px] text-sidebar">Create your account</h1>
        <p className="text-muted text-sm sm:text-base mt-2">Start your 14-day free trial. No credit card required.</p>
      </div>

      {/* STEP INDICATOR */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-8 sm:mb-10">
        {[
          { id: 1, label: 'Account', icon: User },
          { id: 2, label: 'Business', icon: Building2 },
          { id: 3, label: 'Plan', icon: CreditCard }
        ].map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
              <div className={`h-1.5 w-full rounded-full transition-colors ${step === s.id ? 'bg-brand' : step > s.id ? 'bg-success' : 'bg-border-light'
                }`} />
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-brand' : step > s.id ? 'text-success' : 'text-muted'
                }`}>
                <span className="hidden xs:inline">{s.id} </span>{s.label}
              </span>
            </div>
            {i < 2 && <div className="w-2 sm:w-4" />}
          </div>
        ))}
      </div>


      <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
        {/* STEP 1: ACCOUNT */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-border-light p-5 sm:p-8 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-sidebar">First Name</label>
                <input
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                  placeholder="Emeka"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-sidebar">Last Name</label>
                <input
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                  placeholder="Okonkwo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sidebar">Email address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                placeholder="emeka@healthymeals.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sidebar">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
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
              <label className="text-sm font-medium text-sidebar">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="w-full h-11 bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition mt-4"
            >
              Continue
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light"></div>
              </div>
              <span className="relative bg-white px-4 text-sm text-muted">or</span>
            </div>

            <button
              type="button"
              onClick={() => googleLogin()}
              className="w-full h-11 border border-border-light text-sidebar rounded-lg font-medium hover:bg-surface transition flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* STEP 2: BUSINESS */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-border-light p-5 sm:p-8 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-sidebar">Business Name</label>
              <input
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                placeholder="e.g. Healthy Meals"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sidebar">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition bg-white"
              >
                <optgroup label="Africa">
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                  <option value="RW">Rwanda</option>
                </optgroup>
                <optgroup label="International">
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sidebar">Contact Phone</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 sm:px-4 bg-surface border border-border-light rounded-lg text-xs sm:text-sm font-medium text-sidebar shrink-0">
                  +234
                </div>
                <input
                  name="contactPhone"
                  required
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                  placeholder="801 234 5678"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="button"
                onClick={nextStep}
                className="w-full h-11 bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={prevStep}
                className="text-muted flex items-center justify-center gap-2 hover:text-sidebar transition text-sm font-medium"
              >
                <ArrowLeft size={16} /> Back to account details
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PLAN */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-border-light p-5 sm:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.plan === plan.id
                      ? 'border-brand bg-brand/5'
                      : 'border-border-light bg-white hover:border-brand/20'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${formData.plan === plan.id ? 'text-brand' : 'text-muted'
                        }`}>
                        {plan.name}
                      </p>
                      <h4 className="text-sidebar font-bold text-base sm:text-lg">₦{plan.price}<span className="text-[10px] sm:text-xs font-normal text-muted">/mo</span></h4>
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:gap-0 text-left sm:text-right text-[10px] sm:text-xs text-muted leading-tight">
                      <p>{plan.branches}</p>
                      <span className="sm:hidden opacity-30">|</span>
                      <p>{plan.staff}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => setFormData(prev => ({ ...prev, gateway: 'paystack' }))}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                formData.gateway === 'paystack' ? 'border-brand bg-brand/5' : 'border-border-light bg-white'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${formData.gateway === 'paystack' ? 'bg-[#00D09C]/10' : 'bg-surface'}`}>
                    <Check className={formData.gateway === 'paystack' ? 'text-[#00D09C]' : 'text-gray-300'} size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-sidebar truncate">Paystack</p>
                    <p className="text-[9px] sm:text-[10px] text-muted font-medium uppercase tracking-tight truncate">African Payments</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="bg-[#00D09C] text-white px-1 py-0.5 rounded font-bold text-[7px] sm:text-[8px] tracking-tighter">PAYSTACK</div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D09C]/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D09C]" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setFormData(prev => ({ ...prev, gateway: 'stripe' }))}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                formData.gateway === 'stripe' ? 'border-brand bg-brand/5' : 'border-border-light bg-white opacity-70'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${formData.gateway === 'stripe' ? 'bg-[#635BFF]/10' : 'bg-surface'}`}>
                    <Check className={formData.gateway === 'stripe' ? 'text-[#635BFF]' : 'text-gray-300'} size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-sidebar truncate">Stripe</p>
                    <p className="text-[9px] sm:text-[10px] text-muted font-medium uppercase tracking-tight truncate">International</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="bg-[#635BFF] text-white px-1 py-0.5 rounded font-bold text-[7px] sm:text-[8px] tracking-tighter">STRIPE</div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Registration'}
              </button>
              <button
                type="button"
                onClick={prevStep}
                className="text-muted flex items-center justify-center gap-2 hover:text-sidebar transition text-sm font-medium"
              >
                <ArrowLeft size={16} /> Back to business details
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-12 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-brand font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </AuthSplitLayout>
  );
}


export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

