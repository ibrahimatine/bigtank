'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, UserCircle, MessageCircle } from 'lucide-react';

export function UserNav() {
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useSocket();

  if (loading) {
    return <Skeleton className="h-8 w-20 rounded-lg" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm hover:text-[var(--color-accent)] transition-colors"
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 transition-colors"
        >
          Inscription
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
        {/* Avatar avec badge non-lu visible sans ouvrir le menu */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm hidden sm:inline">{user.name.split(' ')[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-auto bg-[var(--color-accent)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        {(user.role === 'SELLER' || user.role === 'ADMIN') && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Mes annonces
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === 'USER' && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Devenir vendeur
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-500">
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
