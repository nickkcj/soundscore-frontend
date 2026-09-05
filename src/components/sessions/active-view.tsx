'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock, EyeOff, Flag, Lock, MessageCircle, Music, Radio, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RatingSelector } from './rating-selector';
import { sessionsApi } from '@/lib/sessions-api';
import { ApiException } from '@/lib/api';
import type { SessionPresencePayload, SessionState } from '@/types/sessions';

interface ActiveViewProps {
  session: SessionState;
  onlineUsers: SessionPresencePayload[];
  onMutationSuccess: () => Promise<void>;
}

export function ActiveView({ session, onlineUsers, onMutationSuccess }: ActiveViewProps) {
  const currentTrack = session.tracks[session.current_track_index];
  const [rating, setRating] = useState<number | null>(currentTrack?.my_rating ?? null);
  const [comment, setComment] = useState(currentTrack?.my_comment ?? '');
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [revealedExpanded, setRevealedExpanded] = useState(false);

  useEffect(() => {
    setRating(currentTrack?.my_rating ?? null);
    setComment(currentTrack?.my_comment ?? '');
  }, [session.current_track_index, currentTrack?.my_rating, currentTrack?.my_comment]);

  const onlineIds = new Set(onlineUsers.map((user) => user.user_id));
  const totalParticipants = session.participants.length;
  const votesCount = currentTrack?.votes_count ?? 0;
  const hasVoted = currentTrack?.my_rating !== null;
  const isRevealed = currentTrack?.revealed ?? false;
  const isLastTrack = session.current_track_index === session.tracks.length - 1;
  const progress = ((session.current_track_index + (isRevealed ? 1 : 0)) / session.tracks.length) * 100;
  const voteProgress = totalParticipants > 0 ? (votesCount / totalParticipants) * 100 : 0;
  const revealedTracks = session.tracks.filter((track) => track.revealed && track.index < session.current_track_index);

  const handleLockIn = async () => {
    if (rating === null) {
      toast.error('Escolha uma nota primeiro.');
      return;
    }
    setIsLockingIn(true);
    try {
      await sessionsApi.submitRating(session.code, { track_index: session.current_track_index, rating, comment: comment.trim() || undefined });
      await onMutationSuccess();
    } catch (error) {
      if (error instanceof ApiException && error.status === 409) toast.error('A votação desta faixa já foi encerrada.');
      else toast.error(error instanceof Error ? error.message : 'Não foi possível enviar sua nota.');
    } finally {
      setIsLockingIn(false);
    }
  };

  const handleAdvance = async () => {
    setIsAdvancing(true);
    try {
      await sessionsApi.advance(session.code);
      await onMutationSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível avançar a sessão.');
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/sessions" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-foreground/65 transition-colors hover:bg-white/70 hover:text-wine-700 dark:hover:bg-muted"><ArrowLeft className="h-4 w-4" />Sair da sessão</Link>
      </div>

      <header className="overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white shadow-[0_14px_40px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card">
        <div className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#eee8df] sm:h-16 sm:w-16">{session.album_cover_image ? <Image src={session.album_cover_image} alt={session.album_title} fill className="object-cover" /> : <div className="flex h-full items-center justify-center"><Music className="h-6 w-6 text-wine-700/35" /></div>}</div>
          <div className="min-w-0 flex-1"><p className="truncate font-black sm:text-lg">{session.album_title}</p><p className="truncate text-xs text-muted-foreground sm:text-sm">{session.album_artist}</p></div>
          <div className="shrink-0 text-right"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Faixa</p><p className="mt-0.5 text-lg font-black text-wine-700">{session.current_track_index + 1}<span className="text-sm text-muted-foreground">/{session.tracks.length}</span></p></div>
        </div>
        <div className="h-1.5 bg-[#eee8df] dark:bg-muted"><div className="h-full rounded-r-full bg-gradient-to-r from-wine-700 to-[#d98524] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="overflow-hidden rounded-[1.75rem] border border-[#dcd4ca] bg-white shadow-[0_18px_50px_rgba(50,38,30,0.07)] dark:border-border dark:bg-card">
          <div className="border-b border-[#e8e0d7] bg-[#f8f5f0] px-5 py-5 text-center dark:border-border dark:bg-muted/25 sm:px-7 sm:py-6">
            <p className="mb-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700"><Radio className="h-3.5 w-3.5 text-[#d98524]" />{isRevealed ? 'Notas reveladas' : 'Avaliando agora'}</p>
            <h1 className="break-words text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">{currentTrack?.name}</h1>
          </div>

          {!isRevealed ? (
            <div className="space-y-6 p-5 sm:p-7">
              <div>
                <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-black">Qual é a sua nota?</p><p className="mt-1 text-xs text-muted-foreground">De 0 a 10, confie na primeira impressão.</p></div>{rating !== null && <span className="text-3xl font-black leading-none text-wine-700">{rating}</span>}</div>
                <RatingSelector value={rating} onChange={setRating} disabled={isLockingIn} />
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-muted-foreground"><span>Péssima</span><span>Perfeita</span></div>
              </div>

              <div className="space-y-2"><label htmlFor="track-comment" className="flex items-center gap-2 text-sm font-black"><MessageCircle className="h-4 w-4 text-wine-700" />Uma impressão sobre a faixa <span className="font-normal text-muted-foreground">(opcional)</span></label><Textarea id="track-comment" placeholder="O que chamou sua atenção?" value={comment} onChange={(event) => setComment(event.target.value)} disabled={isLockingIn} className="min-h-24 resize-none rounded-xl border-[#ded6cc] bg-[#faf8f4] p-4 shadow-none focus-visible:border-wine-700/45 focus-visible:ring-wine-700/15 dark:border-border dark:bg-muted/30" /></div>

              <Button onClick={handleLockIn} disabled={rating === null || isLockingIn} className="h-12 w-full rounded-full bg-wine-700 text-base font-black text-white hover:bg-wine-800">{isLockingIn ? 'Confirmando…' : hasVoted ? <><CheckCircle2 className="mr-2 h-5 w-5" />Atualizar minha nota</> : <><Lock className="mr-2 h-4 w-4" />Confirmar em segredo</>}</Button>
              <div className="flex items-start gap-2.5 rounded-xl bg-wine-700/[0.055] p-3.5 text-xs leading-relaxed text-muted-foreground"><EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-wine-700" /><p>Sua nota fica escondida até o encerramento desta rodada. Ninguém influencia ninguém.</p></div>
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:p-7">
              <div className="rounded-[1.4rem] bg-wine-800 px-5 py-6 text-center text-white"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f4bd74]">Média da faixa</p><p className="mt-1 text-6xl font-black tracking-[-0.05em]">{currentTrack?.avg_rating?.toFixed(1) ?? '—'}</p><p className="mt-2 text-xs text-white/60">A opinião da sala, finalmente revelada.</p></div>
              <div><p className="mb-3 text-sm font-black">O que cada pessoa achou</p><div className="space-y-2">{currentTrack?.ratings.map((result) => <div key={result.user_id} className="flex items-start gap-3 rounded-xl border border-[#e8e0d7] bg-[#faf8f4] p-3.5 dark:border-border dark:bg-muted/25"><Avatar className="mt-0.5 h-9 w-9 shrink-0"><AvatarImage src={session.participants.find((participant) => participant.user_id === result.user_id)?.profile_picture || undefined} /><AvatarFallback className="bg-wine-700/10 text-xs font-black text-wine-700">{result.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-black">{result.username}</span><strong className={cn('text-xl font-black', result.rating >= 8 ? 'text-emerald-600' : result.rating >= 5 ? 'text-wine-700' : 'text-muted-foreground')}>{result.rating}</strong></div>{result.comment && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.comment}</p>}</div></div>)}</div></div>
              {session.is_host ? <Button onClick={handleAdvance} disabled={isAdvancing} className="h-12 w-full rounded-full bg-wine-700 text-base font-black text-white hover:bg-wine-800">{isAdvancing ? 'Carregando…' : isLastTrack ? <><Flag className="mr-2 h-4 w-4" />Finalizar e ver o resultado</> : <>Próxima faixa <ArrowRight className="ml-2 h-4 w-4" /></>}</Button> : <p className="flex items-center justify-center gap-2 py-2 text-center text-sm text-muted-foreground"><Clock className="h-4 w-4" />Aguardando o anfitrião avançar…</p>}
            </div>
          )}
        </main>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white shadow-[0_12px_35px_rgba(50,38,30,0.055)] dark:border-border dark:bg-card">
            <div className="border-b border-[#e8e0d7] p-4 dark:border-border"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-wine-700">Rodada atual</p><h2 className="mt-1 font-black">Notas recebidas</h2></div><strong className="text-xl font-black text-wine-700">{votesCount}/{totalParticipants}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee8df] dark:bg-muted"><div className="h-full rounded-full bg-[#d98524] transition-all" style={{ width: `${voteProgress}%` }} /></div></div>
            <div className="p-4"><p className="flex items-center gap-1.5 text-xs leading-relaxed text-muted-foreground"><EyeOff className="h-3.5 w-3.5 shrink-0 text-wine-700" />O progresso é anônimo até a revelação.</p>{hasVoted && !isRevealed && <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Sua nota foi registrada</p>}</div>
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white shadow-[0_12px_35px_rgba(50,38,30,0.055)] dark:border-border dark:bg-card"><header className="flex items-center justify-between border-b border-[#e8e0d7] p-4 dark:border-border"><h2 className="flex items-center gap-2 font-black"><Users className="h-4 w-4 text-wine-700" />Na sala</h2><span className="text-xs font-bold text-muted-foreground">{onlineUsers.length} online</span></header><div className="divide-y divide-[#eee8e0] px-3 dark:divide-border">{session.participants.map((participant) => { const isOnline = onlineIds.has(participant.user_id); return <div key={participant.user_id} className="flex min-h-14 items-center gap-2.5 px-1 py-2"><div className="relative"><Avatar className="h-8 w-8"><AvatarImage src={participant.profile_picture || undefined} /><AvatarFallback className="bg-wine-700/10 text-xs font-black text-wine-700">{participant.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>{isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-card" />}</div><span className="min-w-0 flex-1 truncate text-xs font-bold">{participant.username}</span>{participant.is_host && <span className="text-[9px] font-black uppercase tracking-wide text-[#b66d16]">host</span>}</div>; })}</div></section>
        </aside>
      </div>

      {revealedTracks.length > 0 && <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white dark:border-border dark:bg-card"><button type="button" onClick={() => setRevealedExpanded((value) => !value)} className="flex min-h-12 w-full items-center justify-between px-5 py-3 text-sm font-black transition-colors hover:bg-[#faf8f4] dark:hover:bg-muted/30"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#d98524]" />Faixas já reveladas ({revealedTracks.length})</span>{revealedExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</button>{revealedExpanded && <div className="divide-y divide-[#eee8e0] border-t border-[#e8e0d7] dark:divide-border dark:border-border">{revealedTracks.map((track) => <div key={track.index} className="flex items-center gap-3 px-5 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3eee7] text-[11px] font-black text-muted-foreground dark:bg-muted">{track.index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{track.name}</span><strong className="text-lg font-black text-wine-700">{track.avg_rating?.toFixed(1) ?? '—'}</strong></div>)}</div>}</section>}
    </div>
  );
}
