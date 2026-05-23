import { ImageResponse } from 'next/og'
import { getList, getAllSlugs } from '@/lib/lists'

export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Lists — realistic mock data'

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const list = await getList(slug)
  const name = list?.name ?? 'List not found'
  const count = list?.items.length ?? 0
  const sample = list?.items.slice(0, 4) ?? []

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
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#0B0B0B',
              color: '#fafaf9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0B0B0B' }}>
            Lists
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 18,
              color: '#737373',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            lists.gariasf.com
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: name.length > 22 ? 80 : 104,
              fontWeight: 700,
              color: '#0B0B0B',
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#525252',
              fontWeight: 400,
            }}
          >
            {`${count.toLocaleString()} realistic items - copy as text, JSON, or CSV`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '18px 22px',
            background: '#ffffff',
            borderRadius: 14,
            boxShadow: '0 0 0 1px rgba(11,11,11,0.06), 0 4px 12px rgba(11,11,11,0.04)',
          }}
        >
          {sample.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 20,
                color: '#262626',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                letterSpacing: -0.3,
              }}
            >
              <div style={{ color: '#a3a3a3', width: 28, display: 'flex' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ display: 'flex' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
