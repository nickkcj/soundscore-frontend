'use client';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ScrobblesByDay } from '@/types';

interface ActivityChartProps {
  data: ScrobblesByDay[];
  isLoading?: boolean;
}

export function ActivityChart({ data, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-16 h-4 bg-muted rounded" />
            <div className="flex-1 h-4 bg-muted rounded" style={{ width: `${Math.random() * 60 + 20}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No activity data yet</p>
      </div>
    );
  }

  // Find max count for scaling bars
  const maxCount = Math.max(...data.map(d => d.count));

  // Sort by date descending (most recent first)
  const sortedData = [...data].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
        <span className="text-xs text-muted-foreground">Last 30 days</span>
      </div>

      {sortedData.map((item) => {
        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const date = parseISO(item.date);

        return (
          <div key={item.date} className="flex items-center gap-3 group">
            <span className="w-16 text-xs text-muted-foreground shrink-0">
              {format(date, 'd MMM', { locale: ptBR })}
            </span>
            <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
              <div
                className="h-full bg-primary/20 rounded transition-all duration-300 group-hover:bg-primary/30"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="w-8 text-xs text-muted-foreground text-right">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
