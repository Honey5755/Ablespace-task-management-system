'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';

/** Redirects unauthenticated visitors to the login screen. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // Render nothing until the stored token has been checked, so protected
  // content never flashes before the redirect lands.
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return <>{children}</>;
}
