'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, Users, Music, Loader2, ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRequireAuth } from '@/hooks/use-auth';
import { useGroupWebSocket } from '@/hooks/use-websocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Group, GroupMember, GroupMessage } from '@/types';

export default function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = parseInt(id);
  const { user, isLoading: authLoading } = useRequireAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, { username: string; timestamp: number }>>(new Map());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolledUp = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Se está a mais de 150px do final, usuário scrollou pra cima
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
  }, []);

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      setIsLoading(true);
      try {
        interface GroupDetailResponse {
          group: Group;
          members: GroupMember[];
          recent_messages: GroupMessage[];
          is_member: boolean;
          user_role: string | null;
        }

        const data = await api.get<GroupDetailResponse>(`/groups/${groupId}`);
        setGroup({
          ...data.group,
          is_member: data.is_member,
          role: data.user_role as Group['role'],
        });
        setMembers(data.members);
        setMessages(data.recent_messages);
      } catch {
        toast.error('Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchGroup();
    }
  }, [groupId, authLoading]);

  // WebSocket connection
  const { isConnected, sendMessage, sendTyping } = useGroupWebSocket({
    groupId,
    onMessage: (message) => {
      setMessages((prev) => {
        // Evita duplicação - se já existe uma mensagem com mesmo id ou
        // uma mensagem optimistic do mesmo usuário com mesmo conteúdo, substitui
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id ||
          (m.id < 0 && m.user_id === message.user_id && m.content === message.content)
        );

        if (existingIndex !== -1) {
          // Substitui a mensagem optimistic pela real do servidor
          const newMessages = [...prev];
          newMessages[existingIndex] = message;
          return newMessages;
        }

        return [...prev, message];
      });
      // Só faz scroll automático se usuário não scrollou pra cima
      if (!userScrolledUp.current) {
        setTimeout(scrollToBottom, 50);
      }
      // Remove usuário do typing quando envia mensagem
      setTypingUsers((prev) => {
        if (prev.has(message.user_id)) {
          const newMap = new Map(prev);
          newMap.delete(message.user_id);
          return newMap;
        }
        return prev;
      });
    },
    onUserJoined: (userId, username, profilePicture) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
      // Adicionar novo membro à lista se não existir
      setMembers((prev) => {
        const alreadyMember = prev.some((m) => m.user_id === userId);
        if (alreadyMember) return prev;

        // Só incrementa o contador se realmente é um novo membro
        setGroup((g) => (g ? { ...g, member_count: g.member_count + 1 } : null));

        return [
          ...prev,
          {
            id: Date.now(),
            user_id: userId,
            group_id: groupId,
            role: 'member' as const,
            joined_at: new Date().toISOString(),
            username,
            profile_picture: profilePicture ?? null,
            is_online: true,
          },
        ];
      });
    },
    onUserLeft: (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
    onOnlineUsers: (users) => {
      setOnlineUsers(new Set(users.map((u) => u.user_id)));
    },
    onTyping: (userId, username) => {
      // Não mostrar para o próprio usuário
      if (userId === user?.id) return;

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, { username, timestamp: Date.now() });
        return newMap;
      });
    },
  });

  // Scroll to bottom only on initial load
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (messages.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  // Limpar usuários typing após 3 segundos de inatividade
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const newMap = new Map<number, { username: string; timestamp: number }>();
        prev.forEach((value, key) => {
          if (now - value.timestamp < 3000) {
            newMap.set(key, value);
          }
        });
        return newMap.size !== prev.size ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
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
          `/groups/${groupId}/messages/image`,
          formData
        );
        imagePath = response.image_path;
        imageUrl = response.image_url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao enviar imagem');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Optimistic update - adiciona mensagem imediatamente com id negativo temporário
    const optimisticMessage: GroupMessage = {
      id: -Date.now(), // ID negativo para identificar como optimistic
      group_id: groupId,
      user_id: user.id,
      content,
      image_url: imageUrl || null,
      created_at: new Date().toISOString(),
      username: user.username,
      profile_picture: user.profile_picture || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Envia via WebSocket
    sendMessage(content, imagePath);
    setMessageInput('');
    clearSelectedImage();
    inputRef.current?.focus();
    // Força scroll quando o próprio usuário envia
    userScrolledUp.current = false;
    setTimeout(scrollToBottom, 50);
  };

  const handleJoinGroup = async () => {
    if (!group) return;

    try {
      await api.post(`/groups/${groupId}/join`);

      // Refetch group data to get updated members list including the new member
      interface GroupDetailResponse {
        group: Group;
        members: GroupMember[];
        recent_messages: GroupMessage[];
        is_member: boolean;
        user_role: string | null;
      }

      const data = await api.get<GroupDetailResponse>(`/groups/${groupId}`);
      setGroup({
        ...data.group,
        is_member: data.is_member,
        role: data.user_role as Group['role'],
      });
      setMembers(data.members);
      setMessages(data.recent_messages);

      toast.success('Joined group!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group');
    }
  };

  if (authLoading || isLoading) {
    return <GroupChatSkeleton />;
  }

  if (!group) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Group not found</p>
            <Link href="/groups">
              <Button className="mt-4">Back to groups</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not a member
  if (!group.is_member) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Link href="/groups" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>
        <Card className="overflow-hidden">
          {/* Cover Image Banner */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
            {group.cover_image ? (
              <Image src={group.cover_image} alt={group.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          <CardContent className="pt-6 pb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
            {group.description && (
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">{group.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.member_count} members
              </span>
              {group.category && (
                <Badge variant="secondary">{group.category}</Badge>
              )}
            </div>
            <Button size="lg" onClick={handleJoinGroup}>Join Group</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <div className="w-full max-w-6xl px-4">
        <div className="flex flex-col lg:flex-row gap-3 h-[700px]">
          {/* Members Sidebar - Left */}
          <Card className="hidden lg:flex lg:flex-col w-56 flex-shrink-0">
            <CardHeader className="py-3 px-4 pb-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="space-y-3 px-4 pt-2 pb-3">
                  {members.map((member, index) => (
                    <div key={member.id || `member-${index}`} className="flex items-center gap-2">
                      <div className="relative">
                        <UserAvatar
                          username={member.username}
                          profilePicture={member.profile_picture}
                          size="sm"
                        />
                        {onlineUsers.has(member.user_id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{member.username}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden">
            {/* Cover Banner */}
            <div className="relative h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
              {group.cover_image ? (
                <Image src={group.cover_image} alt={group.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <Link href="/groups">
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-base font-semibold text-foreground">{group.name}</h1>
                    <p className="text-xs text-muted-foreground">
                      {onlineUsers.size} online · {group.member_count} members
                    </p>
                  </div>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleMessagesScroll}
            >
              <div className="space-y-4 px-6 py-4">
                {messages.map((message, index) => (
                  <MessageItem
                    key={message.id || `msg-${index}`}
                    message={message}
                    isOwn={message.user_id === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-3 py-2 border-t bg-muted/30">
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
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);

                  // Debounce de 500ms para enviar typing
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
      </div>
    </div>
  );
}

function MessageItem({ message, isOwn }: { message: GroupMessage; isOwn: boolean }) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      <div className="flex-shrink-0">
        <UserAvatar
          username={message.username}
          profilePicture={message.profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-sm font-medium', isOwn && 'order-2')}>
            {message.username}
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
              <Image
                src={message.image_url}
                alt="Message image"
                width={250}
                height={200}
                className={cn(
                  'rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity',
                  isImageLoading && 'hidden'
                )}
                onLoad={() => setIsImageLoading(false)}
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

function TypingIndicator({ typingUsers }: { typingUsers: Map<number, { username: string }> }) {
  if (typingUsers.size === 0) return null;

  const users = Array.from(typingUsers.values());

  let text = '';
  if (users.length === 1) {
    text = `${users[0].username} está digitando`;
  } else if (users.length === 2) {
    text = `${users[0].username} e ${users[1].username} estão digitando`;
  } else {
    text = 'Várias pessoas estão digitando';
  }

  return (
    <div className="px-3 py-0.5 text-xs text-muted-foreground/70 flex items-center gap-0.5">
      <span>{text}</span>
      <span className="flex">
        <span className="animate-bounce [animation-delay:0ms]">.</span>
        <span className="animate-bounce [animation-delay:150ms]">.</span>
        <span className="animate-bounce [animation-delay:300ms]">.</span>
      </span>
    </div>
  );
}

function GroupChatSkeleton() {
  return (
    <div className="flex justify-center py-4">
      <div className="w-full max-w-6xl px-4">
        <div className="flex gap-3 h-[700px]">
          {/* Members Sidebar Skeleton */}
          <Card className="hidden lg:block w-64 flex-shrink-0">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area Skeleton */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 pb-4 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex-1 py-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-48 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
