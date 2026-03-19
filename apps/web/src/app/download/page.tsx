import type { Metadata } from 'next';
import { Smartphone, Monitor, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';
import { QrCode } from './qr-code';
import { InstallButton } from './install-button';

export const metadata: Metadata = {
  title: 'Telecharger l\'app',
  description:
    'Installez Samadal sur votre telephone ou ordinateur. Achetez et vendez des chaussures au Senegal, directement depuis votre ecran d\'accueil.',
  openGraph: {
    title: 'Telecharger Samadal',
    description:
      'Installez l\'app Samadal pour acheter et vendre des chaussures au Senegal.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const STEPS_ANDROID = [
  {
    icon: MoreVertical,
    text: 'Ouvrez samadal.net dans Chrome',
  },
  {
    icon: Download,
    text: 'Appuyez sur "Installer l\'application" dans le menu',
  },
  {
    icon: Smartphone,
    text: 'L\'app apparait sur votre ecran d\'accueil',
  },
];

const STEPS_IPHONE = [
  {
    icon: Share,
    text: 'Ouvrez samadal.net dans Safari',
  },
  {
    icon: PlusSquare,
    text: 'Appuyez sur Partager puis "Sur l\'ecran d\'accueil"',
  },
  {
    icon: Smartphone,
    text: 'L\'app apparait sur votre ecran d\'accueil',
  },
];

const STEPS_PC = [
  {
    icon: Monitor,
    text: 'Ouvrez samadal.net dans Chrome ou Edge',
  },
  {
    icon: Download,
    text: 'Cliquez sur l\'icone d\'installation dans la barre d\'adresse',
  },
  {
    icon: Monitor,
    text: 'L\'app s\'ouvre comme une application de bureau',
  },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero */}
      <section className="relative bg-[var(--color-primary)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M10 60c0-4 4-8 12-10s16-2 20 0 6 6 8 10 4 10 8 12 10 2 16 0 10-6 10-10v-8c0-4-2-10-4-12s-6-4-10-4-8 2-12 4-8 4-14 4-12-2-16-4-6-4-8-8 0-10 4-12 10-4 16-2 12 4 14 8'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-[1280px] mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-wide">
              Gratuit — Aucun telechargement requis
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider">
            INSTALLEZ
            <span className="text-[var(--color-accent)] block mt-1">SAMADAL</span>
          </h1>

          <p className="mt-5 text-white/50 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Accedez a Samadal directement depuis votre ecran d&apos;accueil.
            <span className="text-white/80 font-semibold"> Pas besoin de Play Store ou App Store</span> — c&apos;est une application web progressive.
          </p>

          {/* Install button + QR code */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-10">
            <InstallButton />

            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-lg shadow-black/20">
                <QrCode url="https://samadal.net/download" size={160} />
              </div>
              <span className="text-xs text-white/40">Scannez pour ouvrir sur mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions par plateforme */}
      <section className="max-w-[1280px] mx-auto px-4 py-16 sm:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-wider text-center mb-3">
          COMMENT INSTALLER
        </h2>
        <p className="text-center text-sm text-[var(--color-muted-foreground)] mb-12 max-w-md mx-auto">
          Suivez les etapes selon votre appareil
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Android */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Android</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">Chrome</p>
              </div>
            </div>
            <div className="space-y-4">
              {STEPS_ANDROID.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--color-muted-foreground)]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* iPhone */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">iPhone</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">Safari uniquement</p>
              </div>
            </div>
            <div className="space-y-4">
              {STEPS_IPHONE.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--color-muted-foreground)]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PC/Mac */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">PC / Mac</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">Chrome ou Edge</p>
              </div>
            </div>
            <div className="space-y-4">
              {STEPS_PC.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--color-muted-foreground)]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-[var(--color-card)] border-t border-[var(--color-border)] py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-wider text-center mb-12">
            POURQUOI L&apos;APP ?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {[
              { title: 'Acces rapide', desc: 'Un tap depuis votre ecran d\'accueil, sans ouvrir le navigateur' },
              { title: 'Mode plein ecran', desc: 'L\'app s\'ouvre sans barre d\'adresse, comme une vraie app' },
              { title: 'Notifications', desc: 'Recevez des alertes quand un vendeur vous repond' },
              { title: '0 stockage', desc: 'Pas d\'installation lourde — tout reste sur le web' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
