"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { Lock, User as UserIcon, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { orgSlug } = useParams();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [salesId, setSalesId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await api.post("/auth/login", {
        orgSlug,
        salesId: salesId.toUpperCase(),
        password,
      });

      setAuth(response.user, response.access_token);
      toast.success(`Welcome back, ${response.user.name}`);
      router.push(`/${orgSlug}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left side: Form */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-display text-navy">
              Sign in to <span className="text-brand capitalize">{orgSlug}</span>
            </h1>
            <p className="text-gray-500 font-sans">
              Enter your Sales ID and password to access the Ordera dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Sales ID
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. OWNER001"
                  className="w-full pl-12 pr-4 py-4 bg-surface border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-sans uppercase placeholder:lowercase"
                  value={salesId}
                  onChange={(e) => setSalesId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-surface border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Having trouble? Contact your branch manager or <span className="text-brand cursor-pointer hover:underline">Ordera Support</span>.
          </p>
        </div>
      </div>

      {/* Right side: Branding/Visual */}
      <div className="hidden lg:flex bg-navy p-12 relative overflow-hidden flex-col justify-between">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center font-display text-white text-xl">O</div>
          <span className="text-xl font-display text-white tracking-tight">Ordera</span>
        </div>
        
        <div className="relative z-10 space-y-6">
          <blockquote className="text-4xl font-display text-white leading-tight">
            "Ordera has completely transformed how we manage our Lagos branches. Efficiency is up by 40%."
          </blockquote>
          <div>
            <p className="text-brand font-bold">Femi Adeniyi</p>
            <p className="text-gray-500 text-sm">CEO, Lagos Lounge Group</p>
          </div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
}
