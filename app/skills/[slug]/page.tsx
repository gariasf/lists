import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SkillRun from '@/components/SkillRun'
import { SKILLS, getSkill } from '@/lib/skills'
import { getAllLists } from '@/lib/lists'

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
  return {
    title: `${skill.name} · Skill`,
    description: skill.description,
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

  return <SkillRun skill={skill} allLists={catalog} />
}
