'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LibraryHeaderBanner } from './library-header-banner';
import { LibraryTabs, type LibrarySubTab } from './library-tabs';
import { DateRangeSelector, type DateRangeValue } from './date-range-selector';
import { StatsCounter } from './stats-counter';
import { ScrobbleList } from './scrobble-list';
import { TopArtists } from './top-artists';
import { TopAlbums } from './top-albums';
import { TopTracks } from './top-tracks';
import { ActivityChart } from './activity-chart';
import {
  useSpotifyStatus,
  useScrobbles,
  useLibraryStats,
  useTopArtists,
  useTopAlbums,
  useTopTracks,
  useSyncScrobbles,
} from '@/hooks/use-library';
import { useAuth } from '@/hooks/use-auth';

interface LibraryContentProps {
  username: string;
}

export function LibraryContent({ username }: LibraryContentProps) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.username === username;

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeValue>('30');
  const days = parseInt(dateRange);

  // Data hooks with date range
  const { status, isLoading: statusLoading } = useSpotifyStatus(username);
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useLibraryStats(username, days);
  const { scrobbles, isLoading: scrobblesLoading, refetch: refetchScrobbles } = useScrobbles(username);
  const { artists, isLoading: artistsLoading } = useTopArtists(username, 'medium_term');
  const { albums, isLoading: albumsLoading } = useTopAlbums(username, days);
  const { tracks, isLoading: tracksLoading } = useTopTracks(username, days);
  const { sync, isSyncing } = useSyncScrobbles();

  const [activeSubTab, setActiveSubTab] = useState<LibrarySubTab>('scrobbles');
  const [hasSynced, setHasSynced] = useState(false);

  // Auto-sync on load for own profile
  useEffect(() => {
    if (isOwnProfile && status?.connected && !hasSynced) {
      handleSync();
      setHasSynced(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, status?.connected]);

  const handleSync = async () => {
    const result = await sync();
    if (result) {
      toast.success(result.message);
      refetchScrobbles();
      refetchStats();
    } else {
      toast.error('Erro ao sincronizar. Verifique se o Spotify está conectado.');
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-medium mb-2">Spotify Não Conectado</h3>
        <p className="text-muted-foreground mb-4">
          {isOwnProfile
            ? 'Conecte sua conta do Spotify para acompanhar seu histórico de músicas.'
            : 'Este usuário não conectou sua conta do Spotify.'}
        </p>
        {isOwnProfile && (
          <Button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/spotify/login`;
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            Conectar Spotify
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <LibraryHeaderBanner
        topArtist={artists[0] || null}
        topTrack={stats?.top_track || null}
        isLoading={artistsLoading || statsLoading}
      />

      {/* Stats Counter & Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <StatsCounter
          totalScrobbles={stats?.total_scrobbles || 0}
          uniqueArtists={stats?.unique_artists_count || 0}
          isLoading={statsLoading}
        />

        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />

          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <LibraryTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content (2/3) */}
        <div className="lg:col-span-2 min-h-[400px]">
          {activeSubTab === 'scrobbles' && (
            <ScrobbleList scrobbles={scrobbles} isLoading={scrobblesLoading} />
          )}
          {activeSubTab === 'artists' && (
            <TopArtists artists={artists} isLoading={artistsLoading} />
          )}
          {activeSubTab === 'albums' && (
            <TopAlbums albums={albums} isLoading={albumsLoading} />
          )}
          {activeSubTab === 'tracks' && (
            <TopTracks tracks={tracks} isLoading={tracksLoading} />
          )}
        </div>

        {/* Right Column - Activity Chart (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-4 bg-card rounded-lg border">
            <ActivityChart
              data={stats?.scrobbles_by_day || []}
              isLoading={statsLoading}
              days={days}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
