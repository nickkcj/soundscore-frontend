'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRequireAuth } from '@/hooks/use-auth';
import { useDMWebSocket } from '@/hooks/use-dm-websocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DirectMessageType, DMMessageListResponse, ConversationType, ConversationListResponse } from '@/types';

interface OtherUser {
  id: number;
  username: string;
  profile_picture: string | null;
}

export default function DMChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId: conversationIdStr } = use(params);
  const conversationId = parseInt(conversationIdStr, 10);
  const { user, isLoading: authLoading } = useRequireAuth();

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<DirectMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolledUp = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
  }, []);

  // Fetch conversation data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch conversations to find the other user info
        const convData = await api.get<ConversationListResponse>('/dm/conversations');
        const thisConv = convData.conversations.find((c) => c.id === conversationId);
        if (thisConv) {
          setOtherUser(thisConv.other_user);
        }

        // Fetch messages
        const msgData = await api.get<DMMessageListResponse>(
          `/dm/conversations/${conversationId}/messages?per_page=100`
        );
        setMessages(msgData.messages);

        // Mark as read
        await api.put(`/dm/conversations/${conversationId}/read`);
      } catch {
        toast.error('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [conversationId, authLoading]);

  // WebSocket
  const { isConnected, sendMessage, sendTyping, sendRead } = useDMWebSocket({
    conversationId,
    onMessage: (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id ||
          (m.id < 0 && m.sender_id === message.sender_id && m.content === message.content)
        );

        if (existingIndex !== -1) {
          const newMessages = [...prev];
          newMessages[existingIndex] = message;
          return newMessages;
        }

        return [...prev, message];
      });

      if (!userScrolledUp.current) {
        setTimeout(scrollToBottom, 50);
      }

      // Clear typing when message received
      setTypingUser(null);

      // Mark as read if message from other user
      if (message.sender_id !== user?.id) {
        sendRead();
      }
    },
    onTyping: (_userId, username) => {
      setTypingUser(username);
      // Clear after 3 seconds
      setTimeout(() => setTypingUser(null), 3000);
    },
    onRead: () => {
      // Mark all our sent messages as read
      setMessages((prev) =>
        prev.map((m) => (m.sender_id === user?.id ? { ...m, is_read: true } : m))
      );
    },
  });

  // Scroll to bottom on initial load
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (messages.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use JPG, PNG, WebP or GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum: 5MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedImage) || !isConnected || !user) return;

    const content = messageInput.trim();
    let imagePath: string | undefined;
    let imageUrl: string | undefined;

    // Upload image if selected
    if (selectedImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const response = await api.postForm<{ image_url: string; image_path: string }>(
          `/dm/conversations/${conversationId}/messages/image`,
          formData
        );
        imagePath = response.image_path;
        imageUrl = response.image_url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Optimistic update
    const optimisticMessage: DirectMessageType = {
      id: -Date.now(),
      conversation_id: conversationId,
      sender_id: user.id,
      sender_username: user.username,
      sender_profile_picture: user.profile_picture,
      content,
      image_url: imageUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    sendMessage(content, imagePath);
    setMessageInput('');
    clearSelectedImage();
    inputRef.current?.focus();
    userScrolledUp.current = false;
    setTimeout(scrollToBottom, 50);
  };

  if (authLoading || isLoading) {
    return <DMChatSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <Link
              href="/messages"
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {otherUser && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <UserAvatar
                  username={otherUser.username}
                  profilePicture={otherUser.profile_picture}
                  size="sm"
                />
                <div className="min-w-0">
                  <Link
                    href={`/profile/${otherUser.username}`}
                    className="font-bold text-[15px] hover:underline block truncate"
                  >
                    {otherUser.username}
                  </Link>
                </div>
              </div>
            )}
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
              {isConnected ? 'Online' : 'Connecting...'}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleMessagesScroll}
        >
          <div className="space-y-4 px-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Send a message to start the conversation
              </div>
            )}
            {messages.map((message, index) => (
              <MessageItem
                key={message.id || `msg-${index}`}
                message={message}
                isOwn={message.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Typing Indicator */}
        {typingUser && (
          <div className="px-4 py-0.5 text-xs text-muted-foreground/70 flex items-center gap-0.5">
            <span>{typingUser} is typing</span>
            <span className="flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t bg-muted/30">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
            className="h-10 w-10 flex-shrink-0"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            id="comment-input"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                sendTyping();
              }, 500);
            }}
            disabled={!isConnected || isUploading}
            className="h-10"
          />
          <Button
            type="submit"
            disabled={!isConnected || isUploading || (!messageInput.trim() && !selectedImage)}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageItem({ message, isOwn }: { message: DirectMessageType; isOwn: boolean }) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (message.image_url) {
      setIsImageLoading(true);
    }
  }, [message.image_url]);

  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      <div className="flex-shrink-0">
        <UserAvatar
          username={message.sender_username}
          profilePicture={message.sender_profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-sm font-medium', isOwn && 'order-2')}>
            {message.sender_username}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
        <div
          className={cn(
            'rounded-lg inline-block overflow-hidden',
            message.content ? 'px-3 py-2' : 'p-1',
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {message.image_url && (
            <div className="relative mb-2 last:mb-0">
              {isImageLoading && (
                <div className="w-[250px] h-[200px] bg-muted-foreground/20 animate-pulse rounded-lg flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.image_url}
                alt="Message image"
                className={cn(
                  'max-w-[250px] max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity',
                  isImageLoading && 'hidden'
                )}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
                onClick={() => window.open(message.image_url!, '_blank')}
              />
            </div>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DMChatSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen flex flex-col">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex-1 py-4 px-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-48 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
