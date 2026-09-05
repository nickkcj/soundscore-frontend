'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Users, Lock, Globe, TrendingUp, Music2, Loader2, MoreVertical, Settings, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupSettingsModal } from '@/components/groups/group-settings-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { Group, GroupListResponse, GroupMember } from '@/types';

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Eletrônica' },
  { value: 'classical', label: 'Clássica' },
  { value: 'jazz', label: 'Jazz' },
];

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

export default function GroupsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [trendingGroups, setTrendingGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const initialLoadDone = useRef(false);

  // Handle join success - atualiza estado e redireciona para o grupo
  const handleJoinSuccess = useCallback((groupUuid: string) => {
    // Atualiza a lista principal
    setGroups(prev => prev.map(g =>
      g.uuid === groupUuid ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
    ));
    // Atualiza trending groups
    setTrendingGroups(prev => prev.map(g =>
      g.uuid === groupUuid ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
    ));

    toast.success('Você entrou no grupo!');
    router.push(`/groups/${groupUuid}`);
  }, [router]);

  // Handle group update
  const handleGroupUpdate = useCallback((updatedGroup: Group) => {
    setGroups(prev => prev.map(g =>
      g.uuid === updatedGroup.uuid ? { ...g, ...updatedGroup, is_member: g.is_member, role: g.role } : g
    ));
    setTrendingGroups(prev => prev.map(g =>
      g.uuid === updatedGroup.uuid ? { ...g, ...updatedGroup, is_member: g.is_member, role: g.role } : g
    ));
  }, []);

  // Handle group delete
  const handleGroupDelete = useCallback((groupUuid: string) => {
    setGroups(prev => prev.filter(g => g.uuid !== groupUuid));
    setTrendingGroups(prev => prev.filter(g => g.uuid !== groupUuid));
  }, []);

  const fetchGroups = useCallback(async () => {
    // Only show full skeleton on initial load
    if (!initialLoadDone.current) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (category !== 'all') params.append('category', category);

      const response = await api.get<GroupListResponse>(`/groups?${params}`);
      setGroups(response.groups);
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [category, debouncedSearch]);

  const fetchTrendingGroups = useCallback(async () => {
    try {
      const response = await api.get<GroupListResponse>('/groups?per_page=8&sort=members');
      setTrendingGroups(response.groups);
    } catch {
      setTrendingGroups([]);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial load
  useEffect(() => {
    if (!authLoading && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchGroups();
      fetchTrendingGroups();
    }
  }, [authLoading, fetchGroups, fetchTrendingGroups]);

  // Search/filter changes (after initial load)
  useEffect(() => {
    if (initialLoadDone.current) {
      fetchGroups();
    }
  }, [category, debouncedSearch, fetchGroups]);

  if (authLoading) {
    return <GroupsPageSkeleton />;
  }

  const memberGroups = groups.filter((group) => group.is_member);
  const featuredGroups = trendingGroups.filter((group) => !group.is_member).slice(0, 4);
  const discoverGroups = !search && category === 'all'
    ? groups.filter((group) => !group.is_member)
    : groups;

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-6 md:pb-24 md:pt-10">
        <header className="mb-8 grid gap-6 border-b border-[#d8cfc4] pb-8 md:mb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:pb-10 dark:border-border">
          <div className="max-w-3xl">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" /> Comunidades SoundScore</p>
            <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl md:text-6xl">Encontre gente que<br className="hidden sm:block" /> ouve como você.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Entre em grupos para conversar sobre artistas, gêneros e discos que não saem da sua cabeça.</p>
          </div>
          <Button asChild className="h-12 w-full rounded-full bg-wine-700 px-5 text-white shadow-[0_10px_24px_rgba(114,47,55,0.2)] hover:bg-wine-800 sm:w-fit"><Link href="/groups/create"><Plus className="mr-2 h-4 w-4" /> Criar grupo</Link></Button>
        </header>

        {memberGroups.length > 0 && !search && category === 'all' && (
          <section className="mb-9 md:mb-12">
            <div className="mb-4 flex items-end justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700 sm:text-[11px]">Seu espaço</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">Seus grupos</h2></div>
              <span className="text-sm text-muted-foreground">{memberGroups.length} {memberGroups.length === 1 ? 'grupo' : 'grupos'}</span>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {memberGroups.map((group) => (
                <Link key={group.uuid} href={`/groups/${group.uuid}`} className="group flex w-[17rem] shrink-0 snap-start items-center gap-3 rounded-[1.35rem] border border-[#dcd4ca] bg-white p-3 shadow-[0_10px_30px_rgba(50,38,30,0.05)] transition-all hover:-translate-y-0.5 dark:border-border dark:bg-card sm:w-[19rem]">
                  <GroupCover group={group} className="h-16 w-16 shrink-0 rounded-[1rem]" sizes="64px" />
                  <div className="min-w-0 flex-1"><p className="truncate font-black tracking-[-0.015em]">{group.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{group.member_count} membros</p></div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-wine-700 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {featuredGroups.length > 0 && !search && category === 'all' && (
          <section className="mb-9 md:mb-12">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2ad52]/20 text-[#c87318]"><TrendingUp className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700 sm:text-[11px]">Movimentando a comunidade</p><h2 className="text-2xl font-black tracking-[-0.035em]">Em alta agora</h2></div></div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {featuredGroups.map((group) => <div key={group.id} className="w-[min(82vw,19rem)] shrink-0 snap-start sm:w-auto"><GroupCard group={group} compact onJoinSuccess={handleJoinSuccess} onUpdate={handleGroupUpdate} onDelete={handleGroupDelete} currentUserId={user?.id} /></div>)}
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 md:mb-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700 sm:text-[11px]">Descobrir</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Encontre sua turma</h2></div>
          <div className="mb-5 rounded-[1.6rem] border border-[#dcd4ca] bg-white p-3 shadow-[0_12px_35px_rgba(50,38,30,0.05)] dark:border-border dark:bg-card sm:p-4">
            <div className="relative">
              {isSearching ? <Loader2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-wine-700" /> : <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-700" />}
              <Input placeholder="Buscar por nome ou assunto..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 rounded-full border-[#ded6cc] bg-[#f7f3ed] pl-11 pr-4 shadow-none focus-visible:ring-wine-700/30 dark:bg-muted/40" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-colors ${category === item.value ? 'bg-wine-700 text-white' : 'bg-[#eee8df] text-foreground/70 hover:bg-[#e6ddd2] dark:bg-muted'}`}>{item.label}</button>)}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <GroupCardSkeleton key={index} />)}</div>
          ) : discoverGroups.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#cfc4b7] bg-white/55 px-5 py-14 text-center dark:border-border dark:bg-card/50"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eee8df] text-wine-700 dark:bg-muted"><Users className="h-6 w-6" /></span><h3 className="text-lg font-black">Nenhum grupo por aqui</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Tente outro termo ou crie o espaço que você gostaria de encontrar.</p></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{discoverGroups.map((group) => <GroupCard key={group.id} group={group} onJoinSuccess={handleJoinSuccess} onUpdate={handleGroupUpdate} onDelete={handleGroupDelete} currentUserId={user?.id} />)}</div>
          )}
        </section>
      </main>
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  compact?: boolean;
  onJoinSuccess?: (groupUuid: string) => void;
  onUpdate?: (updatedGroup: Group) => void;
  onDelete?: (groupUuid: string) => void;
  currentUserId?: number;
}

function GroupCard({ group, compact = false, onJoinSuccess, onUpdate, onDelete, currentUserId }: GroupCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const router = useRouter();

  const isAdmin = group.role === 'admin';
  const isCreator = currentUserId === group.created_by_id;

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isJoining) return;

    setIsJoining(true);
    try {
      await api.post(`/groups/${group.uuid}/join`);
      onJoinSuccess?.(group.uuid);
    } catch {
      // Error handled silently, button returns to normal state
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/groups/${group.uuid}`);
  };

  const handleOpenSettings = async () => {
    // Fetch members when opening settings
    try {
      const response = await api.get<{ members: GroupMember[] }>(`/groups/${group.uuid}/members`);
      setMembers(response.members);
    } catch {
      setMembers([]);
    }
    setShowSettings(true);
  };

  return (
    <>
      <article className="group/card flex h-full min-w-0 flex-col overflow-hidden rounded-[1.55rem] border border-[#dcd4ca] bg-white shadow-[0_14px_38px_rgba(50,38,30,0.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(50,38,30,0.11)] dark:border-border dark:bg-card">
        <div className={`relative ${compact ? 'h-32' : 'h-36 sm:h-40'}`}>
          <GroupCover group={group} className="h-full w-full" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 360px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {group.privacy === 'private' ? <><Lock className="h-3 w-3" />Privado</> : <><Globe className="h-3 w-3" />Público</>}
          </div>
          <div className="absolute right-3 top-3">
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white" onClick={(event) => event.stopPropagation()} aria-label={`Gerenciar ${group.name}`}><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  {isCreator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={handleOpenSettings}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir grupo
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className={`flex flex-1 flex-col ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}>
          <div className="min-h-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h3 className="truncate text-lg font-black tracking-[-0.025em]">{group.name}</h3>
              {group.category && <span className="max-w-24 shrink-0 truncate rounded-full bg-[#f2ad52]/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#b96713]">{getCategoryLabel(group.category)}</span>}
            </div>
            {group.description && <p className={`mt-1.5 text-sm leading-relaxed text-muted-foreground ${compact ? 'line-clamp-2' : 'line-clamp-2'}`}>{group.description}</p>}
          </div>
          <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-[#eee8e0] pt-3 dark:border-border">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-4 w-4 shrink-0" />{group.member_count} membros</span>
            {group.is_member ? (
              <Button size="sm" variant="outline" onClick={handleOpen} className="h-9 shrink-0 rounded-full border-[#d5ccc1] px-4 text-xs font-bold hover:bg-[#f4f0e8] dark:border-border">Abrir <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            ) : (
              <Button size="sm" onClick={handleJoin} disabled={isJoining} className="h-9 shrink-0 rounded-full bg-wine-700 px-4 text-xs font-bold text-white hover:bg-wine-800">{isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Participar'}</Button>
            )}
          </div>
        </div>
      </article>

      {/* Settings Modal */}
      {showSettings && currentUserId && (
        <GroupSettingsModal
          group={group}
          members={members}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={() => onDelete?.(group.uuid)}
          isCreator={isCreator}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

function GroupCover({ group, className, sizes }: { group: Group; className: string; sizes: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-[#4d2028] via-[#722f37] to-[#d98524] ${className}`}>
      {group.cover_image ? (
        <Image src={group.cover_image} alt={group.name} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover/card:scale-[1.035]" />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden text-white">
          <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full border-[18px] border-white/10" />
          <div className="absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-[#f2ad52]/20 blur-xl" />
          <Music2 className="relative h-9 w-9 text-white/85" />
        </div>
      )}
    </div>
  );
}

function GroupCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.55rem] border border-[#dcd4ca] bg-white dark:border-border dark:bg-card">
      <Skeleton className="h-36 sm:h-40" />
      <div className="space-y-2 p-4 sm:p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function GroupsPageSkeleton() {
  return (
    <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background">
      <div className="container mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-10">
        <div className="mb-10 border-b border-[#d8cfc4] pb-10 dark:border-border">
          <Skeleton className="mb-3 h-4 w-44" />
          <Skeleton className="h-12 w-full max-w-xl sm:h-16" />
          <Skeleton className="mt-4 h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="mb-4 h-8 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <GroupCardSkeleton key={index} />)}
        </div>
      </div>
    </div>
  );
}
