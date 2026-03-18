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

// Extraire l'origine (protocol + host) de l'URL API pour le WebSocket
const CHAT_SERVICE_URL = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return 'http://localhost:4000';
  try {
    return new URL(apiUrl).origin;
  } catch {
    // Fallback : retirer /api seulement en fin d'URL
    return apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:4000';
  }
})();

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  refreshUnreadCount: () => Promise<void>;
  onMessage: (handler: (message: ChatMessage) => void) => () => void;
  sendMessage: (conversationId: string, content: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch('/api/chat/unread-count', { cache: 'no-store' });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.count ?? data?.data?.count ?? data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    const count = await fetchUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setUnreadCount(0);
      }
      return;
    }

    let cancelled = false;

    async function getToken(): Promise<string | null> {
      try {
        const res = await fetch('/api/auth/socket-token');
        if (!res.ok) return null;
        const { token } = await res.json();
        return token || null;
      } catch {
        return null;
      }
    }

    async function initSocket() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        // Fetch le nombre initial de non lus
        const initialCount = await fetchUnreadCount();
        if (!cancelled) setUnreadCount(initialCount);

        if (cancelled) return;

        const socket = io(CHAT_SERVICE_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (!cancelled) setIsConnected(true);
        });

        socket.on('disconnect', () => {
          if (!cancelled) setIsConnected(false);
        });

        // Rafraichir le token avant chaque tentative de reconnexion
        socket.on('reconnect_attempt', async () => {
          const freshToken = await getToken();
          if (freshToken && !cancelled) {
            socket.auth = { token: freshToken };
          }
        });

        socket.on('connect_error', async () => {
          // Si erreur d'auth, essayer avec un nouveau token
          if (!cancelled) {
            const freshToken = await getToken();
            if (freshToken) {
              socket.auth = { token: freshToken };
            }
          }
        });

        // Nouveau message — incrementer SEULEMENT si ce n'est pas le message de l'utilisateur courant
        socket.on('new_message', (message: ChatMessage) => {
          if (!cancelled && message.senderId !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
        });
      } catch {
        // Erreur silencieuse
      }
    }

    initSocket();

    // Polling de secours toutes les 30s pour rester synchronise avec le serveur
    const pollInterval = setInterval(async () => {
      if (!cancelled) {
        const count = await fetchUnreadCount();
        if (!cancelled) setUnreadCount(count);
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnected],
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
        refreshUnreadCount,
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
