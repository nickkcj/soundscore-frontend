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
                <span className="text-gray-500">★</span>
                <span
                  className="text-yellow-400 absolute left-0 top-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  ★
                </span>
              </>
            ) : (
              <span className={filled ? 'text-yellow-400' : 'text-gray-500'}>
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
    <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-xl border border-pink-600/20 animate-pulse">
      <div className="aspect-square bg-gray-800" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-700" />
          <div className="h-5 w-20 bg-gray-700 rounded" />
        </div>
        <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
        <div className="h-3 w-full bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function AlbumCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-lg overflow-hidden shadow-xl border-2 border-pink-600/50 animate-pulse">
      <div className="aspect-square bg-gray-800" />
      <div className="p-4">
        <div className="h-5 w-32 bg-gray-700 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
        <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
        <div className="h-3 w-full bg-gray-700 rounded" />
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
            rgba(201,24,74,0.8) 0%,
            rgba(201,24,74,0.7) 20%,
            rgba(201,24,74,0.6) 40%,
            rgba(201,24,74,0.5) 60%,
            rgba(201,24,74,0.3) 70%,
            rgba(0,0,0,0.7) 90%,
            #000000 100%)`,
        }}
      >
        <div className="flex justify-center items-center p-10 pl-8 md:pl-32 mx-auto max-md:flex-col max-md:p-5 w-full max-w-7xl animate-[fadeIn_1s_ease-in-out]">
          {/* Text section */}
          <div className="w-full md:w-1/2 text-center md:text-left px-4 animate-[slideInLeft_1.2s_ease-out]">
            <h1 className="text-white text-6xl font-bold tracking-[-1px] mb-5 max-md:text-[36px] max-sm:text-3xl animate-[fadeUp_1.4s_ease-out]">
              Rank your taste in music
            </h1>
            <p className="text-white/75 text-xl mb-6 max-md:text-lg max-sm:text-base animate-[fadeUp_1.6s_ease-out]">
              SoundScore allows you to rank every album that has ever launched. You
              can discuss and review other people&apos;s score.
            </p>
            {isAuthenticated ? (
              <Link
                href={`/my-reviews`}
                className="inline-block cursor-pointer bg-white hover:bg-opacity-90 px-6 py-3 rounded-md max-md:mx-auto max-md:block max-sm:w-full max-sm:text-lg transition-all duration-300 text-center transform hover:scale-105 hover:-translate-y-1 animate-[fadeUp_1.8s_ease-out] shadow-lg hover:shadow-xl text-black text-xl font-medium"
              >
                Start Ranking
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-block text-black text-xl font-medium cursor-pointer bg-white hover:bg-opacity-90 px-6 py-3 rounded-md max-md:mx-auto max-md:block max-sm:w-full max-sm:text-lg transition-all duration-300 text-center transform hover:scale-105 hover:-translate-y-1 animate-[fadeUp_1.8s_ease-out] shadow-lg hover:shadow-xl"
              >
                Start Ranking
              </Link>
            )}
          </div>

          {/* Image section with float animation */}
          <div className="w-full md:w-1/2 flex justify-center px-4 animate-[slideInRight_1.2s_ease-out]">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
              className="w-[550px] h-[550px] max-md:w-full max-md:h-auto max-md:mt-6 object-contain animate-[float_6s_ease-in-out_infinite]"
              alt="Music illustration"
            />
          </div>
        </div>
      </section>

      {/* Combined Content Section - Seamless Flow */}
      <section className="relative bg-black overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 md:px-10">
          {/* Albums Showcase */}
          <div className="text-center py-16">
            <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-8 max-sm:text-2xl">
              All albums you have ever imagined
            </h2>
            <figure className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/d578524dc05ef0a1d102bcaca03c78c5f6dc8b21"
                className="w-full max-w-[800px] h-auto rounded-xl mx-auto max-md:w-full shadow-2xl shadow-pink-900/20"
                alt="Album grid"
                loading="lazy"
              />
            </figure>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-pink-600/50" />
            <div className="w-2 h-2 rounded-full bg-pink-600/50" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-pink-600/50" />
          </div>

          {/* Latest Reviews */}
          <div id="reviews" className="py-12">
            <div className="text-center mb-10">
              <span className="text-pink-500 text-sm font-medium tracking-wider uppercase">Community</span>
              <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mt-2">
                Latest Reviews
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                    className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl border border-white/5 hover:border-pink-600/30 group"
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
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {review.user_profile_picture ? (
                          <img
                            src={review.user_profile_picture}
                            alt={review.username}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-600/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center ring-2 ring-pink-600/30">
                            <span className="text-white text-sm font-medium">
                              {review.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-white font-semibold">{review.username}</span>
                      </div>
                      <StarRating rating={review.rating} />
                      {review.text && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {review.text}
                        </p>
                      )}
                      <p className="text-pink-500/70 text-xs mt-3 font-medium">
                        {review.album_title} - {review.album_artist}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-400 py-10">
                  No reviews yet. Be the first to review an album!
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <Link
                href={isAuthenticated ? '/feed' : '/register'}
                className="inline-flex items-center gap-2 bg-transparent border border-pink-600/50 hover:bg-pink-600/10 text-pink-500 hover:text-pink-400 text-sm font-medium py-2.5 px-6 rounded-full transition-all duration-300"
              >
                View All Reviews
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-8">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30" />
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          </div>

          {/* Weekly Top Albums - Podium Style */}
          <div id="top-albums" className="py-12 pb-20">
            <div className="text-center mb-12">
              <span className="text-yellow-500 text-sm font-medium tracking-wider uppercase">This Week</span>
              <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tight mt-2">
                Top Albums
              </h2>
              <p className="text-gray-500 mt-3 text-sm">Based on community ratings</p>
            </div>

            {loadingAlbums ? (
              <div className="flex justify-center items-end gap-4 md:gap-8 max-w-4xl mx-auto">
                <div className="flex-1 max-w-[200px]"><AlbumCardSkeleton /></div>
                <div className="flex-1 max-w-[280px]"><AlbumCardSkeleton /></div>
                <div className="flex-1 max-w-[180px]"><AlbumCardSkeleton /></div>
              </div>
            ) : topAlbums.length > 0 ? (
              <div className="flex justify-center items-end gap-3 md:gap-6 max-w-5xl mx-auto px-2">
                {/* 2nd Place - Left */}
                {topAlbums[1] && (
                  <Link
                    href={`/album/${topAlbums[1].spotify_id}`}
                    className="flex-1 max-w-[180px] md:max-w-[220px] bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-xl border border-gray-400/20 relative group"
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
                    className="flex-1 max-w-[220px] md:max-w-[300px] bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-yellow-500/10 border border-yellow-500/30 relative -mt-8 group"
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
                    className="flex-1 max-w-[160px] md:max-w-[200px] bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-xl border border-amber-700/20 relative group"
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white text-base font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-pink-600/25 hover:shadow-pink-600/40 hover:-translate-y-0.5"
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
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
