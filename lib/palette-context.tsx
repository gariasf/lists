'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Category } from './types'

export interface CatalogEntry {
  slug: string
  name: string
  category: Category
}

interface PaletteContextValue {
  catalog: CatalogEntry[]
  open: boolean
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
  recent: string[]
  pushRecent: (slug: string) => void
  pinned: string[]
  togglePin: (slug: string) => void
  isPinned: (slug: string) => boolean
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

const RECENT_KEY = 'lists.recent'
const PINNED_KEY = 'lists.pinned'
const MAX_RECENT = 8

function safeRead(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function safeWrite(key: string, value: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or storage disabled — ignore
  }
}

export function PaletteProvider({
  catalog,
  children,
}: {
  catalog: CatalogEntry[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [pinned, setPinned] = useState<string[]>([])
  const validSlugs = useMemo(() => new Set(catalog.map((c) => c.slug)), [catalog])

  useEffect(() => {
    setRecent(safeRead(RECENT_KEY).filter((s) => validSlugs.has(s)))
    setPinned(safeRead(PINNED_KEY).filter((s) => validSlugs.has(s)))
  }, [validSlugs])

  const openPalette = useCallback(() => setOpen(true), [])
  const closePalette = useCallback(() => setOpen(false), [])
  const togglePalette = useCallback(() => setOpen((o) => !o), [])

  const pushRecent = useCallback(
    (slug: string) => {
      if (!validSlugs.has(slug)) return
      setRecent((prev) => {
        const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT)
        safeWrite(RECENT_KEY, next)
        return next
      })
    },
    [validSlugs],
  )

  const togglePin = useCallback(
    (slug: string) => {
      if (!validSlugs.has(slug)) return
      setPinned((prev) => {
        const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
        safeWrite(PINNED_KEY, next)
        return next
      })
    },
    [validSlugs],
  )

  const isPinned = useCallback((slug: string) => pinned.includes(slug), [pinned])

  const value = useMemo<PaletteContextValue>(
    () => ({
      catalog,
      open,
      openPalette,
      closePalette,
      togglePalette,
      recent,
      pushRecent,
      pinned,
      togglePin,
      isPinned,
    }),
    [
      catalog,
      open,
      openPalette,
      closePalette,
      togglePalette,
      recent,
      pushRecent,
      pinned,
      togglePin,
      isPinned,
    ],
  )

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error('usePalette must be used inside <PaletteProvider>')
  return ctx
}
