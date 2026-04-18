export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Marketing Header would go here */}
      <header className="border-b border-border-light bg-white py-4 px-6 fixed w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-display text-sidebar">Ordera</div>
          <nav className="flex gap-6 items-center">
            <a href="/pricing" className="text-muted hover:text-sidebar transition">Pricing</a>
            <a href="/about" className="text-muted hover:text-sidebar transition">About</a>
          </nav>
        </div>
      </header>
      <div className="pt-20 flex-1">{children}</div>
      {/* Marketing Footer would go here */}
    </div>
  );
}
