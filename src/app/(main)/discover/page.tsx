'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Disc3, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumCard, AlbumCardSkeleton } from '@/components/common/album-card';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import type { SpotifyAlbumResult, UserListItem } from '@/types';

interface AlbumWithRating extends SpotifyAlbumResult {
  avg_rating?: number;
  review_count?: number;
}

interface SearchResults {
  albums: AlbumWithRating[];
  users: UserListItem[];
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('albums');
  const [results, setResults] = useState<SearchResults>({ albums: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ albums: [], users: [] });
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          type: tab === 'all' ? 'all' : tab,
        });

        const response = await api.get<SearchResults>(`/reviews/discover?${params}`);
        setResults(response);
      } catch {
        setResults({ albums: [], users: [] });
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery, tab]);

  const hasResults = results.albums.length > 0 || results.users.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-100 dark:bg-pink-950/30 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 dark:bg-purple-950/30 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />
      </div>

      <main className="container mx-auto max-w-6xl px-4 py-12 md:py-16 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4 animate-fade-in">
            Discover New Music
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore albums, artists, and connect with music lovers from around the world.
          </p>
        </header>

        {/* Search Section */}
        <section className="mb-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-pink-400" />
              </div>
              <Input
                placeholder="Search albums, artists, or users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-border rounded-full focus:border-pink-400 focus:ring-pink-400 transition-all bg-background shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-10">
          <div className="flex justify-center">
            <TabsList className="bg-card shadow-sm border border-border rounded-full p-1.5">
              <TabsTrigger
                value="albums"
                className="rounded-full px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
              >
                <Disc3 className="h-4 w-4 mr-2" />
                Albums
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-full px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Results */}
        {!query.trim() ? (
          <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
            <div className="bg-pink-50 dark:bg-pink-950/30 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to Explore?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start typing to search for your favorite albums, artists, or discover new music enthusiasts.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-8">
            {tab === 'albums' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <AlbumCardSkeleton key={i} size="md" />
                ))}
              </div>
            )}
            {tab === 'users' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        ) : !hasResults ? (
          <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
            <div className="bg-muted w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different search term.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Albums Grid */}
            {tab === 'albums' && results.albums.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                  <Disc3 className="h-7 w-7 text-pink-500 mr-3" />
                  Albums
                  <span className="ml-3 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {results.albums.length} results
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {results.albums.map((album) => (
                    <AlbumCard
                      key={album.spotify_id}
                      spotifyId={album.spotify_id}
                      title={album.title}
                      artist={album.artist}
                      coverImage={album.cover_image}
                      releaseDate={album.release_date}
                      rating={album.avg_rating}
                      reviewCount={album.review_count}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Users Grid */}
            {tab === 'users' && results.users.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                  <Users className="h-7 w-7 text-pink-500 mr-3" />
                  Users
                  <span className="ml-3 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {results.users.length} results
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function UserCard({ user }: { user: UserListItem }) {
  return (
    <Link href={`/profile/${user.username}`}>
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-pink-100">
              <Image
                src={user.profile_picture || '/images/default.jpg'}
                alt={user.username}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground truncate text-lg">{user.username}</h3>
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{user.bio}</p>
            )}
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm">
            View
          </button>
        </div>
      </div>
    </Link>
  );
}

function UserCardSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
    </div>
  );
}
