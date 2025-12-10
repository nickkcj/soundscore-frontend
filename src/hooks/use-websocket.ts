'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/api';
import type { WSMessage, GroupMessage } from '@/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface UseWebSocketOptions {
  groupId: number;
  onMessage?: (message: GroupMessage) => void;
  onUserJoined?: (userId: number, username: string, profilePicture?: string) => void;
  onUserLeft?: (userId: number, username: string) => void;
  onOnlineUsers?: (users: { user_id: number; username: string; profile_picture: string }[]) => void;
  onTyping?: (userId: number, username: string) => void;
}

export function useGroupWebSocket({
  groupId,
  onMessage,
  onUserJoined,
  onUserLeft,
  onOnlineUsers,
  onTyping,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);

  // Store callbacks in refs to avoid recreating connect function
  const onMessageRef = useRef(onMessage);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onOnlineUsersRef = useRef(onOnlineUsers);
  const onTypingRef = useRef(onTyping);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onUserJoinedRef.current = onUserJoined;
    onUserLeftRef.current = onUserLeft;
    onOnlineUsersRef.current = onOnlineUsers;
    onTypingRef.current = onTyping;
  }, [onMessage, onUserJoined, onUserLeft, onOnlineUsers, onTyping]);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    isConnectingRef.current = true;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `${WS_BASE_URL}/ws/group/${groupId}?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      isConnectingRef.current = false;
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'message':
            if (onMessageRef.current && data.message_id && data.user_id && data.username) {
              onMessageRef.current({
                id: data.message_id,
                group_id: groupId,
                user_id: data.user_id,
                content: data.content || '',
                created_at: data.timestamp || new Date().toISOString(),
                username: data.username,
                profile_picture: data.profile_picture || null,
              });
            }
            break;

          case 'user_joined':
            if (onUserJoinedRef.current && data.user_id && data.username) {
              onUserJoinedRef.current(data.user_id, data.username, data.profile_picture);
            }
            break;

          case 'user_left':
            if (onUserLeftRef.current && data.user_id && data.username) {
              onUserLeftRef.current(data.user_id, data.username);
            }
            break;

          case 'online_users':
            if (onOnlineUsersRef.current && data.online_users) {
              onOnlineUsersRef.current(data.online_users);
            }
            break;

          case 'typing':
            if (onTypingRef.current && data.user_id && data.username) {
              onTypingRef.current(data.user_id, data.username);
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

      // Don't reconnect if it was a clean close or auth error
      if (event.code === 1000 || event.code === 4001 || event.code === 4003) {
        return;
      }

      // Attempt reconnect with exponential backoff
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
  }, [groupId]);

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

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [groupId]); // Only reconnect when groupId changes

  return {
    isConnected,
    error,
    sendMessage,
    sendTyping,
    reconnect: connect,
  };
}
