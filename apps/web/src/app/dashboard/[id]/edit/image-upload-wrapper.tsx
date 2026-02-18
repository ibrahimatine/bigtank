'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/dashboard/image-upload';

interface Props {
  listingId: string;
  images: { id: string; url: string; key: string; order: number }[];
}

export function ImageUploadWrapper({ listingId, images }: Props) {
  const [currentImages] = useState(images);
  const router = useRouter();

  function handleImagesChange() {
    router.refresh();
  }

  return (
    <ImageUpload
      listingId={listingId}
      existingImages={currentImages}
      onImagesChange={handleImagesChange}
    />
  );
}
