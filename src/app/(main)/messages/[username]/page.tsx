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
import { ReviewShareCard, tryParseReviewShare } from '@/components/reviews/review-share-card';
import type { DirectMessageType, DMMessageListResponse } from '@/types';

interface OtherUser {
  id: number;
  username: string;
  profile_picture: string | null;
}

interface ConversationStartResponse {
  id: number;
  other_user: OtherUser;
  last_message: null;
  unread_count: number;
  updated_at: string;
}

export default function DMChatPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user, isLoading: authLoading } = useRequireAuth();

  const [conversationId, setConversationId] = useState<number | null>(null);
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

  // Start/get conversation by username, then fetch messages
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get or create conversation by username
        const conv = await api.post<ConversationStartResponse>(
          `/dm/conversations/${username}`
        );
        setConversationId(conv.id);
        setOtherUser(conv.other_user);

        // Fetch messages
        const msgData = await api.get<DMMessageListResponse>(
          `/dm/conversations/${conv.id}/messages?per_page=100`
        );
        setMessages(msgData.messages);

        // Mark as read
        await api.put(`/dm/conversations/${conv.id}/read`);
      } catch {
        toast.error('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [username, authLoading]);

  // Realtime connection (Supabase) — só conecta quando tiver o conversationId
  const { isConnected, sendMessage, sendTyping, sendRead } = useDMWebSocket({
    conversationId: conversationId || 0,
    onMessage: (message) => {
      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id ||
          (m.id < 0 && m.sender_id === message.sender_id && m.content === message.content)
        );

        if (existingIndex !== -1) {
          // Preserva dados de exibição do optimistic caso o INSERT não traga
          const existing = prev[existingIndex];
          const newMessages = [...prev];
          newMessages[existingIndex] = {
            ...message,
            sender_username: message.sender_username || existing.sender_username,
            sender_profile_picture: message.sender_profile_picture ?? existing.sender_profile_picture,
          };
          return newMessages;
        }

        // Enriquece mensagem de outro usuário com os dados do otherUser carregado
        if (message.sender_id !== user?.id && otherUser) {
          return [...prev, {
            ...message,
            sender_username: otherUser.username,
            sender_profile_picture: otherUser.profile_picture,
          }];
        }

        return [...prev, message];
      });

      if (!userScrolledUp.current) {
        setTimeout(scrollToBottom, 50);
      }

      setTypingUser(null);

      if (message.sender_id !== user?.id) {
        sendRead();
      }
    },
    onTyping: (_userId, uname) => {
      setTypingUser(uname);
      setTimeout(() => setTypingUser(null), 3000);
    },
    onRead: () => {
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
    if ((!messageInput.trim() && !selectedImage) || !isConnected || !user || !conversationId) return;

    const content = messageInput.trim();
    let imagePath: string | undefined;
    let imagePreviewUrl: string | undefined;

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
        imagePreviewUrl = response.image_url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const optimisticId = -Date.now();
    const optimisticMessage: DirectMessageType = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_username: user.username,
      sender_profile_picture: user.profile_picture,
      content,
      image_url: imagePreviewUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    clearSelectedImage();
    inputRef.current?.focus();
    userScrolledUp.current = false;
    setTimeout(scrollToBottom, 50);

    try {
      // POST REST — retorna a mensagem completa com id definitivo
      const serverMessage = await sendMessage(content, imagePath);
      if (serverMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...serverMessage } : m))
        );
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  if (authLoading || isLoading) {
    return <DMChatSkeleton />;
  }

  return (
    <div className="h-[var(--app-usable-height)] min-h-0 bg-background">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col border-border sm:border-x">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-md border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-4 h-14">
            <Link
              href="/messages"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted active:bg-muted"
              aria-label="Back to conversations"
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
          className="flex-1 overflow-y-auto min-h-0"
          onScroll={handleMessagesScroll}
        >
          <div className="space-y-3 px-4 py-4 sm:space-y-4">
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
          <div className="px-4 py-0.5 text-xs text-muted-foreground/70 flex items-center gap-0.5 flex-shrink-0">
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
          <div className="max-h-32 flex-shrink-0 overflow-y-auto border-t bg-muted/30 px-4 py-2">
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={120}
                height={120}
                className="h-24 w-24 rounded-lg object-cover sm:h-[120px] sm:w-[120px]"
              />
              <button
                type="button"
                onClick={clearSelectedImage}
                className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                aria-label="Remove selected image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex flex-shrink-0 items-center gap-2 border-t bg-background/95 px-3 py-2 backdrop-blur sm:py-3">
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
            className="h-11 w-11 flex-shrink-0"
            aria-label="Attach an image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
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
            className="h-11 min-w-0"
          />
          <Button
            type="submit"
            disabled={!isConnected || isUploading || (!messageInput.trim() && !selectedImage)}
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Send message"
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
  const reviewShare = message.content ? tryParseReviewShare(message.content) : null;

  return (
    <div className={cn('flex min-w-0 gap-2 sm:gap-3', isOwn && 'flex-row-reverse')}>
      <div className="flex-shrink-0">
        <UserAvatar
          username={message.sender_username}
          profilePicture={message.sender_profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('min-w-0 max-w-[calc(100%-2.5rem)] sm:max-w-[70%]', isOwn && 'text-right')}>
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <span className={cn('min-w-0 truncate text-sm font-medium', isOwn && 'order-2')}>
            {message.sender_username}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
        {reviewShare ? (
          <ReviewShareCard data={reviewShare} />
        ) : (
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
                  <div className="flex h-44 w-[min(250px,65vw)] items-center justify-center rounded-lg bg-muted-foreground/20 animate-pulse sm:h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Open message image in a new tab"
                  onClick={() => window.open(message.image_url!, '_blank', 'noopener,noreferrer')}
                  className={cn(
                    'block max-w-full overflow-hidden rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isImageLoading && 'hidden'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.image_url}
                    alt="Message image"
                    className="h-auto max-h-[min(300px,42dvh)] w-auto max-w-full object-cover"
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                  />
                </button>
              </div>
            )}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DMChatSkeleton() {
  return (
    <div className="h-[var(--app-usable-height)] min-h-0 bg-background">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col border-border sm:border-x">
        <div className="bg-background/80 backdrop-blur-md border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-4 h-14">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex-1 py-4 px-4 space-y-4 min-h-0 overflow-hidden">
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
