import { Suspense } from 'react'
import type { Metadata } from 'next'
import SkillsShell from '@/components/SkillsShell'
import { getAllLists } from '@/lib/lists'

export const metadata: Metadata = {
  title: 'Skills',
  description:
    'Curated AI recipes that compose lists + generation into coherent mock-data scenarios.',
}

export default async function SkillsPage() {
  const lists = await getAllLists()
  const catalog = lists.map((l) => ({
    slug: l.slug,
    name: l.name,
    category: l.category,
  }))
  return (
    <Suspense fallback={null}>
      <SkillsShell allLists={catalog} />
    </Suspense>
  )
}
