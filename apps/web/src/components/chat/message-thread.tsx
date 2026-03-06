'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import type { ChatMessage, Conversation } from '@/lib/api';
import { MessageInput } from './message-input';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-SN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-SN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
          isOwn
            ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
            : 'bg-[#f0f0f0] text-[var(--color-foreground)] rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <p className={`text-[11px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
          {formatTime(message.createdAt)}
          {isOwn && message.readAt && (
            <span className="ml-1">· Lu</span>
          )}
        </p>
      </div>
    </div>
  );
}

// L'API renvoie les messages en DESC (plus recent en premier) — on trie ASC pour affichage
function sortAsc(msgs: ChatMessage[]): ChatMessage[] {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

interface MessageThreadProps {
  conversation: Conversation;
  initialMessages: ChatMessage[];
  currentUserId: string;
}

export function MessageThread({
  conversation,
  initialMessages,
  currentUserId,
}: MessageThreadProps) {
  const { onMessage, sendMessage, sendTyping, markRead, refreshUnreadCount, socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>(() => sortAsc(initialMessages));
  const [otherTyping, setOtherTyping] = useState(false);

  // Ref sur le conteneur scrollable — evite scrollIntoView qui scrolle la page entiere
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rejoindre la room
  useEffect(() => {
    if (socket) {
      socket.emit('join_conversation', { conversationId: conversation.id });
    }
  }, [socket, conversation.id]);

  // Marquer comme lu a l'ouverture + rafraichir le compteur de non lus
  useEffect(() => {
    markRead(conversation.id);
    refreshUnreadCount();
  }, [markRead, refreshUnreadCount, conversation.id]);

  // Scroll : instant au montage, uniquement si pres du bas pour les nouveaux messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isInitialMount.current) {
      el.scrollTop = el.scrollHeight;
      isInitialMount.current = false;
    } else {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (nearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, otherTyping]);

  // Nouveaux messages Socket.io
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      if (message.conversationId !== conversation.id) return;
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== currentUserId) {
        // Marquer comme lu et rafraichir le compteur (l'utilisateur est en train de lire)
        markRead(conversation.id);
        refreshUnreadCount();
      }
    },
    [conversation.id, currentUserId, markRead, refreshUnreadCount],
  );

  useEffect(() => {
    const unsubscribe = onMessage(handleNewMessage);
    return unsubscribe;
  }, [onMessage, handleNewMessage]);

  // Indicateur de frappe
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        setOtherTyping(data.isTyping);
        if (data.isTyping) {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      }
    };

    socket.on('user_typing', handleTyping);
    return () => {
      socket.off('user_typing', handleTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socket, conversation.id, currentUserId]);

  // Statut "Lu"
  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = (data: {
      conversationId: string;
      readBy: string;
      readAt: string;
    }) => {
      if (data.conversationId === conversation.id && data.readBy !== currentUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUserId && !m.readAt
              ? { ...m, readAt: data.readAt }
              : m,
          ),
        );
      }
    };

    socket.on('messages_read', handleMessagesRead);
    return () => {
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, conversation.id, currentUserId]);

  // Grouper par jour (messages deja tries ASC)
  const grouped: { day: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) {
      last.messages.push(msg);
    } else {
      grouped.push({ day, messages: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zone scrollable avec ref directe */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {grouped.map(({ day, messages: dayMessages }) => (
            <div key={day}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[11px] text-[var(--color-muted-foreground)] px-2 select-none">
                  {day}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              <div className="space-y-1.5">
                {dayMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Indicateur de frappe */}
          {otherTyping && (
            <div className="flex justify-start pt-1">
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[#f0f0f0]">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-card)]">
        <MessageInput
          onSend={(content) => sendMessage(conversation.id, content)}
          onTypingChange={(typing) => sendTyping(conversation.id, typing)}
        />
      </div>
    </div>
  );
}
