'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY_PREFIX = 'lists.augment.'

function storageKey(slug: string): string {
  return `${KEY_PREFIX}${slug}`
}

function safeRead(slug: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function safeWrite(slug: string, value: string[]) {
  if (typeof window === 'undefined') return
  try {
    if (value.length === 0) {
      window.localStorage.removeItem(storageKey(slug))
    } else {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(value))
    }
  } catch {
    /* quota / disabled — ignore */
  }
}

/**
 * Per-list user-augmented items stored in localStorage. Returned items render
 * after the original list. Survives reloads, not synced across devices.
 */
export function useAugment(slug: string) {
  const [extras, setExtras] = useState<string[]>([])

  useEffect(() => {
    setExtras(safeRead(slug))
  }, [slug])

  const append = useCallback(
    (items: string[]) => {
      setExtras((prev) => {
        const seen = new Set(prev.map((s) => s.toLowerCase()))
        const fresh = items.filter((s) => {
          const lower = s.toLowerCase().trim()
          if (!lower || seen.has(lower)) return false
          seen.add(lower)
          return true
        })
        const next = [...prev, ...fresh]
        safeWrite(slug, next)
        return next
      })
    },
    [slug],
  )

  const removeAt = useCallback(
    (index: number) => {
      setExtras((prev) => {
        const next = prev.filter((_, i) => i !== index)
        safeWrite(slug, next)
        return next
      })
    },
    [slug],
  )

  const clear = useCallback(() => {
    safeWrite(slug, [])
    setExtras([])
  }, [slug])

  return { extras, append, removeAt, clear }
}
