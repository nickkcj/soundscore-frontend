// User types
export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture: string | null;
  banner_image: string | null;
  bio: string | null;
  created_at: string;
}

export interface UserProfile extends User {
  review_count: number;
  followers_count: number;
  following_count: number;
  avg_rating: number | null;
  is_following?: boolean;
}

export interface UserListItem {
  id: number;
  username: string;
  profile_picture: string | null;
  bio: string | null;
  is_following?: boolean;
  followers_count?: number;
}

// Album types
export interface Album {
  id: number;
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
}

export interface SpotifyAlbumResult {
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
}

// Album detail types
export interface Track {
  track_number: number;
  name: string;
  duration_ms: number;
  explicit: boolean;
  spotify_url: string;
  artists: string;
}

export interface AlbumDetail {
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
  label: string | null;
  copyrights: string[];
  total_tracks: number;
  popularity: number;
  spotify_url: string;
  tracks: Track[];
  summary: string | null;
  avg_rating: number | null;
  review_count: number;
}

// Review types
export interface Review {
  id: number;
  uuid: string;
  rating: number;
  text: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  album: Album;
  user_id: number;
  username: string;
  user_profile_picture: string | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean | null;
}

export interface ReviewCreate {
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
  rating: number;
  text?: string;
  is_favorite?: boolean;
}

export interface ReviewUpdate {
  rating?: number;
  text?: string;
  is_favorite?: boolean;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Comment types
export interface Comment {
  id: number;
  text: string;
  created_at: string;
  user_id: number;
  username: string;
  user_profile_picture: string | null;
  parent_id: number | null;
  replies: Comment[];
  like_count: number;
  is_liked: boolean | null;
}

export interface CommentCreate {
  text: string;
  parent_id?: number;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

// Like response
export interface LikeResponse {
  liked: boolean;
  like_count: number;
}

// Follow response
export interface FollowResponse {
  success: boolean;
  message: string;
  followers_count: number;
}

// Group types
export interface Group {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  privacy: 'public' | 'private';
  category: string | null;
  cover_image: string | null;
  created_by_id: number;
  created_at: string;
  member_count: number;
  is_member?: boolean;
  role?: 'admin' | 'moderator' | 'member';
}

export interface GroupMember {
  id: number;
  user_id: number;
  group_id: number;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  username: string;
  profile_picture: string | null;
  is_online?: boolean;
}

export interface GroupMessage {
  id: number;
  group_id: number;
  user_id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  username: string;
  profile_picture: string | null;
}

export interface GroupCreate {
  name: string;
  description?: string;
  privacy?: 'public' | 'private';
  category?: string;
}

export interface GroupListResponse {
  groups: Group[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Group Invite types
export interface GroupInvite {
  id: number;
  uuid: string;
  group_id: number;
  group_name: string;
  group_uuid: string;
  group_cover_image: string | null;
  invitee_id: number;
  invitee_username: string;
  inviter_id: number;
  inviter_username: string;
  inviter_profile_picture: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface GroupInviteListResponse {
  invites: GroupInvite[];
  total: number;
}

export interface InviteActionResponse {
  success: boolean;
  message: string;
  group_uuid?: string;
}

export interface GroupInviteResponse {
  invite: GroupInvite;
  message: string;
}

// Notification types
export interface Notification {
  id: number;
  notification_type: 'like' | 'comment' | 'follow' | 'reply' | 'group_invite';
  message: string;
  review_id: number | null;
  review_uuid: string | null;
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  actor_id: number;
  actor_username: string;
  actor_profile_picture: string | null;
  // Group invite specific fields
  invite_uuid?: string;
  group_uuid?: string;
  group_name?: string;
  group_cover_image?: string | null;
  expires_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedUsersResponse {
  users: UserListItem[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiError {
  detail: string;
}

export interface MessageResponse {
  message: string;
}

// WebSocket message types
export interface WSMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'online_users' | 'typing' | 'member_joined';
  content?: string;
  image_url?: string;
  user_id?: number;
  username?: string;
  profile_picture?: string;
  message_id?: number;
  timestamp?: string;
  online_users?: { user_id: number; username: string; profile_picture: string }[];
  role?: 'admin' | 'moderator' | 'member';
  joined_at?: string;
  member_count?: number;
}

// Chatbot types
export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  response: string;
  created_at: string;
}

// Optimistic update types
export interface OptimisticReview extends Review {
  _optimistic?: boolean;
  _optimisticId?: string;
}

export interface OptimisticComment extends Comment {
  _optimistic?: boolean;
  _optimisticId?: string;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Home page types
export interface TopAlbum {
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
  avg_rating: number;
  review_count: number;
}

export interface TopAlbumsResponse {
  albums: TopAlbum[];
}

export interface RecentReview {
  id: number;
  uuid: string;
  rating: number;
  text: string | null;
  created_at: string;
  album_title: string;
  album_artist: string;
  album_cover_image: string | null;
  album_spotify_id: string;
  user_id: number;
  username: string;
  user_profile_picture: string | null;
}

export interface RecentReviewsResponse {
  reviews: RecentReview[];
}

// Trending albums types
export interface TrendingAlbum {
  spotify_id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  release_date: string | null;
  avg_rating: number | null;
  review_count: number;
  week_start: string;
}

export interface TrendingAlbumsResponse {
  albums: TrendingAlbum[];
  week_start: string;
  week_end: string;
}
