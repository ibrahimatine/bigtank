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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Messages
          </h1>
          {conversations.length > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <ConversationList initialConversations={conversations} />
      </div>
    </div>
  );
}
