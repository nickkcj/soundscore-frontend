'use client';

import { useEffect } from 'react';

/** Registra o service worker do PWA (produção apenas). */
export function SWRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // PWA é progressivo: sem SW o site continua funcionando normalmente
    });
  }, []);

  return null;
}
