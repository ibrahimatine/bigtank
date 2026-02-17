'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: string;
  url: string;
  order: number;
  width: number;
  height: number;
}

export function ListingGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-[var(--color-muted)] rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)]">
        Pas de photos
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => a.order - b.order);
  const active = sorted[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-[var(--color-muted)] rounded-lg overflow-hidden">
        <Image
          src={active.url}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                i === activeIndex
                  ? 'border-[var(--color-accent)]'
                  : 'border-transparent hover:border-[var(--color-border)]'
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
