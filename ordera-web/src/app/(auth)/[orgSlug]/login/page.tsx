"use client";

import { useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function LoginPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const resolvedParams = use(params);
  const [salesId, setSalesId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(resolvedParams.orgSlug, salesId, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid Sales ID or Password");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Branding (40%) - Hidden on Mobile, Visible on LG */}
      <div className="hidden lg:flex lg:w-[40%] bg-sidebar flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-brand/5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <Image
              src="/logo/logo-dark.svg"
              alt="Ordera Logo"
              width={100}
              height={100}
              className="priority"
            />
          </div>
          <h1 className="text-5xl font-display text-center leading-tight">
            Run every<br />table.
          </h1>
          <p className="mt-6 text-gray-400 text-lg text-center max-w-xs font-sans">
            High-performance restaurant management at your fingertips.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form (60% on desktop, 100% on mobile) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Branding (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sidebar rounded-2xl mb-4 shadow-lg shadow-brand/10">
              <Image
                src="/logo/logo-dark.svg"
                alt="Ordera Logo"
                width={40}
                height={40}
              />
            </div>
            <h1 className="text-3xl font-display text-sidebar tracking-tight">Ordera</h1>
            <p className="text-gray-500 text-sm mt-1">POS Management System</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Enter your employee credentials to access your branch
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="salesId"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Sales ID
                </label>
                <input
                  id="salesId"
                  name="salesId"
                  type="text"
                  required
                  value={salesId}
                  onChange={(e) => setSalesId(e.target.value)}
                  placeholder="e.g. OWNER001"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-danger text-sm p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-xl bg-brand px-4 py-4 text-sm font-bold text-white shadow-xl shadow-brand/10 hover:bg-brand/90 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:bg-gray-300 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  "Sign In to Branch"
                )}
              </button>
            </div>
          </form>

          <footer className="mt-12 text-center text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Ordera POS Ecosystem. Secure Access.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
