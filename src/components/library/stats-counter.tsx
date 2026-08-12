'use client';

interface StatsCounterProps {
  totalScrobbles: number;
  uniqueArtists: number;
  isLoading?: boolean;
}

export function StatsCounter({ totalScrobbles, uniqueArtists, isLoading }: StatsCounterProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 sm:gap-6 animate-pulse">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-5 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 text-sm sm:flex sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="text-xl sm:text-2xl font-bold text-foreground">
          {totalScrobbles.toLocaleString()}
        </span>
        <span className="text-muted-foreground">scrobbles</span>
      </div>
      <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="text-lg font-semibold text-foreground">
          {uniqueArtists.toLocaleString()}
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-wider">
          unique artists
        </span>
      </div>
    </div>
  );
}
