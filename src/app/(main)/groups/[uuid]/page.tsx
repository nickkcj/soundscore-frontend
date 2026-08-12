'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, Users, Music, Loader2, ImageIcon, X, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserAvatar } from '@/components/common/user-avatar';
import { InviteMemberModal } from '@/components/groups/invite-member-modal';
import { GroupSettingsModal } from '@/components/groups/group-settings-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useGroupWebSocket } from '@/hooks/use-websocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ReviewShareCard, tryParseReviewShare } from '@/components/reviews/review-share-card';
import type { Group, GroupMember, GroupMessage } from '@/types';

export default function GroupChatPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid: groupUuid } = use(params);
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
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
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

        const data = await api.get<GroupDetailResponse>(`/groups/${groupUuid}`);
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
  }, [groupUuid, authLoading]);

  // Realtime connection (Supabase)
  const { isConnected, sendMessage, sendTyping } = useGroupWebSocket({
    groupUuid,
    groupId: group?.id ?? 0,
    onMessage: (message) => {
      setMessages((prev) => {
        // Evita duplicação — se já existe mensagem com mesmo id ou
        // uma mensagem optimistic do mesmo usuário com mesmo conteúdo, substitui
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id ||
          (m.id < 0 && m.user_id === message.user_id && m.content === message.content)
        );

        if (existingIndex !== -1) {
          // Substitui a mensagem optimistic pela real do servidor.
          // Preserva username/profile_picture da mensagem optimistic se o
          // evento do Realtime não trouxer (INSERT não inclui joins).
          const existing = prev[existingIndex];
          const newMessages = [...prev];
          newMessages[existingIndex] = {
            ...message,
            username: message.username || existing.username,
            profile_picture: message.profile_picture ?? existing.profile_picture,
          };
          return newMessages;
        }

        // Mensagem de outro membro: enriquece com dados da lista de membros
        if (message.user_id !== user?.id) {
          const member = members.find((m) => m.user_id === message.user_id);
          if (member) {
            return [...prev, {
              ...message,
              username: member.username,
              profile_picture: member.profile_picture,
            }];
          }
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
    onUserJoined: (userId) => {
      // User connected to chat (came online)
      setOnlineUsers((prev) => new Set(prev).add(userId));
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
    onMembersChanged: async () => {
      // Alguém entrou/saiu do grupo (evento do Realtime em group_members):
      // refaz o fetch para atualizar lista de membros e contador na sidebar
      try {
        interface GroupDetailResponse {
          group: Group;
          members: GroupMember[];
          recent_messages: GroupMessage[];
          is_member: boolean;
          user_role: string | null;
        }
        const data = await api.get<GroupDetailResponse>(`/groups/${groupUuid}`);
        setGroup({
          ...data.group,
          is_member: data.is_member,
          role: data.user_role as Group['role'],
        });
        setMembers(data.members);
      } catch {
        // silencioso — a lista atual continua válida até o próximo evento
      }
    },
    onMemberJoined: (data) => {
      // New member joined the group - update members list and count
      setMembers((prev) => {
        const alreadyMember = prev.some((m) => m.user_id === data.user_id);
        if (alreadyMember) return prev;

        return [
          ...prev,
          {
            id: Date.now(),
            user_id: data.user_id,
            group_id: group?.id || 0,
            role: data.role,
            joined_at: data.joined_at,
            username: data.username,
            profile_picture: data.profile_picture,
            is_online: false,
          },
        ];
      });
      // Update member count from server
      setGroup((g) => (g ? { ...g, member_count: data.member_count } : null));
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
      toast.error('Invalid file type. Use JPG, PNG, WebP or GIF.');
      return;
    }

    // Validate file size (5MB)
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
    let imagePreviewUrl: string | undefined;

    // Upload da imagem se houver
    if (selectedImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const response = await api.postForm<{ image_url: string; image_path: string }>(
          `/groups/${groupUuid}/messages/image`,
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

    // Optimistic update — id negativo temporário
    const optimisticId = -Date.now();
    const optimisticMessage: GroupMessage = {
      id: optimisticId,
      group_id: group?.id || 0,
      user_id: user.id,
      content,
      image_url: imagePreviewUrl || null,
      created_at: new Date().toISOString(),
      username: user.username,
      profile_picture: user.profile_picture || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    clearSelectedImage();
    inputRef.current?.focus();
    userScrolledUp.current = false;
    setTimeout(scrollToBottom, 50);

    try {
      // POST REST — retorna a mensagem completa com id definitivo e URL assinada
      const serverMessage = await sendMessage(content, imagePath);
      if (serverMessage) {
        // Substitui o optimistic pela resposta real do servidor
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...serverMessage } : m
          )
        );
      }
    } catch (err) {
      // Reverte o optimistic em caso de falha
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleJoinGroup = async () => {
    if (!group) return;

    try {
      await api.post(`/groups/${groupUuid}/join`);

      // Refetch group data to get updated members list including the new member
      interface GroupDetailResponse {
        group: Group;
        members: GroupMember[];
        recent_messages: GroupMessage[];
        is_member: boolean;
        user_role: string | null;
      }

      const data = await api.get<GroupDetailResponse>(`/groups/${groupUuid}`);
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

  const handleGroupUpdate = (updatedGroup: Group) => {
    setGroup(prev => prev ? {
      ...prev,
      ...updatedGroup,
      // Preserve membership fields that aren't returned by PATCH
      is_member: prev.is_member,
      role: prev.role,
    } : null);
  };

  const handleGroupDelete = () => {
    router.push('/groups');
  };

  const isAdmin = group?.role === 'admin';
  const isCreator = user?.id === group?.created_by_id;

  if (authLoading || isLoading) {
    return <GroupChatSkeleton />;
  }

  if (!group) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-4 md:py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Group not found</p>
            <Button asChild className="mt-4">
              <Link href="/groups">Back to groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not a member
  if (!group.is_member) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-4 md:py-8">
        <Link href="/groups" className="mb-3 inline-flex min-h-11 items-center gap-2 text-muted-foreground hover:text-foreground md:mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>
        <Card className="overflow-hidden">
          {/* Cover Image Banner */}
          <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 md:h-48">
            {group.cover_image ? (
              <Image src={group.cover_image} alt={group.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-12 w-12 text-muted-foreground/30 md:h-16 md:w-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          <CardContent className="px-4 pb-6 pt-4 text-center md:px-6 md:pb-8 md:pt-6">
            <h2 className="mb-2 text-xl font-bold md:text-2xl">{group.name}</h2>
            {group.description && (
              <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground md:text-base">{group.description}</p>
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
            <Button className="h-11 min-w-32" onClick={handleJoinGroup}>Join Group</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-[var(--app-header-total-height,calc(var(--app-header-height,4rem)+env(safe-area-inset-top)))] bottom-[var(--app-bottom-nav-total-height,calc(var(--app-bottom-nav-height,4rem)+env(safe-area-inset-bottom)))] z-40 flex justify-center overflow-hidden bg-background md:static md:z-auto md:h-[min(52rem,calc(100dvh-var(--app-header-height,4rem)-2rem))] md:min-h-[36rem] md:bg-transparent md:py-4">
      <div className="h-full w-full max-w-6xl md:px-4">
        <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
          {/* Members Sidebar - Left */}
          <Card className="hidden lg:flex lg:flex-col w-56 flex-shrink-0">
            <CardHeader className="py-3 px-4 pb-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </CardTitle>
              {/* Invite button for private groups - admin only */}
              {group.privacy === 'private' && group.role === 'admin' && (
                <div className="pt-2">
                  <InviteMemberModal groupUuid={groupUuid} />
                </div>
              )}
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y bg-background md:rounded-lg md:border">
            {/* Compact group app bar */}
            <div className="relative h-16 flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/20 md:h-20">
              {group.cover_image ? (
                <Image src={group.cover_image} alt={group.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-between gap-2 px-2.5 md:px-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Button variant="secondary" size="icon" className="h-11 w-11 flex-shrink-0 bg-background/85 hover:bg-background" asChild>
                    <Link href="/groups" aria-label="Back to groups">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{group.name}</h1>
                    <p className="truncate text-xs text-muted-foreground">
                      {onlineUsers.size} online
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <MembersDialog
                    group={group}
                    groupUuid={groupUuid}
                    members={members}
                    onlineUsers={onlineUsers}
                  />
                  {isAdmin && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-11 w-11 bg-background/85 hover:bg-background"
                      onClick={() => setShowSettings(true)}
                      aria-label="Group settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full ring-2 ring-background',
                      isConnected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                    )}
                    role="status"
                    aria-label={isConnected ? 'Connected' : 'Connecting'}
                    title={isConnected ? 'Connected' : 'Connecting'}
                  />
                </div>
              </div>
            </div>

            {/* Settings Modal */}
            {showSettings && user && (
              <GroupSettingsModal
                group={group}
                members={members}
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onUpdate={handleGroupUpdate}
                onDelete={handleGroupDelete}
                isCreator={isCreator}
                currentUserId={user.id}
              />
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleMessagesScroll}
            >
              <div className="space-y-3 px-3 py-3 sm:px-4 md:space-y-4 md:px-6 md:py-4">
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
              <div className="flex-shrink-0 border-t bg-muted/30 px-3 py-2">
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    aria-label="Remove selected image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex flex-shrink-0 gap-2 border-t bg-muted/30 p-2.5 md:p-3">
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

                  // Debounce de 500ms para enviar typing
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
                className="h-11 w-11 flex-shrink-0"
                aria-label="Send message"
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

function MembersDialog({
  group,
  groupUuid,
  members,
  onlineUsers,
}: {
  group: Group;
  groupUuid: string;
  members: GroupMember[];
  onlineUsers: Set<number>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 bg-background/85 hover:bg-background lg:hidden"
          aria-label={`View ${members.length} members`}
        >
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(80dvh,36rem)] max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-4 py-4 text-left">
          <DialogTitle>Members ({members.length})</DialogTitle>
          <DialogDescription className="line-clamp-1">{group.name}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60dvh] overflow-y-auto px-4 py-3">
          {group.privacy === 'private' && group.role === 'admin' && (
            <div className="mb-3">
              <InviteMemberModal groupUuid={groupUuid} />
            </div>
          )}
          <div className="space-y-1">
            {members.map((member, index) => (
              <div
                key={member.id || `mobile-member-${index}`}
                className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5"
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    username={member.username}
                    profilePicture={member.profile_picture}
                    size="sm"
                  />
                  {onlineUsers.has(member.user_id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.username}</p>
                  <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageItem({ message, isOwn }: { message: GroupMessage; isOwn: boolean }) {
  const reviewShare = message.content ? tryParseReviewShare(message.content) : null;

  return (
    <div className={cn('flex min-w-0 gap-2 md:gap-3', isOwn && 'flex-row-reverse')}>
      <div className="flex-shrink-0">
        <UserAvatar
          username={message.username}
          profilePicture={message.profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('min-w-0 max-w-[82%] md:max-w-[70%]', isOwn && 'text-right')}>
        <div className={cn('mb-1 flex min-w-0 items-center gap-1.5', isOwn && 'justify-end')}>
          <span className={cn('max-w-[9rem] truncate text-xs font-medium sm:max-w-[14rem] sm:text-sm', isOwn && 'order-2')}>
            {message.username}
          </span>
          <span className="flex-shrink-0 text-[10px] text-muted-foreground sm:text-xs">
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
              <MessageImage key={message.image_url} imageUrl={message.image_url} />
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

function MessageImage({ imageUrl }: { imageUrl: string }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative mb-2 last:mb-0">
      {isLoading && (
        <div className="flex h-40 w-[min(64vw,250px)] items-center justify-center rounded-lg bg-muted-foreground/20 animate-pulse sm:h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        aria-label="Open message image in a new tab"
        onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
        className={cn(
          'block max-w-[min(64vw,250px)] overflow-hidden rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isLoading && 'hidden'
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Message image"
          className="max-h-60 max-w-full object-cover sm:max-h-[300px]"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </button>
    </div>
  );
}

function TypingIndicator({ typingUsers }: { typingUsers: Map<number, { username: string }> }) {
  if (typingUsers.size === 0) return null;

  const users = Array.from(typingUsers.values());

  let text = '';
  if (users.length === 1) {
    text = `${users[0].username} is typing`;
  } else if (users.length === 2) {
    text = `${users[0].username} and ${users[1].username} are typing`;
  } else {
    text = 'Several people are typing';
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-0.5 truncate px-3 py-0.5 text-xs text-muted-foreground/70">
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
    <div className="fixed inset-x-0 top-[var(--app-header-total-height,calc(var(--app-header-height,4rem)+env(safe-area-inset-top)))] bottom-[var(--app-bottom-nav-total-height,calc(var(--app-bottom-nav-height,4rem)+env(safe-area-inset-bottom)))] z-40 flex justify-center overflow-hidden bg-background md:static md:z-auto md:h-[min(52rem,calc(100dvh-var(--app-header-height,4rem)-2rem))] md:min-h-[36rem] md:bg-transparent md:py-4">
      <div className="h-full w-full max-w-6xl md:px-4">
        <div className="flex h-full min-h-0 gap-3">
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y md:rounded-lg md:border">
            <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b px-3 md:h-20">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-hidden px-3 py-4 md:px-6">
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
            <div className="flex h-16 flex-shrink-0 items-center gap-2 border-t px-3">
              <Skeleton className="h-11 w-11 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 w-11 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
