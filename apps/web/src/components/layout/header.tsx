import Link from 'next/link';
import { NavSearchBar } from './nav-search-bar';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-primary)] text-white">
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl tracking-[0.15em] shrink-0"
        >
          SAMA<span className="text-[var(--color-accent)]">DAL</span>
        </Link>

        <div className="hidden sm:block flex-1 max-w-md">
          <NavSearchBar />
        </div>

        <nav className="flex items-center gap-3 sm:gap-4 text-sm">
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors font-medium"
          >
            Explorer
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <UserNav />
        </nav>
      </div>

      <div className="sm:hidden px-4 pb-3">
        <NavSearchBar />
      </div>
    </header>
  );
}
