import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, UserCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const navItems = [
  { href: '/dashboard', label: 'Mes annonces', icon: LayoutDashboard },
  { href: '/dashboard/new', label: 'Nouvelle annonce', icon: PlusCircle },
  { href: '/profile', label: 'Mon profil', icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold mb-4">
            Dashboard
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
