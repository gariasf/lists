import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SkillRun from '@/components/SkillRun'
import { SKILLS, getSkill } from '@/lib/skills'
import { getAllLists } from '@/lib/lists'

const BASE_URL = 'https://lists.gariasf.com'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return SKILLS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) return { title: 'Skill not found' }

  const url = `${BASE_URL}/skills/${slug}/`
  const title = `${skill.name} — AI generator`
  const description = skill.description

  return {
    title,
    description,
    keywords: [
      skill.name.toLowerCase(),
      'AI generator',
      'mock data',
      'design mockup',
      skill.tagline.toLowerCase(),
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

export default async function SkillPage({ params }: PageProps) {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) notFound()

  const lists = await getAllLists()
  const catalog = lists.map((l) => ({
    slug: l.slug,
    name: l.name,
    category: l.category,
  }))

  const url = `${BASE_URL}/skills/${slug}/`

  const skillLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${skill.name} — Lists Skill`,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    description: skill.description,
    url,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    creator: { '@type': 'Organization', name: 'Lists', url: BASE_URL },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'All Lists', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Skills', item: `${BASE_URL}/skills/` },
      { '@type': 'ListItem', position: 3, name: skill.name, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <SkillRun skill={skill} allLists={catalog} />
    </>
  )
}
