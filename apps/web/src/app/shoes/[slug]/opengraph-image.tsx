import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Annonce Samadal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = 'Annonce Samadal';
  let brand = '';
  let price = '';
  let sizeEu = '';
  let imageUrl: string | null = null;

  try {
    const res = await fetch(`${API_BASE}/listings/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const listing = json.data ?? json;
      title = listing.title || title;
      brand = listing.brand || '';
      sizeEu = listing.sizeEu ? `EU ${listing.sizeEu}` : '';
      price = listing.priceXof
        ? new Intl.NumberFormat('fr-SN').format(listing.priceXof) + ' FCFA'
        : '';
      imageUrl = listing.images?.[0]?.url || null;
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 60,
          gap: 48,
        }}
      >
        {/* Image produit */}
        {imageUrl && (
          <div
            style={{
              width: 440,
              height: 510,
              borderRadius: 20,
              overflow: 'hidden',
              display: 'flex',
              background: '#2a2a3e',
            }}
          >
            <img
              src={imageUrl}
              width={440}
              height={510}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Infos */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {/* Brand + size */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 24,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {brand && <span>{brand}</span>}
            {brand && sizeEu && <span>·</span>}
            {sizeEu && <span>{sizeEu}</span>}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
            }}
          >
            {title.length > 60 ? title.slice(0, 57) + '...' : title}
          </div>

          {/* Price */}
          {price && (
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#e94560',
                marginTop: 8,
              }}
            >
              {price}
            </div>
          )}

          {/* Samadal badge */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#e94560',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: 'white',
              }}
            >
              S
            </div>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>
              samadal.net
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
