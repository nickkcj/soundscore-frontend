'use client';

interface StatsCounterProps {
  totalScrobbles: number;
  uniqueArtists: number;
  days: number;
  isLoading?: boolean;
}

export function StatsCounter({ totalScrobbles, uniqueArtists, days, isLoading }: StatsCounterProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 sm:gap-6 animate-pulse">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-5 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 divide-x divide-[#e6dfd6] text-sm dark:divide-border sm:flex sm:divide-x-0 sm:gap-8">
      <div className="min-w-0 px-2 sm:px-0">
        <span className="block text-xl font-black tracking-[-0.03em] text-foreground sm:text-2xl">
          {totalScrobbles.toLocaleString()}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">reproduções</span>
      </div>
      <div className="min-w-0 px-2 sm:px-0">
        <span className="block text-xl font-black tracking-[-0.03em] text-foreground sm:text-2xl">
          {uniqueArtists.toLocaleString()}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">artistas</span>
      </div>
      <div className="min-w-0 px-2 sm:px-0">
        <span className="block text-xl font-black tracking-[-0.03em] text-[#d98524] sm:text-2xl">{Math.round(totalScrobbles / days)}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">por dia</span>
      </div>
    </div>
  );
}
