// Listening Party / Session types

export interface SessionParticipant {
  user_id: number;
  username: string;
  profile_picture: string | null;
  is_host: boolean;
}

export interface SessionRating {
  user_id: number;
  username: string;
  rating: number;
  comment: string | null;
}

export interface SessionTrack {
  index: number;
  name: string;
  revealed: boolean;
  votes_count: number;
  my_rating: number | null;
  my_comment: string | null;
  ratings: SessionRating[]; // only when revealed
  avg_rating: number | null; // only when revealed
}

export interface SessionSummary {
  avg_by_track: (number | null)[];
  avg_by_user: { user_id: number; username: string; avg: number }[];
  best_track_index: number | null;
  most_divisive_track_index: number | null;
  album_avg: number | null;
}

export interface SessionState {
  code: string;
  status: 'lobby' | 'active' | 'finished';
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
  album_spotify_id: string | null;
  host_id: number;
  is_host: boolean;
  is_participant: boolean;
  current_track_index: number;
  created_at: string;
  participants: SessionParticipant[];
  tracks: SessionTrack[];
  summary: SessionSummary | null;
}

export interface SessionListItem {
  code: string;
  status: 'lobby' | 'active' | 'finished';
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
  participants_count: number;
  created_at: string;
}

export interface CreateSessionPayload {
  album_title: string;
  album_artist: string;
  album_cover_image?: string | null;
  album_spotify_id?: string | null;
  tracks: string[];
}

export interface SubmitRatingPayload {
  track_index: number;
  rating: number;
  comment?: string;
}

// Presence payload for Supabase Realtime
export interface SessionPresencePayload {
  user_id: number;
  username: string;
  profile_picture: string | null;
}
