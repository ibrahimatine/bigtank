import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMyListingById } from '@/lib/api';
import { ListingForm } from '@/components/dashboard/listing-form';
import { ImageUploadWrapper } from './image-upload-wrapper';

export const metadata: Metadata = {
  title: 'Modifier l\'annonce',
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;

  let listing;
  try {
    listing = await getMyListingById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
          Modifier l&apos;annonce
        </h1>
        <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
          <ListingForm mode="edit" initialData={listing} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
        <ImageUploadWrapper listingId={listing.id} images={listing.images} />
      </div>
    </div>
  );
}
