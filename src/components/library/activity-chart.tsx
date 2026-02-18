'use client';

import { format, eachDayOfInterval, subDays } from 'date-fns';
import type { ScrobblesByDay } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityChartProps {
  data: ScrobblesByDay[];
  isLoading?: boolean;
  days?: number;
}

export function ActivityChart({ data, isLoading, days = 30 }: ActivityChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-14 h-4 bg-muted rounded" />
              <div className="flex-1 h-5 bg-muted rounded" />
              <div className="w-8 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>No activity data</p>
      </div>
    );
  }

  // Create a map for quick lookup
  const dataMap = new Map(data.map(d => [d.date, d.count]));

  // Generate all days in range
  const today = new Date();
  const startDate = subDays(today, days - 1);
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  // Find max for intensity calculation
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getBarWidth = (count: number) => {
    if (count === 0) return 0;
    return Math.max((count / maxCount) * 100, 5);
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-primary';
    if (ratio > 0.5) return 'bg-primary/70';
    if (ratio > 0.25) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  // Show most recent 15 days (oldest at top, newest at bottom)
  const displayDays = allDays.slice(-15);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
        <span className="text-xs text-muted-foreground">
          Last {days} days
        </span>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-1">
        {displayDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = dataMap.get(dateStr) || 0;

          return (
            <div key={dateStr} className="flex items-center gap-3 group">
              <span className="w-14 text-xs text-muted-foreground shrink-0">
                {format(day, 'd MMM')}
              </span>
              <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded transition-all duration-300 group-hover:opacity-80',
                    getIntensityClass(count)
                  )}
                  style={{ width: `${getBarWidth(count)}%` }}
                />
              </div>
              <span className="w-8 text-xs text-muted-foreground text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground pt-2">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-muted/30" />
        <div className="w-3 h-3 rounded-sm bg-primary/20" />
        <div className="w-3 h-3 rounded-sm bg-primary/40" />
        <div className="w-3 h-3 rounded-sm bg-primary/70" />
        <div className="w-3 h-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
