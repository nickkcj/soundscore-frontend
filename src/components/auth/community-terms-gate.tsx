'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { api, ApiException } from '@/lib/api';

export function CommunityTermsGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();
  const publicPage = ['/terms', '/privacy', '/delete-account', '/about', '/'].includes(pathname);
  const [checked, setChecked] = useState(false);
  const client = useQueryClient();
  const status = useQuery({ queryKey: ['community-terms', user?.id], queryFn: () => api.get<{ accepted: boolean }>('/moderation/terms'), enabled: isAuthenticated && !publicPage, retry: 1 });
  const accept = useMutation({ mutationFn: () => api.post('/moderation/terms', { version: '2026-10-03' }), onSuccess: () => client.invalidateQueries({ queryKey: ['community-terms'] }) });
  // Support publishing the web gate before the API rollout. Other errors remain actionable.
  const legacyApi = status.error instanceof ApiException && status.error.status === 404;
  if (!isAuthenticated || publicPage || status.data?.accepted || legacyApi) return children;
  return <section className="mx-auto max-w-lg space-y-6 p-8">
    <h1 className="text-2xl font-bold">Regras da comunidade</h1>
    {status.isPending ? <p>Carregando…</p> : status.isError ? <><p>Não foi possível carregar os termos.</p><button className="underline" onClick={() => void status.refetch()}>Tentar novamente</button></> : <>
      <p>Antes de continuar, leia as regras. Não permitimos assédio, discurso de ódio, ameaças, conteúdo sexual, golpes ou exposição de dados pessoais.</p>
      <Link className="underline" href="/terms">Ler os termos de uso</Link><br /><Link className="underline" href="/privacy">Política de Privacidade</Link>
      <label className="flex items-center gap-3"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} disabled={accept.isPending} />Li e aceito os termos de uso.</label>
      {accept.isError && <p role="alert">Não foi possível salvar. Tente novamente.</p>}
      <button className="rounded-xl bg-[#722F37] px-5 py-3 text-white disabled:opacity-50" disabled={!checked || accept.isPending} onClick={() => accept.mutate()}>Continuar</button>
    </>}
    <button className="block underline" onClick={logout}>Sair da conta</button>
  </section>;
}
