import { AnnouncementBanner } from '@/components/common/AnnouncementBanner';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBanner />
      <div className="flex flex-1 bg-surface">
        {/* Organization Owner Sidebar */}
        <aside className="w-64 bg-sidebar text-white p-6 flex flex-col gap-8">
          <div className="font-display text-2xl">Dashboard</div>
          <nav className="flex flex-col gap-2">
            <a href="/dashboard" className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition">Overview</a>
            <a href="/branches" className="px-4 py-2 rounded hover:bg-white/10 transition">Branches</a>
            <a href="/menu" className="px-4 py-2 rounded hover:bg-white/10 transition disabled opacity-50">Menu Builder</a>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
