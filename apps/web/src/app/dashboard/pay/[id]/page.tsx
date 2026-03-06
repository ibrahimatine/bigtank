'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Gift, Loader2, CheckCircle2, Clock } from 'lucide-react';
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

type PaymentMethodKey = 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';

const PAYMENT_METHODS: { key: PaymentMethodKey; label: string; color: string; bgColor: string }[] = [
  { key: 'ORANGE_MONEY', label: 'Orange Money', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  { key: 'WAVE', label: 'Wave', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'FREE_MONEY', label: 'Free Money', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
];

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

  // Nouveaux états pour Intech
  const [phone, setPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>('ORANGE_MONEY');
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [, setRefCommand] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger les données initiales + numéro de téléphone du profil
  useEffect(() => {
    async function load() {
      try {
        const [previewRes, listingRes, profileRes] = await Promise.all([
          fetch(`/api/payments/preview/${id}`),
          fetch(`/api/listings/${id}`),
          fetch('/api/auth/me'),
        ]);

        if (previewRes.ok) {
          const d = await previewRes.json();
          setPreview(d.data ?? d);
        }
        if (listingRes.ok) {
          const d = await listingRes.json();
          setListing(d.data ?? d);
        }
        if (profileRes.ok) {
          const d = await profileRes.json();
          const user = d.data ?? d.user ?? d;
          if (user.phone) setPhone(user.phone);
        }
      } catch {
        setError('Impossible de charger les informations de paiement.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Polling du statut de paiement
  const startPolling = useCallback((ref: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${encodeURIComponent(ref)}`);
        if (!res.ok) return;

        const data = await res.json();
        const status = data.data?.status ?? data.status;

        if (status === 'COMPLETED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          router.push('/dashboard/payment/success');
        } else if (status === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setWaitingConfirmation(false);
          setError('Le paiement a échoué. Veuillez réessayer.');
        }
      } catch {
        // Silently retry
      }
    }, 5000);
  }, [router]);

  // Cleanup du polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handlePay = async () => {
    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone.');
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: id,
          phone: phone.trim(),
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.data?.error || data.message || 'Erreur lors du paiement.');
        return;
      }

      const result = data.data ?? data;

      if (result.isFree) {
        router.push('/dashboard/payment/success?free=1');
        return;
      }

      // Le push USSD a été envoyé — passer en mode attente
      setRefCommand(result.refCommand);
      setWaitingConfirmation(true);
      startPolling(result.refCommand);
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

  // Écran d'attente de confirmation (après envoi du push USSD)
  if (waitingConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[var(--color-primary)] px-6 py-5 text-white">
              <h1 className="text-lg font-bold">En attente de confirmation</h1>
              <p className="text-sm opacity-80 mt-0.5">
                Validez le paiement sur votre téléphone
              </p>
            </div>

            <div className="p-6 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <Clock className="h-16 w-16 text-[var(--color-primary)] animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  Vérifiez votre téléphone
                </p>
                <p className="text-sm text-gray-600">
                  Un message de paiement a été envoyé sur le numéro <strong>{phone}</strong>.
                  Entrez votre code PIN pour confirmer le paiement de{' '}
                  <strong>{preview ? formatXof(preview.commission) : '...'}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification en cours...
              </div>

              <button
                onClick={() => {
                  if (pollingRef.current) clearInterval(pollingRef.current);
                  setWaitingConfirmation(false);
                  setRefCommand(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Annuler et réessayer
              </button>
            </div>
          </div>
        </div>
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

        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <span className="text-gray-600">Prix de l&apos;annonce</span>
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

            {/* Sélecteur de méthode de paiement */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Méthode de paiement
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setSelectedMethod(method.key)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium border-2 transition-all ${
                      selectedMethod === method.key
                        ? `${method.bgColor} ${method.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    {method.label}
                    {selectedMethod === method.key && (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Champ numéro de téléphone */}
            <div>
              <label htmlFor="phone" className="text-xs text-gray-500 mb-1.5 block font-medium uppercase tracking-wide">
                Numéro de téléphone
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2.5 rounded-lg font-medium">
                  +221
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="77 000 00 00"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Le numéro sur lequel vous recevrez la demande de paiement
              </p>
            </div>

            {/* Note annonce gratuite */}
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700">
              <Gift className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Si c&apos;est votre première annonce, elle sera publiée{' '}
                <strong>gratuitement</strong> — aucun paiement requis.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={paying || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  {preview ? `Payer ${formatXof(preview.commission)}` : 'Publier l\'annonce'}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Paiement sécurisé via Intech · Durée de publication : 60 jours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
