import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMyProfile } from '@/lib/api';
import { ListingForm } from '@/components/dashboard/listing-form';

export const metadata: Metadata = {
  title: 'Nouvelle annonce',
};

export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  try {
    const profile = await getMyProfile();
    if ((profile.role as string) !== 'SELLER') {
      redirect('/dashboard');
    }
  } catch {
    redirect('/dashboard');
  }

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
