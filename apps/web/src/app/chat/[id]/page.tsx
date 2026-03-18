import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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

  const isSystem = (conversation as unknown as Record<string, unknown>).isSystem === true;
  const isbuyer = conversation.buyerId === currentUserId;
  const otherUser = isbuyer ? conversation.seller : conversation.buyer;
  const displayName = isSystem ? 'Samadal' : otherUser.name;
  const thumbnail = conversation.listing?.images?.[0]?.url;
  const price = conversation.listing
    ? ((conversation.listing as unknown as Record<string, unknown>).priceXof as number | undefined)
    : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header conversation */}
      <div className="flex items-center gap-3 pb-4 mb-0">
        <Link
          href="/chat"
          className="p-2 -ml-2 rounded-xl hover:bg-[var(--color-muted)] transition-colors"
          aria-label="Retour aux messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Avatar + Nom */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
            isSystem
              ? 'bg-[var(--color-accent)] text-white text-base'
              : 'bg-[var(--color-accent)] text-white'
          }`}>
            {isSystem ? 'S' : otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
              {isSystem
                ? 'Messages de l\'equipe Samadal'
                : `${conversation.listing?.title ?? ''}${price ? ` · ${price.toLocaleString('fr-SN')} FCFA` : ''}`
              }
            </p>
          </div>
        </div>

        {/* Lien vers l'annonce (pas pour les conversations systeme) */}
        {!isSystem && conversation.listing && (
          <Link
            href={`/shoes/${conversation.listing.slug}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-muted)] transition-colors shrink-0 border border-[var(--color-border)]"
            title="Voir l'annonce"
          >
            {thumbnail ? (
              <div className="relative w-7 h-7 rounded-md overflow-hidden">
                <Image
                  src={thumbnail}
                  alt={conversation.listing.title}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
            ) : null}
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
          </Link>
        )}
      </div>

      {/* Thread de messages */}
      <div className="flex-1 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <MessageThread
          conversation={conversation}
          initialMessages={messagesData.data}
          currentUserId={currentUserId}
          isSystemConversation={isSystem}
        />
      </div>
    </div>
  );
}
