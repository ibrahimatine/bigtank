'use client';

import { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-300 font-semibold text-sm">
        <Check className="h-5 w-5" />
        App installee !
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors shadow-lg shadow-[var(--color-accent)]/20 cursor-pointer"
      >
        <Download className="h-5 w-5" />
        Installer l&apos;app Samadal
      </button>
    );
  }

  // Fallback: browser doesn't support install prompt (iPhone, Firefox...)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white/80 font-semibold text-sm">
        <Download className="h-5 w-5" />
        Installer l&apos;app
      </div>
      <span className="text-xs text-white/40">
        Suivez les etapes ci-dessous selon votre appareil
      </span>
    </div>
  );
}
