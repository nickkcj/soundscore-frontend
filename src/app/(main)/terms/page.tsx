import Link from 'next/link';

export default function TermsPage() {
  return <article className="mx-auto max-w-2xl space-y-6 px-6 py-12">
    <h1 className="text-3xl font-bold">SoundScore — Termos de uso e regras da comunidade</h1>
    <p>Versão de 3 de outubro de 2026.</p>
    <section><h2 className="text-xl font-semibold">Respeito e conteúdo permitido</h2><p>Assédio, bullying, ameaças, discriminação, discurso de ódio, conteúdo sexual explícito, violência gráfica, golpes e atividades ilegais são proibidos. Não exponha dados pessoais de outras pessoas sem autorização. Publique apenas conteúdo que você tem direito de compartilhar.</p></section>
    <section><h2 className="text-xl font-semibold">Segurança infantil</h2><p>O SoundScore proíbe expressamente abuso e exploração sexual infantil (CSAE), incluindo material de abuso sexual infantil (CSAM), aliciamento, sexualização de menores e qualquer conteúdo que coloque crianças em risco. Você pode denunciar pelo aplicativo ou por contact@soundscore.com.br, nosso ponto de contato para segurança infantil.</p><p>A equipe deve analisar essas denúncias com prioridade, remover conteúdo confirmado e reportar às autoridades competentes conforme a legislação aplicável. Não envie cópias de material ilegal por e-mail; informe o link ou identificador do conteúdo.</p></section>
    <section><h2 className="text-xl font-semibold">Denúncias e bloqueios</h2><p>No aplicativo Android, use o menu de segurança dos perfis, resenhas, comentários, grupos e mensagens. As denúncias são confidenciais e são analisadas pela equipe. Conteúdo pode ser removido e contas podem ser suspensas. Recursos contra decisões de moderação podem ser enviados a contact@soundscore.com.br.</p></section>
    <section><h2 className="text-xl font-semibold">Sua conta e seus dados</h2><p>Você é responsável pela segurança da conta e pelo conteúdo publicado. O serviço não é direcionado a menores de 13 anos. Você pode excluir sua conta nas configurações ou solicitar exclusão pela página abaixo.</p><Link className="underline" href="/privacy">Política de Privacidade</Link><br /><Link className="underline" href="/delete-account">Solicitar exclusão da conta</Link></section>
  </article>;
}
