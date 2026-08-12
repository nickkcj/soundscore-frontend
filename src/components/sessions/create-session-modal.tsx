'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Music, Search, PenLine, ImagePlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
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
      toast.error(err instanceof Error ? err.message : 'Failed to upload cover');
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
      toast.error('Could not fetch tracklist. You can still create the session.');
    } finally {
      setIsFetchingTracks(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (mode === 'spotify') {
      if (!selectedAlbum) {
        toast.error('Please select an album first.');
        return;
      }
      if (fetchedTracks.length === 0) {
        toast.error('Could not load tracks for this album. Try manual mode.');
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
        toast.error(err instanceof Error ? err.message : 'Failed to create session');
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
        toast.error('Please enter artist name and album title.');
        return;
      }
      if (tracks.length === 0) {
        toast.error('Please enter at least one track.');
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
        toast.error(err instanceof Error ? err.message : 'Failed to create session');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const canSubmit = mode === 'spotify'
    ? selectedAlbum !== null && fetchedTracks.length > 0 && !isFetchingTracks
    : manualArtist.trim().length > 0 && manualTitle.trim().length > 0 && manualTracksText.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[90vh] sm:w-full sm:p-6">
        <DialogHeader>
          <DialogTitle>Create Listening Party</DialogTitle>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setMode('spotify')}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-all sm:px-3 ${
              mode === 'spotify'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4" />
            Search Spotify
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-all sm:px-3 ${
              mode === 'manual'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PenLine className="h-4 w-4" />
            Manual Entry
          </button>
        </div>

        {/* Spotify Mode */}
        {mode === 'spotify' && (
          <div className="space-y-4">
            <AlbumSearch
              onSelect={handleAlbumSelect}
              selectedAlbum={selectedAlbum}
            />

            {isFetchingTracks && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tracklist...
              </div>
            )}

            {fetchedTracks.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Tracklist ({fetchedTracks.length} tracks)
                </p>
                <ol className="space-y-1">
                  {fetchedTracks.map((track, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                      <span>{track}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="manual-artist">Artist</Label>
                <Input
                  id="manual-artist"
                  placeholder="Artist name"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-title">Album Title</Label>
                <Input
                  id="manual-title"
                  placeholder="Album title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cover Image (optional)</Label>
              {coverPreview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualCover('');
                      setCoverPreview(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <label
                  className={`flex items-center justify-center gap-2 h-16 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground cursor-pointer transition-colors hover:border-wine-400 hover:text-wine-600 ${
                    isUploadingCover ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Upload cover image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manual-tracks">
                Tracklist
                <span className="text-muted-foreground font-normal ml-1">(one track per line)</span>
              </Label>
              <Textarea
                id="manual-tracks"
                placeholder={`Track 1\nTrack 2\nTrack 3`}
                value={manualTracksText}
                onChange={(e) => setManualTracksText(e.target.value)}
                className="min-h-32 resize-none"
              />
              {manualTracksText.trim() && (
                <p className="text-xs text-muted-foreground">
                  {manualTracksText.split('\n').filter((t) => t.trim()).length} tracks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="grid grid-cols-2 gap-2 pt-2 sm:gap-3">
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="h-11 w-full bg-wine-600 text-white hover:bg-wine-700"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Music className="h-4 w-4" />
                Create Party
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
