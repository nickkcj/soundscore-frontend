'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Music,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RatingSelector } from './rating-selector';
import { sessionsApi } from '@/lib/sessions-api';
import { ApiException } from '@/lib/api';
import type { SessionState, SessionPresencePayload } from '@/types/sessions';

interface ActiveViewProps {
  session: SessionState;
  onlineUsers: SessionPresencePayload[];
  onMutationSuccess: () => Promise<void>;
}

export function ActiveView({ session, onlineUsers, onMutationSuccess }: ActiveViewProps) {
  const currentTrack = session.tracks[session.current_track_index];
  const [rating, setRating] = useState<number | null>(currentTrack?.my_rating ?? null);
  const [comment, setComment] = useState<string>(currentTrack?.my_comment ?? '');
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [revealedExpanded, setRevealedExpanded] = useState(false);

  // Sync form with track changes
  useEffect(() => {
    setRating(currentTrack?.my_rating ?? null);
    setComment(currentTrack?.my_comment ?? '');
  }, [session.current_track_index, currentTrack?.my_rating, currentTrack?.my_comment]);

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const totalParticipants = session.participants.length;
  const votesCount = currentTrack?.votes_count ?? 0;
  const hasVoted = currentTrack?.my_rating !== null;
  const isRevealed = currentTrack?.revealed ?? false;
  const isLastTrack = session.current_track_index === session.tracks.length - 1;

  const handleLockIn = async () => {
    if (rating === null) {
      toast.error('Please select a rating first.');
      return;
    }

    setIsLockingIn(true);
    try {
      await sessionsApi.submitRating(session.code, {
        track_index: session.current_track_index,
        rating,
        comment: comment.trim() || undefined,
      });
      await onMutationSuccess();
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        toast.error('Voting is closed — this track has already been revealed.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to submit rating');
      }
    } finally {
      setIsLockingIn(false);
    }
  };

  const handleAdvance = async () => {
    setIsAdvancing(true);
    try {
      await sessionsApi.advance(session.code);
      await onMutationSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to advance');
    } finally {
      setIsAdvancing(false);
    }
  };

  const revealedTracks = session.tracks.filter((t) => t.revealed && t.index < session.current_track_index);

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden">
            {session.album_cover_image ? (
              <Image
                src={session.album_cover_image}
                alt={session.album_title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-wine-500/20 to-wine-800/20">
                <Music className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{session.album_title}</p>
            <p className="text-sm text-muted-foreground truncate">{session.album_artist}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Track</p>
            <p className="font-bold text-wine-600 dark:text-wine-400">
              {session.current_track_index + 1}/{session.tracks.length}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-wine-600 rounded-full transition-all duration-500"
            style={{
              width: `${((session.current_track_index + (isRevealed ? 1 : 0)) / session.tracks.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current track card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
              {session.album_cover_image ? (
                <Image
                  src={session.album_cover_image}
                  alt={session.album_title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-wine-500/20 to-wine-800/20">
                  <Music className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Now Rating
              </p>
              <h2 className="text-2xl font-bold leading-tight">{currentTrack?.name}</h2>
            </div>
          </div>
        </div>

        {!isRevealed ? (
          /* Voting phase */
          <div className="p-5 space-y-5">
            <div>
              <p className="text-sm font-medium text-center text-muted-foreground mb-3">
                Your rating
              </p>
              <RatingSelector
                value={rating}
                onChange={setRating}
                disabled={isLockingIn}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="track-comment" className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comment (optional)
              </label>
              <Textarea
                id="track-comment"
                placeholder="What do you think about this track?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none min-h-[80px]"
                disabled={isLockingIn}
              />
            </div>

            <Button
              className="w-full bg-wine-600 hover:bg-wine-700 text-white h-12 text-base font-semibold"
              onClick={handleLockIn}
              disabled={rating === null || isLockingIn}
            >
              {isLockingIn ? (
                'Locking in...'
              ) : hasVoted ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Update Vote
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Lock In
                </>
              )}
            </Button>

            {/* Voting progress */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Votes</span>
                <span className="text-sm font-bold text-wine-600 dark:text-wine-400">
                  {votesCount}/{totalParticipants}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {session.participants.map((p, i) => {
                  const isOnline = onlineIds.has(p.user_id);
                  // We know votes count but not WHO voted (by design — blind voting)
                  // Show participant avatars with online indicator only
                  return (
                    <div key={p.user_id} className="relative" title={p.username}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.profile_picture || undefined} />
                        <AvatarFallback className="bg-wine-600 text-white text-xs">
                          {p.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                      {/* Show vote indicator based on index vs votes_count (order not guaranteed but fair indicator) */}
                      {i < votesCount && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-wine-600 ring-1 ring-background flex items-center justify-center">
                          <CheckCircle2 className="h-2 w-2 text-white" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasVoted && votesCount < totalParticipants && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Waiting for others...
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Reveal phase */
          <div className="p-5 space-y-4">
            {/* Average highlight */}
            <div className="text-center py-4 bg-gradient-to-br from-wine-50 to-wine-100 dark:from-wine-950/30 dark:to-wine-900/20 rounded-xl border border-wine-200 dark:border-wine-800">
              <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
              <p className="text-5xl font-black text-wine-600 dark:text-wine-400">
                {currentTrack?.avg_rating?.toFixed(1) ?? '—'}
              </p>
            </div>

            {/* Individual ratings */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">All votes revealed</p>
              {currentTrack?.ratings.map((r) => (
                <div
                  key={r.user_id}
                  className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg"
                >
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    {session.participants.find((p) => p.user_id === r.user_id)?.profile_picture && (
                      <AvatarImage
                        src={session.participants.find((p) => p.user_id === r.user_id)!.profile_picture!}
                      />
                    )}
                    <AvatarFallback className="bg-wine-600 text-white text-xs font-semibold">
                      {r.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.username}</span>
                      <span className={cn(
                        'text-xl font-black shrink-0',
                        r.rating >= 8 ? 'text-green-600 dark:text-green-400' :
                        r.rating >= 5 ? 'text-wine-600 dark:text-wine-400' :
                        'text-muted-foreground'
                      )}>
                        {r.rating}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Host controls */}
            {session.is_host && (
              <Button
                className="w-full bg-wine-600 hover:bg-wine-700 text-white h-12 text-base font-semibold"
                onClick={handleAdvance}
                disabled={isAdvancing}
              >
                {isAdvancing
                  ? 'Loading...'
                  : isLastTrack
                    ? 'Finish & See Results'
                    : 'Next Track'}
              </Button>
            )}

            {!session.is_host && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Waiting for host to advance...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Revealed tracks history accordion */}
      {revealedTracks.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setRevealedExpanded((v) => !v)}
          >
            <span>Previous tracks ({revealedTracks.length})</span>
            {revealedExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {revealedExpanded && (
            <div className="divide-y divide-border border-t border-border">
              {revealedTracks.map((track) => (
                <div key={track.index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{track.name}</span>
                    <span className="text-base font-bold text-wine-600 dark:text-wine-400">
                      {track.avg_rating?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {track.ratings.map((r) => (
                      <div key={r.user_id} className="flex items-center gap-1.5 text-xs">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-wine-600 text-white text-[10px]">
                            {r.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{r.rating}</span>
                        <span className="text-muted-foreground">{r.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
