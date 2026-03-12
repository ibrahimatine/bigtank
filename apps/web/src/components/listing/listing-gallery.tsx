'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  order: number;
  width: number;
  height: number;
}

export function ListingGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const sorted = [...images].sort((a, b) => a.order - b.order);

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, sorted.length - 1)));
  }, [sorted.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
    setTouchStart(null);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-[var(--color-muted)] rounded-2xl flex flex-col items-center justify-center text-[var(--color-muted-foreground)] gap-2">
        <span className="text-5xl">👟</span>
        <span className="text-sm">Pas de photos</span>
      </div>
    );
  }

  const active = sorted[activeIndex];

  return (
    <>
      <div className="space-y-3">
        {/* Image principale */}
        <div
          className="relative aspect-square bg-[var(--color-muted)] rounded-2xl overflow-hidden cursor-zoom-in group"
          onClick={() => setZoomed(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={active.url}
            alt=""
            fill
            className="object-contain transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Zoom icon */}
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4 text-white" />
          </div>

          {/* Nav arrows */}
          {sorted.length > 1 && (
            <>
              {activeIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {activeIndex < sorted.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </>
          )}

          {/* Dots indicator mobile */}
          {sorted.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 sm:hidden">
              {sorted.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Miniatures desktop */}
        {sorted.length > 1 && (
          <div className="hidden sm:flex gap-2 overflow-x-auto pb-1">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 ring-2 transition-all ${
                  i === activeIndex
                    ? 'ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-background)]'
                    : 'ring-transparent hover:ring-[var(--color-border)]'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setZoomed(false)}
        >
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Nav dans le zoom */}
          {sorted.length > 1 && activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {sorted.length > 1 && activeIndex < sorted.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div className="relative w-full max-w-3xl aspect-square mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.url}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {activeIndex + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  );
}
