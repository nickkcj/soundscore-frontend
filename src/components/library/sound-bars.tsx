'use client';

interface SoundBarsProps {
  isPlaying?: boolean;
  className?: string;
}

export function SoundBars({ isPlaying = true, className = '' }: SoundBarsProps) {
  return (
    <div className={`flex items-end gap-[2px] h-3 ${className}`}>
      <span
        className={`w-[3px] bg-primary rounded-full ${
          isPlaying ? 'animate-sound-bar-1' : 'h-1'
        }`}
      />
      <span
        className={`w-[3px] bg-primary rounded-full ${
          isPlaying ? 'animate-sound-bar-2' : 'h-2'
        }`}
      />
      <span
        className={`w-[3px] bg-primary rounded-full ${
          isPlaying ? 'animate-sound-bar-3' : 'h-1'
        }`}
      />
    </div>
  );
}
