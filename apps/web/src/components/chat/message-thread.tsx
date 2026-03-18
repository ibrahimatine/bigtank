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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

function MessageBubble({ message, isOwn, isFirstInGroup, isLastInGroup }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
    >
      {/* Avatar pour les messages recus — seulement sur le dernier du groupe */}
      {!isOwn && (
        <div className="w-7 mr-2 shrink-0 self-end">
          {isLastInGroup && message.sender?.name ? (
            <div className="w-7 h-7 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[11px] font-semibold text-[var(--color-muted-foreground)]">
              {message.sender.name.charAt(0).toUpperCase()}
            </div>
          ) : null}
        </div>
      )}

      <div className={`max-w-[72%] min-w-[4.5rem]`}>
        {/* Nom expediteur — seulement premier du groupe et messages recus */}
        {!isOwn && isFirstInGroup && message.sender?.name && (
          <p className="text-[11px] font-medium text-[var(--color-muted-foreground)] mb-1 ml-1">
            {message.sender.name}
          </p>
        )}

        <div
          className={`
            relative px-3.5 py-2.5 text-[14px] leading-[1.45]
            ${isOwn
              ? `bg-[var(--color-accent)] text-white
                 ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-br-md' : ''}
                 ${isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-br-md' : ''}
                 ${!isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tr-md rounded-br-md' : ''}
                 ${!isFirstInGroup && !isLastInGroup ? 'rounded-xl rounded-r-md' : ''}
                 ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-br-md' : ''}
                `
              : `bg-[var(--color-muted)] text-[var(--color-foreground)]
                 ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-bl-md' : ''}
                 ${isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-bl-md' : ''}
                 ${!isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tl-md rounded-bl-md' : ''}
                 ${!isFirstInGroup && !isLastInGroup ? 'rounded-xl rounded-l-md' : ''}
                 ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-bl-md' : ''}
                `
            }
          `}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Heure + Lu */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/50' : 'text-[var(--color-muted-foreground)]'}`}>
            <span className="text-[10px]">{formatTime(message.createdAt)}</span>
            {isOwn && message.readAt && (
              <span className="text-[10px] font-medium">· Lu</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaySeparator({ day }: { day: string }) {
  return (
    <div className="flex items-center gap-4 my-6 px-2">
      <div className="flex-1 h-px bg-[var(--color-border)] opacity-50" />
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider select-none">
        {day}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)] opacity-50" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mt-3">
      <div className="w-7 mr-2 shrink-0" />
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--color-muted)]">
        <div className="flex gap-1 items-center h-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)] opacity-60 animate-bounce [animation-delay:0ms] [animation-duration:0.8s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)] opacity-60 animate-bounce [animation-delay:150ms] [animation-duration:0.8s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)] opacity-60 animate-bounce [animation-delay:300ms] [animation-duration:0.8s]" />
        </div>
      </div>
    </div>
  );
}

// Trier ASC pour affichage chronologique
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rejoindre la room
  useEffect(() => {
    if (socket) {
      socket.emit('join_conversation', { conversationId: conversation.id });
    }
  }, [socket, conversation.id]);

  // Marquer comme lu a l'ouverture
  useEffect(() => {
    markRead(conversation.id);
    refreshUnreadCount();
  }, [markRead, refreshUnreadCount, conversation.id]);

  // Scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isInitialMount.current) {
      el.scrollTop = el.scrollHeight;
      isInitialMount.current = false;
    } else {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (nearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, otherTyping]);

  // Nouveaux messages Socket.io
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      if (message.conversationId !== conversation.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId !== currentUserId) {
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

  // Grouper par jour
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
      {/* Zone scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Debut de la conversation
            </p>
          </div>
        )}

        {grouped.map(({ day, messages: dayMessages }) => (
          <div key={day}>
            <DaySeparator day={day} />

            {dayMessages.map((msg, i) => {
              const prevMsg = i > 0 ? dayMessages[i - 1] : null;
              const nextMsg = i < dayMessages.length - 1 ? dayMessages[i + 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                />
              );
            })}
          </div>
        ))}

        {otherTyping && <TypingIndicator />}

        {/* Espace en bas pour le scroll */}
        <div className="h-2" />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-3 sm:p-4 bg-[var(--color-card)]">
        <MessageInput
          onSend={(content) => sendMessage(conversation.id, content)}
          onTypingChange={(typing) => sendTyping(conversation.id, typing)}
        />
      </div>
    </div>
  );
}
