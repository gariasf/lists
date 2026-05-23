import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import DetailShell from '@/components/DetailShell'
import { getList, getAllSlugs, getAllLists } from '@/lib/lists'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const list = await getList(slug)

  if (!list) {
    return { title: 'List Not Found' }
  }

  return {
    title: `${list.name} - Lists`,
    description: `${list.items.length} items in the ${list.name} list. Copy-paste real content for your designs.`,
  }
}

export default async function ListPage({ params }: PageProps) {
  const { slug } = await params
  const list = await getList(slug)

  if (!list) {
    notFound()
  }

  const allLists = await getAllLists()
  const relatedLists = allLists
    .filter((l) => l.category === list.category && l.slug !== list.slug)
    .slice(0, 5)

  return <DetailShell list={list} relatedLists={relatedLists} allLists={allLists} />
}
