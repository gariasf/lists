import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Lists — real content for designers'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: '#fafaf9',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#0B0B0B',
              color: '#fafaf9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: '#0B0B0B' }}>
            Lists
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: '#0B0B0B',
              letterSpacing: -3,
              lineHeight: 0.95,
            }}
          >
            Real content
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: '#0B0B0B',
              letterSpacing: -3,
              lineHeight: 0.95,
            }}
          >
            for your designs.
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#525252',
              fontWeight: 400,
              marginTop: 8,
            }}
          >
            365 curated lists - 5 AI generators - free + open source
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 14,
            fontSize: 22,
            color: '#525252',
          }}
        >
          {['names', 'prices', 'addresses', 'colors', 'IBANs'].map((label) => (
            <div
              key={label}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                color: '#262626',
                borderRadius: 999,
                boxShadow: '0 0 0 1px rgba(11,11,11,0.08)',
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
