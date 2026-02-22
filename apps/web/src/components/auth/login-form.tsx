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
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

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
      setError(result.error);
    } else {
      const role = result.user?.role;
      const destination = rawRedirect || (role === 'ADMIN' ? '/admin' : '/dashboard');
      router.push(destination);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
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
  );
}
