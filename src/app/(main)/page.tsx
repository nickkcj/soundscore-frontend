'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { homeApi } from '@/lib/api';
import type { TopAlbum, RecentReview } from '@/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;

        return (
          <span key={star} className="text-sm relative">
            {halfFilled ? (
              <>
                <span className="text-gray-600">★</span>
                <span
                  className="text-yellow-400 absolute left-0 top-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  ★
                </span>
              </>
            ) : (
              <span className={filled ? 'text-yellow-400' : 'text-gray-600'}>
                ★
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="bg-card/80 dark:bg-[#1A1A1A] rounded-lg overflow-hidden shadow-xl border border-wine-600/20 animate-pulse">
      <div className="aspect-square bg-muted dark:bg-gray-800" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-muted dark:bg-gray-700" />
          <div className="h-5 w-20 bg-muted dark:bg-gray-700 rounded" />
        </div>
        <div className="h-4 w-24 bg-muted dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-full bg-muted dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function AlbumCardSkeleton() {
  return (
    <div className="bg-card/80 dark:bg-[#1A1A1A] rounded-lg overflow-hidden shadow-xl border-2 border-wine-600/50 animate-pulse">
      <div className="aspect-square bg-muted dark:bg-gray-800" />
      <div className="p-4">
        <div className="h-5 w-32 bg-muted dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-24 bg-muted dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-20 bg-muted dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-full bg-muted dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [topAlbums, setTopAlbums] = useState<TopAlbum[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [albumsRes, reviewsRes] = await Promise.all([
          homeApi.getTopAlbums(6),
          homeApi.getRecentReviews(3),
        ]);
        setTopAlbums(albumsRes.albums);
        setRecentReviews(reviewsRes.reviews);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoadingAlbums(false);
        setLoadingReviews(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section with Animations */}
      <section
        className="w-full"
        style={{
          background: `linear-gradient(to bottom,
            #722F37 0%,
            #5E2530 40%,
            #2d1218 70%,
            #121212 100%)`,
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-8 animate-[fadeIn_1s_ease-in-out] max-md:flex-col md:p-10 md:pl-32">
          {/* Text section */}
          <div className="w-full px-0 text-center animate-[slideInLeft_1.2s_ease-out] sm:px-4 md:w-1/2 md:text-left">
            <h1 className="mb-4 text-3xl font-bold tracking-[-1px] text-white animate-[fadeUp_1.4s_ease-out] sm:text-4xl md:mb-5 md:text-6xl">
              Rank your taste in music
            </h1>
            <p className="mb-6 text-base text-white/90 animate-[fadeUp_1.6s_ease-out] sm:text-lg md:mb-8 md:text-xl">
              SoundScore allows you to rank every album that has ever launched. You
              can discuss and review other people&apos;s score.
            </p>
            {isAuthenticated ? (
              <Link
                href={`/my-reviews`}
                className="mx-auto flex min-h-11 w-full max-w-sm cursor-pointer items-center justify-center rounded-full bg-white px-7 py-3 text-center text-base font-semibold text-wine-700 shadow-md transition-all duration-200 animate-[fadeUp_1.8s_ease-out] hover:bg-wine-50 hover:shadow-lg md:mx-0 md:inline-flex md:w-auto"
              >
                Start Ranking
              </Link>
            ) : (
              <Link
                href="/register"
                className="mx-auto flex min-h-11 w-full max-w-sm cursor-pointer items-center justify-center rounded-full bg-white px-7 py-3 text-center text-base font-semibold text-wine-700 shadow-md transition-all duration-200 animate-[fadeUp_1.8s_ease-out] hover:bg-wine-50 hover:shadow-lg md:mx-0 md:inline-flex md:w-auto"
              >
                Start Ranking
              </Link>
            )}
          </div>

          {/* Image section with float animation */}
          <div className="relative flex w-full justify-center px-4 animate-[slideInRight_1.2s_ease-out] md:w-1/2">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-75" />
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
              className="relative mt-5 h-56 w-56 object-contain opacity-90 brightness-0 invert contrast-200 animate-[float_6s_ease-in-out_infinite] sm:h-72 sm:w-72 md:mt-0 md:h-[550px] md:w-[550px]"
              alt="Music illustration"
            />
          </div>
        </div>
      </section>

      {/* Combined Content Section - Seamless Flow */}
      <section className="relative bg-[#121212] overflow-hidden">
        <div className="container mx-auto px-4 md:px-10">
          {/* Albums Showcase */}
          <div className="py-10 text-center md:py-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-white md:mb-8 md:text-4xl">
              All albums you have ever imagined
            </h2>
            <figure className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/d578524dc05ef0a1d102bcaca03c78c5f6dc8b21"
                className="w-full max-w-[800px] h-auto rounded-xl mx-auto max-md:w-full shadow-2xl shadow-wine-900/20"
                alt="Album grid"
                loading="lazy"
              />
            </figure>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-5 md:py-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-wine-600/50" />
            <div className="w-2 h-2 rounded-full bg-wine-600/50" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-wine-600/50" />
          </div>

          {/* Latest Reviews */}
          <div id="reviews" className="py-8 md:py-12">
            <div className="mb-6 text-center md:mb-10">
              <span className="text-wine-500 text-sm font-medium tracking-wider uppercase">Community</span>
              <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mt-2">
                Latest Reviews
              </h2>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {loadingReviews ? (
                <>
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                </>
              ) : recentReviews.length > 0 ? (
                recentReviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/album/${review.album_spotify_id}`}
                    className="bg-[#1c1c1e] backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl border border-white/5 hover:border-wine-600/30 group"
                  >
                    <div className="aspect-square overflow-hidden relative">
                      {review.album_cover_image ? (
                        <img
                          src={review.album_cover_image}
                          alt={`${review.album_title} cover`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500 text-4xl">♪</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {review.user_profile_picture ? (
                          <img
                            src={review.user_profile_picture}
                            alt={review.username}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-wine-600/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-wine-600 flex items-center justify-center ring-2 ring-wine-600/30">
                            <span className="text-white text-sm font-medium">
                              {review.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">{review.username}</span>
                      </div>
                      <StarRating rating={review.rating} />
                      {review.text && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {review.text}
                        </p>
                      )}
                      <p className="text-wine-500/70 text-xs mt-3 font-medium">
                        {review.album_title} - {review.album_artist}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-gray-400">
                  No reviews yet. Be the first to review an album!
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <Link
                href={isAuthenticated ? '/feed' : '/register'}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-wine-600/50 bg-transparent px-6 py-2.5 text-sm font-medium text-wine-500 transition-all duration-300 hover:bg-wine-600/10 hover:text-wine-400"
              >
                View All Reviews
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-5 md:py-8">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30" />
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          </div>

          {/* Weekly Top Albums - Podium Style */}
          <div id="top-albums" className="pb-14 pt-8 md:py-12 md:pb-20">
            <div className="mb-8 text-center md:mb-12">
              <span className="text-yellow-500 text-sm font-medium tracking-wider uppercase">This Week</span>
              <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tight mt-2">
                Top Albums
              </h2>
              <p className="text-gray-500 mt-3 text-sm">Based on community ratings</p>
            </div>

            {loadingAlbums ? (
              <div className="mx-auto grid max-w-4xl grid-cols-2 items-end gap-3 md:flex md:justify-center md:gap-8">
                <div className="order-2 max-w-[200px] md:flex-1"><AlbumCardSkeleton /></div>
                <div className="order-1 col-span-2 mx-auto w-full max-w-[240px] md:order-none md:flex-1 md:max-w-[280px]"><AlbumCardSkeleton /></div>
                <div className="order-3 max-w-[180px] md:flex-1"><AlbumCardSkeleton /></div>
              </div>
            ) : topAlbums.length > 0 ? (
              <div className="mx-auto grid max-w-5xl grid-cols-2 items-end justify-items-center gap-3 px-2 md:flex md:justify-center md:gap-6">
                {/* 2nd Place - Left */}
                {topAlbums[1] && (
                  <Link
                    href={`/album/${topAlbums[1].spotify_id}`}
                    className="group relative order-2 w-full max-w-[180px] overflow-hidden rounded-xl border border-gray-400/20 bg-[#1c1c1e] shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 md:order-none md:flex-1 md:max-w-[220px]"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-gray-400/10 to-transparent opacity-50 pointer-events-none"></div>
                    <div className="relative">
                      <div className="absolute top-2 left-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg z-10">
                        <span className="text-gray-800 text-lg md:text-xl font-bold">2</span>
                      </div>
                      {topAlbums[1].cover_image ? (
                        <img
                          src={topAlbums[1].cover_image}
                          alt={`${topAlbums[1].title} cover`}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500 text-4xl">♪</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="text-white text-sm md:text-base font-bold mb-1 truncate">{topAlbums[1].title}</h3>
                      <p className="text-gray-400 text-xs md:text-sm mb-1 font-medium truncate">{topAlbums[1].artist}</p>
                      <div className="flex items-center gap-1 mb-1">
                        <StarRating rating={topAlbums[1].avg_rating} />
                        <span className="text-gray-400 text-xs">
                          ({topAlbums[1].avg_rating.toFixed(1)})
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {topAlbums[1].review_count} {topAlbums[1].review_count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </Link>
                )}

                {/* 1st Place - Center (Larger) */}
                {topAlbums[0] && (
                  <Link
                    href={`/album/${topAlbums[0].spotify_id}`}
                    className="group relative order-1 col-span-2 w-full max-w-[240px] overflow-hidden rounded-xl border border-yellow-500/30 bg-[#1c1c1e] shadow-2xl shadow-yellow-500/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 md:order-none md:-mt-8 md:flex-1 md:max-w-[300px]"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-yellow-500/20 to-transparent opacity-60 pointer-events-none"></div>
                    <div className="relative">
                      <div className="absolute top-3 left-3 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg z-10 ring-2 ring-yellow-400/50">
                        <span className="text-yellow-900 text-xl md:text-2xl font-bold">1</span>
                      </div>
                      {topAlbums[0].cover_image ? (
                        <img
                          src={topAlbums[0].cover_image}
                          alt={`${topAlbums[0].title} cover`}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500 text-6xl">♪</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="text-white text-lg md:text-xl font-bold mb-1 truncate">{topAlbums[0].title}</h3>
                      <p className="text-yellow-500 text-sm md:text-base mb-2 font-medium truncate">{topAlbums[0].artist}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={topAlbums[0].avg_rating} />
                        <span className="text-gray-400 text-sm">
                          ({topAlbums[0].avg_rating.toFixed(1)})
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {topAlbums[0].review_count} {topAlbums[0].review_count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </Link>
                )}

                {/* 3rd Place - Right */}
                {topAlbums[2] && (
                  <Link
                    href={`/album/${topAlbums[2].spotify_id}`}
                    className="group relative order-3 w-full max-w-[160px] overflow-hidden rounded-xl border border-amber-700/20 bg-[#1c1c1e] shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 md:order-none md:flex-1 md:max-w-[200px]"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-amber-700/10 to-transparent opacity-50 pointer-events-none"></div>
                    <div className="relative">
                      <div className="absolute top-2 left-2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg z-10">
                        <span className="text-amber-200 text-base md:text-lg font-bold">3</span>
                      </div>
                      {topAlbums[2].cover_image ? (
                        <img
                          src={topAlbums[2].cover_image}
                          alt={`${topAlbums[2].title} cover`}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500 text-3xl">♪</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 md:p-3">
                      <h3 className="text-white text-xs md:text-sm font-bold mb-1 truncate">{topAlbums[2].title}</h3>
                      <p className="text-amber-600 text-xs mb-1 font-medium truncate">{topAlbums[2].artist}</p>
                      <div className="flex items-center gap-1 mb-1">
                        <StarRating rating={topAlbums[2].avg_rating} />
                        <span className="text-gray-400 text-[10px]">
                          ({topAlbums[2].avg_rating.toFixed(1)})
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px]">
                        {topAlbums[2].review_count} {topAlbums[2].review_count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-10">
                No top albums yet. Start reviewing to see the rankings!
              </div>
            )}

            <div className="flex justify-center mt-12 max-w-5xl mx-auto px-2">
              <Link
                href="/discover"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wine-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-wine-700 hover:shadow-lg"
              >
                Discover More Albums
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade to footer */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
      </section>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInLeft {
          from { transform: translateX(-10%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideInRight {
          from { transform: translateX(10%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
