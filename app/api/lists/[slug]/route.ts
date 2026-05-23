import { NextResponse } from 'next/server'
import { getList, getAllSlugs } from '@/lib/lists'

export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params
  const list = await getList(slug)

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }

  return NextResponse.json(
    {
      slug: list.slug,
      name: list.name,
      category: list.category,
      count: list.items.length,
      format: list.format,
      items: list.items,
      ...(list.structured ? { structured: list.structured } : {}),
    },
    {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    },
  )
}
