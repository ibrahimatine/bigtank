'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, User } from 'lucide-react';
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
      <div className="text-center py-16 text-[var(--color-muted-foreground)]">
        <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Aucune conversation</p>
        <p className="text-sm mt-1">
          Contactez un vendeur depuis une annonce pour demarrer une conversation.
        </p>
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
