'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
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
  if (notif.type === 'NEW_LISTING_PUBLISHED' && notif.data.listingId) {
    return `/admin/listings`;
  }
  return null;
}

/** Icone selon le type de notification */
function getNotifEmoji(type: string): string {
  switch (type) {
    case 'NEW_MESSAGE': return '💬';
    case 'WELCOME': return '👋';
    case 'NEW_LISTING_PUBLISHED': return '📦';
    case 'LISTING_SOLD': return '🎉';
    case 'PAYMENT_RECEIVED': return '💰';
    case 'LISTING_EXPIRING': return '⏰';
    default: return '🔔';
  }
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

  useEffect(() => {
    if (!user) return;
    const unsub = onMessage((message) => {
      if (message.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return unsub;
  }, [user, onMessage]);

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
    if (!open) fetchNotifications();
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--color-card)] text-[var(--color-card-foreground)] rounded-2xl shadow-2xl border border-[var(--color-border)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste de notifications — style messages */}
          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--color-muted-foreground)]">Chargement…</div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Aucune notification pour le moment
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[var(--color-muted)] ${
                    !notif.readAt ? 'bg-[var(--color-accent)]/5' : ''
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
                  {/* Avatar — initiale de l'envoyeur pour les messages, "S" pour le reste */}
                  <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                    {notif.type === 'NEW_MESSAGE' && notif.data?.senderName
                      ? notif.data.senderName.charAt(0).toUpperCase()
                      : 'S'}
                  </div>

                  {/* Contenu — style message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {notif.type === 'NEW_MESSAGE' && notif.data?.senderName
                          ? notif.data.senderName
                          : 'Samadal'}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted-foreground)]">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Le "message" = body de la notification avec emoji du type */}
                    <div className={`mt-1 text-[13px] leading-snug ${!notif.readAt ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'}`}>
                      <span className="mr-1.5">{getNotifEmoji(notif.type)}</span>
                      {notif.body}
                    </div>
                  </div>

                  {/* Point non-lu */}
                  {!notif.readAt && (
                    <div className="mt-2 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    </div>
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
