import Image from 'next/image';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from './star-rating';
import { cn } from '@/lib/utils';

interface AlbumCardProps {
  spotifyId: string;
  title: string;
  artist: string;
  coverImage?: string | null;
  rating?: number;
  reviewCount?: number;
  releaseDate?: string | null;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-32',
  md: 'w-40',
  lg: 'w-48',
};

export function AlbumCard({
  spotifyId,
  title,
  artist,
  coverImage,
  rating,
  reviewCount,
  releaseDate,
  onClick,
  selected,
  size = 'md',
}: AlbumCardProps) {
  const content = (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-lg group cursor-pointer',
        selected && 'ring-2 ring-primary',
        sizeClasses[size]
      )}
      onClick={onClick}
    >
      <div className="aspect-square relative bg-muted overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Music className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate" title={title}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground truncate" title={artist}>
          {artist}
        </p>
        {releaseDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(releaseDate).getFullYear()}
          </p>
        )}
        {rating !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <StarRating rating={rating} size="sm" />
            {reviewCount !== undefined && (
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/album/${spotifyId}`}>
      {content}
    </Link>
  );
}

export function AlbumCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Card className={cn('overflow-hidden', sizeClasses[size])}>
      <Skeleton className="aspect-square" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
