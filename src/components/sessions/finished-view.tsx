'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Check, ExternalLink, Medal, Music, Share2, Sparkles, Star, Trophy, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionState } from '@/types/sessions';

interface FinishedViewProps {
  session: SessionState;
}

export function FinishedView({ session }: FinishedViewProps) {
  const { summary } = session;
  const [copied, setCopied] = useState(false);
  const bestTrack = summary?.best_track_index !== null && summary?.best_track_index !== undefined ? session.tracks[summary.best_track_index] : null;
  const divisiveTrack = summary?.most_divisive_track_index !== null && summary?.most_divisive_track_index !== undefined ? session.tracks[summary.most_divisive_track_index] : null;
  const ranking = summary ? [...summary.avg_by_user].sort((a, b) => b.avg - a.avg) : [];

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link do resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  return (
    <div>
      <Link href="/sessions" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-foreground/65 transition-colors hover:bg-white/70 hover:text-wine-700 dark:hover:bg-muted"><ArrowLeft className="h-4 w-4" />Todas as sessões</Link>

      <section className="relative overflow-hidden rounded-[2rem] bg-wine-800 text-white shadow-[0_24px_65px_rgba(80,28,36,0.2)]">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#e6a04a]/20 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)_15rem] md:items-center md:gap-8 lg:p-10">
          <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-[1.35rem] bg-white/10 shadow-2xl ring-1 ring-white/15 sm:h-44 sm:w-44 md:mx-0">{session.album_cover_image ? <Image src={session.album_cover_image} alt={session.album_title} fill priority className="object-cover" /> : <div className="flex h-full items-center justify-center"><Music className="h-12 w-12 text-white/35" /></div>}</div>
          <div className="min-w-0 text-center md:text-left"><p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f4bd74] md:justify-start"><Sparkles className="h-3.5 w-3.5" />Sessão concluída</p><h1 className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">{session.album_title}</h1><p className="mt-2 truncate text-base text-white/68 sm:text-lg">{session.album_artist}</p><p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/60 md:justify-start"><Users className="h-3.5 w-3.5 text-[#f4bd74]" />{session.participants.length} pessoas · {session.tracks.length} faixas avaliadas</p></div>
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 text-center backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f4bd74]">Média do álbum</p><p className="mt-1 text-6xl font-black tracking-[-0.06em]">{summary?.album_avg?.toFixed(1) ?? '—'}</p><div className="mt-2 flex justify-center gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={cn('h-4 w-4', summary?.album_avg !== null && summary?.album_avg !== undefined && index < Math.round(summary.album_avg / 2) ? 'fill-[#f4bd74] text-[#f4bd74]' : 'text-white/25')} />)}</div><p className="mt-3 text-[11px] text-white/50">O veredito coletivo da sala</p></div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        {bestTrack && <HighlightCard icon={Trophy} eyebrow="A favorita da sala" title={bestTrack.name} score={bestTrack.avg_rating} tone="gold" />}
        {divisiveTrack && <HighlightCard icon={Zap} eyebrow="A mais divisiva" title={divisiveTrack.name} score={divisiveTrack.avg_rating} tone="orange" />}
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#dcd4ca] bg-white shadow-[0_16px_45px_rgba(50,38,30,0.065)] dark:border-border dark:bg-card">
          <header className="flex items-start justify-between gap-4 border-b border-[#e8e0d7] px-5 py-5 dark:border-border sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">Faixa por faixa</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Mapa de notas</h2><p className="mt-1 text-xs text-muted-foreground">Compare onde a turma concordou — e onde não concordou nem um pouco.</p></div><BarChart3 className="h-5 w-5 shrink-0 text-[#d98524]" /></header>
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[42rem] text-sm">
              <thead><tr className="border-b border-[#e8e0d7] bg-[#f8f5f0] dark:border-border dark:bg-muted/25"><th className="sticky left-0 z-10 min-w-[12rem] bg-[#f8f5f0] px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground dark:bg-muted">Faixa</th>{session.participants.map((participant) => <th key={participant.user_id} className="max-w-24 px-3 py-3 text-center text-[10px] font-black text-muted-foreground"><span className="block truncate">{participant.username}</span></th>)}<th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-wine-700">Média</th></tr></thead>
              <tbody className="divide-y divide-[#eee8e0] dark:divide-border">{session.tracks.map((track, index) => { const average = summary?.avg_by_track[index]; return <tr key={track.index} className="transition-colors hover:bg-[#faf8f4] dark:hover:bg-muted/20"><td className="sticky left-0 z-10 max-w-[15rem] bg-white px-4 py-3 dark:bg-card"><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1ece5] text-[10px] font-black text-muted-foreground dark:bg-muted">{index + 1}</span><span className="line-clamp-2 text-xs font-bold sm:text-sm">{track.name}</span></div></td>{session.participants.map((participant) => { const result = track.ratings?.find((rating) => rating.user_id === participant.user_id); return <td key={participant.user_id} className="px-3 py-3 text-center">{result ? <span title={result.comment || undefined} className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-black', scoreClass(result.rating))}>{result.rating}</span> : <span className="text-muted-foreground">—</span>}</td>; })}<td className="px-4 py-3 text-center"><strong className="text-base font-black text-wine-700">{average !== null && average !== undefined ? average.toFixed(1) : '—'}</strong></td></tr>; })}</tbody>
            </table>
          </div>
          <footer className="flex flex-wrap gap-4 border-t border-[#e8e0d7] bg-[#faf8f4] px-5 py-3 text-[10px] font-semibold text-muted-foreground dark:border-border dark:bg-muted/20"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-emerald-100 ring-1 ring-emerald-200" />8–10</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-[#f3e7d8] ring-1 ring-[#ead5ba]" />5–7</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-[#f1ece5] ring-1 ring-[#ded6cc]" />0–4</span></footer>
        </section>

        {ranking.length > 0 && <aside className="overflow-hidden rounded-[1.65rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card"><header className="border-b border-[#e8e0d7] px-5 py-5 dark:border-border"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">A régua de cada um</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Ranking da sala</h2><p className="mt-1 text-xs text-muted-foreground">Média das notas dadas</p></header><div className="divide-y divide-[#eee8e0] px-3 dark:divide-border">{ranking.map((person, index) => { const participant = session.participants.find((item) => item.user_id === person.user_id); return <div key={person.user_id} className="flex min-h-[4.75rem] items-center gap-3 px-2 py-3"><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black', index === 0 ? 'bg-[#e6a04a]/20 text-[#a96112]' : 'bg-[#f1ece5] text-muted-foreground dark:bg-muted')}>{index === 0 ? <Medal className="h-3.5 w-3.5" /> : index + 1}</span><Avatar className="h-9 w-9 shrink-0"><AvatarImage src={participant?.profile_picture || undefined} /><AvatarFallback className="bg-wine-700/10 text-xs font-black text-wine-700">{person.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{person.username}</p><p className="text-[10px] text-muted-foreground">{index === 0 ? 'Mais entusiasmado' : index === ranking.length - 1 && ranking.length > 1 ? 'Mais rigoroso' : 'Na média da turma'}</p></div><strong className="text-xl font-black text-wine-700">{person.avg.toFixed(1)}</strong></div>; })}</div></aside>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={handleShare} className="h-12 rounded-full border-[#d5ccc1] bg-white font-black dark:border-border dark:bg-card"><>{copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-2 h-4 w-4 text-wine-700" />}{copied ? 'Link copiado' : 'Compartilhar resultado'}</></Button>{session.album_spotify_id && <Button asChild className="h-12 rounded-full bg-wine-700 font-black text-white hover:bg-wine-800"><Link href={`/album/${session.album_spotify_id}`}>Ver página do álbum <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}</div>
      <p className="mt-5 text-center text-xs text-muted-foreground">Sessão <span className="font-mono font-bold tracking-wider">{session.code}</span> · O resultado continua disponível neste link.</p>
    </div>
  );
}

function HighlightCard({ icon: Icon, eyebrow, title, score, tone }: { icon: typeof Trophy; eyebrow: string; title: string; score: number | null; tone: 'gold' | 'orange' }) {
  return <article className="flex min-w-0 items-center gap-4 rounded-[1.5rem] border border-[#dcd4ca] bg-white p-4 shadow-[0_12px_35px_rgba(50,38,30,0.055)] dark:border-border dark:bg-card sm:p-5"><span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', tone === 'gold' ? 'bg-[#e6a04a]/18 text-[#b66d16]' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/30')}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">{eyebrow}</p><h3 className="mt-1 truncate font-black sm:text-lg">{title}</h3></div><strong className="shrink-0 text-3xl font-black tracking-[-0.04em] text-wine-700">{score?.toFixed(1) ?? '—'}</strong></article>;
}

function scoreClass(score: number) {
  if (score >= 8) return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-300 dark:ring-emerald-900';
  if (score >= 5) return 'bg-[#f3e7d8] text-[#9a5b17] ring-1 ring-[#ead5ba] dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900';
  return 'bg-[#f1ece5] text-muted-foreground ring-1 ring-[#ded6cc] dark:bg-muted dark:ring-border';
}
