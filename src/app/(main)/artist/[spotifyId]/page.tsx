'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Music,
  Star,
  Disc3,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { ArtistDetail } from '@/types';

function formatReleaseYear(date: string | null): string {
  if (!date) return '';
  return date.split('-')[0];
}

interface PageProps {
  params: Promise<{ spotifyId: string }>;
}

export default function ArtistPage({ params }: PageProps) {
  const { spotifyId } = use(params);
  const router = useRouter();

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<ArtistDetail>(`/artist/${spotifyId}/details`);
        setArtist(data);
      } catch (err) {
        setError('Failed to load artist details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtist();
  }, [spotifyId]);

  if (isLoading) {
    return <ArtistPageSkeleton />;
  }

  if (error || !artist) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-3 h-11 px-2 md:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-12 md:py-20">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Artist not found</h2>
          <p className="text-muted-foreground">{error || 'Could not load artist details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto max-w-5xl px-4 py-4 md:py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-3 h-11 px-2 md:mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Artist Header */}
        <div className="mb-6 flex items-center gap-4 md:mb-10 md:items-start md:gap-8">
          {/* Artist Image */}
          <div className="flex-shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-xl sm:h-36 sm:w-36 md:h-64 md:w-64 md:shadow-2xl">
              {artist.image_url ? (
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-wine-500/20 to-wine-800/20">
                  <Music className="h-12 w-12 text-muted-foreground/50 md:h-24 md:w-24" />
                </div>
              )}
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
            <h1 className="mb-2 line-clamp-2 text-2xl font-bold leading-tight md:text-4xl">{artist.name}</h1>

            {/* Genres */}
            {artist.genres.length > 0 && (
              <div className="mb-2 flex max-h-14 flex-wrap items-center gap-1.5 overflow-hidden md:mb-4 md:max-h-none md:gap-2">
                {artist.genres.slice(0, 5).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground md:mb-4 md:text-sm">
              <span className="flex items-center gap-1">
                <Disc3 className="h-4 w-4" />
                {artist.albums.length} albums
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {artist.spotify_url && (
                <Button asChild className="h-11 bg-wine-600 px-3 text-white hover:bg-wine-700">
                  <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Spotify
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio / Summary */}
        {artist.summary && (
          <Card className="mb-6 md:mb-10">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Music className="h-5 w-5 text-wine-500" />
                About {artist.name}
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {artist.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Discography */}
        {artist.albums.length > 0 && (
          <div className="mb-6 md:mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-wine-500" />
              Discography
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.spotify_id}
                  href={`/album/${album.spotify_id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      {album.cover_image ? (
                        <Image
                          src={album.cover_image}
                          alt={album.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Disc3 className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2.5 sm:p-3">
                      <p className="font-medium text-sm truncate">{album.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatReleaseYear(album.release_date)}
                      </p>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        {album.avg_rating ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {album.avg_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ratings</span>
                        )}
                        {album.review_count > 0 && (
                          <span className="truncate text-[11px] text-muted-foreground sm:text-xs">
                            ({album.review_count} {album.review_count === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistPageSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 md:py-8">
      <Skeleton className="h-11 w-24 mb-3 md:mb-6" />

      <div className="flex gap-4 md:gap-8 mb-6 md:mb-10">
        <Skeleton className="h-28 w-28 shrink-0 rounded-full sm:h-36 sm:w-36 md:h-64 md:w-64" />
        <div className="flex-1 space-y-4 flex flex-col justify-center">
          <Skeleton className="h-10 w-3/4 mx-auto md:mx-0" />
          <div className="flex gap-2 justify-center md:justify-start">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
          <div className="flex gap-4 justify-center md:justify-start">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-10 w-40 mx-auto md:mx-0" />
        </div>
      </div>

      <Card className="mb-10">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
