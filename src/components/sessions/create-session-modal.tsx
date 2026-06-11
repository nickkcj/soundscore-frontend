'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Music, Search, PenLine } from 'lucide-react';
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
  const [manualCover, setManualCover] = useState('');
  const [manualTracksText, setManualTracksText] = useState('');

  const resetState = useCallback(() => {
    setMode('spotify');
    setSelectedAlbum(null);
    setFetchedTracks([]);
    setManualArtist('');
    setManualTitle('');
    setManualCover('');
    setManualTracksText('');
  }, []);

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Listening Party</DialogTitle>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setMode('spotify')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
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
            <div className="grid grid-cols-2 gap-3">
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
              <Label htmlFor="manual-cover">Cover Image URL (optional)</Label>
              <Input
                id="manual-cover"
                placeholder="https://..."
                value={manualCover}
                onChange={(e) => setManualCover(e.target.value)}
              />
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
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-wine-600 hover:bg-wine-700 text-white"
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
