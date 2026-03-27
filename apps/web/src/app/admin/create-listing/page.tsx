import type { Metadata } from 'next';
import { CreateListingForSellerForm } from '@/components/admin/create-listing-form';

export const metadata: Metadata = { title: 'Creer une annonce' };
export const dynamic = 'force-dynamic';

export default function AdminCreateListingPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold mb-6">Creer une annonce pour un vendeur</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        Cette annonce sera publiee directement dans le compte du vendeur. Il pourra la voir et la gerer depuis son dashboard.
      </p>
      <CreateListingForSellerForm />
    </div>
  );
}
