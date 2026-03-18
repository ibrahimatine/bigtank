'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Search } from 'lucide-react';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuth } from '@/components/providers/auth-provider';
import type { Conversation } from '@/lib/api';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "maintenant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' });
}

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
}

function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const isSystem = conversation.isSystem === true;
  const isBuyer = conversation.buyerId === currentUserId;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;
  const displayName = isSystem ? 'Samadal' : otherUser.name;
  const thumbnail = conversation.listing?.images?.[0]?.url;
  const unread = (conversation._count?.messages ?? 0) > 0;
  const lastMessage = (conversation as unknown as Record<string, unknown>).lastMessage as { content: string; senderId: string } | null;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[var(--color-muted)]/60 ${
        unread ? 'bg-[var(--color-accent)]/[0.03]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isSystem ? (
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-base">
            S
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-sm font-semibold text-[var(--color-muted-foreground)] overflow-hidden">
            {otherUser.avatarUrl ? (
              <Image
                src={otherUser.avatarUrl}
                alt={otherUser.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              otherUser.name.charAt(0).toUpperCase()
            )}
          </div>
        )}
        {unread && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-card)]" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm truncate ${unread ? 'font-bold' : 'font-medium'}`}>
            {displayName}
          </p>
          <span className={`text-[11px] shrink-0 ${unread ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-muted-foreground)]'}`}>
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
          {isSystem ? 'Messages de Samadal' : (conversation.listing?.title ?? '')}
        </p>
        {lastMessage?.content && (
          <p className={`text-[13px] truncate mt-0.5 ${unread ? 'text-[var(--color-foreground)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
            {lastMessage.senderId === currentUserId ? 'Vous : ' : ''}
            {lastMessage.content}
          </p>
        )}
      </div>

      {/* Thumbnail annonce (pas pour les conversations systeme) */}
      {!isSystem && thumbnail && conversation.listing && (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0">
          <Image
            src={thumbnail}
            alt={conversation.listing.title}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      )}
    </Link>
  );
}

export function ConversationList({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const { user } = useAuth();
  const { onMessage } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [search, setSearch] = useState('');

  const handleNewMessage = useCallback((message: { conversationId: string; createdAt: string }) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === message.conversationId);
      if (idx === -1) {
        // Nouvelle conversation — la fetcher depuis l'API
        fetch(`/api/chat/conversations`, { cache: 'no-store' })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (!data) return;
            const list = data?.data ?? data ?? [];
            if (Array.isArray(list)) setConversations(list);
          })
          .catch(() => {});
        return prev;
      }

      const updated = { ...prev[idx], lastMessageAt: message.createdAt };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = onMessage(handleNewMessage as any);
    return unsubscribe;
  }, [onMessage, handleNewMessage]);

  if (!user) return null;

  // Filtrage par recherche
  const filtered = search.trim()
    ? conversations.filter((c) => {
        const other = c.buyerId === user.id ? c.seller : c.buyer;
        const q = search.toLowerCase();
        return other.name.toLowerCase().includes(q) || (c.listing?.title ?? '').toLowerCase().includes(q);
      })
    : conversations;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-20 px-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-5">
          <MessageCircle className="h-8 w-8 text-[var(--color-muted-foreground)] opacity-50" />
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold mb-2">
          Aucune conversation
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs leading-relaxed">
          Trouvez une paire qui vous plait et contactez le vendeur pour demarrer une conversation.
        </p>

        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Explorer les annonces
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Barre de recherche */}
      {conversations.length > 3 && (
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[var(--color-muted)]/50 border border-transparent focus:border-[var(--color-border)] outline-none transition-colors placeholder:text-[var(--color-muted-foreground)]"
            />
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="divide-y divide-[var(--color-border)]/50">
        {filtered.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            currentUserId={user.id}
          />
        ))}
      </div>

      {search && filtered.length === 0 && (
        <div className="px-4 py-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Aucun resultat pour &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
