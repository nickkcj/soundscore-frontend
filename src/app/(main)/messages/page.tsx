'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, MessageCircleMore, Music2, PenLine, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/common/user-avatar';
import { useRequireAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { tryParseReviewShare } from '@/components/reviews/review-share-card';
import { NewConversationDialog } from '@/components/messages/new-conversation-dialog';
import type { ConversationListResponse, ConversationType } from '@/types';

export default function MessagesPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<ConversationListResponse>('/dm/conversations');
      setConversations(data.conversations);
    } catch {
      // Mantém a última lista disponível durante falhas temporárias.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchConversations();
  }, [authLoading, fetchConversations]);

  useEffect(() => {
    if (authLoading) return;
    const interval = setInterval(fetchConversations, 30_000);
    return () => clearInterval(interval);
  }, [authLoading, fetchConversations]);

  // No desktop, a caixa de mensagens já abre com a conversa mais recente.
  // No mobile, preservamos o fluxo lista → conversa.
  useEffect(() => {
    if (authLoading || isLoading || conversations.length === 0) return;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    if (!desktop) return;
    const mostRecent = [...conversations].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    router.replace(`/messages/${mostRecent.other_user.username}`);
  }, [authLoading, conversations, isLoading, router]);

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredConversations = normalizedSearch
    ? conversations.filter((conversation) =>
        conversation.other_user.username.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      )
    : conversations;
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unread_count, 0);

  if (authLoading || isLoading) return <MessagesPageSkeleton />;

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-4xl px-4 pb-16 pt-6 md:pb-24 md:pt-10">
        <header className="mb-7 flex items-end justify-between gap-4 md:mb-9">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" />Entre uma faixa e outra</p>
            <h1 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">Conversas</h1>
            <p className="mt-3 hidden text-sm text-muted-foreground sm:block">Continue as conversas que começaram com uma música.</p>
          </div>
          <NewConversationDialog>
            <Button className="h-11 shrink-0 rounded-full bg-wine-700 px-4 text-white hover:bg-wine-800 sm:h-12 sm:px-5"><PenLine className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Nova conversa</span><span className="sm:hidden">Nova</span></Button>
          </NewConversationDialog>
        </header>

        <section className="overflow-hidden rounded-[1.75rem] border border-[#dcd4ca] bg-white shadow-[0_18px_55px_rgba(50,38,30,0.07)] dark:border-border dark:bg-card">
          <div className="border-b border-[#e7dfd5] p-3 dark:border-border sm:p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-700" />
              <Input placeholder="Buscar nas conversas..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 rounded-full border-[#ded6cc] bg-[#f7f3ed] pl-11 pr-4 shadow-none focus-visible:ring-wine-700/30 dark:bg-muted/40" />
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="px-5 py-16 text-center sm:py-20">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-700/10 text-wine-700"><MessageCircleMore className="h-7 w-7" /></span>
              <h2 className="text-lg font-black">{search ? 'Nenhuma conversa encontrada' : 'Sua próxima conversa começa aqui'}</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{search ? 'Tente buscar por outro nome de usuário.' : 'Encontre alguém para falar sobre o disco que não sai dos seus fones.'}</p>
              {!search && <NewConversationDialog><Button variant="outline" className="mt-5 h-11 rounded-full border-[#d5ccc1] px-5 dark:border-border"><PenLine className="mr-2 h-4 w-4" />Começar conversa</Button></NewConversationDialog>}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-[#eee8e0] px-4 py-3 text-xs text-muted-foreground dark:border-border sm:px-5">
                <span>{filteredConversations.length} {filteredConversations.length === 1 ? 'conversa' : 'conversas'}</span>
                {unreadTotal > 0 && <span className="font-bold text-wine-700">{unreadTotal} {unreadTotal === 1 ? 'mensagem não lida' : 'mensagens não lidas'}</span>}
              </div>
              {filteredConversations.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function getMessagePreview(content: string | undefined): { text: string; sharedReview: boolean } {
  if (!content) return { text: 'A conversa ainda não começou.', sharedReview: false };
  const reviewShare = tryParseReviewShare(content);
  if (reviewShare) return { text: `Compartilhou uma review de ${reviewShare.album_title}`, sharedReview: true };
  return { text: content, sharedReview: false };
}

function ConversationItem({ conversation }: { conversation: ConversationType }) {
  const { other_user: otherUser, last_message: lastMessage, unread_count: unreadCount, updated_at: updatedAt } = conversation;
  const preview = getMessagePreview(lastMessage?.content);

  return (
    <Link href={`/messages/${otherUser.username}`} className={cn('group flex min-h-[5.5rem] items-center gap-3 border-b border-[#eee8e0] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-[#faf7f2] dark:border-border dark:hover:bg-muted/35 sm:gap-4 sm:px-5', unreadCount > 0 && 'bg-wine-700/[0.035]')}>
      <div className="relative shrink-0">
        <UserAvatar username={otherUser.username} profilePicture={otherUser.profile_picture} size="lg" showLink={false} />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#d98524] dark:border-card" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('min-w-0 truncate text-[15px] font-bold', unreadCount > 0 && 'font-black')}>{otherUser.username}</span>
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground sm:text-xs">{formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ptBR })}</span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          {preview.sharedReview && <Music2 className="h-3.5 w-3.5 shrink-0 text-[#d98524]" />}
          <p className={cn('truncate text-sm', unreadCount > 0 ? 'font-semibold text-foreground/85' : 'text-muted-foreground')}>{preview.text}</p>
          {unreadCount > 0 && <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-wine-700 px-1.5 text-[10px] font-black text-white">{unreadCount}</span>}
        </div>
      </div>
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-wine-700/45 transition-transform group-hover:translate-x-0.5 group-hover:text-wine-700 sm:block" />
    </Link>
  );
}

function MessagesPageSkeleton() {
  return (
    <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background"><div className="container mx-auto max-w-4xl px-4 py-10"><Skeleton className="mb-3 h-12 w-52" /><Skeleton className="mb-8 h-4 w-80" /><div className="overflow-hidden rounded-[1.75rem] border border-[#dcd4ca] bg-white dark:border-border dark:bg-card"><div className="border-b p-4"><Skeleton className="h-12 w-full rounded-full" /></div>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex items-center gap-4 border-b p-4 last:border-0"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-2/3" /></div></div>)}</div></div></div>
  );
}
