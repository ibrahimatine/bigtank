import Link from 'next/link';
import { SearchBar } from '@/components/search/search-bar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-primary)] text-white">
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight shrink-0"
        >
          Big<span className="text-[var(--color-accent)]">Tank</span>
        </Link>

        <div className="hidden sm:block flex-1 max-w-md">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/search"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            Explorer
          </Link>
        </nav>
      </div>

      <div className="sm:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
