import { redirect } from 'next/navigation';

/**
 * Compatibilidade com links e favoritos antigos.
 * A descoberta agora acontece na busca global do cabeçalho e no feed.
 */
export default function LegacyDiscoverPage() {
  redirect('/feed');
}
