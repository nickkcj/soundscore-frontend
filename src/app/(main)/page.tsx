'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Disc3,
  Headphones,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { homeApi } from '@/lib/api';
import type { TopAlbum, RecentReview } from '@/types';

const PREVIEW_REVIEWS = [
  {
    id: -1,
    album_spotify_id: 'preview-brighter-days',
    album_cover_image: '/images/brighterdays.jpeg',
    album_title: 'Brighter Days',
    album_artist: 'Uma descoberta da comunidade',
    username: 'anaescuta',
    rating: 5,
    text: 'Daqueles discos que ficam melhores a cada nova audição.',
  },
  {
    id: -2,
    album_spotify_id: 'preview-the-album',
    album_cover_image: '/images/thealbum.jpg',
    album_title: 'The Album',
    album_artist: 'Em rotação agora',
    username: 'vinilnoturno',
    rating: 4,
    text: 'Produção cuidadosa, refrões enormes e muita personalidade.',
  },
  {
    id: -3,
    album_spotify_id: 'preview-happiness',
    album_cover_image: '/images/hapiness.jpeg',
    album_title: 'Happiness',
    album_artist: 'Favorito da semana',
    username: 'lado_b',
    rating: 5,
    text: 'Uma estreia que já chegou com cara de clássico moderno.',
  },
];

const PREVIEW_ALBUMS = [
  { spotify_id: 'preview-1', title: 'Brighter Days', artist: 'Mais ouvido hoje', cover_image: '/images/brighterdays.jpeg', avg_rating: 4.9 },
  { spotify_id: 'preview-2', title: 'The Album', artist: 'Subindo no ranking', cover_image: '/images/thealbum.jpg', avg_rating: 4.7 },
  { spotify_id: 'preview-3', title: 'Happiness', artist: 'Novo favorito', cover_image: '/images/hapiness.jpeg', avg_rating: 4.6 },
];

