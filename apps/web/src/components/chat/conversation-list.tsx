'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuth } from '@/components/providers/auth-provider';
import type { Conversation } from '@/lib/api';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
}

function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const isbuyer = conversation.buyerId === currentUserId;
  const otherUser = isbuyer ? conversation.seller : conversation.buyer;
  const thumbnail = conversation.listing.images[0]?.url;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-3 p-4 hover:bg-[var(--color-muted)] transition-colors border-b border-[var(--color-border)] last:border-0"
    >
      {/* Thumbnail annonce */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={conversation.listing.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{otherUser.name}</p>
          <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
          {conversation.listing.title}
        </p>
      </div>
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

  // Remonte la conversation correspondante en tête de liste quand nouveau message
  const handleNewMessage = useCallback((message: { conversationId: string; createdAt: string }) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === message.conversationId);
      if (idx === -1) return prev;

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

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-6">
        {/* Illustration — bulles de chat */}
        <svg
          viewBox="0 0 120 100"
          className="w-28 h-24 mb-6 text-[var(--color-muted-foreground)] opacity-25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Bulle principale */}
          <rect x="8" y="10" width="70" height="48" rx="12" />
          <line x1="20" y1="30" x2="56" y2="30" />
          <line x1="20" y1="42" x2="46" y2="42" />
          <polyline points="8,58 8,70 22,58" />
          {/* Bulle secondaire (plus petite, en bas droite) */}
          <rect x="50" y="52" width="62" height="36" rx="10" />
          <line x1="62" y1="66" x2="98" y2="66" />
          <line x1="62" y1="76" x2="84" y2="76" />
          <polyline points="112,88 112,98 98,88" />
        </svg>

        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold mb-2">
          Aucune conversation
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">
          Vous n&apos;avez pas encore de messages. Trouvez une annonce et contactez le vendeur pour demarrer une conversation.
        </p>

        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-4 w-4" />
          Explorer les annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          currentUserId={user.id}
        />
      ))}
    </div>
  );
}
