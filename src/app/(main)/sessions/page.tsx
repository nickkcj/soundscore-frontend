'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Radio, Plus, Users, Music, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateSessionModal } from '@/components/sessions/create-session-modal';
import { SessionStatusBadge } from '@/components/sessions/session-status-badge';
import { sessionsApi } from '@/lib/sessions-api';
import type { SessionListItem } from '@/types/sessions';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessions(await sessionsApi.getMine());
      } catch {
        // lista vazia já cobre o estado de erro aqui
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) router.push(`/session/${code}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-4 md:py-12">
        {/* Hero */}
        <div className="mb-6 text-center md:mb-8">
          <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine-50 dark:bg-wine-950/30 md:mb-4 md:h-16 md:w-16">
            <Radio className="h-6 w-6 text-wine-500 md:h-8 md:w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Listening Parties
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground md:text-base">
            Listen to an album with your friends, rate it track by track blindly,
            and find out together who the toughest critic is.
          </p>
        </div>

        {/* Ações */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row">
          <Button
            onClick={() => setCreateOpen(true)}
            className="flex-1 h-12 bg-wine-600 hover:bg-wine-700 text-white rounded-xl text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Session
          </Button>
          <form onSubmit={handleJoin} className="flex-1 flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Have a code? (e.g. XK4P2)"
              maxLength={8}
              className="h-12 rounded-xl uppercase tracking-widest"
            />
            <Button type="submit" variant="outline" aria-label="Join session" className="h-12 w-12 shrink-0 rounded-xl p-0">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </div>

        {/* Minhas sessões */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="font-semibold text-foreground flex items-center">
              <Music className="h-4 w-4 mr-2 text-wine-500" />
              My Sessions
            </h2>
          </div>

          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground sm:px-5 sm:py-12">
              <p className="font-medium">No sessions yet.</p>
              <p className="text-sm mt-1">
                Create your first one and share the code with your friends!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((s) => (
                <Link
                  key={s.code}
                  href={`/session/${s.code}`}
                  className="flex min-h-16 min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 sm:px-4 sm:py-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {s.album_cover_image ? (
                      <Image src={s.album_cover_image} alt={s.album_title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.album_title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.album_artist} · {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {s.participants_count}
                  </span>
                  {s.status === 'finished' && s.album_avg !== null ? (
                    <span className="flex shrink-0 flex-col items-center rounded-lg bg-wine-50 px-2 py-1 dark:bg-wine-950/30 sm:px-2.5">
                      <span className="text-base font-bold leading-tight text-wine-600 dark:text-wine-300">
                        {s.album_avg.toFixed(1)}
                      </span>
                      {s.my_avg !== null && (
                        <span className="text-[10px] leading-tight text-muted-foreground">
                          you: {s.my_avg.toFixed(1)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <SessionStatusBadge status={s.status} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateSessionModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
