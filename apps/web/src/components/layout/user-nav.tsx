'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';

export function UserNav() {
  const { user, loading, logout } = useAuth();

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
        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-white">
          {initials}
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
