'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Disc3, ImagePlus, Loader2, PenLine, Search, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlbumSearch } from '@/components/reviews/album-search';
import { api } from '@/lib/api';
import { sessionsApi } from '@/lib/sessions-api';
import type { SpotifyAlbumResult, AlbumDetail } from '@/types';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreationMode = 'spotify' | 'manual';

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>('spotify');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTracks, setIsFetchingTracks] = useState(false);

  // Spotify mode state
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbumResult | null>(null);
  const [fetchedTracks, setFetchedTracks] = useState<string[]>([]);

  // Manual mode state
  const [manualArtist, setManualArtist] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  // manualCover guarda a chave S3 retornada pelo upload; coverPreview, a URL
  // assinada para mostrar a thumb no modal
  const [manualCover, setManualCover] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [manualTracksText, setManualTracksText] = useState('');

  const resetState = useCallback(() => {
    setMode('spotify');
    setSelectedAlbum(null);
    setFetchedTracks([]);
    setManualArtist('');
    setManualTitle('');
    setManualCover('');
    setCoverPreview(null);
    setManualTracksText('');
  }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem pode ter no máximo 5 MB.');
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.postForm<{ image_path: string; image_url: string }>(
        '/sessions/upload-cover',
        formData
      );
      setManualCover(res.image_path);
      setCoverPreview(res.image_url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a capa.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAlbumSelect = useCallback(async (album: SpotifyAlbumResult) => {
    setSelectedAlbum(album);
    setFetchedTracks([]);

    if (!album?.spotify_id) return;

    setIsFetchingTracks(true);
    try {
      const detail = await api.get<AlbumDetail>(`/reviews/album/${album.spotify_id}/details`);
      setFetchedTracks(detail.tracks.map((t) => t.name));
    } catch {
      toast.error('Não foi possível carregar as faixas. Tente o modo manual.');
    } finally {
      setIsFetchingTracks(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (mode === 'spotify') {
      if (!selectedAlbum) {
        toast.error('Selecione um álbum primeiro.');
        return;
      }
      if (fetchedTracks.length === 0) {
        toast.error('Não foi possível carregar as faixas. Tente o modo manual.');
        return;
      }

      setIsSubmitting(true);
      try {
        const session = await sessionsApi.create({
          album_title: selectedAlbum.title,
          album_artist: selectedAlbum.artist,
          album_cover_image: selectedAlbum.cover_image,
          album_spotify_id: selectedAlbum.spotify_id,
          tracks: fetchedTracks,
        });
        onOpenChange(false);
        resetState();
        router.push(`/session/${session.code}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível criar a sessão.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const trimmedArtist = manualArtist.trim();
      const trimmedTitle = manualTitle.trim();
      const tracks = manualTracksText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);

      if (!trimmedArtist || !trimmedTitle) {
        toast.error('Informe o artista e o título do álbum.');
        return;
      }
      if (tracks.length === 0) {
        toast.error('Informe pelo menos uma faixa.');
        return;
      }

      setIsSubmitting(true);
      try {
        const session = await sessionsApi.create({
          album_title: trimmedTitle,
          album_artist: trimmedArtist,
          album_cover_image: manualCover.trim() || null,
          album_spotify_id: null,
          tracks,
        });
        onOpenChange(false);
        resetState();
        router.push(`/session/${session.code}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível criar a sessão.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const canSubmit = mode === 'spotify'
    ? selectedAlbum !== null && fetchedTracks.length > 0 && !isFetchingTracks
    : manualArtist.trim().length > 0 && manualTitle.trim().length > 0 && manualTracksText.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) resetState(); onOpenChange(value); }}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl gap-0 overflow-y-auto rounded-[1.75rem] border-[#dcd4ca] bg-[#fdfcf9] p-0 dark:border-border dark:bg-card sm:max-h-[92dvh] sm:w-full">
        <DialogHeader className="border-b border-[#e8e0d7] px-5 pb-5 pt-6 text-left dark:border-border sm:px-7">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-wine-700"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" />Um álbum, várias opiniões</p>
          <DialogTitle className="text-2xl font-black tracking-[-0.04em]">Criar Listening Party</DialogTitle>
          <DialogDescription className="leading-relaxed">Escolha o disco que todo mundo vai ouvir e avaliar junto.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[#eee8df] p-1 dark:bg-muted">
            <button type="button" onClick={() => setMode('spotify')} className={`flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition-all ${mode === 'spotify' ? 'bg-white text-wine-700 shadow-sm dark:bg-card' : 'text-muted-foreground hover:text-foreground'}`}><Search className="h-4 w-4" />Buscar álbum</button>
            <button type="button" onClick={() => setMode('manual')} className={`flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white text-wine-700 shadow-sm dark:bg-card' : 'text-muted-foreground hover:text-foreground'}`}><PenLine className="h-4 w-4" />Adicionar manualmente</button>
          </div>

          {mode === 'spotify' && (
            <div className="space-y-4">
              <AlbumSearch onSelect={handleAlbumSelect} selectedAlbum={selectedAlbum} />
              {isFetchingTracks && <div className="flex items-center gap-2 rounded-xl bg-[#f7f3ed] p-3 text-sm text-muted-foreground dark:bg-muted/30"><Loader2 className="h-4 w-4 animate-spin text-wine-700" />Carregando as faixas…</div>}
              {fetchedTracks.length > 0 && <div className="max-h-48 overflow-y-auto rounded-xl border border-[#e3dbd1] bg-[#f8f5f0] p-3 dark:border-border dark:bg-muted/25"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-wine-700">{fetchedTracks.length} faixas encontradas</p><ol className="space-y-1.5">{fetchedTracks.map((track, index) => <li key={track} className="flex gap-2 text-sm"><span className="w-5 shrink-0 text-right text-xs text-muted-foreground">{index + 1}</span><span>{track}</span></li>)}</ol></div>}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="manual-artist" className="font-bold">Artista</Label><Input id="manual-artist" placeholder="Nome do artista" value={manualArtist} onChange={(event) => setManualArtist(event.target.value)} className="h-11 rounded-xl border-[#ded6cc] bg-white shadow-none dark:border-border dark:bg-muted/30" /></div>
              <div className="space-y-1.5"><Label htmlFor="manual-title" className="font-bold">Título do álbum</Label><Input id="manual-title" placeholder="Nome do álbum" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} className="h-11 rounded-xl border-[#ded6cc] bg-white shadow-none dark:border-border dark:bg-muted/30" /></div>
              <div className="space-y-1.5"><Label className="font-bold">Capa <span className="font-normal text-muted-foreground">(opcional)</span></Label>{coverPreview ? <div className="flex items-center gap-3 rounded-xl border border-[#e3dbd1] bg-white p-3 dark:border-border dark:bg-muted/30"><Image src={coverPreview} alt="Prévia da capa" width={64} height={64} unoptimized className="h-16 w-16 rounded-lg object-cover" /><Button type="button" variant="outline" size="sm" onClick={() => { setManualCover(''); setCoverPreview(null); }} className="rounded-full"><X className="mr-1 h-4 w-4" />Remover</Button></div> : <label className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfc4b8] bg-white text-sm font-semibold text-muted-foreground transition-colors hover:border-wine-700/45 hover:text-wine-700 dark:border-border dark:bg-muted/25 ${isUploadingCover ? 'pointer-events-none opacity-60' : ''}`}>{isUploadingCover ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</> : <><ImagePlus className="h-4 w-4" />Escolher uma capa</>}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} /></label>}</div>
              <div className="space-y-1.5"><Label htmlFor="manual-tracks" className="font-bold">Faixas <span className="font-normal text-muted-foreground">(uma por linha)</span></Label><Textarea id="manual-tracks" placeholder={'Faixa 1\nFaixa 2\nFaixa 3'} value={manualTracksText} onChange={(event) => setManualTracksText(event.target.value)} className="min-h-32 resize-none rounded-xl border-[#ded6cc] bg-white p-3 shadow-none dark:border-border dark:bg-muted/30" />{manualTracksText.trim() && <p className="text-right text-xs text-muted-foreground">{manualTracksText.split('\n').filter((track) => track.trim()).length} faixas</p>}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-[#e8e0d7] bg-white px-5 py-4 dark:border-border dark:bg-card sm:gap-3 sm:px-7">
          <Button variant="outline" className="h-11 rounded-full border-[#d5ccc1] font-bold dark:border-border" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button className="h-11 rounded-full bg-wine-700 font-bold text-white hover:bg-wine-800" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Criando…</> : <><Disc3 className="h-4 w-4" />Criar sessão</>}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
