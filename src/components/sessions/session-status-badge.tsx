'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SessionStatusBadgeProps {
  status: 'lobby' | 'active' | 'finished';
  className?: string;
}

const STATUS_CONFIG = {
  lobby: {
    label: 'Lobby',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  active: {
    label: 'Live',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  finished: {
    label: 'Finished',
    className: 'bg-muted text-muted-foreground border-border',
  },
} as const;

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {status === 'active' && (
        <span className="relative flex h-1.5 w-1.5 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
        </span>
      )}
      {config.label}
    </Badge>
  );
}
