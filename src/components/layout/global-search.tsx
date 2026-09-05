'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Disc3, Loader2, MessageSquareText, Search, UserRound, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { SpotifyAlbumResult, UserListItem } from '@/types';

interface ReviewSearchResult {
  uuid: string;
  text: string | null;
  username: string;
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
}

interface GlobalSearchResults {
  albums: SpotifyAlbumResult[];
  users: UserListItem[];
  reviews: ReviewSearchResult[];
}

const EMPTY_RESULTS: GlobalSearchResults = { albums: [], users: [], reviews: [] };

function useGlobalSearch() {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      return;
    }

    let active = true;
    api.get<GlobalSearchResults>(`/reviews/discover?q=${encodeURIComponent(debouncedQuery.trim())}&type=all`)
      .then((response) => {
        if (active) setResults({ ...EMPTY_RESULTS, ...response });
      })
      .catch(() => {
        if (active) setResults(EMPTY_RESULTS);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [debouncedQuery]);

  const setQuery = (value: string) => {
    setQueryState(value);
    setIsLoading(value.trim().length >= 2);
  };

  return { query, setQuery, results, isLoading };
}

function SearchResults({ query, results, isLoading, onNavigate }: { query: string; results: GlobalSearchResults; isLoading: boolean; onNavigate: () => void }) {
  const hasResults = results.albums.length || results.users.length || results.reviews.length;

  if (query.trim().length < 2) {
    return <div className="px-5 py-8 text-center text-sm text-muted-foreground">Digite pelo menos duas letras para buscar em todo o SoundScore.</div>;
  }
  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-wine-700" /> Buscando...</div>;
  }
  if (!hasResults) {
    return <div className="px-5 py-9 text-center"><p className="font-bold">Nada encontrado</p><p className="mt-1 text-sm text-muted-foreground">Tente outro álbum, artista ou nome de usuário.</p></div>;
  }

  return (
    <div className="max-h-[min(32rem,70dvh)] overflow-y-auto p-2">
      {results.albums.length > 0 && (
        <SearchGroup icon={Disc3} title="Álbuns">
          {results.albums.slice(0, 4).map((album) => (
            <Link key={album.spotify_id} href={`/album/${album.spotify_id}`} onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f4f0e8] dark:hover:bg-muted">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                {album.cover_image ? <Image src={album.cover_image} alt="" fill className="object-cover" /> : <Disc3 className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{album.title}</p><p className="truncate text-xs text-muted-foreground">{album.artist}</p></div>
            </Link>
          ))}
        </SearchGroup>
      )}
      {results.users.length > 0 && (
        <SearchGroup icon={UserRound} title="Pessoas">
          {results.users.slice(0, 4).map((user) => (
            <Link key={user.id} href={`/profile/${user.username}`} onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f4f0e8] dark:hover:bg-muted">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-wine-100 font-bold text-wine-700">
                {user.profile_picture ? <Image src={user.profile_picture} alt="" fill className="object-cover" /> : user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{user.username}</p>{user.bio && <p className="truncate text-xs text-muted-foreground">{user.bio}</p>}</div>
            </Link>
          ))}
        </SearchGroup>
      )}
      {results.reviews.length > 0 && (
        <SearchGroup icon={MessageSquareText} title="Reviews">
          {results.reviews.slice(0, 3).map((review) => (
            <Link key={review.uuid} href={`/reviews/${review.uuid}`} onClick={onNavigate} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f4f0e8] dark:hover:bg-muted">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {review.album_cover_image ? <Image src={review.album_cover_image} alt="" fill className="object-cover" /> : <MessageSquareText className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{review.album_title} <span className="font-normal text-muted-foreground">por @{review.username}</span></p><p className="line-clamp-1 text-xs text-muted-foreground">{review.text || `${review.album_artist} recebeu uma nova nota.`}</p></div>
            </Link>
          ))}
        </SearchGroup>
      )}
    </div>
  );
}

function SearchGroup({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <section className="not-last:border-b not-last:border-[#ebe5dd] not-last:pb-2 not-first:pt-2 dark:not-last:border-border"><h2 className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.13em] text-wine-700 dark:text-wine-300"><Icon className="h-3.5 w-3.5" />{title}</h2>{children}</section>;
}

export function GlobalSearch({ mobile = false }: { mobile?: boolean }) {
  const { query, setQuery, results, isLoading } = useGlobalSearch();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openSearch = () => {
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
      if (mobile !== isMobileViewport) return;
      setOpen(true);
      if (!mobile) window.setTimeout(() => inputRef.current?.focus(), 0);
    };
    window.addEventListener('soundscore:open-search', openSearch);
    return () => window.removeEventListener('soundscore:open-search', openSearch);
  }, [mobile]);

  useEffect(() => {
    if (mobile) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [mobile]);

  if (mobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><button aria-label="Buscar" className="flex h-11 w-11 items-center justify-center rounded-full"><Search className="h-5 w-5" /></button></DialogTrigger>
        <DialogContent showCloseButton={false} className="top-0 bottom-auto max-h-[85dvh] translate-y-0 gap-0 rounded-b-3xl rounded-t-none border-x-0 border-t-0 bg-[#f4f0e8] p-3 sm:top-[50%] sm:translate-y-[-50%]">
          <DialogTitle className="sr-only">Buscar no SoundScore</DialogTitle>
          <div className="flex items-center gap-2 rounded-full border border-[#dcd4ca] bg-white px-4">
            <Search className="h-4 w-4 shrink-0 text-wine-700" />
            <input ref={inputRef} autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Álbuns, artistas ou pessoas" className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
            {query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <SearchResults query={query} results={results} isLoading={isLoading} onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1 max-w-md">
      <div className="flex items-center gap-2 rounded-full border border-[#ded7ce] bg-[#f4f0e8]/75 px-4 transition-all focus-within:border-wine-700/35 focus-within:bg-white focus-within:shadow-[0_8px_30px_rgba(50,38,30,0.09)] dark:border-border dark:bg-muted/70">
        <Search className="h-4 w-4 shrink-0 text-wine-700 dark:text-wine-300" />
        <input ref={inputRef} value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Buscar álbuns, artistas ou pessoas" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
      </div>
      {open && <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] overflow-hidden rounded-[1.35rem] border border-[#dcd4ca] bg-white shadow-[0_24px_70px_rgba(42,31,24,0.18)] dark:border-border dark:bg-card"><SearchResults query={query} results={results} isLoading={isLoading} onNavigate={() => setOpen(false)} /></div>}
    </div>
  );
}
