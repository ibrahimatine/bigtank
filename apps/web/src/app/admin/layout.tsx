import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Users, ShoppingBag, Shield, Receipt, Flag, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: 'Administration',
  },
  robots: { index: false, follow: false },
};

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users, exact: false },
  { href: '/admin/listings', label: 'Annonces', icon: ShoppingBag, exact: false },
  { href: '/admin/reports', label: 'Signalements', icon: Flag, exact: false },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt, exact: false },
  { href: '/admin/tools', label: 'Outils', icon: Wrench, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-red-500" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
              Administration
            </h2>
          </div>
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

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-border)] flex justify-around py-2 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[9px] leading-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
