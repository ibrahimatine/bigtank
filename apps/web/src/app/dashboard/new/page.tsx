import type { Metadata } from 'next';
import { ListingForm } from '@/components/dashboard/listing-form';

export const metadata: Metadata = {
  title: 'Nouvelle annonce',
};

export default function NewListingPage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        Publier une annonce
      </h1>
      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
        <ListingForm mode="create" />
      </div>
    </div>
  );
}
