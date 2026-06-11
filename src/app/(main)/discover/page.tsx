'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Disc3, Music, MessageSquareText, TrendingUp, Sparkles, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumCard, AlbumCardSkeleton } from '@/components/common/album-card';
import { StarRating } from '@/components/common/star-rating';
import { UserAvatar } from '@/components/common/user-avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import type { SpotifyAlbumResult, UserListItem } from '@/types';

interface AlbumWithRating extends SpotifyAlbumResult {
  avg_rating?: number;
  review_count?: number;
}

interface ReviewHit {
  uuid: string;
  rating: number;
  text: string | null;
  is_favorite: boolean;
  created_at: string;
  username: string;
  user_profile_picture: string | null;
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
  like_count: number;
  comment_count: number;
}

interface SearchResults {
  albums: AlbumWithRating[];
  users: UserListItem[];
  reviews: ReviewHit[];
}

interface RecentReviewItem {
  id: number;
  rating: number;
  text: string | null;
  created_at: string;
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
  album_spotify_id: string;
  username: string;
  user_profile_picture: string | null;
}

const EMPTY_RESULTS: SearchResults = { albums: [], users: [], reviews: [] };

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);

  // Conteúdo de exploração (estado sem busca)
  const [trending, setTrending] = useState<AlbumWithRating[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReviewItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserListItem[]>([]);
  const [exploreLoading, setExploreLoading] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  // Busca
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults(EMPTY_RESULTS);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery, type: tab });
        const response = await api.get<SearchResults>(`/reviews/discover?${params}`);
        setResults({ ...EMPTY_RESULTS, ...response });
      } catch {
        setResults(EMPTY_RESULTS);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery, tab]);

  // Conteúdo de exploração (carrega uma vez)
  useEffect(() => {
    const fetchExplore = async () => {
      setExploreLoading(true);
      const [trendingRes, recentRes, suggestedRes] = await Promise.allSettled([
        api.get<{ albums: AlbumWithRating[] }>('/home/trending-albums'),
        api.get<{ reviews: RecentReviewItem[] }>('/home/recent-reviews'),
        api.get<{ users: UserListItem[] }>('/users/suggested?per_page=6'),
      ]);
      if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.albums);
      if (recentRes.status === 'fulfilled') setRecentReviews(recentRes.value.reviews);
      if (suggestedRes.status === 'fulfilled') setSuggestedUsers(suggestedRes.value.users);
      setExploreLoading(false);
    };

    fetchExplore();
  }, []);

  const hasResults =
    results.albums.length > 0 || results.users.length > 0 || results.reviews.length > 0;
  const showAlbums = tab === 'all' || tab === 'albums';
  const showUsers = tab === 'all' || tab === 'users';
  const showReviews = tab === 'all' || tab === 'reviews';

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Search Section */}
        <section className="mb-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-wine-400" />
              </div>
              <Input
                placeholder="Search albums, users, or reviews..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-border rounded-full focus:border-wine-400 focus:ring-wine-400 transition-all bg-background shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-8">
          <div className="flex justify-center">
            <TabsList className="bg-card shadow-sm border border-border rounded-full p-1.5">
              <TabsTrigger
                value="all"
                className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-wine-600 data-[state=active]:text-white transition-all"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
              <TabsTrigger
                value="albums"
                className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-wine-600 data-[state=active]:text-white transition-all"
              >
                <Disc3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Albums</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-wine-600 data-[state=active]:text-white transition-all"
              >
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-wine-600 data-[state=active]:text-white transition-all"
              >
                <MessageSquareText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Conteúdo */}
        {!query.trim() ? (
          <ExploreContent
            trending={trending}
            recentReviews={recentReviews}
            suggestedUsers={suggestedUsers}
            isLoading={exploreLoading}
          />
        ) : isLoading ? (
          <div className="space-y-8">
            {showAlbums && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <AlbumCardSkeleton key={i} size="md" />
                ))}
              </div>
            )}
            {showUsers && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
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
            {/* Albums */}
            {showAlbums && results.albums.length > 0 && (
              <SectionBlock icon={Disc3} title="Albums" count={results.albums.length}>
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
              </SectionBlock>
            )}

            {/* Users */}
            {showUsers && results.users.length > 0 && (
              <SectionBlock icon={Users} title="Users" count={results.users.length}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* Reviews */}
            {showReviews && results.reviews.length > 0 && (
              <SectionBlock icon={MessageSquareText} title="Reviews" count={results.reviews.length}>
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
                  {results.reviews.map((review) => (
                    <ReviewHitRow key={review.uuid} review={review} />
                  ))}
                </div>
              </SectionBlock>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SectionBlock({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
        <Icon className="h-5 w-5 text-wine-500 mr-2" />
        {title}
        {count !== undefined && (
          <span className="ml-3 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {count} {count === 1 ? 'result' : 'results'}
          </span>
        )}
      </h2>
      {children}
    </div>
  );
}

/** Resultado de busca de review — linha compacta no padrão do feed */
function ReviewHitRow({ review }: { review: ReviewHit }) {
  return (
    <Link
      href={`/reviews/${review.uuid}`}
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
    >
      <UserAvatar username={review.username} profilePicture={review.user_profile_picture} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold truncate">{review.username}</span>
          <span className="text-muted-foreground">·</span>
          <span className="shrink-0 text-muted-foreground">
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
          </span>
        </div>
        {review.text && (
          <p className="mt-0.5 text-[15px] leading-snug text-foreground/90 line-clamp-2">
            {review.text}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-2">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {review.album_cover_image ? (
              <Image src={review.album_cover_image} alt={review.album_title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{review.album_title}</p>
            <p className="truncate text-xs text-muted-foreground">{review.album_artist}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              {review.is_favorite && (
                <Heart aria-label="Favorite" className="h-3 w-3 fill-current text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Conteúdo de exploração mostrado quando não há busca ativa */
function ExploreContent({
  trending,
  recentReviews,
  suggestedUsers,
  isLoading,
}: {
  trending: AlbumWithRating[];
  recentReviews: RecentReviewItem[];
  suggestedUsers: UserListItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <Skeleton className="h-6 w-44 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <AlbumCardSkeleton key={i} size="md" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-44 mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = trending.length === 0 && recentReviews.length === 0 && suggestedUsers.length === 0;
  if (isEmpty) {
    return (
      <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
        <div className="bg-wine-50 dark:bg-wine-950/30 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
          <Search className="h-12 w-12 text-wine-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Ready to Explore?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start typing to search for albums, users, or reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Trending da semana */}
      {trending.length > 0 && (
        <SectionBlock icon={TrendingUp} title="Trending This Week">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trending.map((album) => (
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
        </SectionBlock>
      )}

      {/* Quem seguir */}
      {suggestedUsers.length > 0 && (
        <SectionBlock icon={Users} title="Who to Follow">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Reviews recentes da comunidade */}
      {recentReviews.length > 0 && (
        <SectionBlock icon={MessageSquareText} title="Recent Reviews">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
            {recentReviews.map((review) => (
              <Link
                key={review.id}
                href={`/album/${review.album_spotify_id}`}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <UserAvatar
                  username={review.username}
                  profilePicture={review.user_profile_picture}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold truncate">{review.username}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {review.text && (
                    <p className="mt-0.5 text-[15px] leading-snug text-foreground/90 line-clamp-2">
                      {review.text}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">
                      {review.album_title} — {review.album_artist}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SectionBlock>
      )}
    </div>
  );
}

function UserCard({ user }: { user: UserListItem }) {
  return (
    <Link href={`/profile/${user.username}`}>
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-wine-100">
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
          <button className="px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white text-sm font-medium rounded-full transition-all shadow-sm">
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
