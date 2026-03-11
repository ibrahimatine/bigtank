import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Samadal — Chaussures Grandes Tailles au Senegal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
          gap: 20,
        }}
      >
        {/* Logo text */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          Samadal
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 80,
            height: 6,
            background: '#e94560',
            borderRadius: 3,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: '#e94560',
            textAlign: 'center',
          }}
        >
          Chaussures Grandes Tailles au Senegal
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          EU 46 et plus · Nike · Jordan · Adidas · New Balance
        </div>

        {/* URL badge */}
        <div
          style={{
            marginTop: 32,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 40,
            padding: '10px 28px',
            fontSize: 20,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          samadal.net
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
