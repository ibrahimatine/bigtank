'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

interface StartConversationButtonProps {
  listingId: string;
  sellerId: string;
}

export function StartConversationButton({
  listingId,
  sellerId,
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // L'user est le vendeur lui-meme
  const isSeller = user?.id === sellerId;

  const handleOpen = () => {
    if (!user) {
      router.push(`/login?redirect=/shoes/${listingId}`);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi');
        return;
      }

      const conversationId = data?.data?.conversation?.id ?? data?.conversation?.id;
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
        setOpen(false);
      }
    } catch {
      setError('Erreur reseau. Reessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (isSeller) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Contacter le vendeur
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                Contacter le vendeur
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Ecrivez votre premier message pour demarrer la conversation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="Bonjour, est-ce que cet article est toujours disponible ?"
                rows={4}
                autoFocus
                className="w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] resize-none transition-colors"
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
