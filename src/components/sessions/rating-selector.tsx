'use client';

import { cn } from '@/lib/utils';

interface RatingSelectorProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function RatingSelector({ value, onChange, disabled }: RatingSelectorProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:flex sm:flex-wrap sm:justify-center" role="group" aria-label="Rating from 0 to 10">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        const isSelected = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            aria-label={`Rate ${n}`}
            aria-pressed={isSelected}
            className={cn(
              'h-11 min-w-0 rounded-lg text-base font-bold transition-all duration-150 sm:min-w-[44px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? 'bg-wine-600 text-white shadow-lg scale-105 ring-2 ring-wine-400'
                : 'bg-muted text-foreground hover:bg-wine-100 hover:text-wine-700 dark:hover:bg-wine-900/30 dark:hover:text-wine-300'
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
