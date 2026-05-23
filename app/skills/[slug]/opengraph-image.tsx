import { ImageResponse } from 'next/og'
import { SKILLS, getSkill } from '@/lib/skills'

export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Lists Skill — AI generator for designers'

export async function generateStaticParams() {
  return SKILLS.map((s) => ({ slug: s.slug }))
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = getSkill(slug)
  const name = skill?.name ?? 'Skill not found'
  const tagline = skill?.tagline ?? ''

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
          <div
            style={{
              fontSize: 14,
              padding: '4px 10px',
              borderRadius: 999,
              background: '#0B0B0B',
              color: '#fafaf9',
              fontWeight: 600,
              marginLeft: 6,
            }}
          >
            SKILL
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
            powered by AI
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: name.length > 18 ? 88 : 112,
              fontWeight: 700,
              color: '#0B0B0B',
              letterSpacing: -2.5,
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
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 20,
            color: '#525252',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              background: '#0B0B0B',
              color: '#fafaf9',
              borderRadius: 10,
              fontWeight: 600,
              display: 'flex',
              gap: 8,
            }}
          >
            Generate
          </div>
          <div>One click. Free. No signup.</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
