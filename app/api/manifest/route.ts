import { NextResponse } from 'next/server'
import { LIST_DEFINITIONS } from '@/lib/lists-data'

export const dynamic = 'force-static'

export async function GET() {
  const index = LIST_DEFINITIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    category: d.category,
    url: `/api/lists/${d.slug}`,
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
