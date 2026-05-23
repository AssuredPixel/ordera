import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'Ordera | Premium Restaurant Management & SaaS',
  description: 'The all-in-one platform for modern restaurant operations, multi-tenant billing, and AI-driven insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display:wght@400&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-sans: 'DM Sans', sans-serif;
            --font-display: 'DM Serif Display', serif;
          }
        `}</style>
      </head>
      <body className="font-sans antialiased text-muted overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
