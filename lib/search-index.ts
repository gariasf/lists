import fuzzysort from 'fuzzysort'

type Prepared = ReturnType<typeof fuzzysort.prepare>

export interface RawIndexList {
  slug: string
  name: string
  cat: string
  items: string[]
}

export interface RawIndex {
  version: number
  lists: RawIndexList[]
}

export interface IndexList {
  slug: string
  name: string
  cat: string
  nameTarget: Prepared
}

export interface IndexItem {
  value: string
  listIdx: number
  target: Prepared
}

export interface LoadedIndex {
  lists: IndexList[]
  items: IndexItem[]
}

let cache: Promise<LoadedIndex | null> | null = null

export function loadSearchIndex(): Promise<LoadedIndex | null> {
  if (cache) return cache
  cache = (async () => {
    if (typeof window === 'undefined') return null
    try {
      const res = await fetch('/search-index.json', { cache: 'force-cache' })
      if (!res.ok) {
        console.warn('[search-index] fetch failed', res.status)
        return null
      }
      const raw = (await res.json()) as RawIndex
      const lists: IndexList[] = raw.lists.map((l) => ({
        slug: l.slug,
        name: l.name,
        cat: l.cat,
        nameTarget: fuzzysort.prepare(l.name),
      }))
      const items: IndexItem[] = []
      raw.lists.forEach((l, idx) => {
        for (const value of l.items) {
          items.push({ value, listIdx: idx, target: fuzzysort.prepare(value) })
        }
      })
      return { lists, items }
    } catch (err) {
      console.warn('[search-index] load error', err)
      cache = null
      return null
    }
  })()
  return cache
}

export type FuzzyMatch = ReturnType<typeof fuzzysort.single>

