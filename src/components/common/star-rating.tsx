'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? `Select a rating, current rating ${rating} out of ${maxRating}` : `Rating: ${rating} out of ${maxRating}`}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const isFull = value <= rating;
        const isHalf = !isFull && value - 0.5 <= rating;

        const star = isHalf ? (
          <div className="relative">
            <Star
              className={cn(
                sizeClasses[size],
                'fill-transparent text-muted-foreground/40'
              )}
            />
            <div className="absolute inset-0 w-1/2 overflow-hidden">
              <Star
                className={cn(
                  sizeClasses[size],
                  'fill-amber-400 text-amber-400'
                )}
              />
            </div>
          </div>
        ) : (
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              isFull
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40'
            )}
          />
        );

        if (!interactive) {
          return <span key={i} aria-hidden="true">{star}</span>;
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(value)}
            aria-label={`${value} out of ${maxRating} stars`}
            aria-pressed={value === rating}
            className={cn(
              'relative cursor-pointer transition-colors hover:scale-110'
            )}
          >
            {star}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Skeleton for loading state
export function StarRatingSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded bg-muted animate-pulse',
            size === 'sm' && 'h-3.5 w-3.5',
            size === 'md' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6'
          )}
        />
      ))}
    </div>
  );
}
