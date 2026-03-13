'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingSearchResult } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@samadal/shared-types';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' F';
}

function timeAgo(ts: number): string {
  const ms = ts < 1e10 ? ts * 1000 : ts;
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 2592000) return `il y a ${Math.floor(diff / 604800)} sem`;
  return `il y a ${Math.floor(diff / 2592000)} mois`;
}

function isNew(ts: number): boolean {
  const ms = ts < 1e10 ? ts * 1000 : ts;
  return Date.now() - ms < 86400000;
}

const CONDITION_COLORS: Record<ListingCondition, string> = {
  NEW: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  LIKE_NEW: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  GOOD: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  FAIR: 'bg-stone-500/15 text-stone-600 dark:text-stone-400',
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: 'Disponible', style: 'bg-emerald-500 text-white' },
  SOLD: { label: 'Vendue', style: 'bg-stone-800 text-white' },
  RESERVED: { label: 'Reservee', style: 'bg-amber-500 text-white' },
};

/** Minimal swipe carousel — zero dependencies, touch + arrows */
function ImageCarousel({
  images,
  alt,
  isSoldOrReserved,
}: {
  images: string[];
  alt: string;
  isSoldOrReserved: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const touchRef = useRef<{ x: number; y: number; swiping: boolean }>({ x: 0, y: 0, swiping: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (dir: 1 | -1, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIdx((prev) => {
        const next = prev + dir;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY, swiping: false };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    // If horizontal swipe is dominant, mark as swiping
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      touchRef.current.swiping = true;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current.swiping) return;
      e.preventDefault();
      e.stopPropagation();
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      if (Math.abs(dx) > 30) {
        setIdx((prev) => {
          const next = dx < 0 ? prev + 1 : prev - 1;
          if (next < 0) return images.length - 1;
          if (next >= images.length) return 0;
          return next;
        });
      }
      touchRef.current.swiping = false;
    },
    [images.length],
  );

  // Block the parent Link click when user was swiping
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (touchRef.current.swiping) {
      e.preventDefault();
      e.stopPropagation();
      touchRef.current.swiping = false;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full group/carousel"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      {/* Current image with crossfade */}
      <Image
        key={idx}
        src={images[idx]}
        alt={`${alt} - ${idx + 1}`}
        fill
        className={`object-contain p-2 transition-opacity duration-200 ${isSoldOrReserved ? 'grayscale' : ''}`}
        sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {/* Desktop arrows — appear on hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => go(-1, e)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white dark:hover:bg-black/70"
            aria-label="Image precedente"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-stone-700 dark:text-stone-200" />
          </button>
          <button
            onClick={(e) => go(1, e)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white dark:hover:bg-black/70"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-3.5 w-3.5 text-stone-700 dark:text-stone-200" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          {images.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIdx(i);
              }}
              className={`rounded-full transition-all duration-200 ${
                i === idx
                  ? 'w-4 h-1.5 bg-white shadow-sm'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
          {images.length > 5 && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          )}
        </div>
      )}
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingSearchResult }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const conditionColor =
    CONDITION_COLORS[listing.condition as ListingCondition] || 'bg-stone-500/15 text-stone-600';
  const isSoldOrReserved = listing.status === 'SOLD' || listing.status === 'RESERVED';
  const statusInfo = STATUS_CONFIG[listing.status];
  const isNewListing = isNew(listing.createdAt);

  // Build image list: prefer imageUrls, fallback to thumbnailUrl
  const images: string[] =
    listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls
      : listing.thumbnailUrl
        ? [listing.thumbnailUrl]
        : [];

  const hasImages = images.length > 0;

  return (
    <Link href={`/shoes/${listing.slug}`} className="group block">
      <div className={`bg-[var(--color-card)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 ${isSoldOrReserved ? 'opacity-60' : ''}`}>
        {/* Image area */}
        <div className="relative aspect-square bg-gradient-to-br from-[var(--color-muted)] via-[var(--color-muted)]/80 to-[var(--color-muted)]/40 overflow-hidden">
          {hasImages ? (
            images.length > 1 ? (
              <ImageCarousel
                images={images}
                alt={listing.title}
                isSoldOrReserved={isSoldOrReserved}
              />
            ) : (
              <Image
                src={images[0]}
                alt={listing.title}
                fill
                className={`object-contain p-2 ${isSoldOrReserved ? 'grayscale' : ''}`}
                sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M2 18c0-1 1-2 3-2.5S8 15 9 14s1.5-2.5 2-3.5S12.5 8 14 7s3-1 4.5-.5S21 8 21.5 9s.5 2.5.5 3.5V18c0 1-1 2-2 2H4c-1 0-2-1-2-2z" />
              </svg>
              <span className="text-[10px] sm:text-xs font-medium opacity-50">Pas de photo</span>
            </div>
          )}

          {/* Badges top */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-20 pointer-events-none">
            <span className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg tracking-wide shadow-sm">
              EU {listing.sizeEu}
            </span>
            {isNewListing && !isSoldOrReserved && (
              <span className="inline-flex items-center gap-0.5 bg-[var(--color-accent)] text-white text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-lg shadow-sm">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Nouveau
              </span>
            )}
          </div>

          {/* Statut */}
          {statusInfo && listing.status !== 'ACTIVE' && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 pointer-events-none">
              <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shadow-sm ${statusInfo.style}`}>
                {statusInfo.label}
              </span>
            </div>
          )}

          {/* Gradient overlay bas */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
        </div>

        {/* Infos */}
        <div className="p-2.5 sm:p-4">
          <div className="flex items-center justify-between gap-1.5">
            <p className="text-[10px] sm:text-xs text-[var(--color-muted-foreground)] uppercase tracking-[0.12em] sm:tracking-[0.15em] font-semibold truncate">
              {listing.brand}
            </p>
            <span className={`shrink-0 text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${conditionColor}`}>
              {conditionLabel}
            </span>
          </div>

          <h3 className="font-medium text-xs sm:text-[15px] mt-1 sm:mt-1.5 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-end justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--color-border)]/60">
            <span className="font-[family-name:var(--font-display)] text-base sm:text-2xl text-[var(--color-accent)] leading-none tracking-wide">
              {formatPrice(listing.priceXof)}
            </span>
            <div className="flex flex-col items-end gap-0.5">
              {listing.locationCity && (
                <span className="flex items-center gap-0.5 text-[9px] sm:text-[11px] text-[var(--color-muted-foreground)]">
                  <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">{listing.locationCity}</span>
                </span>
              )}
              <span className="text-[9px] sm:text-[11px] text-[var(--color-muted-foreground)]/50">
                {timeAgo(listing.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="p-2.5 sm:p-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12 sm:w-14" />
          <Skeleton className="h-4 w-14 sm:w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 sm:h-4 w-full" />
        <div className="flex justify-between pt-2 border-t border-[var(--color-border)]/60">
          <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
          <Skeleton className="h-3 w-10 sm:w-12" />
        </div>
      </div>
    </div>
  );
}
