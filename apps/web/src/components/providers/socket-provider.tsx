'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '@/lib/api';
import { useAuth } from './auth-provider';

const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:4003';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  onMessage: (handler: (message: ChatMessage) => void) => () => void;
  sendMessage: (conversationId: string, content: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      // Deconnexion si pas d'user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Fetch le token JWT pour Socket.io (cookie httpOnly non accessible JS)
    let cancelled = false;

    async function initSocket() {
      try {
        const res = await fetch('/api/auth/socket-token');
        if (!res.ok || cancelled) return;

        const { token } = await res.json();
        if (!token || cancelled) return;

        // Fetch le nombre initial de non lus
        const unreadRes = await fetch('/api/chat/unread-count');
        if (unreadRes.ok && !cancelled) {
          const unreadData = await unreadRes.json();
          setUnreadCount(unreadData?.data?.count ?? unreadData?.count ?? 0);
        }

        if (cancelled) return;

        const socket = io(CHAT_SERVICE_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (!cancelled) setIsConnected(true);
        });

        socket.on('disconnect', () => {
          if (!cancelled) setIsConnected(false);
        });

        // Quand un nouveau message arrive, incrementer le compteur non lus
        socket.on('new_message', () => {
          if (!cancelled) {
            setUnreadCount((prev) => prev + 1);
          }
        });
      } catch {
        // Erreur silencieuse — l'user pourra recharger
      }
    }

    initSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user]);

  const onMessage = useCallback(
    (handler: (message: ChatMessage) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on('new_message', handler);
      return () => {
        socket.off('new_message', handler);
      };
    },
    [],
  );

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('send_message', { conversationId, content });
  }, []);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socketRef.current?.emit('typing', { conversationId, isTyping });
    },
    [],
  );

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId });
  }, []);

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        unreadCount,
        setUnreadCount,
        decrementUnread,
        onMessage,
        sendMessage,
        sendTyping,
        markRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
