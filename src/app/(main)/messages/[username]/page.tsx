'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCheck, Send, Loader2, ImageIcon, X, MessageCircleMore, Music2, PenLine, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRequireAuth } from '@/hooks/use-auth';
import { useDMWebSocket } from '@/hooks/use-dm-websocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ReviewShareCard, tryParseReviewShare } from '@/components/reviews/review-share-card';
import { NewConversationDialog } from '@/components/messages/new-conversation-dialog';
import type { ConversationListResponse, ConversationType, DirectMessageType, DMMessageListResponse } from '@/types';

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
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolledUp = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
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

        // A lateral enriquece o desktop, mas uma falha nela não deve impedir o chat.
        try {
          const conversationData = await api.get<ConversationListResponse>('/dm/conversations');
          setConversations(conversationData.conversations);
        } catch {
          setConversations([]);
        }

        // Mark as read
        await api.put(`/dm/conversations/${conv.id}/read`);
      } catch {
        toast.error('Não foi possível carregar a conversa');
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
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. O máximo é 5 MB.');
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
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
    if ((!messageInput.trim() && !selectedImage) || !user || !conversationId) return;

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
        toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a imagem');
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
          prev.map((m) => (
            m.id === optimisticId
              ? {
                  ...serverMessage,
                  // A API assina novamente a mesma foto e devolve outra URL.
                  // Preservar a URL já carregada evita o fallback com a inicial
                  // enquanto o navegador baixa a nova assinatura.
                  sender_username: m.sender_username || serverMessage.sender_username,
                  sender_profile_picture:
                    m.sender_profile_picture ?? serverMessage.sender_profile_picture,
                }
              : m
          ))
        );
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem');
    }
  };

  if (authLoading || isLoading) {
    return <DMChatSkeleton />;
  }

  return (
    <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav-total-height)] top-[var(--app-header-total-height)] z-40 min-h-0 bg-[#f4f0e8] p-0 text-[#1b1919] dark:bg-background dark:text-foreground md:static md:z-auto md:h-[var(--app-usable-height)] md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl overflow-hidden border-y border-[#dcd4ca] bg-white shadow-[0_18px_55px_rgba(50,38,30,0.08)] dark:border-border dark:bg-card sm:rounded-[1.65rem] sm:border">
        <ConversationSidebar conversations={conversations} search={conversationSearch} onSearchChange={setConversationSearch} activeUsername={username} />

        <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#e6ded4] bg-white dark:border-border dark:bg-card">
          <div className="flex h-[4.75rem] items-center gap-3 px-3 sm:h-20 sm:px-4">
            <Link href="/messages" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-wine-700/8 hover:text-wine-700 md:hidden" aria-label="Voltar às conversas"><ArrowLeft className="h-5 w-5" /></Link>
            {otherUser && (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar username={otherUser.username} profilePicture={otherUser.profile_picture} size="md" />
                <div className="min-w-0">
                  <Link href={`/profile/${otherUser.username}`} className="block truncate font-black tracking-[-0.015em] hover:text-wine-700">{otherUser.username}</Link>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500')} />{isConnected ? 'Mensagens sincronizadas' : 'Reconectando…'}</p>
                </div>
              </div>
            )}
            {otherUser && <Button asChild variant="ghost" className="hidden h-10 rounded-full px-4 text-xs font-bold text-wine-700 hover:bg-wine-700/8 hover:text-wine-700 sm:inline-flex"><Link href={`/profile/${otherUser.username}`}>Ver perfil</Link></Button>}
          </div>
        </div>

        <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto bg-[#f8f5f0] dark:bg-background/55" onScroll={handleMessagesScroll}>
          <div className={cn('flex min-h-full flex-col space-y-4 px-3 py-5 sm:px-5 md:px-7', messages.length === 0 ? 'justify-center' : 'justify-end')}>
            {messages.length === 0 && (
              <div className="mx-auto max-w-sm py-20 text-center"><span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-700/10 text-wine-700"><MessageCircleMore className="h-7 w-7" /></span><h2 className="font-black">Uma música já é um bom começo</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Envie uma mensagem ou compartilhe uma review para começar a conversa.</p></div>
            )}
            {messages.map((message, index) => <MessageItem key={message.id || `msg-${index}`} message={message} isOwn={message.sender_id === user?.id} />)}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {typingUser && <div className="flex shrink-0 items-center gap-0.5 bg-[#f8f5f0] px-4 py-1 text-xs text-muted-foreground dark:bg-background/55"><span>{typingUser} está digitando</span><span className="flex"><span className="animate-bounce [animation-delay:0ms]">.</span><span className="animate-bounce [animation-delay:150ms]">.</span><span className="animate-bounce [animation-delay:300ms]">.</span></span></div>}

        {imagePreview && (
          <div className="max-h-32 shrink-0 overflow-y-auto border-t border-[#e6ded4] bg-white px-4 py-2 dark:border-border dark:bg-card"><div className="relative inline-block"><Image src={imagePreview} alt="Prévia" width={120} height={120} className="h-24 w-24 rounded-xl object-cover sm:h-[120px] sm:w-[120px]" /><button type="button" onClick={clearSelectedImage} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90" aria-label="Remover imagem selecionada"><X className="h-3.5 w-3.5" /></button></div></div>
        )}

        <form onSubmit={handleSendMessage} className="flex shrink-0 items-center gap-2 border-t border-[#e6ded4] bg-white p-2.5 dark:border-border dark:bg-card sm:p-3">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="hidden" />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-11 w-11 shrink-0 rounded-full text-wine-700 hover:bg-wine-700/10 hover:text-wine-700" aria-label="Anexar imagem"><ImageIcon className="h-5 w-5" /></Button>
          <Input ref={inputRef} placeholder="Escreva uma mensagem..." value={messageInput} onChange={(event) => { setMessageInput(event.target.value); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => sendTyping(), 500); }} disabled={isUploading} className="h-11 min-w-0 rounded-full border-[#ded6cc] bg-[#f7f3ed] px-4 shadow-none dark:border-border dark:bg-muted/50" />
          <Button type="submit" disabled={isUploading || (!messageInput.trim() && !selectedImage)} size="icon" className="h-11 w-11 shrink-0 rounded-full bg-wine-700 text-white hover:bg-wine-800" aria-label="Enviar mensagem">{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
        </form>
        </div>
      </div>
    </div>
  );
}

