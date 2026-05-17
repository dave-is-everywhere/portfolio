import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Dave Park - An Enabler';

const fontPath = (name: string) =>
  join(process.cwd(), 'public/fonts/pretendard', name);

export default async function Image() {
  // Satori supports WOFF (not WOFF2) — must use .woff files here
  const [light, regular, bold] = await Promise.all([
    readFile(fontPath('Pretendard-Light.woff')),
    readFile(fontPath('Pretendard-Regular.woff')),
    readFile(fontPath('Pretendard-Bold.woff')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          color: '#FFFFFF',
          fontFamily: 'Pretendard',
          backgroundColor: '#020203',
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(58,134,255,0.22) 0%, rgba(2,2,3,0) 60%)',
        }}
      >
        {/* ─── Decorative particles ────────────────────────── */}
        {[
          { top: 90,  left: 220, size: 4, glow: '#3A86FF', op: 0.7 },
          { top: 160, left: 980, size: 3, glow: '#FFFFFF', op: 0.5 },
          { top: 470, left: 140, size: 5, glow: '#3A86FF', op: 0.6 },
          { top: 540, left: 1070,size: 3, glow: '#FFFFFF', op: 0.7 },
          { top: 380, left: 1130,size: 4, glow: '#8338EC', op: 0.5 },
          { top: 220, left: 1080,size: 2, glow: '#FFFFFF', op: 0.6 },
          { top: 510, left: 320, size: 2, glow: '#FFFFFF', op: 0.5 },
          { top: 110, left: 700, size: 3, glow: '#3A86FF', op: 0.5 },
          { top: 80,  left: 1050,size: 2, glow: '#FFFFFF', op: 0.4 },
          { top: 590, left: 720, size: 3, glow: '#3A86FF', op: 0.6 },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top:    p.top,
              left:   p.left,
              width:  p.size,
              height: p.size,
              borderRadius: 999,
              backgroundColor: p.glow,
              opacity: p.op,
              boxShadow: `0 0 ${p.size * 4}px ${p.glow}`,
            }}
          />
        ))}

        {/* ─── Top-left logo ──────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            letterSpacing: '0.12em',
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 24px #3A86FF',
            }}
          />
          DAVE IS EVERYWHERE
        </div>

        {/* ─── Top-right version ──────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            fontSize: 14,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 400,
            textTransform: 'uppercase',
          }}
        >
          <div>V 2.0.24</div>
          <div>ENG // KOR</div>
        </div>

        {/* ─── Center hero ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 144,
              fontWeight: 300,
              letterSpacing: '0.02em',
              lineHeight: 1.05,
              color: '#FFFFFF',
            }}
          >
            An Enabler
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.88)',
              textTransform: 'uppercase',
            }}
          >
            Who Turns Ideas Into Reality
          </div>
        </div>

        {/* ─── Bottom meta ─────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 80,
            right: 80,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 16,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          <div>Portfolio · Seongwoong Park</div>
          <div style={{ color: '#3A86FF' }}>Location: South Korea</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Pretendard', data: light,   weight: 300, style: 'normal' },
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
        { name: 'Pretendard', data: bold,    weight: 700, style: 'normal' },
      ],
    },
  );
}
