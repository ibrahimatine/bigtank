'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Suggestion {
  id: string;
  slug: string;
  title: string;
  brand: string;
  sizeEu: number;
  priceXof: number;
  thumbnailUrl: string | null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(
          `${API_BASE}/listings/search?q=${encodeURIComponent(query.trim())}&limit=5`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const unwrapped = json.data !== undefined ? json.data : json;
        const items: Suggestion[] = Array.isArray(unwrapped)
          ? unwrapped
          : (unwrapped.data ?? []);
        setSuggestions(items);
        setShowDropdown(items.length > 0);
      } catch {
        // ignore network errors silently
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/search');
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <input
          type="search"
          placeholder="Rechercher Nike, Jordan, taille 47..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:bg-white/20 transition-colors"
        />
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-[var(--color-border)] z-50 overflow-hidden">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/shoes/${suggestion.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-muted)] transition-colors"
              onClick={() => {
                setShowDropdown(false);
                setQuery('');
              }}
            >
              <div className="w-10 h-10 rounded-md bg-[var(--color-muted)] shrink-0 overflow-hidden">
                {suggestion.thumbnailUrl ? (
                  <img
                    src={suggestion.thumbnailUrl}
                    alt={suggestion.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    👟
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  {suggestion.brand} &middot; EU {suggestion.sizeEu}
                </p>
                <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                  {suggestion.title}
                </p>
              </div>
              <span className="text-sm font-bold text-[var(--color-accent)] shrink-0">
                {formatPrice(suggestion.priceXof)}
              </span>
            </Link>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 text-xs text-center text-[var(--color-accent)] hover:bg-[var(--color-muted)] border-t border-[var(--color-border)] transition-colors font-medium"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowDropdown(false);
              router.push(`/search?query=${encodeURIComponent(query.trim())}`);
            }}
          >
            Voir tous les résultats pour &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
