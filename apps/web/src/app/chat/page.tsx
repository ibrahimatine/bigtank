import { MessageCircle } from 'lucide-react';
import { getConversations } from '@/lib/api';
import { ConversationList } from '@/components/chat/conversation-list';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  let conversations: Awaited<ReturnType<typeof getConversations>>['data'] = [];

  try {
    const result = await getConversations();
    conversations = result.data;
  } catch {
    // Auth error ou API indisponible
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Mes messages
        </h1>
      </div>

      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <ConversationList initialConversations={conversations} />
      </div>
    </div>
  );
}
