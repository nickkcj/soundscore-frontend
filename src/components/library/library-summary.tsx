'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Music, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useSpotifyStatus,
  useLibraryStats,
  useTopArtists,
} from '@/hooks/use-library';

interface LibrarySummaryProps {
  username: string;
  isOwnProfile: boolean;
  isPublic: boolean;
}

export function LibrarySummary({ username, isOwnProfile, isPublic }: LibrarySummaryProps) {
  const { status, isLoading: statusLoading } = useSpotifyStatus(username);
  const { stats, isLoading: statsLoading } = useLibraryStats(username, 30);
  const { artists, isLoading: artistsLoading } = useTopArtists(username, 'medium_term', 3);

  // Se não é público e não é o próprio perfil, não mostrar nada
  if (!isPublic && !isOwnProfile) {
    return null;
  }

  // Loading state
  if (statusLoading || statsLoading || artistsLoading) {
    return (
      <div className="py-6 border-t border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Spotify não conectado
  if (!status?.connected) {
    if (!isOwnProfile) return null;

    return (
      <div className="py-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Biblioteca</h2>
        </div>
        <div className="text-center py-6 bg-muted/30 rounded-lg">
          <Music className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-3">
            Conecte seu Spotify para mostrar sua biblioteca
          </p>
          <Button
            size="sm"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/spotify/login`;
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            Conectar Spotify
          </Button>
        </div>
      </div>
    );
  }

  // Sem dados ainda
  if (!stats || stats.total_scrobbles === 0) {
    if (!isOwnProfile) return null;

    return (
      <div className="py-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Biblioteca</h2>
          <Link href="/library">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver completa
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="text-center py-6 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Sincronize seu histórico para ver seus top artistas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Biblioteca</h2>
          <span className="text-sm text-muted-foreground">
            {stats.total_scrobbles.toLocaleString('pt-BR')} scrobbles
          </span>
        </div>
        {isOwnProfile && (
          <Link href="/library">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver completa
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Top Artists */}
      {artists.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Artistas</h3>
          <div className="flex gap-4">
            {artists.slice(0, 3).map((artist, index) => (
              <div key={artist.name} className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg font-bold text-muted-foreground/50">{index + 1}</span>
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {artist.image ? (
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm truncate">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Track */}
      {stats.top_track && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
              {stats.top_track.image ? (
                <Image
                  src={stats.top_track.image}
                  alt={stats.top_track.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Mais ouvida</p>
              <p className="font-medium text-sm truncate">{stats.top_track.name}</p>
              <p className="text-xs text-muted-foreground truncate">{stats.top_track.artist}</p>
            </div>
            <span className="text-xs text-muted-foreground">{stats.top_track.count}x</span>
          </div>
        </div>
      )}
    </div>
  );
}
