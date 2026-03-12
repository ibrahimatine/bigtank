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
          className="flex items-center gap-2 shrink-0"
        >
          <svg className="h-7 w-7 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.5 17.5c0-1.5 1-2.5 3-3s4-.5 5.5-1.5 2-3 2.5-4.5S14.5 5.5 16 4.5s3.5-1 5-.5 2 2 2.5 3.5.5 3 .5 4.5v5.5c0 1.5-1 2.5-2.5 2.5H5c-1.5 0-2.5-1-2.5-2.5z" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-[0.15em]">
            SAMA<span className="text-[var(--color-accent)]">DAL</span>
          </span>
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
