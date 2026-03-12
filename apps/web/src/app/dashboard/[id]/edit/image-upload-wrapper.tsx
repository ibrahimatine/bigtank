'use client';

import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/dashboard/image-upload';

interface Props {
  listingId: string;
  images: { id: string; url: string; key: string; order: number }[];
}

export function ImageUploadWrapper({ listingId, images }: Props) {
  const router = useRouter();

  function handleImagesChange() {
    router.refresh();
  }

  return (
    <ImageUpload
      listingId={listingId}
      existingImages={images}
      onImagesChange={handleImagesChange}
    />
  );
}
