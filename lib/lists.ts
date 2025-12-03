import { ListItem, Category } from './types'
import { LIST_DEFINITIONS, getSlugFromFile } from './lists-data'

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/listsfordesign/Lists/master/Lists'

// Cache for fetched lists
const listCache = new Map<string, string[]>()

export async function fetchListItems(file: string): Promise<string[]> {
  if (listCache.has(file)) {
    return listCache.get(file)!
  }

  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/${file}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${file}: ${response.status}`)
      return []
    }

    const text = await response.text()
    const items = text.split('\n').filter((line) => line.trim() !== '')
    listCache.set(file, items)
    return items
  } catch (error) {
    console.error(`Error fetching ${file}:`, error)
    return []
  }
}

export async function getList(slug: string): Promise<ListItem | null> {
  const definition = LIST_DEFINITIONS.find(
    (d) => getSlugFromFile(d.file) === slug
  )

  if (!definition) {
    return null
  }

  const items = await fetchListItems(definition.file)

  return {
    slug,
    name: definition.name,
    category: definition.category,
    items,
  }
}

export async function getAllLists(): Promise<ListItem[]> {
  const lists = await Promise.all(
    LIST_DEFINITIONS.map(async (definition) => {
      const items = await fetchListItems(definition.file)
      return {
        slug: getSlugFromFile(definition.file),
        name: definition.name,
        category: definition.category,
        items,
      }
    })
  )

  return lists.filter((list) => list.items.length > 0)
}

export async function getListsByCategory(category: Category): Promise<ListItem[]> {
  const allLists = await getAllLists()

  if (category === 'all') {
    return allLists
  }

  return allLists.filter((list) => list.category === category)
}

export function getPreviewItems(items: string[], count: number = 10): string[] {
  return items.slice(0, count)
}

export function getAllSlugs(): string[] {
  return LIST_DEFINITIONS.map((d) => getSlugFromFile(d.file))
}
