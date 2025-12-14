'use client';

interface StatsCounterProps {
  totalScrobbles: number;
  uniqueArtists: number;
  isLoading?: boolean;
}

export function StatsCounter({ totalScrobbles, uniqueArtists, isLoading }: StatsCounterProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-6 animate-pulse">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-5 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground">
          {totalScrobbles.toLocaleString('pt-BR')}
        </span>
        <span className="text-muted-foreground">scrobbles</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">
          {uniqueArtists.toLocaleString('pt-BR')}
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-wider">
          artistas incluídos
        </span>
      </div>
    </div>
  );
}
