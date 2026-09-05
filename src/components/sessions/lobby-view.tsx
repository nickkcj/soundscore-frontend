'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Copy, Crown, Headphones, Link2, Music, Radio, Sparkles, Users, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SessionPresencePayload, SessionState } from '@/types/sessions';

interface LobbyViewProps {
  session: SessionState;
  onlineUsers: SessionPresencePayload[];
  onStart: () => void;
  onCopyLink: () => void;
  isStarting: boolean;
}

export function LobbyView({ session, onlineUsers, onStart, onCopyLink, isStarting }: LobbyViewProps) {
  const onlineIds = new Set(onlineUsers.map((user) => user.user_id));

  return (
    <div>
      <Link href="/sessions" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-foreground/65 transition-colors hover:bg-white/70 hover:text-wine-700 dark:hover:bg-muted"><ArrowLeft className="h-4 w-4" />Todas as sessões</Link>

      <section className="relative overflow-hidden rounded-[2rem] bg-wine-800 text-white shadow-[0_22px_60px_rgba(80,28,36,0.18)]">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#e6a04a]/20 blur-3xl" />
        <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_17rem] md:items-center md:gap-8 lg:p-9">
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-[1.4rem] bg-white/10 shadow-2xl ring-1 ring-white/15 sm:h-48 sm:w-48 md:mx-0">
            {session.album_cover_image ? <Image src={session.album_cover_image} alt={session.album_title} fill priority className="object-cover" /> : <div className="flex h-full items-center justify-center"><Music className="h-14 w-14 text-white/35" /></div>}
          </div>

          <div className="min-w-0 text-center md:text-left">
            <p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f4bd74] md:justify-start"><Radio className="h-3.5 w-3.5" />Sala de espera</p>
            <h1 className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">{session.album_title}</h1>
            <p className="mt-2 truncate text-base text-white/68 sm:text-lg">{session.album_artist}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-white/62 md:justify-start"><span className="flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-[#f4bd74]" />{session.tracks.length} {session.tracks.length === 1 ? 'faixa' : 'faixas'}</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#f4bd74]" />{session.participants.length} {session.participants.length === 1 ? 'participante' : 'participantes'}</span></div>
          </div>

          <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 text-center backdrop-blur-md sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Código da sessão</p>
            <button type="button" onClick={onCopyLink} className="group mt-2 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 font-mono text-2xl font-black tracking-[0.2em] transition-colors hover:bg-white/15" aria-label={`Copiar convite da sessão ${session.code}`}><span>{session.code}</span><Copy className="h-4 w-4 text-[#f4bd74] transition-transform group-hover:scale-110" /></button>
            <Button variant="ghost" onClick={onCopyLink} className="mt-2 h-9 rounded-full px-3 text-xs font-bold text-white/75 hover:bg-white/10 hover:text-white"><Link2 className="mr-1.5 h-3.5 w-3.5" />Copiar link de convite</Button>
            {session.is_host ? <Button onClick={onStart} disabled={isStarting || session.participants.length < 1} className="mt-3 h-12 w-full rounded-full bg-[#e6a04a] font-black text-[#2b1917] shadow-lg hover:bg-[#f0af5d] disabled:opacity-65">{isStarting ? 'Iniciando…' : <>Começar sessão <ArrowRight className="ml-2 h-4 w-4" /></>}</Button> : <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-white/65"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f4bd74]" />Aguardando quem criou a sala</p>}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card">
          <header className="border-b border-[#e8e0d7] px-5 py-5 dark:border-border"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">Quem vai ouvir</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Na sala</h2></div><span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-wine-700/10 px-2 text-sm font-black text-wine-700">{session.participants.length}</span></div>{onlineUsers.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Wifi className="h-3.5 w-3.5 text-emerald-500" />{onlineUsers.length} {onlineUsers.length === 1 ? 'pessoa online agora' : 'pessoas online agora'}</p>}</header>
          <div className="divide-y divide-[#eee8e0] px-3 dark:divide-border">
            {session.participants.map((participant) => {
              const isOnline = onlineIds.has(participant.user_id);
              return <div key={participant.user_id} className="flex min-h-[4.5rem] items-center gap-3 px-2 py-3"><div className="relative"><Avatar className="h-11 w-11"><AvatarImage src={participant.profile_picture || undefined} alt={participant.username} /><AvatarFallback className="bg-wine-700/10 font-black text-wine-700">{participant.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>{isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-card" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{participant.username}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{participant.is_host ? 'Criou esta sessão' : isOnline ? 'Online agora' : 'Entrou na sessão'}</p></div>{participant.is_host && <span title="Anfitrião" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6a04a]/15 text-[#b66d16]"><Crown className="h-4 w-4" /></span>}</div>;
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card">
          <header className="flex items-start justify-between gap-4 border-b border-[#e8e0d7] px-5 py-5 dark:border-border"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">O que vem pela frente</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Faixas do álbum</h2></div><Headphones className="h-5 w-5 text-[#d98524]" /></header>
          <ol className="max-h-[28rem] overflow-y-auto px-3 sm:px-4">
            {session.tracks.map((track) => <li key={track.index} className="flex min-h-[3.6rem] items-center gap-3 border-b border-[#eee8e0] px-2 py-2.5 last:border-0 dark:border-border"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3eee7] text-[11px] font-black text-muted-foreground dark:bg-muted">{track.index + 1}</span><span className="min-w-0 flex-1 break-words text-sm font-semibold">{track.name}</span><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-wine-700/25" /></li>)}
          </ol>
        </section>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-[#e3dbd1] bg-white/65 p-4 text-sm leading-relaxed text-muted-foreground dark:border-border dark:bg-card/65"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6a04a]/15 text-[#b66d16]"><Sparkles className="h-4 w-4" /></span><p><strong className="text-foreground">Tudo pronto?</strong> Quando a sessão começar, as notas de cada faixa ficam escondidas até todo mundo confirmar.</p></div>
    </div>
  );
}
