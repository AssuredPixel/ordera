export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <main className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {children}
      </main>
    </div>
  );
}
