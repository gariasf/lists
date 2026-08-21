import { NextResponse } from 'next/server'
import { CHURN, LIST_DEFINITIONS } from '@/lib/lists-data'
import VERIFIED from '@/data/verified.json'

export const dynamic = 'force-static'

export async function GET() {
  const index = LIST_DEFINITIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    category: d.category,
    url: `/api/lists/${d.slug}`,
    ...((VERIFIED as Record<string, string>)[d.slug]
      ? { verified: (VERIFIED as Record<string, string>)[d.slug] }
      : {}),
    ...(CHURN[d.slug] ? { churn: CHURN[d.slug].every } : {}),
  }))

  return NextResponse.json(
    {
      count: index.length,
      lists: index,
    },
    {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    },
  )
}
