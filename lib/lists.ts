import { promises as fs } from 'fs'
import path from 'path'
import { ListItem, Category } from './types'
import {
  LIST_DEFINITIONS,
  LocalSource,
  UpstreamSource,
} from './lists-data'
import { AUDIT_OVERRIDES } from './audit-overrides'

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/listsfordesign/Lists/master/Lists'
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data', 'lists')

const itemsCache = new Map<string, string[]>()
const structuredCache = new Map<string, Record<string, unknown>[]>()

async function fetchUpstream({ file }: UpstreamSource): Promise<string[]> {
  if (itemsCache.has(`upstream:${file}`)) {
    return itemsCache.get(`upstream:${file}`)!
  }
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/${file}`, {
      next: { revalidate: 86400 },
    })
    if (!response.ok) {
      console.error(`Failed to fetch ${file}: ${response.status}`)
      return []
    }
    const text = await response.text()
    const items = text.split('\n').map((l) => l.trim()).filter((l) => l !== '')
    itemsCache.set(`upstream:${file}`, items)
    return items
  } catch (error) {
    console.error(`Error fetching ${file}:`, error)
    return []
  }
}

async function loadLocal(
  source: LocalSource,
): Promise<{ items: string[]; structured?: Record<string, unknown>[] }> {
  const cacheKey = `local:${source.file}`
  if (itemsCache.has(cacheKey)) {
    return {
      items: itemsCache.get(cacheKey)!,
      structured: structuredCache.get(cacheKey),
    }
  }

  const fullPath = path.join(LOCAL_DATA_DIR, source.file)
  try {
    const raw = await fs.readFile(fullPath, 'utf8')

    if (source.format === 'txt') {
      // Only treat `# ` (hash + space) as a comment marker. Bare `#`
      // is legitimate content for hashtag / channel / order-id lists.
      const items = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '' && !l.startsWith('# '))
      itemsCache.set(cacheKey, items)
      return { items }
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      console.error(`Local JSON ${source.file} must be an array`)
      return { items: [] }
    }

    if (parsed.every((x) => typeof x === 'string')) {
      const items = parsed as string[]
      itemsCache.set(cacheKey, items)
      return { items }
    }

    const structured = parsed as Record<string, unknown>[]
    const key = source.valueKey
    if (!key) {
      console.error(
        `Local JSON ${source.file} has objects but no valueKey configured`,
      )
      return { items: [] }
    }
    const items = structured.map((row) => String(row[key] ?? ''))
    itemsCache.set(cacheKey, items)
    structuredCache.set(cacheKey, structured)
    return { items, structured }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      console.error(`Error reading local list ${source.file}:`, err)
    }
    return { items: [] }
  }
}

export async function getList(slug: string): Promise<ListItem | null> {
  const def = LIST_DEFINITIONS.find((d) => d.slug === slug)
  if (!def) return null

  // Audit-pass override: full replacement from data/lists/audit-overrides/<slug>.txt.
  // Bypasses upstream + any other local sources for the slug. See
  // audit-reports/ for the parallel-expert findings that produced these.
  if (AUDIT_OVERRIDES.has(def.slug)) {
    const local = await loadLocal({
      file: `audit-overrides/${def.slug}.txt`,
      format: 'txt',
    })
    return {
      slug: def.slug,
      name: def.name,
      category: def.category,
      items: local.items,
      structured: undefined,
      format: 'txt',
    }
  }

  const upstreamItems = def.upstream ? await fetchUpstream(def.upstream) : []
  const local = def.local
    ? await loadLocal(def.local)
    : { items: [] as string[], structured: undefined as Record<string, unknown>[] | undefined }

  const layer = def.layer ?? 'append'
  let items: string[]
  if (def.upstream && def.local) {
    items = layer === 'replace' ? local.items : [...upstreamItems, ...local.items]
  } else if (def.local) {
    items = local.items
  } else {
    items = upstreamItems
  }

  return {
    slug: def.slug,
    name: def.name,
    category: def.category,
    items,
    structured: local.structured,
    format: def.local?.format === 'json' ? 'json' : 'txt',
  }
}

export async function getAllLists(): Promise<ListItem[]> {
  const lists = await Promise.all(
    LIST_DEFINITIONS.map(async (def) => getList(def.slug)),
  )
  return lists.filter((l): l is ListItem => l !== null && l.items.length > 0)
}

export async function getListsByCategory(category: Category): Promise<ListItem[]> {
  const allLists = await getAllLists()
  if (category === 'all') return allLists
  return allLists.filter((l) => l.category === category)
}

export function getPreviewItems(items: string[], count: number = 10): string[] {
  return items.slice(0, count)
}

export function getAllSlugs(): string[] {
  return LIST_DEFINITIONS.map((d) => d.slug)
}
