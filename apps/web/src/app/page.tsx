'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';

/** Entry point: send guests to login, returning users straight to the board. */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/tasks' : '/login');
  }, [isLoading, isAuthenticated, router]);

  return null;
}
