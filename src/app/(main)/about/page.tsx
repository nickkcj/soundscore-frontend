'use client';

import Link from 'next/link';
import { Music, Users, Star, Heart, MessageCircle, Zap, Globe, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-100 dark:bg-pink-950/30 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 dark:bg-purple-950/30 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-50 dark:bg-pink-950/20 rounded-full filter blur-2xl opacity-40 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-16 md:py-24 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg mb-6">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6">
            About SoundScore
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SoundScore is your ultimate destination for discovering, rating, and sharing your thoughts on music.
            Connect with fellow music enthusiasts and explore a world of albums, artists, and reviews.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center">
                <Heart className="w-8 h-8 text-pink-500 mr-3" />
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We believe that music is more than just sound - it&apos;s a universal language that connects people across
                cultures and generations. SoundScore was created to give music lovers a platform to express their
                passion, share their discoveries, and engage in meaningful conversations about the albums that shape our lives.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Whether you&apos;re a casual listener or a dedicated audiophile, SoundScore provides the tools to
                track your music journey, rate your favorite albums, and connect with like-minded individuals who
                share your taste in music.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
            What Makes SoundScore Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Rate Albums</h3>
              <p className="text-muted-foreground">
                Share your opinion with our 5-star rating system and write detailed reviews for the albums you love.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Connect & Follow</h3>
              <p className="text-muted-foreground">
                Build your network by following other users and see what albums they&apos;re listening to and reviewing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Discover New Music</h3>
              <p className="text-muted-foreground">
                Explore trending albums, browse by genre, or find hidden gems through our powerful search and discovery tools.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Join Groups</h3>
              <p className="text-muted-foreground">
                Create or join groups based on your favorite genres, artists, or music topics to connect with like-minded fans.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Stay up to date with instant notifications when someone likes your review or when your favorite users post.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card rounded-xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is safe with us. We prioritize privacy and security in everything we build.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Your Music Journey?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of music lovers who are already sharing their passion on SoundScore.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 bg-background text-pink-600 dark:text-pink-400 font-semibold rounded-full hover:bg-muted transition-colors shadow-md"
              >
                Get Started Free
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent text-white font-semibold rounded-full border-2 border-white hover:bg-white/10 dark:hover:bg-white/20 transition-colors"
              >
                Explore Music
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Credits */}
        <section className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Built with love by{' '}
            <a
              href="https://www.linkedin.com/in/nicholas-jasper-6388902b9/"
              className="text-pink-500 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nicholas Jasper
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
