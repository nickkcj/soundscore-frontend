'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LobbyView } from '@/components/sessions/lobby-view';
import { ActiveView } from '@/components/sessions/active-view';
import { FinishedView } from '@/components/sessions/finished-view';
import { useSession } from '@/hooks/use-session';
import { useAuthStore } from '@/stores/auth-store';
import { sessionsApi } from '@/lib/sessions-api';
import Link from 'next/link';

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const user = useAuthStore((s) => s.user);

  // Memoizado: é dependência do useEffect do hook — referência nova a cada
  // render causaria loop infinito de re-subscrição no canal
  const currentUser = useMemo(
    () =>
      user
        ? { user_id: user.id, username: user.username, profile_picture: user.profile_picture ?? null }
        : null,
    [user]
  );

  const { session, isLoading, error, onlineUsers, refreshSession, broadcastSync } =
    useSession({ code: code.toUpperCase(), currentUser });

  const [isStarting, setIsStarting] = useState(false);
  const joinAttempted = useRef(false);

  // Refetch + avisa os outros clientes — chamado após qualquer mutação
  const onMutationSuccess = async () => {
    await refreshSession();
    await broadcastSync();
  };

  // Auto-join: quem chega pelo link entra na sala automaticamente
  useEffect(() => {
    const autoJoin = async () => {
      if (
        !session ||
        session.is_participant ||
        session.status === 'finished' ||
        joinAttempted.current
      ) {
        return;
      }
      joinAttempted.current = true;
      try {
        await sessionsApi.join(session.code);
        await onMutationSuccess();
        toast.success('You joined the session!');
      } catch {
        toast.error('Could not join the session');
      }
    };
    autoJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.code, session?.is_participant, session?.status]);

  const handleStart = async () => {
    if (!session) return;
    setIsStarting(true);
    try {
      await sessionsApi.start(session.code);
      await onMutationSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied! Share it with your friends 🎧');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-3xl px-4 py-6 md:py-12">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-xl md:h-48 md:w-48" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-40 w-full rounded-xl mt-4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-3xl px-4 py-12 text-center md:py-20">
          <h1 className="text-2xl font-bold text-foreground mb-2">Session not found</h1>
          <p className="text-muted-foreground mb-6">
            Double-check that the code <span className="font-mono font-semibold">{code.toUpperCase()}</span> is correct.
          </p>
          <Button asChild className="bg-wine-600 hover:bg-wine-700 text-white rounded-xl">
            <Link href="/sessions">Back to Listening Parties</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-4 md:py-10">
        {session.status === 'lobby' && (
          <LobbyView
            session={session}
            onlineUsers={onlineUsers}
            onStart={handleStart}
            onCopyLink={handleCopyLink}
            isStarting={isStarting}
          />
        )}
        {session.status === 'active' && (
          <ActiveView
            session={session}
            onlineUsers={onlineUsers}
            onMutationSuccess={onMutationSuccess}
          />
        )}
        {session.status === 'finished' && <FinishedView session={session} />}
      </main>
    </div>
  );
}
