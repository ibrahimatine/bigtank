import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { getConversationById, getConversationMessages } from '@/lib/api';
import { MessageThread } from '@/components/chat/message-thread';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bt_access')?.value;
    if (!token) return null;

    // Decode le payload JWT sans verification (deja verifie par le middleware)
    const [, payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decoded.sub || null;
  } catch {
    return null;
  }
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;

  let conversation;
  let messagesData;

  try {
    [conversation, messagesData] = await Promise.all([
      getConversationById(id),
      getConversationMessages(id),
    ]);
  } catch {
    notFound();
  }

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) notFound();

  const isbuyer = conversation.buyerId === currentUserId;
  const otherUser = isbuyer ? conversation.seller : conversation.buyer;
  const thumbnail = conversation.listing.images[0]?.url;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header conversation */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/chat"
          className="p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
          aria-label="Retour aux messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Info interlocuteur */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{otherUser.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] truncate">
              {conversation.listing.title}
            </p>
          </div>
        </div>

        {/* Lien vers l'annonce */}
        <Link
          href={`/shoes/${conversation.listing.slug}`}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors shrink-0"
          title="Voir l'annonce"
        >
          {thumbnail ? (
            <div className="relative w-8 h-8 rounded overflow-hidden">
              <Image
                src={thumbnail}
                alt={conversation.listing.title}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <ShoppingBag className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          )}
        </Link>
      </div>

      {/* Thread de messages */}
      <div className="flex-1 bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <MessageThread
          conversation={conversation}
          initialMessages={messagesData.data}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
