'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Aucun token de verification fourni.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
        } else {
          const msg = data.error || data.message || '';
          if (msg.includes('expire')) {
            setStatus('expired');
          } else {
            setStatus('error');
          }
          setErrorMessage(msg || 'Lien de verification invalide ou deja utilise');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Erreur de connexion au serveur.');
      });
  }, [token]);

  async function handleResend() {
    if (!resendEmail || !resendEmail.includes('@')) return;
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage('Email envoye ! Consultez votre boite mail.');
      } else {
        setResendMessage(data.error || 'Erreur lors du renvoi.');
      }
    } catch {
      setResendMessage('Erreur lors du renvoi.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-lg">
      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Verification en cours...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Email verifie avec succes !
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Votre compte est maintenant actif. Vous pouvez vous connecter et commencer a explorer.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            Se connecter
          </Link>
        </>
      )}

      {(status === 'error' || status === 'expired') && (
        <>
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {status === 'expired' ? 'Lien expire' : 'Lien invalide'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {errorMessage}
          </p>

          {/* Formulaire de renvoi */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              Entrez votre email pour recevoir un nouveau lien :
            </p>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm dark:bg-gray-800"
            />
            <button
              onClick={handleResend}
              disabled={resendLoading || !resendEmail}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {resendLoading ? 'Envoi en cours...' : 'Renvoyer l\'email de verification'}
            </button>
            {resendMessage && (
              <p className={`text-sm ${resendMessage.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>
                {resendMessage}
              </p>
            )}
          </div>

          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Retour a la connexion
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
