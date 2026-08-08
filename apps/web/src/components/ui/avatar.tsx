'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { Plus } from 'lucide-react';
import { forwardRef } from 'react';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UserRef } from '@/lib/types';

export const Avatar = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex size-6 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square size-full', className)} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex size-full items-center justify-center bg-muted text-[10px] font-medium uppercase text-muted-foreground',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

/**
 * The Members cell: an avatar when assigned, or the dashed `+` affordance the
 * design shows on unassigned rows.
 */
export function MemberCell({
  user,
  className,
  onClick,
}: {
  user: UserRef | null;
  className?: string;
  onClick?: () => void;
}) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Assign member"
        className={cn(
          'flex size-6 items-center justify-center rounded-full border border-dashed border-border',
          'text-muted-foreground transition-colors hover:border-foreground hover:text-foreground',
          className,
        )}
      >
        <Plus className="size-3" />
      </button>
    );
  }

  return (
    <Avatar className={className} title={user.name}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
