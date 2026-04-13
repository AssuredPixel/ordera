"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WorkspaceLocator() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slug.trim()) {
      router.push(`/${slug.trim().toLowerCase()}/login`);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-2xl shadow-xl shadow-brand/5 border border-gray-100">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sidebar rounded-2xl mb-4 shadow-lg shadow-brand/10">
            <Image
              src="/logo/logo-dark.svg"
              alt="Ordera Logo"
              width={40}
              height={40}
            />
          </div>
          <h1 className="text-3xl font-display text-sidebar tracking-tight">Ordera</h1>
          <p className="text-gray-500 text-sm mt-1">Multi-Tenant Access</p>
        </div>

        <div className="space-y-3 mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">
            Find your workspace
          </h2>
          <p className="text-gray-500 text-sm">
            Enter your restaurant's unique organization slug to log in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Workspace URL
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/50 focus-within:bg-white focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/5 transition-all outline-none overflow-hidden">
              <span className="pl-4 text-gray-400 text-sm italic pr-1">ordera.app/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="demo"
                className="block w-full bg-transparent px-2 py-3.5 text-gray-900 focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!slug.trim()}
            className="group relative flex w-full justify-center rounded-xl bg-brand px-4 py-4 text-sm font-bold text-white shadow-xl shadow-brand/10 hover:bg-brand/90 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:bg-gray-300 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
