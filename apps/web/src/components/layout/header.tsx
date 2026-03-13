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
          <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
            <path d="M10 21.5c0-1.2.8-2.2 2.4-2.8 1.6-.6 3-.4 4.2-1.2s1.6-2.2 2-3.4.8-2.4 1.8-3.2 2.2-.8 3-.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="11" cy="22.5" r="1.2" fill="white" opacity="0.6" />
            <circle cx="14.5" cy="18" r="0.8" fill="white" opacity="0.4" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl tracking-[0.08em] font-bold">
            samadal
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
