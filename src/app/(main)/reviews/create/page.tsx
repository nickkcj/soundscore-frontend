'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreateReviewModal } from '@/components/reviews/create-review-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { AlbumDetail, SpotifyAlbumResult } from '@/types';

function CreateReviewFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const albumId = searchParams.get('album');
  const { user, isLoading: authLoading } = useRequireAuth();
  const [initialAlbum, setInitialAlbum] = useState<SpotifyAlbumResult | null>(null);
  const [albumLoading, setAlbumLoading] = useState(Boolean(albumId));

  useEffect(() => {
    if (!albumId) return;
    let active = true;
    api.get<AlbumDetail>(`/reviews/album/${encodeURIComponent(albumId)}/details`)
      .then((album) => {
        if (!active) return;
        setInitialAlbum({
          spotify_id: album.spotify_id,
          title: album.title,
          artist: album.artist,
          cover_image: album.cover_image,
          release_date: album.release_date,
        });
      })
      .catch(() => undefined)
      .finally(() => { if (active) setAlbumLoading(false); });
    return () => { active = false; };
  }, [albumId]);

  if (authLoading || !user || albumLoading) return null;

  return (
    <CreateReviewModal
      open
      onOpenChange={(open) => { if (!open) router.push('/feed'); }}
      onSuccess={() => router.push('/feed')}
      initialAlbum={initialAlbum}
      currentUser={{ id: user.id, username: user.username, profile_picture: user.profile_picture }}
    />
  );
}

export default function CreateReviewPage() {
  return <Suspense fallback={null}><CreateReviewFlow /></Suspense>;
}
