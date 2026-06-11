'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { sessionsApi } from '@/lib/sessions-api';
import { ApiException } from '@/lib/api';
import type { SessionState, SessionPresencePayload } from '@/types/sessions';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSessionOptions {
  code: string;
  currentUser: { user_id: number; username: string; profile_picture: string | null } | null;
}

interface UseSessionReturn {
  session: SessionState | null;
  isLoading: boolean;
  error: string | null;
  onlineUsers: SessionPresencePayload[];
  refreshSession: () => Promise<void>;
  broadcastSync: () => Promise<void>;
}

export function useSession({ code, currentUser }: UseSessionOptions): UseSessionReturn {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<SessionPresencePayload[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMounted = useRef(true);

  const fetchSession = useCallback(async () => {
    try {
      const data = await sessionsApi.get(code);
      if (isMounted.current) {
        setSession(data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        const msg = err instanceof Error ? err.message : 'Failed to load session';
        setError(msg);
      }
    }
  }, [code]);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const broadcastSync = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: {},
      });
    }
  }, []);

  // Initial load + realtime setup
  useEffect(() => {
    isMounted.current = true;
    let channel: RealtimeChannel | null = null;

    const init = async () => {
      setIsLoading(true);
      await fetchSession();
      if (isMounted.current) {
        setIsLoading(false);
      }

      if (!currentUser) return;

      try {
        const supabase = await getSupabaseClient();
        channel = supabase.channel(`listening:${code}`, {
          config: {
            broadcast: { self: false },
            presence: { key: String(currentUser.user_id) },
          },
        });

        channelRef.current = channel;

        // Presence: track online users
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel!.presenceState<SessionPresencePayload>();
            const users = Object.values(state).flat();
            if (isMounted.current) {
              setOnlineUsers(users);
            }
          })
          .on('presence', { event: 'join' }, ({ newPresences }) => {
            if (isMounted.current) {
              setOnlineUsers((prev) => {
                const ids = new Set(prev.map((u) => u.user_id));
                const next = [...prev];
                for (const p of newPresences as unknown as SessionPresencePayload[]) {
                  if (!ids.has(p.user_id)) next.push(p);
                }
                return next;
              });
            }
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            if (isMounted.current) {
              const leftIds = new Set(
                (leftPresences as unknown as SessionPresencePayload[]).map((u) => u.user_id)
              );
              setOnlineUsers((prev) => prev.filter((u) => !leftIds.has(u.user_id)));
            }
          })
          // Broadcast: sync event → refetch
          .on('broadcast', { event: 'sync' }, async () => {
            await fetchSession();
          });

        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && currentUser) {
            await channel!.track({
              user_id: currentUser.user_id,
              username: currentUser.username,
              profile_picture: currentUser.profile_picture,
            });
          }
        });
      } catch {
        // Realtime init failure is non-fatal — polling would be fallback
      }
    };

    init();

    return () => {
      isMounted.current = false;
      if (channel) {
        channel.unsubscribe();
      }
      channelRef.current = null;
    };
  }, [code, currentUser, fetchSession]);

  return { session, isLoading, error, onlineUsers, refreshSession, broadcastSync };
}
