import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Search, Star, Users } from 'lucide-react';

const JOURNEY = [
  {
    number: '01',
    icon: Search,
    title: 'Descubra',
    text: 'Encontre discos por meio de pessoas, reviews e conversas — não apenas por uma recomendação automática.',
  },
  {
    number: '02',
    icon: Star,
    title: 'Registre',
    text: 'Dê sua nota, escreva o que sentiu e construa uma memória viva de tudo o que passou pelos seus fones.',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Compartilhe',
    text: 'Compare opiniões, encontre sua turma e transforme uma experiência individual em uma conversa coletiva.',
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-[#f4f0e8] text-[#1b1919]">
      <section className="relative px-4 pb-20 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="absolute -left-28 top-12 size-80 rounded-full bg-[#963a4a]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#963a4a]">Sobre o SoundScore</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(3.6rem,7.5vw,7.2rem)] font-black leading-[0.86] tracking-[-0.07em]">
              Toda escuta deixa uma
              <span className="text-[#963a4a]"> história.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#625b58] sm:text-xl">
              O SoundScore nasceu para dar contexto ao que você ouve: descobrir
              álbuns, registrar opiniões e encontrar pessoas que vivem música com
              a mesma intensidade.
            </p>
          </div>

          <div className="relative lg:mt-1">
            <div className="absolute -inset-3 rotate-1 rounded-[2.25rem] bg-[#963a4a]/16" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#963a4a]/10 shadow-2xl shadow-[#4b1b22]/15">
              <Image
                src="/images/about/about-community-illustration.png"
                alt="Três amigos compartilhando um disco, fones e uma conversa sobre música"
                width={1456}
                height={1092}
                priority
                className="aspect-[4/3] h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#1b1919]/10 bg-[#1b1919] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f0a36b]">Do play à conversa</p>
              <h2 className="mt-4 max-w-2xl text-5xl font-black leading-none tracking-[-0.055em] sm:text-6xl">Um ciclo feito para continuar.</h2>
            </div>
            <p className="max-w-sm leading-7 text-white/50">Cada opinião alimenta novas descobertas e aproxima pessoas através da música.</p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 lg:grid-cols-3">
            {JOURNEY.map(({ number, icon: Icon, title, text }) => (
              <article key={number} className="group bg-[#1b1919] p-7 transition hover:bg-[#211e1f] sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#f0a36b]">{number}</span>
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/10 text-white/65 transition group-hover:border-[#f0a36b]/40 group-hover:text-[#f0a36b]"><Icon className="size-5" /></span>
                </div>
                <h3 className="mt-20 text-3xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-4 max-w-sm leading-7 text-white/50">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="relative h-[430px] sm:h-[560px]">
            <div className="absolute left-0 top-8 w-[56%] rotate-[-4deg] overflow-hidden rounded-2xl shadow-xl ring-8 ring-[#f4f0e8]">
              <Image src="/images/brighterdays.jpeg" alt="Capa de álbum" width={700} height={700} className="aspect-square w-full object-cover" />
            </div>
            <div className="absolute right-0 top-0 w-[48%] rotate-3 overflow-hidden rounded-2xl shadow-xl ring-8 ring-[#f4f0e8]">
              <Image src="/images/thealbum.jpg" alt="Capa de álbum" width={600} height={600} className="aspect-square w-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-[30%] w-[48%] rotate-2 overflow-hidden rounded-2xl shadow-xl ring-8 ring-[#f4f0e8]">
              <Image src="/images/hapiness.jpeg" alt="Capa de álbum" width={600} height={600} className="aspect-square w-full object-cover" />
            </div>
          </div>

          <div>
            <div className="flex size-12 items-center justify-center rounded-full bg-[#f0a36b] text-[#1b1919]"><Users className="size-5" /></div>
            <h2 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">Feito para quem ouve de verdade.</h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#625b58]">
              Para quem monta rankings, defende álbuns esquecidos, muda de opinião
              na décima audição e sempre tem uma recomendação pronta.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1b1919] px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#963a4a]">
                Criar meu perfil <ArrowRight className="size-4" />
              </Link>
              <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1b1919]/15 px-6 py-3 font-bold transition hover:bg-white/60">
                Voltar para o início
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
