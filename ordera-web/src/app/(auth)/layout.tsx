import { Suspense } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </div>
  );
}

