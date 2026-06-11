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
    <div className="space-y-6">
      {/* Hero: Album avg */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-br from-wine-600 to-wine-800 p-6 text-white text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden shadow-2xl">
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
            <div className="text-center sm:text-left">
              <p className="text-white/80 text-sm mb-0.5">Listening Party Complete</p>
              <h1 className="text-xl font-bold mb-0.5">{session.album_title}</h1>
              <p className="text-white/80">{session.album_artist}</p>
            </div>
          </div>
        </div>

        <div className="p-6 text-center border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">Album Average</p>
          <p className="text-6xl font-black text-wine-600 dark:text-wine-400">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bestTrack && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Best Track</span>
            </div>
            <p className="font-bold">{bestTrack.name}</p>
            <p className="text-2xl font-black text-wine-600 dark:text-wine-400 mt-1">
              {bestTrack.avg_rating?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
        {divisiveTrack && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Most Divisive</span>
            </div>
            <p className="font-bold">{divisiveTrack.name}</p>
            <p className="text-2xl font-black text-wine-600 dark:text-wine-400 mt-1">
              {divisiveTrack.avg_rating?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
      </div>

      {/* Tracks × Participants table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-wine-500" />
          <h2 className="font-semibold">Ratings by Track</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground min-w-[140px]">Track</th>
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
                    <td className="p-3">
                      <span className="text-muted-foreground text-xs mr-1.5">{idx + 1}.</span>
                      {track.name}
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
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Listener Rankings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Average rating given</p>
          </div>
          <div className="divide-y divide-border">
            {[...summary.avg_by_user]
              .sort((a, b) => b.avg - a.avg)
              .map((u, idx) => (
                <div key={u.user_id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-4">{idx + 1}</span>
                    <span className="font-medium">{u.username}</span>
                    {idx === 0 && (
                      <span className="text-xs text-muted-foreground">(most generous)</span>
                    )}
                    {idx === summary.avg_by_user.length - 1 && summary.avg_by_user.length > 1 && (
                      <span className="text-xs text-muted-foreground">(harshest critic)</span>
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
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          {copied ? 'Copied!' : 'Share Session'}
        </Button>
        {session.album_spotify_id && (
          <Button asChild className="flex-1 bg-wine-600 hover:bg-wine-700 text-white">
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
