'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const oauthError = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setNeedsVerification(false);
    setResendMessage('');

    const parsed = loginSchema.safeParse({ emailOrPhone, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const result = await login(emailOrPhone, password);
    setLoading(false);

    if (result.error) {
      // Detecter si c'est une erreur de verification email
      if (result.error.toLowerCase().includes('verifier votre email') || result.error.toLowerCase().includes('verifiez votre email')) {
        setNeedsVerification(true);
      }
      setError(result.error);
    } else {
      const role = result.user?.role;
      const destination = rawRedirect || (role === 'ADMIN' ? '/admin' : '/');
      router.push(destination);
      router.refresh();
    }
  }

  async function handleResend() {
    if (!emailOrPhone.includes('@')) {
      setResendMessage('Entrez votre adresse email pour renvoyer le lien.');
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage('Email de verification renvoye ! Consultez votre boite mail.');
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
    <div className="space-y-4">
      <div className="space-y-3">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google?mode=login`}
          className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuer avec Google
        </a>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/facebook?mode=login`}
          className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#166FE5] transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Continuer avec Facebook
        </a>
      </div>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
        <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-900 px-4 text-gray-500">ou</span></div>
      </div>
    <form onSubmit={handleSubmit} className="space-y-4">
      {oauthError && !error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800">
          {decodeURIComponent(oauthError)}
        </div>
      )}
      {error && (
        <div className={`p-3 rounded-lg text-sm ${needsVerification ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-red-50 text-red-600'}`}>
          <p>{error}</p>
          {needsVerification && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm font-medium underline hover:no-underline"
              >
                {resendLoading ? 'Envoi en cours...' : 'Renvoyer l\'email de verification'}
              </button>
              {resendMessage && (
                <p className="mt-1 text-xs">{resendMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="emailOrPhone">Email ou telephone</Label>
        <Input
          id="emailOrPhone"
          type="text"
          placeholder="email@exemple.com ou 221770001122"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          autoComplete="username"
        />
        {fieldErrors.emailOrPhone && (
          <p className="text-xs text-red-500">{fieldErrors.emailOrPhone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-500">{fieldErrors.password}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">
          Mot de passe oublie ?
        </Link>
      </div>

      <Button type="submit" className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-[var(--color-accent)] hover:underline">
          Creer un compte
        </Link>
      </p>
    </form>
    </div>
  );
}
