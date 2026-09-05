'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Headphones, Music, Plus, Radio, Sparkles, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateSessionModal } from '@/components/sessions/create-session-modal';
import { SessionStatusBadge } from '@/components/sessions/session-status-badge';
import { sessionsApi } from '@/lib/sessions-api';
import { cn } from '@/lib/utils';
import type { SessionListItem } from '@/types/sessions';

const statusOrder: Record<SessionListItem['status'], number> = { active: 0, lobby: 1, finished: 2 };

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    sessionsApi.getMine().then(setSessions).catch(() => setSessions([])).finally(() => setIsLoading(false));
  }, []);

  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [sessions]);
  const activeCount = sessions.filter((session) => session.status !== 'finished').length;

  const handleJoin = (event: React.FormEvent) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) router.push(`/session/${code}`);
  };

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-8 md:pb-24 md:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-wine-800 text-white shadow-[0_24px_65px_rgba(80,28,36,0.2)]">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#e19a43]/20 blur-2xl" />
          <div className="absolute -bottom-32 left-[38%] h-64 w-64 rounded-full bg-white/8 blur-3xl" />
          <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[1.25fr_0.75fr] md:items-center md:p-10 lg:p-12">
            <div>
              <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f4bd74] sm:text-[11px]"><Radio className="h-3.5 w-3.5" />Listening Party</p>
              <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-[3.6rem]">Ouça junto.<br />Avalie sem influência.</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">Escolham um álbum, deem notas faixa a faixa em segredo e revelem as opiniões de todo mundo ao mesmo tempo.</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/72"><span className="flex items-center gap-1.5"><Headphones className="h-4 w-4 text-[#f4bd74]" />Escuta em grupo</span><span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-[#f4bd74]" />Notas às cegas</span><span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#f4bd74]" />Resultado coletivo</span></div>
            </div>

            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
              <Button onClick={() => setCreateOpen(true)} className="h-12 w-full rounded-full bg-[#e6a04a] font-black text-[#2b1917] shadow-lg hover:bg-[#f0af5d]"><Plus className="mr-2 h-4 w-4" />Criar uma sessão</Button>
              <div className="my-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/45"><span className="h-px flex-1 bg-white/15" />ou entre com um código<span className="h-px flex-1 bg-white/15" /></div>
              <form onSubmit={handleJoin} className="flex gap-2">
                <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} placeholder="EX.: XK4P2" maxLength={8} aria-label="Código da sessão" className="h-12 min-w-0 rounded-full border-white/15 bg-white/95 px-5 font-mono font-bold uppercase tracking-[0.16em] text-[#281b1a] shadow-none placeholder:text-[#8a817d] focus-visible:ring-[#f4bd74]/45" />
                <Button type="submit" disabled={joinCode.trim().length < 4} size="icon" aria-label="Entrar na sessão" className="h-12 w-12 shrink-0 rounded-full bg-white text-wine-800 hover:bg-white/90"><ArrowRight className="h-5 w-5" /></Button>
              </form>
              <p className="mt-3 text-center text-[11px] text-white/55">Peça o código para quem criou a sessão.</p>
            </div>
          </div>
        </section>

        <section className="mt-9 md:mt-12">
          <header className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-wine-700">Sua discografia compartilhada</p><h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Suas sessões</h2></div>
            {!isLoading && sessions.length > 0 && <p className="hidden text-sm text-muted-foreground sm:block">{activeCount > 0 ? `${activeCount} ${activeCount === 1 ? 'sessão em andamento' : 'sessões em andamento'}` : `${sessions.length} ${sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}`}</p>}
          </header>

          {isLoading ? <SessionsSkeleton /> : orderedSessions.length === 0 ? (
            <div className="rounded-[1.75rem] border border-[#dcd4ca] bg-white px-6 py-14 text-center shadow-[0_18px_55px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card sm:py-16"><span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-700/10 text-wine-700"><Headphones className="h-7 w-7" /></span><h3 className="text-lg font-black">Seu primeiro play coletivo começa aqui</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Crie uma sessão, envie o código e descubra quem realmente ouviu o mesmo álbum que você.</p><Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-5 h-11 rounded-full border-[#d5ccc1] px-5 font-bold dark:border-border"><Plus className="mr-2 h-4 w-4" />Criar primeira sessão</Button></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orderedSessions.map((session) => <SessionCard key={session.code} session={session} />)}
            </div>
          )}
        </section>
      </main>
      <CreateSessionModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function SessionCard({ session }: { session: SessionListItem }) {
  const finished = session.status === 'finished';
  return (
    <Link href={`/session/${session.code}`} className={cn('group flex min-w-0 gap-4 overflow-hidden rounded-[1.5rem] border bg-white p-3.5 shadow-[0_12px_35px_rgba(50,38,30,0.055)] transition-all hover:-translate-y-0.5 hover:border-wine-700/25 hover:shadow-[0_16px_42px_rgba(50,38,30,0.09)] dark:border-border dark:bg-card sm:p-4', session.status === 'active' ? 'border-emerald-200/80' : 'border-[#dcd4ca]')}>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.05rem] bg-[#eee8df] shadow-sm sm:h-28 sm:w-28">
        {session.album_cover_image ? <Image src={session.album_cover_image} alt={session.album_title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-wine-700/15 to-[#e19a43]/20"><Music className="h-8 w-8 text-wine-700/35" /></div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2"><SessionStatusBadge status={session.status} /><span className="font-mono text-[10px] font-bold tracking-[0.12em] text-muted-foreground">{session.code}</span></div>
        <h3 className="mt-2 line-clamp-1 font-black tracking-[-0.015em] sm:text-lg">{session.album_title}</h3>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{session.album_artist}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Users className="h-3.5 w-3.5" />{session.participants_count} {session.participants_count === 1 ? 'pessoa' : 'pessoas'} · {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })}</span>
          {finished && session.album_avg != null ? <span className="shrink-0 text-right"><strong className="block text-xl font-black leading-none text-wine-700">{session.album_avg.toFixed(1)}</strong><small className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">média</small></span> : <ArrowRight className="h-4 w-4 shrink-0 text-wine-700 transition-transform group-hover:translate-x-0.5" />}
        </div>
      </div>
    </Link>
  );
}

function SessionsSkeleton() {
  return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex gap-4 rounded-[1.5rem] border border-[#dcd4ca] bg-white p-4 dark:border-border dark:bg-card"><Skeleton className="h-28 w-28 shrink-0 rounded-[1.05rem]" /><div className="flex-1 space-y-3 py-1"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-4 h-3 w-2/3" /></div></div>)}</div>;
}
