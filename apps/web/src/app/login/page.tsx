'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brand, GoogleIcon } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loginAsGuest } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/tasks');
  }, [isLoading, isAuthenticated, router]);

  const handleGuestLogin = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginAsGuest();
      router.replace('/tasks');
    } catch {
      setError('Could not start a guest session. Is the API running?');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />

      <Card className="w-full max-w-[430px] p-6 sm:p-[26px]">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Let&apos;s get back on track</h1>
          <p className="text-[15px] text-muted-foreground">
            Enter your email below to login to your account.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            shape="pill"
            className="h-10 w-full"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting session…' : 'Continue as Guest'}
          </Button>

          {/*
            Drawn in the design but not wired up: OAuth needs a Google client id
            and a redirect origin, which the assessment doesn't provide. Rendered
            to match the frame, disabled so it can't mislead. See README.
          */}
          <Button
            variant="outline"
            shape="pill"
            className="h-10 w-full"
            disabled
            title="Google sign-in is not configured in this build"
          >
            <GoogleIcon className="size-4" />
            Login with Google
          </Button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </Card>

      <p className="max-w-[300px] text-center text-[13px] leading-relaxed text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
    </main>
  );
}
