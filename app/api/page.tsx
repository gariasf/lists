import type { Metadata } from 'next'
import ApiShell from '@/components/ApiShell'
import { getAllLists } from '@/lib/lists'

export const metadata: Metadata = {
  title: 'API — plain URLs, no key | Lists',
  description:
    'Every curated list as JSON, plain text or CSV. Open CORS, no key, no rate limit, plus seeded sampling that returns the same items every run.',
}

export default async function ApiPage() {
  const lists = await getAllLists()
  return (
    <ApiShell
      allLists={lists.map((l) => ({
        slug: l.slug,
        name: l.name,
        category: l.category,
      }))}
    />
  )
}
