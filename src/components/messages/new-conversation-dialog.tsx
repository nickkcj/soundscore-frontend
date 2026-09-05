'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, MessageCircleMore, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/common/user-avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import type { UserListItem } from '@/types';

export function NewConversationDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await api.get<{ users: UserListItem[] }>(`/reviews/discover?q=${encodeURIComponent(debouncedQuery.trim())}&type=users&limit=8`);
        if (!cancelled) setUsers(response.users ?? []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };
    searchUsers();
    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuery('');
      setUsers([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] overflow-hidden rounded-[1.5rem] p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#eee8e0] px-5 pb-4 pt-5 text-left dark:border-border">
          <DialogTitle className="text-xl font-black tracking-[-0.025em]">Nova conversa</DialogTitle>
          <DialogDescription>Busque alguém pelo nome de usuário.</DialogDescription>
        </DialogHeader>
        <div className="px-4 pt-4">
          <div className="relative">
            {isSearching ? <Loader2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-wine-700" /> : <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-700" />}
            <Input autoFocus placeholder="Digite pelo menos 2 caracteres..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-full bg-[#f7f3ed] pl-10 dark:bg-muted/40" />
          </div>
        </div>
        <div className="max-h-80 min-h-44 overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <div className="flex min-h-36 flex-col items-center justify-center text-center text-sm text-muted-foreground"><MessageCircleMore className="mb-2 h-6 w-6 text-wine-700/45" />Com quem você quer conversar?</div>
          ) : !isSearching && users.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
          ) : users.map((user) => (
            <button key={user.id} type="button" onClick={() => { setOpen(false); router.push(`/messages/${user.username}`); }} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#f7f3ed] dark:hover:bg-muted/40">
              <UserAvatar username={user.username} profilePicture={user.profile_picture} size="md" showLink={false} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.username}</p>{user.bio && <p className="truncate text-xs text-muted-foreground">{user.bio}</p>}</div>
              <ArrowRight className="h-4 w-4 text-wine-700" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
