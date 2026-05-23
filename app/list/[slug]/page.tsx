import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import DetailShell from '@/components/DetailShell'
import { getList, getAllSlugs, getAllLists } from '@/lib/lists'

const BASE_URL = 'https://lists.gariasf.com'

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

  const url = `${BASE_URL}/list/${slug}/`
  const title = `${list.name} — ${list.items.length} realistic items`
  const description = `${list.items.length} curated ${list.name.toLowerCase()} for mockups, fixtures, and seed data. Copy as plain text, JSON, or CSV. Free to use.`

  return {
    title,
    description,
    keywords: [
      list.name.toLowerCase(),
      list.category,
      'mock data',
      'fake data',
      'sample data',
      'placeholder',
      'design mockup',
      'lorem ipsum alternative',
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'Lists',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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

  const url = `${BASE_URL}/list/${slug}/`

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: list.name,
    alternateName: list.slug,
    description: `${list.items.length} curated ${list.name.toLowerCase()} for designers and developers. Real-looking mock data for mockups, fixtures, and seed data.`,
    url,
    keywords: [list.name, list.category, 'mock data', 'fake data', 'placeholder', 'design'],
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Lists',
      url: BASE_URL,
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'text/plain',
        contentUrl: `${BASE_URL}/api/lists/${slug}`,
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${BASE_URL}/api/lists/${slug}`,
      },
    ],
    variableMeasured: list.name,
    measurementTechnique: 'Curated list of realistic mock data items',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'All Lists', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: list.name, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <DetailShell list={list} relatedLists={relatedLists} allLists={allLists} />
    </>
  )
}
