'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    setLoading(true);
    setError('');

    try {
      const isEmail = emailOrPhone.includes('@');
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEmail ? { email: emailOrPhone } : { phone: emailOrPhone },
        ),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || data.message || 'Une erreur est survenue');
      }
    } catch {
      setError('Erreur de connexion. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Email envoye !</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Si un compte existe avec ces informations, vous recevrez un email avec un lien pour reinitialiser votre mot de passe. Le lien expire dans 1 heure.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4">
              Retour a la connexion
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la connexion
      </Link>

      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center mb-2">
        Mot de passe oublie
      </h1>
      <p className="text-center text-sm text-[var(--color-muted-foreground)] mb-8">
        Entrez votre email pour recevoir un lien de reinitialisation
      </p>

      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="emailOrPhone">Email</Label>
            <Input
              id="emailOrPhone"
              type="email"
              placeholder="votre@email.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
            disabled={loading || !emailOrPhone.trim()}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </Button>
        </form>
      </div>
    </div>
  );
}
