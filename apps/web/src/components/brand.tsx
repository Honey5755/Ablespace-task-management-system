import { cn } from '@/lib/utils';

/**
 * The mark from the Figma logo tile, redrawn as a vector — Figma export was
 * blocked on this file, so it is an approximation. Two faces at different
 * opacities give the solid its 3D read.
 */
function PyramidMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.5 3.5 20.5h8.5z" fill="currentColor" />
      <path d="M12 2.5 20.5 20.5H12z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/** Logo tile + wordmark lockup, as drawn above the login card. */
export function Brand({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <PyramidMark className="size-[18px]" />
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">Pyramid</span>
      )}
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.9 14.53 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.5Z"
      />
    </svg>
  );
}
