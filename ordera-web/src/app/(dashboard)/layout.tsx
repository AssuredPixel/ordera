export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-surface">
      <aside className="w-64 bg-sidebar text-white p-4">
        <h2 className="text-xl font-display text-brand mb-8">Ordera</h2>
        <nav className="space-y-4">
          <div className="p-2 hover:bg-white/10 rounded cursor-pointer">Dashboard</div>
          <div className="p-2 hover:bg-white/10 rounded cursor-pointer">Food & Drinks</div>
          <div className="p-2 hover:bg-white/10 rounded cursor-pointer">Messages</div>
          <div className="p-2 hover:bg-white/10 rounded cursor-pointer">Bills</div>
          <div className="p-2 hover:bg-white/10 rounded cursor-pointer">Settings</div>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
