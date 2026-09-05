'use client';

import { cn } from '@/lib/utils';

interface RatingSelectorProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function RatingSelector({ value, onChange, disabled }: RatingSelectorProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="group" aria-label="Nota de 0 a 10">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        const isSelected = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            aria-label={`Dar nota ${n}`}
            aria-pressed={isSelected}
            className={cn(
              'h-11 min-w-0 rounded-xl text-base font-black transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? 'scale-105 bg-wine-700 text-white shadow-lg ring-2 ring-wine-400'
                : 'bg-[#f1ece5] text-foreground hover:bg-wine-700/10 hover:text-wine-700 dark:bg-muted dark:hover:bg-wine-900/30 dark:hover:text-wine-300'
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
