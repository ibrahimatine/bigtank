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
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
          isOwn
            ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
            : 'bg-white border border-[var(--color-border)] rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? 'text-white/70' : 'text-[var(--color-muted-foreground)]'
          }`}
        >
          {formatTime(message.createdAt)}
          {isOwn && message.readAt && (
            <span className="ml-1">· Lu</span>
          )}
        </p>
      </div>
    </div>
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
  const { onMessage, sendMessage, sendTyping, markRead, socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rejoindre la room de conversation
  useEffect(() => {
    if (socket) {
      socket.emit('join_conversation', { conversationId: conversation.id });
    }
  }, [socket, conversation.id]);

  // Marquer comme lu a l'ouverture
  useEffect(() => {
    markRead(conversation.id);
  }, [markRead, conversation.id]);

  // Ecoute des nouveaux messages
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      if (message.conversationId !== conversation.id) return;
      setMessages((prev) => [...prev, message]);
      // Marquer comme lu si c'est de l'autre
      if (message.senderId !== currentUserId) {
        markRead(conversation.id);
      }
    },
    [conversation.id, currentUserId, markRead],
  );

  useEffect(() => {
    const unsubscribe = onMessage(handleNewMessage);
    return unsubscribe;
  }, [onMessage, handleNewMessage]);

  // Ecoute du statut "en train d'ecrire"
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (
        data.conversationId === conversation.id &&
        data.userId !== currentUserId
      ) {
        setOtherTyping(data.isTyping);
        if (data.isTyping) {
          // Auto-reset apres 3s si pas de mise a jour
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

  // Ecoute des messages lus
  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = (data: {
      conversationId: string;
      readBy: string;
      readAt: string;
    }) => {
      if (
        data.conversationId === conversation.id &&
        data.readBy !== currentUserId
      ) {
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

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

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

  const handleSend = (content: string) => {
    sendMessage(conversation.id, content);
  };

  const handleTypingChange = (typing: boolean) => {
    sendTyping(conversation.id, typing);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {grouped.map(({ day, messages: dayMessages }) => (
          <div key={day}>
            {/* Separateur de jour */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-xs text-[var(--color-muted-foreground)] px-2">
                {day}
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <div className="space-y-2">
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
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-white border border-[var(--color-border)]">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input envoi */}
      <div className="border-t border-[var(--color-border)] p-4">
        <MessageInput onSend={handleSend} onTypingChange={handleTypingChange} />
      </div>
    </div>
  );
}
