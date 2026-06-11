'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { GroupMessage } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface MemberJoinedData {
  user_id: number;
  username: string;
  profile_picture: string | null;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  member_count: number;
}

interface UseWebSocketOptions {
  /** UUID público do grupo (usado na URL e no canal Presence/Broadcast) */
  groupUuid: string;
  /**
   * ID numérico interno do grupo — necessário para filtrar o canal
   * postgres_changes (group_id=eq.{groupId}).
   * A página de grupo já carrega o objeto Group que tem o campo `id`.
   */
  groupId: number;
  onMessage?: (message: GroupMessage) => void;
  onUserJoined?: (userId: number, username: string, profilePicture?: string) => void;
  onUserLeft?: (userId: number, username: string) => void;
  onOnlineUsers?: (users: { user_id: number; username: string; profile_picture: string }[]) => void;
  onTyping?: (userId: number, username: string) => void;
  onMemberJoined?: (data: MemberJoinedData) => void;
  /** Disparado quando alguém entra/sai do grupo (INSERT/DELETE em group_members) */
  onMembersChanged?: () => void;
}

// Payload cru vindo do postgres_changes INSERT em group_messages
interface RawGroupMessageInsert {
  id: number;
  group_id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
}

// Resposta do endpoint REST de envio de mensagem de grupo
interface SendMessageResponse {
  id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: number;
  username: string;
  profile_picture: string | null;
}

