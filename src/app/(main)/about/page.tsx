'use client';

export default function AboutPage() {
  return (
    <div
      className="flex min-h-[var(--app-usable-height)] items-center overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right,
          #722F37 0%,
          #5e2530 60%,
          #3a1820 100%)`,
      }}
    >
      <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center justify-between gap-8 md:gap-10 lg:flex-row lg:gap-12">
          {/* Left side - Text content */}
          <div className="max-w-xl flex-1 text-center lg:text-left">
            <h1 className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:mb-8 md:text-5xl lg:text-6xl">
              Giving music lovers a voice, one review at a time.
            </h1>
            <p className="text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
              Founded in 2025 on the simple idea of giving music lovers a space to explore, rate, and share their favorite albums. SoundScore was built to turn personal listening into a collective experience — where every play, review, and score helps tell the story of what music means to you.
            </p>
          </div>

          {/* Right side - Illustration */}
          <div className="flex flex-1 justify-center lg:justify-end">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
              className="h-52 w-52 object-contain invert sm:h-64 sm:w-64 md:h-[360px] md:w-[360px] lg:h-[450px] lg:w-[450px]"
              alt="Person listening to music with headphones"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
