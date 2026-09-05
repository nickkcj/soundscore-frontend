'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Music } from 'lucide-react';
import { StarRating } from '@/components/common/star-rating';

export interface ReviewShareData {
  type: 'review_share';
  review_uuid: string;
  album_title: string;
  album_artist: string;
  album_cover: string | null;
  album_spotify_id: string;
  rating: number;
  text: string | null;
  username: string;
  is_favorite: boolean;
}

export function tryParseReviewShare(content: string): ReviewShareData | null {
  try {
    const data = JSON.parse(content);
    if (data?.type === 'review_share' && data.review_uuid) {
      return data as ReviewShareData;
    }
  } catch {
    // Not JSON or not a review share
  }
  return null;
}

export function ReviewShareCard({ data }: { data: ReviewShareData }) {
  return (
    <Link
      href={`/reviews/${data.review_uuid}`}
      className="block w-[380px] max-w-full overflow-hidden rounded-[1.2rem] border border-[#ded6cc] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-border dark:bg-card"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex">
        {/* Album Cover */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-muted overflow-hidden">
          {data.album_cover ? (
            <Image
              src={data.album_cover}
              alt={data.album_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-wine-700/20 to-[#d98524]/25">
              <Music className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 p-2.5 min-w-0 text-left">
          <p className="text-xs text-muted-foreground">
            Review de <span className="font-medium text-foreground">@{data.username}</span>
          </p>
          <p className="font-semibold text-sm truncate mt-0.5">{data.album_title}</p>
          <p className="text-xs text-muted-foreground truncate">{data.album_artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={data.rating} size="sm" />
            {data.is_favorite && (
              <Heart className="h-3 w-3 text-primary fill-current" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
