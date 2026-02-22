'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useSocket } from '@/components/providers/socket-provider';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function getNotifUrl(notif: AppNotification): string | null {
  if (!notif.data) return null;
  if (notif.type === 'NEW_MESSAGE' && notif.data.conversationId) {
    return `/chat/${notif.data.conversationId}`;
  }
  return null;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { onMessage } = useSocket();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const count = data?.data?.count ?? data?.count ?? 0;
      setUnreadCount(count);
    } catch {
      // silencieux
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=15', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list: AppNotification[] = data?.data?.notifications ?? data?.notifications ?? [];
      setNotifications(list);
      const unread = list.filter((n) => !n.readAt).length;
      setUnreadCount(unread);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger le compteur au mount + polling 30s
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Incrémenter en temps réel quand un message arrive (pas envoyé par soi-même)
  useEffect(() => {
    if (!user) return;
    const unsub = onMessage((message) => {
      if (message.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return unsub;
  }, [user, onMessage]);

  // Fermer au clic hors du dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen((prev) => !prev);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silencieux
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={handleToggle}
        className="relative p-1.5 hover:opacity-80 transition-opacity"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Chargement…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notif.readAt ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notif.readAt) markAsRead(notif.id);
                    const url = getNotifUrl(notif);
                    if (url) {
                      setOpen(false);
                      router.push(url);
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.readAt ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug truncate">
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.readAt && (
                    <div className="mt-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                  {notif.readAt && (
                    <Check className="h-3.5 w-3.5 text-gray-300 mt-1 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
