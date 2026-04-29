'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((state) => state.loadUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Skip auth check if on auth pages or marketing homepage to prevent unintended redirects
    const path = window.location.pathname;
    if (path === '/login' || path === '/register' || path === '/') {
      return;
    }

    // Only attempt to load user if a token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('ordera_token') : null;
    if (token) {
      loadUser();
    }
  }, [loadUser]);


  // The `mounted` check was causing a severe hydration mismatch where the server rendered an empty body.
  // We can safely render the Providers on the server.

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        {children}
        {mounted && <Toaster position="top-right" expand={false} richColors />}
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

