import { api } from '@/lib/api';
import type {
  SessionState,
  SessionListItem,
  CreateSessionPayload,
  SubmitRatingPayload,
} from '@/types/sessions';

export const sessionsApi = {
  create: (payload: CreateSessionPayload) =>
    api.post<SessionState>('/sessions', payload),

  getMine: () =>
    api.get<SessionListItem[]>('/sessions/mine'),

  get: (code: string) =>
    api.get<SessionState>(`/sessions/${code}`),

  join: (code: string) =>
    api.post<SessionState>(`/sessions/${code}/join`),

  start: (code: string) =>
    api.post<SessionState>(`/sessions/${code}/start`),

  submitRating: (code: string, payload: SubmitRatingPayload) =>
    api.post<SessionState>(`/sessions/${code}/ratings`, payload),

  advance: (code: string) =>
    api.post<SessionState>(`/sessions/${code}/advance`),

  finish: (code: string) =>
    api.post<SessionState>(`/sessions/${code}/finish`),
};
