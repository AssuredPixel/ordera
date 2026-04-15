import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-navy text-white">
      <div className="max-w-3xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-6xl md:text-8xl font-display leading-tight">
          Restaurant efficiency, <span className="text-brand">mastered.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 font-sans max-w-2xl mx-auto leading-relaxed">
          The next generation multi-tenant POS platform for elite dining establishments. 
          Manage branches, menus, and staff with absolute precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link 
            href="/demo/login"
            className="px-8 py-4 bg-brand hover:bg-brand/90 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand/20"
          >
            Launch Demo App
          </Link>
          <button className="px-8 py-4 border border-white/20 hover:bg-white/5 text-white font-bold rounded-full transition-all">
            View Pricing
          </button>
        </div>

        <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/10">
          <div className="space-y-2">
            <h3 className="text-brand font-display text-xl">01. Identity</h3>
            <p className="text-sm text-gray-500">Multi-tenant hierarchy with full data isolation and role-based access.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-brand font-display text-xl">02. Intelligence</h3>
            <p className="text-sm text-gray-500">Built-in AI Assistant to query your business data in natural language.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-brand font-display text-xl">03. Real-time</h3>
            <p className="text-sm text-gray-500">Instant updates for orders, kitchen preparation, and staff messaging.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