function getConversationPreview(content: string | undefined) {
  if (!content) return { text: 'A conversa ainda não começou.', sharedReview: false };
  const sharedReview = tryParseReviewShare(content);
  return sharedReview
    ? { text: `Review de ${sharedReview.album_title}`, sharedReview: true }
    : { text: content, sharedReview: false };
}

function ConversationSidebar({ conversations, search, onSearchChange, activeUsername }: { conversations: ConversationType[]; search: string; onSearchChange: (value: string) => void; activeUsername: string }) {
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredConversations = normalizedSearch
    ? conversations.filter((conversation) => conversation.other_user.username.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : conversations;

  return (
    <aside className="hidden w-[20rem] shrink-0 flex-col border-r border-[#e6ded4] bg-white dark:border-border dark:bg-card md:flex lg:w-[22rem]">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-[#e6ded4] px-5 dark:border-border">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700">Mensagens</p>
          <h1 className="mt-0.5 text-xl font-black tracking-[-0.035em]">Conversas</h1>
        </div>
        <NewConversationDialog>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-wine-700 hover:bg-wine-700/10 hover:text-wine-700" aria-label="Iniciar nova conversa"><PenLine className="h-4.5 w-4.5" /></Button>
        </NewConversationDialog>
      </div>

      <div className="shrink-0 border-b border-[#eee8e0] p-3 dark:border-border">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-700" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar conversas..." className="h-10 rounded-full border-[#ded6cc] bg-[#f7f3ed] pl-10 pr-4 text-sm shadow-none focus-visible:ring-wine-700/30 dark:bg-muted/40" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
            <MessageCircleMore className="mb-3 h-7 w-7 text-wine-700/45" />
            {search ? 'Nenhuma conversa encontrada.' : 'Suas conversas aparecerão aqui.'}
          </div>
        ) : filteredConversations.map((conversation) => {
          const otherUser = conversation.other_user;
          const preview = getConversationPreview(conversation.last_message?.content);
          const active = otherUser.username === activeUsername;
          return (
            <Link key={conversation.id} href={`/messages/${otherUser.username}`} className={cn('flex min-h-[4.75rem] gap-3 border-b border-[#eee8e0] px-3.5 py-3 transition-colors dark:border-border', active ? 'bg-wine-700/[0.075]' : 'hover:bg-[#faf7f2] dark:hover:bg-muted/35')}>
              <div className="relative shrink-0"><UserAvatar username={otherUser.username} profilePicture={otherUser.profile_picture} size="md" showLink={false} />{conversation.unread_count > 0 && !active && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#d98524] dark:border-card" />}</div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2"><span className={cn('truncate text-sm font-bold', conversation.unread_count > 0 && !active && 'font-black')}>{otherUser.username}</span><span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true, locale: ptBR })}</span></div>
                <div className="mt-1 flex min-w-0 items-center gap-1.5">{preview.sharedReview && <Music2 className="h-3.5 w-3.5 shrink-0 text-[#d98524]" />}<p className={cn('truncate text-xs', conversation.unread_count > 0 && !active ? 'font-semibold text-foreground/80' : 'text-muted-foreground')}>{preview.text}</p>{conversation.unread_count > 0 && !active && <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-wine-700 px-1 text-[9px] font-black text-white">{conversation.unread_count}</span>}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function MessageItem({ message, isOwn }: { message: DirectMessageType; isOwn: boolean }) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const reviewShare = message.content ? tryParseReviewShare(message.content) : null;

  return (
    <div className={cn('flex min-w-0 gap-2.5 sm:gap-3', isOwn && 'flex-row-reverse')}>
      <div className="shrink-0">
        <UserAvatar
          username={message.sender_username}
          profilePicture={message.sender_profile_picture}
          size="sm"
          showLink={!isOwn}
        />
      </div>
      <div className={cn('min-w-0 max-w-[84%] sm:max-w-[72%]', isOwn && 'text-right')}>
        <div className={cn('mb-1 flex min-w-0 items-center gap-1.5', isOwn && 'justify-end')}>
          <span className={cn('min-w-0 truncate text-xs font-bold sm:text-sm', isOwn && 'order-2')}>
            {message.sender_username}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          {isOwn && message.is_read && <CheckCheck className="order-3 h-3.5 w-3.5 text-wine-700" aria-label="Lida" />}
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
              <div className="relative mb-2 last:mb-0">
                {isImageLoading && (
                  <div className="flex h-44 w-[min(250px,65vw)] items-center justify-center rounded-lg bg-muted-foreground/20 animate-pulse sm:h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Abrir imagem da mensagem em uma nova aba"
                  onClick={() => window.open(message.image_url!, '_blank', 'noopener,noreferrer')}
                  className={cn(
                    'block max-w-full overflow-hidden rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isImageLoading && 'hidden'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.image_url}
                    alt="Imagem da mensagem"
                    className="h-auto max-h-[min(300px,42dvh)] w-auto max-w-full object-cover"
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                  />
                </button>
              </div>
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

function DMChatSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav-total-height)] top-[var(--app-header-total-height)] z-40 min-h-0 bg-[#f4f0e8] p-0 dark:bg-background md:static md:z-auto md:h-[var(--app-usable-height)] md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden border-y border-[#dcd4ca] bg-white dark:border-border dark:bg-card sm:rounded-[1.65rem] sm:border">
        <div className="shrink-0 border-b border-[#e6ded4] dark:border-border">
          <div className="flex h-[4.75rem] items-center gap-3 px-4 sm:h-20">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-hidden bg-[#f8f5f0] px-4 py-5 dark:bg-background/55">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-48 rounded-[1.15rem]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
