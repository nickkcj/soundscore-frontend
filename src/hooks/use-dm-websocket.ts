'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/api';
import type { DirectMessageType } from '@/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface DMWSMessage {
  type: 'message' | 'typing' | 'read' | 'pong';
  content?: string;
  image_url?: string | null;
  sender_id?: number;
  username?: string;
  profile_picture?: string | null;
  message_id?: number;
  timestamp?: string;
  user_id?: number;
}

interface UseDMWebSocketOptions {
  conversationId: number;
  onMessage?: (message: DirectMessageType) => void;
  onTyping?: (userId: number, username: string) => void;
  onRead?: (userId: number) => void;
}

export function useDMWebSocket({
  conversationId,
  onMessage,
  onTyping,
  onRead,
}: UseDMWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);

  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReadRef = useRef(onRead);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onReadRef.current = onRead;
  }, [onMessage, onTyping, onRead]);

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    isConnectingRef.current = true;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `${WS_BASE_URL}/ws/dm/${conversationId}?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      isConnectingRef.current = false;
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: DMWSMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'message':
            if (onMessageRef.current && data.message_id && data.sender_id && data.username) {
              onMessageRef.current({
                id: data.message_id,
                conversation_id: conversationId,
                sender_id: data.sender_id,
                sender_username: data.username,
                sender_profile_picture: data.profile_picture || null,
                content: data.content || '',
                image_url: data.image_url || null,
                is_read: false,
                created_at: data.timestamp || new Date().toISOString(),
              });
            }
            break;

          case 'typing':
            if (onTypingRef.current && data.user_id && data.username) {
              onTypingRef.current(data.user_id, data.username);
            }
            break;

          case 'read':
            if (onReadRef.current && data.user_id) {
              onReadRef.current(data.user_id);
            }
            break;
        }
      } catch {
        // Invalid JSON
      }
    };

    ws.onerror = () => {
      isConnectingRef.current = false;
      setError('Connection error');
    };

    ws.onclose = (event) => {
      isConnectingRef.current = false;
      setIsConnected(false);
      wsRef.current = null;

      if (event.code === 1000 || event.code === 4001 || event.code === 4003) {
        return;
      }

      if (reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        setError('Connection lost. Please refresh the page.');
      }
    };

    wsRef.current = ws;
  }, [conversationId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((content: string, imageUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        image_url: imageUrl,
      }));
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
  }, []);

  const sendRead = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'read' }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [conversationId]);

  return {
    isConnected,
    error,
    sendMessage,
    sendTyping,
    sendRead,
    reconnect: connect,
  };
}
