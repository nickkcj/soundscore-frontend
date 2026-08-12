'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'soundscore-install-dismissed';

/**
 * Banner de instalação do PWA.
 * Aparece quando o navegador sinaliza que o app é instalável
 * (beforeinstallprompt — Chrome/Edge Android e desktop). No iOS o evento
 * não existe; o caminho é Compartilhar > Adicionar à Tela de Início.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Já instalado (rodando standalone) ou dispensado antes: não mostra
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    setVisible(false);
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <div
      role="region"
      aria-label="Install SoundScore"
      className={cn(
        'fixed left-4 right-4 z-[60] flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md md:bottom-6 md:left-auto md:right-6 md:max-w-sm md:p-4',
        isAuthenticated
          ? 'bottom-[calc(var(--app-bottom-nav-height)+var(--safe-area-bottom)+0.75rem)]'
          : 'bottom-[calc(var(--safe-area-bottom)+0.75rem)]'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-maskable-192.png"
        alt="SoundScore"
        className="h-10 w-10 shrink-0 rounded-xl sm:h-12 sm:w-12"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install SoundScore</p>
        <p className="text-xs text-muted-foreground">
          Quick access from your home screen
        </p>
      </div>
      <Button
        size="sm"
        onClick={install}
        aria-label="Install SoundScore"
        className="h-11 min-w-11 shrink-0 rounded-full bg-wine-600 px-0 text-white hover:bg-wine-700 sm:px-4"
      >
        <Download className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Install</span>
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
