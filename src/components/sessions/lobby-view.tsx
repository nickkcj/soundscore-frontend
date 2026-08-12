'use client';

import Image from 'next/image';
import { Users, Link2, Music, Crown, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { SessionState, SessionPresencePayload } from '@/types/sessions';

interface LobbyViewProps {
  session: SessionState;
  onlineUsers: SessionPresencePayload[];
  onStart: () => void;
  onCopyLink: () => void;
  isStarting: boolean;
}

export function LobbyView({
  session,
  onlineUsers,
  onStart,
  onCopyLink,
  isStarting,
}: LobbyViewProps) {
  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Album Header */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <div className="flex items-center gap-4 sm:items-start sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-lg sm:h-32 sm:w-32 sm:shadow-xl">
            {session.album_cover_image ? (
              <Image
                src={session.album_cover_image}
                alt={session.album_title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-wine-500/20 to-wine-800/20">
                <Music className="h-8 w-8 text-muted-foreground/50 sm:h-12 sm:w-12" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h1 className="mb-1 line-clamp-2 text-xl font-bold leading-tight sm:text-2xl">{session.album_title}</h1>
            <p className="mb-1 truncate text-sm text-muted-foreground sm:mb-3 sm:text-lg">{session.album_artist}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {session.tracks.length} tracks &bull; Code:{' '}
              <span className="font-mono font-semibold text-foreground tracking-widest">
                {session.code}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-wine-500" />
          Participants ({session.participants.length})
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {session.participants.map((p) => {
            const isOnline = onlineIds.has(p.user_id);
            return (
              <div
                key={p.user_id}
                className="flex min-h-11 items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5"
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.profile_picture || undefined} alt={p.username} />
                    <AvatarFallback className="bg-wine-600 text-white text-xs font-semibold">
                      {p.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                  )}
                </div>
                <span className="text-sm font-medium">{p.username}</span>
                {p.is_host && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
            );
          })}
        </div>

        {onlineUsers.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Wifi className="h-3 w-3 text-green-500" />
            {onlineUsers.length} online now
          </p>
        )}
      </div>

      {/* Tracklist */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <h2 className="font-semibold mb-4">Tracklist</h2>
        <ol className="divide-y divide-border">
          {session.tracks.map((track) => (
            <li key={track.index} className="flex items-center gap-3 py-2.5 px-1">
              <span className="w-6 text-sm text-muted-foreground text-right shrink-0">
                {track.index + 1}
              </span>
              <span className="min-w-0 break-words text-sm">{track.name}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={onCopyLink}
        >
          <Link2 className="h-4 w-4" />
          Copy Invite Link
        </Button>
        {session.is_host && (
          <Button
            className={cn(
              'h-11 w-full bg-wine-600 hover:bg-wine-700 text-white',
              'disabled:opacity-70'
            )}
            onClick={onStart}
            disabled={isStarting || session.participants.length < 1}
          >
            {isStarting ? 'Starting...' : 'Start Session'}
          </Button>
        )}
      </div>
    </div>
  );
}
