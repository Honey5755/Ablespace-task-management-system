import { cn } from '@/lib/utils';
import { PRIORITY_LABELS, type TaskPriority } from '@/lib/types';

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: 'text-priority-urgent',
  high: 'text-priority-high',
  medium: 'text-priority-medium',
  low: 'text-priority-low',
  none: 'text-priority-none',
};

/** How many of the three bars are filled. */
const FILLED_BARS: Record<TaskPriority, number> = {
  urgent: 3,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

/**
 * The ascending bar-chart glyph from the design. `none` renders as a single
 * short dash instead of bars, matching the "No Priority" row in the dropdown.
 */
export function PriorityIcon({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const filled = FILLED_BARS[priority];

  if (priority === 'none') {
    return (
      <svg viewBox="0 0 12 12" aria-hidden className={cn('size-3.5', PRIORITY_COLOR.none, className)}>
        <rect x="2" y="8" width="8" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={cn('size-3.5', PRIORITY_COLOR[priority], className)}
    >
      {[0, 1, 2].map((index) => (
        <rect
          key={index}
          x={1 + index * 4}
          y={8 - index * 3}
          width="2.5"
          height={2 + index * 3}
          rx="0.75"
          fill="currentColor"
          // Unfilled bars stay visible but recede, as drawn.
          opacity={index < filled ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

export function PriorityBadge({
  priority,
  className,
  showLabel = true,
}: {
  priority: TaskPriority;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', PRIORITY_COLOR[priority], className)}>
      <PriorityIcon priority={priority} />
      {showLabel && PRIORITY_LABELS[priority]}
    </span>
  );
}
