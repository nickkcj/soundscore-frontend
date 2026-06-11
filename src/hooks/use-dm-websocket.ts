'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { DirectMessageType } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UseDMWebSocketOptions {
  conversationId: number;
  onMessage?: (message: DirectMessageType) => void;
  onTyping?: (userId: number, username: string) => void;
  onRead?: (userId: number) => void;
}

// Payload cru do postgres_changes INSERT em direct_messages
interface RawDirectMessageInsert {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDMWebSocket({
  conversationId,
  onMessage,
  onTyping,
  onRead,
}: UseDMWebSocketOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReadRef = useRef(onRead);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onReadRef.current = onRead;
  }, [onMessage, onTyping, onRead]);

  const currentUserRef = useRef(user);
  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  // IDs já processados para deduplicar com o optimistic update da página
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const connect = useCallback(async () => {
    if (!conversationId) return;

    try {
      const supabase = await getSupabaseClient();

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(`dm:${conversationId}`, {
        config: {
          broadcast: { self: false },
        },
      });

      // ------------------------------------------------------------------
      // 1. postgres_changes — novas mensagens diretas
      // ------------------------------------------------------------------
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const raw = payload.new as RawDirectMessageInsert;

          if (seenMessageIdsRef.current.has(raw.id)) return;
          seenMessageIdsRef.current.add(raw.id);

          const isOwnMessage = raw.sender_id === currentUserRef.current?.id;
          const resolvedUsername = isOwnMessage
            ? (currentUserRef.current?.username ?? '')
            : '';
          const resolvedPicture = isOwnMessage
            ? (currentUserRef.current?.profile_picture ?? null)
            : null;

          const message: DirectMessageType = {
            id: raw.id,
            conversation_id: raw.conversation_id,
            sender_id: raw.sender_id,
            sender_username: resolvedUsername,
            sender_profile_picture: resolvedPicture,
            content: raw.content,
            image_url: raw.image_url,
            is_read: raw.is_read,
            created_at: raw.created_at,
          };

          // O INSERT traz image_url como chave S3 crua (renderiza quebrada/404).
          // Busca a versão assinada via REST antes de entregar.
          if (raw.image_url && !/^https?:\/\//.test(raw.image_url)) {
            api
              .get<{ messages: DirectMessageType[] }>(
                `/dm/conversations/${conversationId}/messages?per_page=20`
              )
              .then((res) => {
                const match = res.messages.find((m) => m.id === raw.id);
                onMessageRef.current?.(
                  match
                    ? {
                        ...message,
                        image_url: match.image_url,
                        sender_username: message.sender_username || match.sender_username,
                        sender_profile_picture:
                          message.sender_profile_picture ?? match.sender_profile_picture,
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
      // 2. Broadcast — typing
      // ------------------------------------------------------------------
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { user_id, username } = payload as { user_id: number; username: string };
        onTypingRef.current?.(user_id, username);
      });

      // ------------------------------------------------------------------
      // Inscreve o canal
      // ------------------------------------------------------------------
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
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
  }, [conversationId]);

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
    if (!conversationId) return;
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // --------------------------------------------------------------------------
  // sendMessage: POST REST (endpoint já existia antes da migração)
  // --------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string): Promise<DirectMessageType | null> => {
      try {
        const response = await api.post<DirectMessageType>(
          `/dm/conversations/${conversationId}/messages`,
          { content, image_url: imageUrl ?? null }
        );

        // Registra o ID para ignorar o evento duplicado do postgres_changes
        seenMessageIdsRef.current.add(response.id);

        return response;
      } catch (err) {
        throw err;
      }
    },
    [conversationId]
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

  // sendRead mantido na interface pública para não quebrar a página que chama;
  // a marcação de leitura continua via REST (PUT /dm/conversations/{id}/read),
  // que a página já faz no carregamento inicial.
  const sendRead = useCallback(() => {
    // No-op: leitura é marcada via REST na página.
    // Mantido para compatibilidade de interface com o código anterior.
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
    sendTyping,
    sendRead,
    reconnect: connect,
  };
}
