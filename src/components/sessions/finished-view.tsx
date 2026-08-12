'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Trophy,
  Zap,
  Share2,
  Star,
  Music,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionState } from '@/types/sessions';

interface FinishedViewProps {
  session: SessionState;
}

export function FinishedView({ session }: FinishedViewProps) {
  const { summary } = session;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const bestTrack =
    summary?.best_track_index !== null && summary?.best_track_index !== undefined
      ? session.tracks[summary.best_track_index]
      : null;

  const divisiveTrack =
    summary?.most_divisive_track_index !== null &&
    summary?.most_divisive_track_index !== undefined
      ? session.tracks[summary.most_divisive_track_index]
      : null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero: Album avg */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-br from-wine-600 to-wine-800 p-4 text-white sm:p-6 sm:text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-xl sm:h-24 sm:w-24 sm:shadow-2xl">
              {session.album_cover_image ? (
                <Image
                  src={session.album_cover_image}
                  alt={session.album_title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/20">
                  <Music className="h-10 w-10 text-white/70" />
                </div>
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-white/80 text-sm mb-0.5">Listening Party Complete</p>
              <h1 className="mb-0.5 line-clamp-2 text-lg font-bold leading-tight sm:text-xl">{session.album_title}</h1>
              <p className="truncate text-sm text-white/80 sm:text-base">{session.album_artist}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 text-center sm:p-6">
          <p className="text-sm text-muted-foreground mb-1">Album Average</p>
          <p className="text-5xl font-black text-wine-600 dark:text-wine-400 sm:text-6xl">
            {summary?.album_avg?.toFixed(1) ?? '—'}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  summary?.album_avg !== null && summary?.album_avg !== undefined &&
                  i < Math.round((summary.album_avg / 10) * 5)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted-foreground'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {bestTrack && (
          <div className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Best Track</span>
            </div>
            <p className="line-clamp-2 text-sm font-bold sm:text-base">{bestTrack.name}</p>
            <p className="text-2xl font-black text-wine-600 dark:text-wine-400 mt-1">
              {bestTrack.avg_rating?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
        {divisiveTrack && (
          <div className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Most Divisive</span>
            </div>
            <p className="line-clamp-2 text-sm font-bold sm:text-base">{divisiveTrack.name}</p>
            <p className="text-2xl font-black text-wine-600 dark:text-wine-400 mt-1">
              {divisiveTrack.avg_rating?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
      </div>

      {/* Tracks × Participants table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-3 sm:p-4">
          <BarChart3 className="h-5 w-5 text-wine-500" />
          <h2 className="font-semibold">Ratings by Track</h2>
        </div>
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 z-10 min-w-[132px] bg-muted/95 p-2.5 text-left font-medium text-muted-foreground sm:min-w-[140px] sm:p-3">Track</th>
                {session.participants.map((p) => (
                  <th key={p.user_id} className="text-center p-3 font-medium whitespace-nowrap">
                    {p.username}
                  </th>
                ))}
                <th className="text-center p-3 font-medium text-wine-600 dark:text-wine-400 whitespace-nowrap">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {session.tracks.map((track, idx) => {
                const avg = summary?.avg_by_track?.[idx];
                return (
                  <tr key={track.index} className="hover:bg-muted/30 transition-colors">
                    <td className="sticky left-0 z-10 max-w-[180px] bg-card p-2.5 sm:p-3">
                      <span className="text-muted-foreground text-xs mr-1.5">{idx + 1}.</span>
                      <span className="line-clamp-2">{track.name}</span>
                    </td>
                    {session.participants.map((p) => {
                      const r = track.ratings?.find((rt) => rt.user_id === p.user_id);
                      return (
                        <td key={p.user_id} className="p-3 text-center">
                          {r !== undefined ? (
                            <span
                              title={r.comment || undefined}
                              className={cn(
                                'font-bold',
                                r.rating >= 8 ? 'text-green-600 dark:text-green-400' :
                                r.rating >= 5 ? 'text-foreground' :
                                'text-muted-foreground'
                              )}
                            >
                              {r.rating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-wine-600 dark:text-wine-400">
                      {avg !== null && avg !== undefined ? avg.toFixed(1) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Rankings */}
      {summary && summary.avg_by_user.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border p-3 sm:p-4">
            <h2 className="font-semibold">Listener Rankings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Average rating given</p>
          </div>
          <div className="divide-y divide-border">
            {[...summary.avg_by_user]
              .sort((a, b) => b.avg - a.avg)
              .map((u, idx) => (
                <div key={u.user_id} className="flex min-w-0 items-center justify-between gap-3 p-3 sm:p-4">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-4">{idx + 1}</span>
                    <span className="truncate font-medium">{u.username}</span>
                    {idx === 0 && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">(most generous)</span>
                    )}
                    {idx === summary.avg_by_user.length - 1 && summary.avg_by_user.length > 1 && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">(harshest critic)</span>
                    )}
                  </div>
                  <span className="text-xl font-black text-wine-600 dark:text-wine-400">
                    {u.avg.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          {copied ? 'Copied!' : 'Share Session'}
        </Button>
        {session.album_spotify_id && (
          <Button asChild className="h-11 w-full bg-wine-600 text-white hover:bg-wine-700">
            <Link href={`/album/${session.album_spotify_id}`}>
              <ExternalLink className="h-4 w-4" />
              View Album
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
