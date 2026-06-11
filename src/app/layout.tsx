import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { SWRegister } from '@/components/providers/sw-register';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// viewport-fit=cover: o app desenha até as bordas (notch/home indicator);
// elementos fixos usam env(safe-area-inset-*) para não ficar embaixo delas
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#722F37',
};

export const metadata: Metadata = {
  title: 'SoundScore - Share Your Music Taste',
  description:
    'Rate albums, discover new music, and connect with fellow music lovers. Share your music taste with the world.',
  keywords: ['music', 'reviews', 'albums', 'ratings', 'social', 'discover'],
  icons: {
    icon: '/images/logo_only_soundscore.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SoundScore',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </QueryProvider>
        <SWRegister />
      </body>
    </html>
  );
}
