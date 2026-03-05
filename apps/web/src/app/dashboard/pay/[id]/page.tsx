'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Gift, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CommissionPreview {
  listingPrice: number;
  commission: number;
  rate: string;
  minimumFee: number;
}

interface Listing {
  id: string;
  title: string;
  priceXof: number;
  images: { url: string }[];
}

function formatXof(amount: number) {
  return new Intl.NumberFormat('fr-SN').format(amount) + ' FCFA';
}

export default function PayListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [preview, setPreview] = useState<CommissionPreview | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [previewRes, listingRes] = await Promise.all([
          fetch(`/api/payments/preview/${id}`),
          fetch(`/api/listings/${id}`),
        ]);

        if (previewRes.ok) {
          const d = await previewRes.json();
          setPreview(d.data ?? d);
        }
        if (listingRes.ok) {
          const d = await listingRes.json();
          setListing(d.data ?? d);
        }
      } catch {
        setError('Impossible de charger les informations de paiement.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.data?.error || 'Erreur lors du paiement.');
        return;
      }

      const result = data.data ?? data;

      if (result.isFree) {
        router.push('/dashboard/payment/success?free=1');
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch {
      setError('Erreur réseau. Réessaye.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[var(--color-primary)] px-6 py-5 text-white">
            <h1 className="text-lg font-bold">Publier votre annonce</h1>
            <p className="text-sm opacity-80 mt-0.5">
              Une petite commission pour rendre votre annonce visible à tous
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Annonce concernée */}
            {listing && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {listing.images?.[0] && (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{listing.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Prix annoncé : {formatXof(listing.priceXof)}
                  </p>
                </div>
              </div>
            )}

            {/* Détail commission */}
            {preview && (
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-gray-600">Prix de l'annonce</span>
                  <span className="font-medium">{formatXof(preview.listingPrice)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-gray-600">Taux commission</span>
                  <span className="font-medium">{preview.rate}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm font-semibold bg-gray-50">
                  <span>Commission BigTank</span>
                  <span className="text-[var(--color-primary)] text-base">
                    {formatXof(preview.commission)}
                  </span>
                </div>
              </div>
            )}

            {/* Méthodes de paiement */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Méthodes acceptées
              </p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                  <Smartphone className="h-3.5 w-3.5" />
                  Orange Money
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                  <Smartphone className="h-3.5 w-3.5" />
                  Wave
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium">
                  <CreditCard className="h-3.5 w-3.5" />
                  Carte
                </div>
              </div>
            </div>

            {/* Note annonce gratuite */}
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700">
              <Gift className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Si c'est votre première annonce, elle sera publiée{' '}
                <strong>gratuitement</strong> — aucun paiement requis.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {preview ? `Payer ${formatXof(preview.commission)}` : 'Publier l\'annonce'}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Paiement sécurisé via PayTech · Durée de publication : 60 jours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
