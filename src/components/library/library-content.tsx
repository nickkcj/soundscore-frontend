'use client';

import { useState } from 'react';
import { Music, Loader2, UserRound, Disc3, ListMusic, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryHeaderBanner } from './library-header-banner';
import { LibraryTabs, type LibrarySubTab } from './library-tabs';
import { DateRangeSelector, type DateRangeValue } from './date-range-selector';
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-[2rem] border border-[#ddd4c9] bg-white px-6 py-12 text-center shadow-[0_18px_60px_rgba(57,39,31,0.08)] dark:border-border dark:bg-card md:my-14">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50 text-wine-700 dark:bg-muted"><Music className="h-7 w-7" /></div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-wine-700">Sua história de escuta</p>
        <h3 className="mb-2 text-2xl font-black tracking-[-0.035em]">Conecte seu Spotify</h3>
        <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {isOwnProfile
            ? 'Acompanhe suas músicas, artistas e álbuns mais ouvidos em um só lugar.'
            : 'Este usuário ainda não conectou uma conta do Spotify.'}
        </p>
        {isOwnProfile && (
          <Button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/spotify/login`;
            }}
            className="h-11 rounded-full bg-wine-700 px-5 font-bold text-white hover:bg-wine-800"
          >
            Conectar Spotify
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header Banner */}
      <LibraryHeaderBanner
        topArtist={artists[0] || null}
        topTrack={stats?.top_track || null}
        isLoading={artistsLoading || statsLoading}
      />

      {/* Tabs */}
      <LibraryTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Two-Column Layout */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left Column - Main Content (2/3) */}
        <div className="order-last min-w-0 rounded-[1.65rem] border border-[#ded6cc] bg-white p-3 shadow-[0_14px_45px_rgba(57,39,31,0.06)] dark:border-border dark:bg-card sm:p-5 lg:order-first lg:col-span-2 lg:min-h-[400px]">
          {activeSubTab !== 'scrobbles' && <LibrarySectionTitle activeTab={activeSubTab} />}
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
        <div className="order-first lg:order-last lg:col-span-1">
          <div className="rounded-[1.65rem] border border-[#ded6cc] bg-white p-4 shadow-[0_14px_45px_rgba(57,39,31,0.06)] dark:border-border dark:bg-card lg:sticky lg:top-24">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine-50 text-wine-700 dark:bg-muted"><BarChart3 className="h-4 w-4" /></span><h2 className="font-black tracking-[-0.02em]">Atividade</h2></div>
            <div className="mb-4"><DateRangeSelector value={dateRange} onChange={setDateRange} /></div>
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

const sectionMeta = {
  artists: { title: 'Artistas mais ouvidos', subtitle: 'Quem mais apareceu nos seus fones.', icon: UserRound },
  albums: { title: 'Álbuns mais ouvidos', subtitle: 'Os discos que ganharam mais voltas.', icon: Disc3 },
  tracks: { title: 'Faixas mais ouvidas', subtitle: 'As músicas que você não quis pular.', icon: ListMusic },
};

function LibrarySectionTitle({ activeTab }: { activeTab: Exclude<LibrarySubTab, 'scrobbles'> }) {
  const item = sectionMeta[activeTab];
  const Icon = item.icon;
  return <div className="mb-3 flex items-center gap-3 border-b border-[#ebe4db] px-1 pb-4 dark:border-border"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f0e8] text-wine-700 dark:bg-muted"><Icon className="h-4 w-4" /></span><div><h2 className="font-black tracking-[-0.02em]">{item.title}</h2><p className="text-xs text-muted-foreground sm:text-sm">{item.subtitle}</p></div></div>;
}
