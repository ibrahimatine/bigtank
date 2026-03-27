'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MessageCircle, Facebook, Copy, ArrowLeft } from 'lucide-react';
import { useState, Suspense } from 'react';
import { toast } from 'sonner';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://samadal.net';

function PublishedContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const title = searchParams.get('title') || 'Mon annonce';
  const [copied, setCopied] = useState(false);

  const listingUrl = slug ? `${SITE_URL}/shoes/${slug}` : SITE_URL;
  const shareText = `${title} — A vendre sur Samadal\n${listingUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}&quote=${encodeURIComponent(title + ' — A vendre sur Samadal')}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      toast.success('Lien copie !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }

  return (
    <div className="max-w-md mx-auto text-center py-8 px-4">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Annonce publiee !</h1>
      <p className="text-[var(--color-muted-foreground)] mb-8">
        Partagez votre annonce pour toucher plus d&apos;acheteurs
      </p>

      {/* Share buttons */}
      <div className="space-y-3 mb-8">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BD5A] transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Partager sur WhatsApp
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#1877F2] text-white font-medium hover:bg-[#1565D8] transition-colors"
        >
          <Facebook className="h-5 w-5" />
          Partager sur Facebook
        </a>

        <button
          onClick={copyLink}
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-[var(--color-border)] font-medium hover:bg-[var(--color-muted)] transition-colors"
        >
          <Copy className="h-5 w-5" />
          {copied ? 'Copie !' : 'Copier le lien (Instagram, etc.)'}
        </button>
      </div>

      {/* View listing */}
      {slug && (
        <Link
          href={`/shoes/${slug}`}
          className="text-sm text-[var(--color-accent)] hover:underline mb-4 inline-block"
        >
          Voir mon annonce
        </Link>
      )}

      {/* Back to dashboard */}
      <div className="mt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PublishedPage() {
  return (
    <Suspense>
      <PublishedContent />
    </Suspense>
  );
}
