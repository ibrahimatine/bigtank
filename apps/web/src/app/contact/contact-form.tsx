'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name') as string,
      email: form.get('email') as string,
      subject: form.get('subject') as string,
      message: form.get('message') as string,
    };

    if (!data.name || !data.email || !data.subject || !data.message) {
      setError('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      setSent(true);
    } catch {
      setError('Une erreur est survenue. Essayez d\'envoyer un email a hello@samadal.net directement.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-[var(--color-success)]" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-2">
          Message envoye !
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Nous vous repondrons sous 48h a l&apos;adresse indiquee.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-6">
        Envoyer un message
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="name">Nom</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Votre nom"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="subject">Sujet</label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder="Comment pouvons-nous vous aider ?"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            placeholder="Decrivez votre demande..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-destructive)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Envoyer
            </>
          )}
        </button>
      </form>
    </div>
  );
}
