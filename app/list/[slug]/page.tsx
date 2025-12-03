import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ListPageContent from '@/components/ListPageContent'
import { getList, getAllSlugs } from '@/lib/lists'

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

  return (
    <>
      <Header />
      <main className="list-page">
        <Link href="/" className="list-page-back">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to all lists
        </Link>
        <div className="list-page-container">
          <div className="list-page-header">
            <h1 className="list-page-title">{list.name}</h1>
          </div>
          <ListPageContent
            items={list.items}
            listName={list.name}
            slug={slug}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
