'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus(res.ok ? 'success' : 'error');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600">Verification en cours...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Email verifie avec succes !
          </h1>
          <p className="mt-2 text-gray-600">
            Votre compte est maintenant actif. Vous pouvez commencer a explorer.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            Explorer les chaussures
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Lien invalide ou deja utilise
          </h1>
          <p className="mt-2 text-gray-600">
            Ce lien de verification a expire ou a deja ete utilise.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            Se connecter
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600">Chargement...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