const MARQUEE_ITEMS = [
  { icon: Headphones, title: 'Descubra', text: 'curadoria feita por pessoas' },
  { icon: Star, title: 'Dê sua nota', text: 'registre tudo o que ouviu' },
  { icon: MessageCircle, title: 'Compartilhe', text: 'reviews que puxam conversa' },
  { icon: Users, title: 'Encontre sua turma', text: 'gente que escuta como você' },
  { icon: Disc3, title: 'Monte sua coleção', text: 'seu gosto em um só lugar' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3.5 ${rating >= star ? 'fill-[#f0a36b] text-[#f0a36b]' : 'fill-transparent text-white/20'}`}
        />
      ))}
    </div>
  );
}

function AlbumCover({ src, alt }: { src?: string | null; alt: string }) {
  return src ? (
    // Album artwork is supplied dynamically by the API.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#272526]">
      <Disc3 className="size-10 text-white/30" />
    </div>
  );
}

function ReviewSkeleton() {
  return <div className="h-[390px] animate-pulse rounded-[1.75rem] bg-black/5" />;
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [topAlbums, setTopAlbums] = useState<TopAlbum[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  useEffect(() => {
    Promise.all([homeApi.getTopAlbums(6), homeApi.getRecentReviews(3)])
      .then(([albums, reviews]) => {
        setTopAlbums(albums.albums);
        setRecentReviews(reviews.reviews);
      })
      .catch((error) => {
        console.error('Failed to fetch home data:', error);
        setApiUnavailable(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const primaryHref = isAuthenticated ? '/feed' : '/register';
  const visibleReviews = apiUnavailable ? PREVIEW_REVIEWS : recentReviews;
  const visibleAlbums = apiUnavailable ? PREVIEW_ALBUMS : topAlbums;

  return (
    <div className="overflow-hidden bg-[#f4f0e8] text-[#1b1919]">
      <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#b74755]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-11 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <h1 className="max-w-2xl text-[clamp(3rem,7vw,6.6rem)] font-black leading-[0.9] tracking-[-0.065em]">
              Música fica melhor quando vira
              <span className="text-[#963a4a]"> conversa.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#5c5654] sm:text-xl">
              Descubra álbuns, publique suas notas e encontre pessoas que escutam
              música com a mesma intensidade que você.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1b1919] px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#963a4a]"
              >
                {isAuthenticated ? 'Ir para o feed' : 'Criar meu perfil'}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#comunidade"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1b1919]/20 px-6 py-3 font-semibold transition hover:bg-white/70"
              >
                Explorar a comunidade
              </a>
            </div>
          </div>

          <div className="relative lg:mt-0">
            <div className="absolute -inset-2 rotate-1 rounded-[2rem] bg-[#963a4a]/15" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#963a4a]/15 bg-[#1b1919] shadow-2xl shadow-[#4b1b22]/15">
              <Image
                src="/images/landing/album-covers-collage.png"
                alt="Colagem com capas de álbuns de diferentes artistas e estilos"
                width={1270}
                height={714}
                priority
                className="aspect-[16/10] h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[#1b1919]/10 bg-[#ebe5db] py-5">
        <div className="flex w-max animate-[landing-marquee_28s_linear_infinite] items-center will-change-transform hover:[animation-play-state:paused]">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(({ icon: Icon, title, text }, index) => (
            <div key={`${title}-${index}`} className="mx-2 flex shrink-0 items-center gap-3 rounded-full border border-[#1b1919]/10 bg-[#f8f4ed] py-2.5 pl-2.5 pr-5 shadow-sm">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#963a4a] text-white"><Icon className="size-4" /></span>
              <p className="whitespace-nowrap text-sm"><strong>{title}</strong><span className="mx-2 text-[#963a4a]">•</span><span className="text-[#6c6562]">{text}</span></p>
            </div>
          ))}
        </div>
      </section>

      <section id="comunidade" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Agora na comunidade</p>
              <h2 className="mt-3 max-w-xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">Opiniões que puxam assunto.</h2>
            </div>
            <Link href={isAuthenticated ? '/feed' : '/register'} className="flex items-center gap-2 font-bold text-[#963a4a] hover:underline">
              Ver todas as reviews <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {loading ? [1, 2, 3].map((item) => <ReviewSkeleton key={item} />) : visibleReviews.length ? visibleReviews.map((review) => (
              <Link key={review.id} href={`/album/${review.album_spotify_id}`} className="group overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[4/3] overflow-hidden"><div className="h-full transition duration-500 group-hover:scale-105"><AlbumCover src={review.album_cover_image} alt={`Capa de ${review.album_title}`} /></div></div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3"><span className="truncate font-bold">@{review.username}</span><div className="rounded-full bg-[#1b1919] px-2.5 py-1.5"><StarRating rating={review.rating} /></div></div>
                  <p className="mt-5 line-clamp-2 min-h-12 text-base leading-6 text-[#5c5654]">{review.text || 'Uma nova nota entrou para a coleção.'}</p>
                  <p className="mt-5 truncate text-xs font-bold uppercase tracking-[0.12em] text-[#963a4a]">{review.album_title} · {review.album_artist}</p>
                </div>
              </Link>
            )) : <p className="md:col-span-3 text-[#6c6562]">As primeiras reviews estão chegando. Que tal publicar a sua?</p>}
          </div>
        </div>
      </section>

      <section className="bg-[#1b1919] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0a36b]">Ranking da semana</p>
              <h2 className="mt-3 text-5xl font-black leading-none tracking-[-0.05em] sm:text-6xl">Os discos que não saem da conversa.</h2>
              <p className="mt-6 max-w-md leading-7 text-white/55">O ranking nasce das notas da comunidade e muda junto com o que todo mundo está ouvindo.</p>
              <Link href={isAuthenticated ? '/feed' : '/register'} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f0a36b] px-6 py-3 font-bold text-[#1b1919] transition hover:scale-[1.02]">Entrar na conversa <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {loading ? [1, 2, 3].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/5" />) : visibleAlbums.slice(0, 3).map((album, index) => (
                <Link key={album.spotify_id} href={`/album/${album.spotify_id}`} className={`group ${index === 0 ? '-translate-y-5' : ''}`}>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5"><AlbumCover src={album.cover_image} alt={`Capa de ${album.title}`} /><span className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-[#f0a36b] font-black text-[#1b1919]">{index + 1}</span></div>
                  <h3 className="mt-4 truncate font-bold sm:text-lg">{album.title}</h3>
                  <p className="mt-1 truncate text-sm text-white/45">{album.artist}</p>
                  <div className="mt-3 flex items-center gap-2"><StarRating rating={album.avg_rating} /><span className="text-xs text-white/40">{album.avg_rating.toFixed(1)}</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes landing-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*='landing-marquee'] { animation-play-state: paused !important; }
        }
      `}</style>
    </div>
  );
}
