'use client';

import { usePathname } from 'next/navigation';
import { SearchBar } from '@/components/search/search-bar';

const HIDDEN_PATHS = ['/dashboard', '/profile', '/chat'];

export function NavSearchBar() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return <SearchBar />;
}
