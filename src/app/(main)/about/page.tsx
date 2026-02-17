'use client';

export default function AboutPage() {
  return (
    <div
      className="min-h-[calc(100vh-140px)] flex items-center"
      style={{
        background: `linear-gradient(to bottom right,
          #722F37 0%,
          #5e2530 60%,
          #3a1820 100%)`,
      }}
    >
      <div className="container mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Text content */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8">
              Giving music lovers a voice, one review at a time.
            </h1>
            <p className="text-white/90 text-lg md:text-xl leading-relaxed">
              Founded in 2025 on the simple idea of giving music lovers a space to explore, rate, and share their favorite albums. SoundScore was built to turn personal listening into a collective experience — where every play, review, and score helps tell the story of what music means to you.
            </p>
          </div>

          {/* Right side - Illustration */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/27032dba77e68e55a80db39bdfcbc3e2ccb4b98f"
              className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] lg:w-[450px] lg:h-[450px] object-contain"
              alt="Person listening to music with headphones"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
