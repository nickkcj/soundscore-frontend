'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  NowPlaying,
  Scrobble,
  LibraryStats,
  TopArtist,
  TopTrack,
  SpotifyConnectionStatus,
  SyncResponse,
} from '@/types';

export function useNowPlaying(username: string) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const data = await api.get<NowPlaying | null>(`/library/now-playing/${username}`);
      setNowPlaying(data);
    } catch {
      setNowPlaying(null);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchNowPlaying();

    // Poll every 30 seconds
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  return { nowPlaying, isLoading, refetch: fetchNowPlaying };
}

export function useSpotifyStatus(username: string) {
  const [status, setStatus] = useState<SpotifyConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.get<SpotifyConnectionStatus>(`/library/spotify-status/${username}`);
        setStatus(data);
      } catch {
        setStatus({ connected: false, username: null });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [username]);

  return { status, isLoading };
}

export function useScrobbles(username: string) {
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchScrobbles = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    setIsLoading(true);

    try {
      const data = await api.get<Scrobble[]>(
        `/library/scrobbles/${username}?limit=${limit}&offset=${currentOffset}`
      );

      if (reset) {
        setScrobbles(data);
        setOffset(limit);
      } else {
        setScrobbles((prev) => [...prev, ...data]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(data.length === limit);
    } catch {
      if (reset) setScrobbles([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, offset]);

  useEffect(() => {
    fetchScrobbles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return { scrobbles, isLoading, hasMore, fetchMore: () => fetchScrobbles(false), refetch: () => fetchScrobbles(true) };
}

export function useLibraryStats(username: string, days = 30) {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LibraryStats>(`/library/stats/${username}?days=${days}`);
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [username, days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}

export function useTopArtists(username: string, days = 30, limit = 10) {
  const [artists, setArtists] = useState<TopArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await api.get<TopArtist[]>(
          `/library/top/artists/${username}?days=${days}&limit=${limit}`
        );
        setArtists(data);
      } catch {
        setArtists([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, [username, days, limit]);

  return { artists, isLoading };
}

export function useTopTracks(username: string, days = 30, limit = 10) {
  const [tracks, setTracks] = useState<TopTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await api.get<TopTrack[]>(
          `/library/top/tracks/${username}?days=${days}&limit=${limit}`
        );
        setTracks(data);
      } catch {
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [username, days, limit]);

  return { tracks, isLoading };
}

export function useSyncScrobbles() {
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = async (): Promise<SyncResponse | null> => {
    setIsSyncing(true);
    try {
      const response = await api.post<SyncResponse>('/library/sync');
      return response;
    } catch {
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return { sync, isSyncing };
}
