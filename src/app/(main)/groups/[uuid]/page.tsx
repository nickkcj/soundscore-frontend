'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, Users, Music2, Loader2, ImageIcon, X, Settings, Lock, Globe, MessageCircleMore, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
        toast.error('Não foi possível carregar o grupo');
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
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. O máximo é 5 MB.');
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
    if ((!messageInput.trim() && !selectedImage) || !user) return;

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
        toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a imagem');
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
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem');
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

      toast.success('Você entrou no grupo!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível entrar no grupo');
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
      <div className="app-usable-viewport bg-[#f4f0e8] px-4 py-14 dark:bg-background">
        <div className="mx-auto max-w-xl rounded-[1.75rem] border border-dashed border-[#cfc4b7] bg-white/60 px-6 py-14 text-center dark:border-border dark:bg-card/50">
          <Users className="mx-auto mb-4 h-10 w-10 text-wine-700/45" />
          <h1 className="text-xl font-black">Grupo não encontrado</h1>
          <Button asChild className="mt-5 h-11 rounded-full bg-wine-700 px-5 text-white hover:bg-wine-800"><Link href="/groups">Voltar aos grupos</Link></Button>
        </div>
      </div>
    );
  }

  // Not a member
  if (!group.is_member) {
    return (
      <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
        <main className="container mx-auto max-w-4xl px-4 py-5 md:py-10">
          <Link href="/groups" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:mb-6"><ArrowLeft className="h-4 w-4" />Voltar aos grupos</Link>
          <section className="overflow-hidden rounded-[1.9rem] border border-[#dcd4ca] bg-white shadow-[0_22px_65px_rgba(50,38,30,0.1)] dark:border-border dark:bg-card">
            <GroupHeroCover group={group} className="h-56 sm:h-72 md:h-80" />
            <div className="px-5 pb-7 pt-6 text-center sm:px-8 sm:pb-9">
              <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-wine-700"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" />Comunidade SoundScore</div>
              <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">{group.name}</h1>
              {group.description && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{group.description}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-[#f4f0e8] px-3 py-1.5 dark:bg-muted"><Users className="h-4 w-4" />{group.member_count} membros</span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#f4f0e8] px-3 py-1.5 dark:bg-muted">{group.privacy === 'private' ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}{group.privacy === 'private' ? 'Grupo privado' : 'Grupo público'}</span>
                {group.category && <span className="rounded-full bg-[#f2ad52]/20 px-3 py-1.5 font-bold text-[#b96713]">{group.category}</span>}
              </div>
              <Button className="mt-6 h-12 min-w-40 rounded-full bg-wine-700 px-6 text-white hover:bg-wine-800" onClick={handleJoinGroup}>Participar do grupo</Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-[var(--app-header-total-height,calc(var(--app-header-height,4rem)+env(safe-area-inset-top)))] bottom-[var(--app-bottom-nav-total-height,calc(var(--app-bottom-nav-height,4rem)+env(safe-area-inset-bottom)))] z-40 flex justify-center overflow-hidden bg-[#f4f0e8] md:static md:z-auto md:h-[min(52rem,calc(100dvh-var(--app-header-height,4rem)-2rem))] md:min-h-[36rem] md:py-4 dark:bg-background">
      <div className="h-full w-full max-w-6xl md:px-4">
        <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
          {/* Members Sidebar - Left */}
          <aside className="hidden w-64 shrink-0 overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card lg:flex lg:flex-col">
            <div className="relative h-28 shrink-0">
              <GroupHeroCover group={group} className="h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h1 className="truncate text-lg font-black tracking-[-0.025em]">{group.name}</h1>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/75"><Users className="h-3 w-3" />{group.member_count} membros</p>
              </div>
            </div>
            <div className="border-b border-[#eee8e0] px-4 py-3 dark:border-border">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black">Membros</h2><span className="text-xs text-muted-foreground">{onlineUsers.size} online</span></div>
              {group.privacy === 'private' && group.role === 'admin' && (
                <div className="pt-2"><InviteMemberModal groupUuid={groupUuid} /></div>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 px-2 py-2">
                  {members.map((member, index) => (
                    <div key={member.id || `member-${index}`} className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#f7f3ed] dark:hover:bg-muted/50">
                      <div className="relative">
                        <UserAvatar
                          username={member.username}
                          profilePicture={member.profile_picture}
                          size="sm"
                        />
                        {onlineUsers.has(member.user_id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-card" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{member.username}</p>
                        <p className="text-[11px] text-muted-foreground">{member.role === 'admin' ? 'Administrador' : member.role === 'moderator' ? 'Moderador' : 'Membro'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-[#dcd4ca] bg-white shadow-[0_18px_55px_rgba(50,38,30,0.08)] md:rounded-[1.65rem] md:border dark:border-border dark:bg-card">
            {/* Compact group app bar */}
            <div className="relative h-[4.75rem] shrink-0 md:h-24">
              <GroupHeroCover group={group} className="h-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
              <div className="absolute inset-0 flex items-center justify-between gap-2 px-2.5 md:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white" asChild>
                    <Link href="/groups" aria-label="Voltar aos grupos">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-black tracking-[-0.02em] text-white sm:text-lg">{group.name}</h1>
                    <p className="flex items-center gap-1.5 truncate text-xs text-white/70"><span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-emerald-400' : 'animate-pulse bg-amber-400')} />{isConnected ? `${onlineUsers.size} online` : 'Conectando…'}</p>
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
                      className="h-11 w-11 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white"
                      onClick={() => setShowSettings(true)}
                      aria-label="Configurações do grupo"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
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
              className="flex-1 overflow-y-auto bg-[#f8f5f0] dark:bg-background/55"
              onScroll={handleMessagesScroll}
            >
              <div className="space-y-4 px-3 py-4 sm:px-4 md:px-6 md:py-5">
                {messages.length === 0 && (
                  <div className="mx-auto max-w-sm py-16 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wine-700/10 text-wine-700"><MessageCircleMore className="h-6 w-6" /></span><h2 className="font-black">A conversa começa aqui</h2><p className="mt-1 text-sm text-muted-foreground">Compartilhe uma música, uma review ou diga o que você está ouvindo.</p></div>
                )}
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
              <div className="shrink-0 border-t border-[#e6ded4] bg-white px-3 py-2 dark:border-border dark:bg-card">
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Prévia"
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    aria-label="Remover imagem selecionada"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex shrink-0 items-center gap-2 border-t border-[#e6ded4] bg-white p-2.5 dark:border-border dark:bg-card md:p-3">
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
                disabled={isUploading}
                className="h-11 w-11 shrink-0 rounded-full text-wine-700 hover:bg-wine-700/10 hover:text-wine-700"
                aria-label="Anexar imagem"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Input
                ref={inputRef}
                placeholder="Escreva uma mensagem..."
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
                disabled={isUploading}
                className="h-11 min-w-0 rounded-full border-[#ded6cc] bg-[#f7f3ed] px-4 shadow-none dark:border-border dark:bg-muted/50"
              />
              <Button
                type="submit"
                disabled={isUploading || (!messageInput.trim() && !selectedImage)}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-wine-700 text-white hover:bg-wine-800"
                aria-label="Enviar mensagem"
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

function GroupHeroCover({ group, className }: { group: Group; className: string }) {
  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br from-[#4d2028] via-[#722f37] to-[#d98524] ${className}`}>
      {group.cover_image ? (
        <Image src={group.cover_image} alt={group.name} fill sizes="(max-width: 768px) 100vw, 900px" className="object-cover" />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center text-white">
          <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-[24px] border-white/10" />
          <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-[#f2ad52]/20 blur-2xl" />
          <Music2 className="relative h-12 w-12 text-white/80" />
        </div>
      )}
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
          className="h-11 w-11 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white lg:hidden"
          aria-label={`Ver ${members.length} membros`}
        >
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(80dvh,36rem)] max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-4 py-4 text-left">
          <DialogTitle>Membros ({members.length})</DialogTitle>
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
                  <p className="text-xs text-muted-foreground">{member.role === 'admin' ? 'Administrador' : member.role === 'moderator' ? 'Moderador' : 'Membro'}</p>
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
    <div className={cn('flex min-w-0 gap-2.5 md:gap-3', isOwn && 'flex-row-reverse')}>
      <div className="flex-shrink-0">
        <UserAvatar
          username={message.username}
          profilePicture={message.profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('min-w-0 max-w-[84%] md:max-w-[72%]', isOwn && 'text-right')}>
        <div className={cn('mb-1 flex min-w-0 items-center gap-1.5', isOwn && 'justify-end')}>
          <span className={cn('max-w-[9rem] truncate text-xs font-medium sm:max-w-[14rem] sm:text-sm', isOwn && 'order-2')}>
            {message.username}
          </span>
          <span className="flex-shrink-0 text-[10px] text-muted-foreground sm:text-xs">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        {reviewShare ? (
          <ReviewShareCard data={reviewShare} />
        ) : (
          <div
            className={cn(
              'inline-block overflow-hidden rounded-[1.15rem] text-left shadow-sm',
              message.content ? 'px-3.5 py-2.5' : 'p-1',
              isOwn ? 'rounded-tr-md bg-wine-700 text-white' : 'rounded-tl-md border border-[#e5ddd3] bg-white text-foreground dark:border-border dark:bg-card'
            )}
          >
            {message.image_url && (
              <MessageImage key={message.image_url} imageUrl={message.image_url} />
            )}
            {message.content && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
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
    text = `${users[0].username} está digitando`;
  } else if (users.length === 2) {
    text = `${users[0].username} e ${users[1].username} estão digitando`;
  } else {
    text = 'Várias pessoas estão digitando';
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
    <div className="fixed inset-x-0 top-[var(--app-header-total-height,calc(var(--app-header-height,4rem)+env(safe-area-inset-top)))] bottom-[var(--app-bottom-nav-total-height,calc(var(--app-bottom-nav-height,4rem)+env(safe-area-inset-bottom)))] z-40 flex justify-center overflow-hidden bg-[#f4f0e8] md:static md:z-auto md:h-[min(52rem,calc(100dvh-var(--app-header-height,4rem)-2rem))] md:min-h-[36rem] md:py-4 dark:bg-background">
      <div className="h-full w-full max-w-6xl md:px-4">
        <div className="flex h-full min-h-0 gap-4">
          {/* Members Sidebar Skeleton */}
          <div className="hidden w-64 shrink-0 overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white dark:border-border dark:bg-card lg:block">
            <Skeleton className="h-28 w-full" />
            <div className="p-4">
              <Skeleton className="mb-4 h-5 w-28" />
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
            </div>
          </div>

          {/* Chat Area Skeleton */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-[#dcd4ca] bg-white md:rounded-[1.65rem] md:border dark:border-border dark:bg-card">
            <div className="flex h-[4.75rem] shrink-0 items-center gap-3 bg-wine-900 px-3 md:h-24">
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
