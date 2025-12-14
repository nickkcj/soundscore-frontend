'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrobbleList } from './scrobble-list';
import { TopArtists } from './top-artists';
import { TopTracks } from './top-tracks';
import { ActivityChart } from './activity-chart';
import {
  useSpotifyStatus,
  useScrobbles,
  useLibraryStats,
  useTopArtists,
  useTopTracks,
  useSyncScrobbles,
} from '@/hooks/use-library';
import { useAuth } from '@/hooks/use-auth';

interface LibraryTabProps {
  username: string;
}

type SubTab = 'scrobbles' | 'artists' | 'tracks';

export function LibraryTab({ username }: LibraryTabProps) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.username === username;

  const { status, isLoading: statusLoading } = useSpotifyStatus(username);
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useLibraryStats(username);
  const { scrobbles, isLoading: scrobblesLoading, refetch: refetchScrobbles } = useScrobbles(username);
  const { artists, isLoading: artistsLoading } = useTopArtists(username);
  const { tracks, isLoading: tracksLoading } = useTopTracks(username);
  const { sync, isSyncing } = useSyncScrobbles();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('scrobbles');
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
      toast.error('Failed to sync. Make sure Spotify is connected.');
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
        <h3 className="text-lg font-medium mb-2">Spotify Not Connected</h3>
        <p className="text-muted-foreground mb-4">
          {isOwnProfile
            ? 'Connect your Spotify account to track your listening history.'
            : 'This user has not connected their Spotify account.'}
        </p>
        {isOwnProfile && (
          <Button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/spotify/login`;
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            Connect Spotify
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg border">
          <div className="text-center">
            <span className="block text-2xl font-bold text-foreground">
              {stats.total_scrobbles}
            </span>
            <span className="text-sm text-muted-foreground">Scrobbles</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-foreground truncate">
              {stats.top_artist?.name || '-'}
            </span>
            <span className="text-sm text-muted-foreground">Top Artist</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-foreground truncate">
              {stats.top_track?.name || '-'}
            </span>
            <span className="text-sm text-muted-foreground">Top Track</span>
          </div>
        </div>
      )}

      {/* Activity Chart */}
      {stats?.scrobbles_by_day && stats.scrobbles_by_day.length > 0 && (
        <div className="p-4 bg-card rounded-lg border">
          <ActivityChart data={stats.scrobbles_by_day} isLoading={statsLoading} />
        </div>
      )}

      {/* Sync Button (own profile only) */}
      {isOwnProfile && (
        <div className="flex justify-end">
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
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveSubTab('scrobbles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSubTab === 'scrobbles'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveSubTab('artists')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSubTab === 'artists'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Artists
        </button>
        <button
          onClick={() => setActiveSubTab('tracks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSubTab === 'tracks'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tracks
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {activeSubTab === 'scrobbles' && (
          <ScrobbleList scrobbles={scrobbles} isLoading={scrobblesLoading} />
        )}
        {activeSubTab === 'artists' && (
          <TopArtists artists={artists} isLoading={artistsLoading} />
        )}
        {activeSubTab === 'tracks' && (
          <TopTracks tracks={tracks} isLoading={tracksLoading} />
        )}
      </div>
    </div>
  );
}
