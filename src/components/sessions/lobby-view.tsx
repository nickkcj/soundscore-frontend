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
    <div className="space-y-6">
      {/* Album Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden shadow-xl">
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
                <Music className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold mb-1">{session.album_title}</h1>
            <p className="text-lg text-muted-foreground mb-3">{session.album_artist}</p>
            <p className="text-sm text-muted-foreground">
              {session.tracks.length} tracks &bull; Code:{' '}
              <span className="font-mono font-semibold text-foreground tracking-widest">
                {session.code}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-wine-500" />
          Participants ({session.participants.length})
        </h2>
        <div className="flex flex-wrap gap-3">
          {session.participants.map((p) => {
            const isOnline = onlineIds.has(p.user_id);
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
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
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="font-semibold mb-4">Tracklist</h2>
        <ol className="divide-y divide-border">
          {session.tracks.map((track) => (
            <li key={track.index} className="flex items-center gap-3 py-2.5 px-1">
              <span className="w-6 text-sm text-muted-foreground text-right shrink-0">
                {track.index + 1}
              </span>
              <span className="text-sm">{track.name}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCopyLink}
        >
          <Link2 className="h-4 w-4" />
          Copy Invite Link
        </Button>
        {session.is_host && (
          <Button
            className={cn(
              'flex-1 bg-wine-600 hover:bg-wine-700 text-white',
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
