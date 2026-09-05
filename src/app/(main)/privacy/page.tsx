import type { Metadata } from 'next';
import Link from 'next/link';
import { Baby, Cookie, Database, ExternalLink, LockKeyhole, Mail, RefreshCw, Share2, ShieldCheck, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade — SoundScore',
  description: 'Como o SoundScore coleta, utiliza e protege seus dados.',
};

const LAST_UPDATED = '11 de junho de 2026';
const sections = [
  { id: 'coleta', title: 'Dados que coletamos', icon: Database },
  { id: 'uso', title: 'Como usamos seus dados', icon: ShieldCheck },
  { id: 'compartilhamento', title: 'Com quem compartilhamos', icon: Share2 },
  { id: 'cookies', title: 'Cookies e armazenamento', icon: Cookie },
  { id: 'exclusao', title: 'Retenção e exclusão', icon: Trash2 },
  { id: 'criancas', title: 'Crianças e adolescentes', icon: Baby },
  { id: 'direitos', title: 'Seus direitos', icon: RefreshCw },
  { id: 'contato', title: 'Contato', icon: Mail },
];

export default function PrivacyPage() {
  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-8 md:pb-24 md:pt-7">
        <header className="relative overflow-hidden rounded-[2rem] bg-wine-800 px-6 py-10 text-white shadow-[0_24px_65px_rgba(80,28,36,0.2)] sm:px-8 md:px-10 md:py-14">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#e6a04a]/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#f4bd74]"><LockKeyhole className="h-5 w-5" /></span>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-[#f4bd74]">Privacidade no SoundScore</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.055em] sm:text-5xl md:text-6xl">Seus dados também fazem parte da sua história.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Esta política explica, sem letras miúdas desnecessárias, quais informações usamos para o SoundScore funcionar e quais escolhas continuam nas suas mãos.</p>
            <p className="mt-6 text-xs font-semibold text-white/45">Última atualização: {LAST_UPDATED}</p>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-[1.5rem] border border-[#dcd4ca] bg-white p-3 shadow-[0_12px_35px_rgba(50,38,30,0.05)] dark:border-border dark:bg-card lg:sticky lg:top-24">
            <p className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-[0.15em] text-wine-700">Nesta página</p>
            <nav aria-label="Seções da política" className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
              {sections.map(({ id, title, icon: Icon }) => <a key={id} href={`#${id}`} className="flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-wine-700/8 hover:text-wine-700"><Icon className="h-3.5 w-3.5 shrink-0" /><span>{title}</span></a>)}
            </nav>
          </aside>

          <article className="overflow-hidden rounded-[1.75rem] border border-[#dcd4ca] bg-white shadow-[0_16px_45px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card">
            <div className="border-b border-[#e9e2da] p-5 sm:p-7 dark:border-border"><p className="text-sm leading-7 text-foreground/75">O SoundScore é uma plataforma social para quem ama música, disponível em <strong className="text-foreground">soundscore.com.br</strong> e em aplicativo móvel. Ao usar a plataforma, você concorda com as práticas descritas nesta política.</p><div className="mt-4 rounded-2xl bg-[#f8f4ee] p-4 text-sm leading-6 text-foreground/70 dark:bg-muted/25"><strong className="text-wine-700">Em resumo:</strong> não vendemos seus dados pessoais e não usamos suas informações para publicidade de terceiros.</div></div>

            <PolicySection id="coleta" icon={Database} title="Dados que coletamos">
              <ul><li><strong>Conta:</strong> nome de usuário, e-mail e senha armazenada de forma protegida. Em acessos com Google ou Spotify, recebemos os dados básicos autorizados por você.</li><li><strong>Perfil:</strong> foto, capa e biografia que você decidir adicionar.</li><li><strong>Atividade:</strong> reviews, notas, comentários, curtidas, conexões, grupos, mensagens e votos em Listening Parties.</li><li><strong>Histórico musical opcional:</strong> ao conectar o Spotify, sincronizamos reproduções recentes para compor sua Biblioteca.</li><li><strong>Dados técnicos:</strong> registros básicos necessários para segurança, estabilidade e correção de erros.</li></ul>
            </PolicySection>
            <PolicySection id="uso" icon={ShieldCheck} title="Como usamos seus dados">
              <ul><li>Para entregar o feed, perfis, reviews, chats, grupos e Listening Parties.</li><li>Para apresentar conteúdo público às outras pessoas, conforme a proposta da plataforma.</li><li>Para enviar notificações esperadas, como respostas, curtidas, convites e mensagens.</li><li>Para gerar conteúdos por inteligência artificial, como biografias e respostas do assistente.</li><li>Para prevenir abuso, proteger contas e investigar problemas técnicos.</li></ul>
            </PolicySection>
            <PolicySection id="compartilhamento" icon={Share2} title="Com quem compartilhamos">
              <p>Utilizamos fornecedores essenciais, que processam informações somente para prestar seus serviços:</p><ul><li><strong>Amazon Web Services:</strong> hospedagem da aplicação e armazenamento de imagens.</li><li><strong>Supabase:</strong> banco de dados e infraestrutura em tempo real.</li><li><strong>Vercel:</strong> hospedagem do site.</li><li><strong>Spotify:</strong> catálogo musical e, quando conectado, histórico de reprodução.</li><li><strong>Google Gemini:</strong> recursos de inteligência artificial.</li><li><strong>Resend:</strong> e-mails transacionais, incluindo recuperação de senha.</li></ul>
            </PolicySection>
            <PolicySection id="cookies" icon={Cookie} title="Cookies e armazenamento local"><p>Usamos cookies essenciais e armazenamento local do navegador para manter sua sessão e lembrar preferências, como o tema escolhido. Não utilizamos cookies de publicidade nem rastreamento entre sites.</p></PolicySection>
            <PolicySection id="exclusao" icon={Trash2} title="Retenção e exclusão"><p>Mantemos seus dados enquanto a conta estiver ativa. Você pode excluir conteúdos dentro do aplicativo. Para remover sua conta e os dados pessoais associados, utilize as configurações ou fale conosco; a solicitação será processada em até 30 dias.</p></PolicySection>
            <PolicySection id="criancas" icon={Baby} title="Crianças e adolescentes"><p>O SoundScore não é direcionado a crianças menores de 13 anos. Caso você acredite que uma criança criou uma conta, entre em contato para que possamos tomar as medidas adequadas.</p></PolicySection>
            <PolicySection id="direitos" icon={RefreshCw} title="Seus direitos e mudanças nesta política"><p>Nos termos da LGPD e de outras leis aplicáveis, você pode solicitar acesso, correção, portabilidade ou exclusão de dados, além de retirar consentimentos quando essa for a base do tratamento.</p><p>Esta política pode mudar conforme o produto evolui. Alterações relevantes serão comunicadas na plataforma, e a data no topo indicará sempre a versão vigente.</p></PolicySection>
            <PolicySection id="contato" icon={Mail} title="Fale com a gente" last><p>Dúvidas ou solicitações relacionadas à privacidade podem ser enviadas para:</p><a href="mailto:contact@soundscore.com.br" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-wine-700 px-4 text-sm font-black text-white hover:bg-wine-800">contact@soundscore.com.br <ExternalLink className="h-3.5 w-3.5" /></a><p className="mt-3 text-xs text-muted-foreground">Você também pode revisar as opções disponíveis nas <Link href="/account" className="font-bold text-wine-700 hover:underline">configurações da conta</Link>.</p></PolicySection>
          </article>
        </div>
      </main>
    </div>
  );
}

function PolicySection({ id, icon: Icon, title, children, last = false }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode; last?: boolean }) {
  return <section id={id} className={`scroll-mt-24 p-5 sm:p-7 ${last ? '' : 'border-b border-[#e9e2da] dark:border-border'}`}><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wine-700/10 text-wine-700"><Icon className="h-4 w-4" /></span><h2 className="text-xl font-black tracking-[-0.03em]">{title}</h2></div><div className="mt-4 space-y-3 text-sm leading-7 text-foreground/72 [&_strong]:font-black [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div></section>;
}
