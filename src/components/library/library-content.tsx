'use client';

import { useState } from 'react';
import { Music, Loader2 } from 'lucide-react';
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

  // Map days to Spotify time_range
  const timeRange = days <= 30 ? 'short_term' : days <= 90 ? 'medium_term' : 'long_term';

  // Data hooks with date range
  const { status, isLoading: statusLoading } = useSpotifyStatus(username);
  const { stats, isLoading: statsLoading } = useLibraryStats(username, days);
  const { scrobbles, isLoading: scrobblesLoading } = useScrobbles(username);
  const { artists, isLoading: artistsLoading } = useTopArtists(username, timeRange);
  const { albums, isLoading: albumsLoading } = useTopAlbums(username, days);
  const { tracks, isLoading: tracksLoading } = useTopTracks(username, days);

  const [activeSubTab, setActiveSubTab] = useState<LibrarySubTab>('scrobbles');

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
            : 'This user hasn\'t connected their Spotify account.'}
        </p>
        {isOwnProfile && (
          <Button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/spotify/login`;
            }}
            className="bg-wine-600 hover:bg-wine-700"
          >
            Connect Spotify
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

        <DateRangeSelector value={dateRange} onChange={setDateRange} />
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