// Payload de Presence por usuário
interface PresenceUser {
  user_id: number;
  username: string;
  profile_picture: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGroupWebSocket({
  groupUuid,
  groupId,
  onMessage,
  onUserJoined,
  onUserLeft,
  onOnlineUsers,
  onTyping,
  onMemberJoined,
  onMembersChanged,
}: UseWebSocketOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  // Mantém callbacks em refs para evitar recrear o canal ao trocar handlers
  const onMessageRef = useRef(onMessage);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onOnlineUsersRef = useRef(onOnlineUsers);
  const onTypingRef = useRef(onTyping);
  const onMemberJoinedRef = useRef(onMemberJoined);
  const onMembersChangedRef = useRef(onMembersChanged);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onUserJoinedRef.current = onUserJoined;
    onUserLeftRef.current = onUserLeft;
    onOnlineUsersRef.current = onOnlineUsers;
    onTypingRef.current = onTyping;
    onMemberJoinedRef.current = onMemberJoined;
    onMembersChangedRef.current = onMembersChanged;
  }, [onMessage, onUserJoined, onUserLeft, onOnlineUsers, onTyping, onMemberJoined, onMembersChanged]);

  // Membro atual para o Presence
  const currentUserRef = useRef(user);
  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  // Conjunto de IDs de mensagens já processadas para evitar duplicação com
  // o optimistic update da página
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const connect = useCallback(async () => {
    if (!groupUuid || !groupId) return;

    try {
      const supabase = await getSupabaseClient();

      // Remove canal anterior se existir
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(`group:${groupUuid}`, {
        config: {
          presence: { key: String(currentUserRef.current?.id ?? 'anon') },
          broadcast: { self: false },
        },
      });

      // ------------------------------------------------------------------
      // 1. postgres_changes — novas mensagens de grupo
      // ------------------------------------------------------------------
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const raw = payload.new as RawGroupMessageInsert;

          // Ignora duplicata (mensagem que o próprio usuário já adicionou via optimistic)
          if (seenMessageIdsRef.current.has(raw.id)) return;
          seenMessageIdsRef.current.add(raw.id);

          // O INSERT não traz username / profile_picture.
          // Tentamos resolver a partir do usuário atual; para mensagens de
          // outros membros o enriquecimento é feito via dedupe na página
          // (que já tem a lista de membros carregada).
          const isOwnMessage = raw.user_id === currentUserRef.current?.id;
          const resolvedUsername = isOwnMessage
            ? (currentUserRef.current?.username ?? '')
            : '';
          const resolvedPicture = isOwnMessage
            ? (currentUserRef.current?.profile_picture ?? null)
            : null;

          const message: GroupMessage = {
            id: raw.id,
            group_id: raw.group_id,
            user_id: raw.user_id,
            content: raw.content,
            image_url: raw.image_url,
            created_at: raw.created_at,
            username: resolvedUsername,
            profile_picture: resolvedPicture,
          };

          // O INSERT traz image_url como chave S3 crua (ex: "group_messages/x.webp"),
          // que renderiza quebrada/404. Busca a versão assinada via REST antes de entregar.
          if (raw.image_url && !/^https?:\/\//.test(raw.image_url)) {
            api
              .get<{ messages: GroupMessage[] }>(`/groups/${groupUuid}/messages?page=1&per_page=20`)
              .then((res) => {
                const match = res.messages.find((m) => m.id === raw.id);
                onMessageRef.current?.(
                  match
                    ? {
                        ...message,
                        image_url: match.image_url,
                        username: message.username || match.username,
                        profile_picture: message.profile_picture ?? match.profile_picture,
                      }
                    : { ...message, image_url: null }
                );
              })
              .catch(() => onMessageRef.current?.({ ...message, image_url: null }));
            return;
          }

          onMessageRef.current?.(message);
        }
      );

      // ------------------------------------------------------------------
      // 1b. postgres_changes — entrada/saída de membros (sidebar)
      // ------------------------------------------------------------------
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => onMembersChangedRef.current?.()
      );
      // DELETE não suporta filter (o evento só carrega a PK da linha antiga);
      // o callback apenas refaz o fetch da lista, então over-fire é inofensivo
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_members',
        },
        () => onMembersChangedRef.current?.()
      );

      // ------------------------------------------------------------------
      // 2. Presence — online users
      // ------------------------------------------------------------------
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state)
          .flat()
          .map((p) => ({
            user_id: p.user_id,
            username: p.username,
            profile_picture: p.profile_picture ?? '',
          }));
        onOnlineUsersRef.current?.(users);
      });

      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p) => {
          const presence = p as unknown as PresenceUser;
          onUserJoinedRef.current?.(
            presence.user_id,
            presence.username,
            presence.profile_picture
          );
        });
      });

      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p) => {
          const presence = p as unknown as PresenceUser;
          onUserLeftRef.current?.(presence.user_id, presence.username);
        });
      });

      // ------------------------------------------------------------------
      // 3. Broadcast — typing
      // ------------------------------------------------------------------
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { user_id, username } = payload as { user_id: number; username: string };
        onTypingRef.current?.(user_id, username);
      });

      // ------------------------------------------------------------------
      // Inscreve o canal
      // ------------------------------------------------------------------
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);

          // Entra no Presence com os dados do usuário atual
          if (currentUserRef.current) {
            await channel.track({
              user_id: currentUserRef.current.id,
              username: currentUserRef.current.username,
              profile_picture: currentUserRef.current.profile_picture ?? '',
            } satisfies PresenceUser);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Connection error');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
      setIsConnected(false);
    }
  }, [groupUuid, groupId]);

  const disconnect = useCallback(async () => {
    if (channelRef.current) {
      try {
        const supabase = await getSupabaseClient();
        await supabase.removeChannel(channelRef.current);
      } catch {
        // silencia erro ao desconectar
      }
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!groupUuid || !groupId) return;
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUuid, groupId]);

  // --------------------------------------------------------------------------
  // sendMessage: POST REST → 201 retorna a mensagem completa
  // --------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string): Promise<GroupMessage | null> => {
      try {
        const response = await api.post<SendMessageResponse>(
          `/groups/${groupUuid}/messages`,
          { content, image_url: imageUrl ?? null }
        );

        const message: GroupMessage = {
          id: response.id,
          group_id: groupId,
          user_id: response.user_id,
          content: response.content,
          image_url: response.image_url,
          created_at: response.created_at,
          username: response.username,
          profile_picture: response.profile_picture,
        };

        // Registra o ID para que o evento do postgres_changes seja ignorado
        seenMessageIdsRef.current.add(response.id);

        return message;
      } catch (err) {
        throw err;
      }
    },
    [groupUuid, groupId]
  );

  // --------------------------------------------------------------------------
  // sendTyping: broadcast no canal
  // --------------------------------------------------------------------------
  const sendTyping = useCallback(() => {
    if (!channelRef.current || !currentUserRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: currentUserRef.current.id,
        username: currentUserRef.current.username,
      },
    });
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
    sendTyping,
    reconnect: connect,
  };
}
