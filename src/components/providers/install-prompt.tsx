'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="fixed left-4 right-4 z-[60] md:left-auto md:right-6 md:max-w-sm rounded-2xl border border-border bg-card shadow-lg p-4 flex items-center gap-3"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-maskable-192.png"
        alt="SoundScore"
        className="h-12 w-12 rounded-xl shrink-0"
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
        className="bg-wine-600 hover:bg-wine-700 text-white rounded-full shrink-0"
      >
        <Download className="h-4 w-4 mr-1" />
        Install
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
