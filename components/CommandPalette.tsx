'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import fuzzysort from 'fuzzysort'
import { usePalette } from '@/lib/palette-context'
import { loadSearchIndex, type LoadedIndex } from '@/lib/search-index'
import {
  ArrowRight,
  CATEGORY_ICONS,
  Check,
  ChevronR,
  Copy,
  Layers,
  Search,
  Sparkles,
  Star,
  StarFilled,
} from '@/components/icons'

const MAX_LIST_RESULTS = 6
const MAX_ITEM_RESULTS = 8
const MIN_QUERY_LEN = 1
const MIN_ITEM_QUERY_LEN = 2

interface Row {
  key: string
  iconBg?: string
  iconColor?: string
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onActivate: () => void
  group: string
  pinSlug?: string
}

function highlightMatch(
  text: string,
  indexes: readonly number[] | null | undefined,
): ReactNode {
  if (!indexes || indexes.length === 0) return text
  const nodes: ReactNode[] = []
  let i = 0
  let cursor = 0
  for (const idx of indexes) {
    if (idx > cursor) nodes.push(text.slice(cursor, idx))
    nodes.push(<mark key={`m-${idx}`}>{text[idx]}</mark>)
    cursor = idx + 1
    i++
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return <>{nodes}</>
}

function parseRandomCommand(query: string): { count: number; rest: string } | null {
  const trimmed = query.trim()
  const m1 = /^random\s+(.+)$/i.exec(trimmed)
  if (m1) return { count: 1, rest: m1[1] }
  const m2 = /^(\d+)\s+(.+?)$/.exec(trimmed)
  if (m2) {
    const n = parseInt(m2[1], 10)
    if (n > 0 && n <= 1000) return { count: n, rest: m2[2] }
  }
  const m3 = /^(.+?)\s+x\s*(\d+)$/i.exec(trimmed)
  if (m3) {
    const n = parseInt(m3[2], 10)
    if (n > 0 && n <= 1000) return { count: n, rest: m3[1] }
  }
  return null
}

function parseGenCommand(query: string): { count: number; prompt: string } | null {
  const trimmed = query.trim()
  // "gen <prompt>" / "generate <prompt>" / "make <prompt>" / "create <prompt>"
  const m = /^(?:gen|generate|make|create|ai)\s+(.+)$/i.exec(trimmed)
  if (!m) return null
  const rest = m[1].trim()
  // Allow "gen 20 X" / "make 5 X"
  const m2 = /^(\d+)\s+(.+)$/.exec(rest)
  if (m2) {
    const n = parseInt(m2[1], 10)
    if (n > 0 && n <= 50) return { count: n, prompt: m2[2] }
  }
  return { count: 10, prompt: rest }
}

const LIST_MATCH_THRESHOLD = -1000

interface GenResult {
  prompt: string
  items: string[]
  ts: number
}

interface SemanticMatch {
  score: number
  value: string
  slug: string
  list: string
}

export default function CommandPalette() {
  const {
    catalog,
    open,
    closePalette,
    recent,
    pushRecent,
    pinned,
    togglePin,
    isPinned,
  } = usePalette()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [index, setIndex] = useState<LoadedIndex | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GenResult | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([])
  const [semanticQuery, setSemanticQuery] = useState('')
  const [semanticLoading, setSemanticLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const semanticAbortRef = useRef<AbortController | null>(null)
  const semanticDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    setGenerating(false)
    setGenError(null)
    setGenerated(null)
    setSemanticMatches([])
    setSemanticQuery('')
    setSemanticLoading(false)
    requestAnimationFrame(() => inputRef.current?.focus())
    if (!index) loadSearchIndex().then(setIndex)
  }, [open, index])

  // Debounced semantic search.
  useEffect(() => {
    if (!open) return
    const q = query.trim()

    if (semanticDebounceRef.current) {
      window.clearTimeout(semanticDebounceRef.current)
      semanticDebounceRef.current = null
    }
    if (semanticAbortRef.current) {
      semanticAbortRef.current.abort()
      semanticAbortRef.current = null
    }

    if (q.length < 3 || parseGenCommand(q) || parseRandomCommand(q)) {
      setSemanticMatches([])
      setSemanticQuery('')
      setSemanticLoading(false)
      return
    }

    semanticDebounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController()
      semanticAbortRef.current = controller
      setSemanticLoading(true)
      try {
        const res = await fetch('/api/ai/semantic', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 8 }),
          signal: controller.signal,
        })
        if (!res.ok) {
          setSemanticMatches([])
          return
        }
        const data = (await res.json()) as { matches: SemanticMatch[] }
        // Drop low-confidence hits to keep the section honest.
        const filtered = (data.matches ?? []).filter((m) => m.score >= 0.55)
        setSemanticMatches(filtered)
        setSemanticQuery(q)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSemanticMatches([])
        }
      } finally {
        if (semanticAbortRef.current === controller) {
          setSemanticLoading(false)
          semanticAbortRef.current = null
        }
      }
    }, 220)

    return () => {
      if (semanticDebounceRef.current) {
        window.clearTimeout(semanticDebounceRef.current)
        semanticDebounceRef.current = null
      }
    }
  }, [open, query])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as any)._t)
    ;(showToast as any)._t = window.setTimeout(() => setToast(null), 1700)
  }, [])

  const copyText = useCallback(
    async (text: string, msg: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast(msg)
      } catch (err) {
        console.error('copy failed', err)
      }
    },
    [showToast],
  )

  const goToList = useCallback(
    (slug: string) => {
      pushRecent(slug)
      closePalette()
      const href = `/list/${slug}/`
      const doc = document as Document & {
        startViewTransition?: (cb: () => void | Promise<void>) => unknown
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (doc.startViewTransition && !reduced) {
        doc.startViewTransition(() => {
          router.push(href)
        })
      } else {
        router.push(href)
      }
    },
    [pushRecent, closePalette, router],
  )

  const runGenerate = useCallback(
    async (prompt: string, count: number, listSlug?: string) => {
      if (!prompt) return
      setGenerating(true)
      setGenError(null)
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, count, listSlug }),
        })
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          const msg = err.error ?? `Generation failed (${res.status})`
          setGenError(msg)
          showToast(msg)
          return
        }
        const data = (await res.json()) as { items: string[]; prompt: string }
        setGenerated({ prompt, items: data.items, ts: Date.now() })
      } catch (err) {
        console.error('generate failed', err)
        setGenError('Network error')
        showToast('Network error')
      } finally {
        setGenerating(false)
      }
    },
    [showToast],
  )

  const randomFromSlug = useCallback(
    async (slug: string, count: number) => {
      try {
        const res = await fetch(`/api/lists/${slug}/`, { cache: 'force-cache' })
        if (!res.ok) {
          showToast('Could not fetch list')
          return
        }
        const data = (await res.json()) as { items: string[]; name: string }
        if (!data.items?.length) {
          showToast('List is empty')
          return
        }
        const picks: string[] = []
        const pool = [...data.items]
        const take = Math.min(count, pool.length)
        for (let i = 0; i < take; i++) {
          const j = Math.floor(Math.random() * pool.length)
          picks.push(pool.splice(j, 1)[0])
        }
        await navigator.clipboard.writeText(picks.join('\n'))
        showToast(
          count === 1
            ? `Copied "${picks[0]}" from ${data.name}`
            : `Copied ${picks.length} from ${data.name}`,
        )
        pushRecent(slug)
        closePalette()
      } catch (err) {
        console.error('random failed', err)
        showToast('Could not copy random item')
      }
    },
    [showToast, pushRecent, closePalette],
  )

  // -------- Build rows for the current query --------
  const groups = useMemo(() => {
    const q = query.trim()
    const built: { label: string; rows: Row[] }[] = []

    const catalogBySlug = new Map(catalog.map((c) => [c.slug, c]))

    // Resolve a query into the best-matching list (for random / N actions).
    const resolveList = (s: string) => {
      const r = fuzzysort.go(s, catalog, { key: 'name', limit: 1, threshold: LIST_MATCH_THRESHOLD })
      return r[0]?.obj
    }

    // Always show previously-generated items at the top while palette is open.
    if (generated && generated.items.length > 0) {
      const rows: Row[] = generated.items.map((value, i) => ({
        key: `gen-${generated.ts}-${i}`,
        icon: <Sparkles />,
        title: value,
        subtitle: `Generated`,
        trailing: <Copy />,
        onActivate: () => copyText(value, `Copied "${value}"`),
        group: 'Generated',
      }))
      // Bulk copy as the first row of the group
      rows.unshift({
        key: `gen-${generated.ts}-all`,
        iconBg: 'var(--color-black)',
        iconColor: '#fff',
        icon: <Sparkles />,
        title: `Copy all ${generated.items.length} generated items`,
        subtitle: `"${generated.prompt}"`,
        trailing: <Copy />,
        onActivate: () => {
          copyText(
            generated.items.join('\n'),
            `Copied ${generated.items.length} generated items`,
          )
        },
        group: 'Generated',
      })
      built.push({ label: 'Generated', rows })
    }

    if (q.length === 0) {
      // Empty state: pinned + recent + base actions
      const pinnedRows: Row[] = pinned
        .map((slug) => catalogBySlug.get(slug))
        .filter((c): c is (typeof catalog)[number] => !!c)
        .map((c) => {
          const Icon = CATEGORY_ICONS[c.category] ?? Layers
          return {
            key: `pin-${c.slug}`,
            icon: <Icon />,
            title: c.name,
            subtitle: c.category,
            trailing: <ChevronR />,
            onActivate: () => goToList(c.slug),
            group: 'Pinned',
            pinSlug: c.slug,
          }
        })
      if (pinnedRows.length > 0) built.push({ label: 'Pinned', rows: pinnedRows })

      const recentRows: Row[] = recent
        .filter((s) => !pinned.includes(s))
        .map((slug) => catalogBySlug.get(slug))
        .filter((c): c is (typeof catalog)[number] => !!c)
        .slice(0, 5)
        .map((c) => {
          const Icon = CATEGORY_ICONS[c.category] ?? Layers
          return {
            key: `recent-${c.slug}`,
            icon: <Icon />,
            title: c.name,
            subtitle: c.category,
            trailing: <ChevronR />,
            onActivate: () => goToList(c.slug),
            group: 'Recent',
            pinSlug: c.slug,
          }
        })
      if (recentRows.length > 0) built.push({ label: 'Recent', rows: recentRows })

      return built
    }

    // Non-empty query
    // 0) explicit "gen <X>" prefix: ONLY show gen at top, suppress everything else
    const genCmd = parseGenCommand(q)
    if (genCmd) {
      built.push({
        label: 'AI',
        rows: [
          {
            key: 'gen-explicit',
            iconBg: 'var(--color-black)',
            iconColor: '#fff',
            icon: generating ? <Sparkles /> : <Sparkles />,
            title: generating
              ? `Generating ${genCmd.count}…`
              : `Generate ${genCmd.count} items with AI`,
            subtitle: `"${genCmd.prompt}"`,
            trailing: generating ? null : <ArrowRight />,
            onActivate: () => {
              if (!generating) runGenerate(genCmd.prompt, genCmd.count)
            },
            group: 'AI',
          },
        ],
      })
      return built
    }

    // 1) random / count action(s)
    const cmd = parseRandomCommand(q)
    if (cmd) {
      const matches = fuzzysort.go(cmd.rest, catalog, {
        key: 'name',
        limit: 1,
        threshold: LIST_MATCH_THRESHOLD,
      })
      const target = matches[0]?.obj
      if (target) {
        built.push({
          label: 'Action',
          rows: [
            {
              key: 'random-action',
              iconBg: 'var(--color-black)',
              iconColor: '#fff',
              icon: <Sparkles />,
              title:
                cmd.count === 1
                  ? `Copy 1 random item from ${target.name}`
                  : `Copy ${cmd.count} random items from ${target.name}`,
              subtitle: target.category,
              trailing: <Copy />,
              onActivate: () => randomFromSlug(target.slug, cmd.count),
              group: 'Action',
            },
          ],
        })
      }
    }

    // 2) Item matches
    if (index && q.length >= MIN_ITEM_QUERY_LEN) {
      const results = fuzzysort.go(q, index.items, {
        key: 'value',
        limit: MAX_ITEM_RESULTS,
        threshold: -10000,
      })
      if (results.length > 0) {
        const rows: Row[] = results.map((r, i) => {
          const item = r.obj
          const list = index.lists[item.listIdx]
          const Icon = CATEGORY_ICONS[list.cat] ?? Layers
          const indexes = r.indexes ?? []
          return {
            key: `item-${i}-${item.value}-${list.slug}`,
            icon: <Icon />,
            title: highlightMatch(item.value, indexes as readonly number[]),
            subtitle: `in ${list.name}`,
            trailing: <Copy />,
            onActivate: () => {
              copyText(item.value, `Copied "${item.value}"`)
              pushRecent(list.slug)
              closePalette()
            },
            group: 'Items',
          }
        })
        built.push({ label: 'Items matching', rows })
      }
    }

    // 3) List matches
    {
      const results = fuzzysort.go(q, catalog, {
        key: 'name',
        limit: MAX_LIST_RESULTS,
        threshold: -10000,
      })
      if (results.length > 0) {
        const rows: Row[] = results.map((r, i) => {
          const c = r.obj
          const Icon = CATEGORY_ICONS[c.category] ?? Layers
          const indexes = r.indexes ?? []
          return {
            key: `list-${i}-${c.slug}`,
            icon: <Icon />,
            title: highlightMatch(c.name, indexes as readonly number[]),
            subtitle: c.category,
            trailing: <ChevronR />,
            onActivate: () => goToList(c.slug),
            group: 'Lists',
            pinSlug: c.slug,
          }
        })
        built.push({ label: 'Lists matching', rows })
      }
    }

    // 3.5) Semantic matches (Vectorize, debounced)
    if (semanticQuery === q && semanticMatches.length > 0) {
      const catalogBySlugSemantic = catalogBySlug
      const rows: Row[] = semanticMatches.map((m, i) => {
        const listEntry = catalogBySlugSemantic.get(m.slug)
        const cat = listEntry?.category ?? 'all'
        const Icon = CATEGORY_ICONS[cat] ?? Layers
        return {
          key: `sem-${i}-${m.slug}-${m.value}`,
          icon: <Icon />,
          title: m.value,
          subtitle: (
            <span className="cmd-row-meta">
              <span>in {m.list}</span>
              <span className="cmd-row-score">{Math.round(m.score * 100)}%</span>
            </span>
          ),
          trailing: <Copy />,
          onActivate: () => {
            copyText(m.value, `Copied "${m.value}"`)
            pushRecent(m.slug)
            closePalette()
          },
          group: 'Semantic',
        }
      })
      built.push({ label: 'Similar in meaning', rows })
    }

    // 4) Fallback "Generate with AI" offer when query is meaningful
    if (q.length >= 3) {
      built.push({
        label: 'Or with AI',
        rows: [
          {
            key: 'gen-offer',
            icon: <Sparkles />,
            title: generating
              ? `Generating…`
              : `Generate 10 items with AI`,
            subtitle: `"${q}"`,
            trailing: generating ? null : <ArrowRight />,
            onActivate: () => {
              if (!generating) runGenerate(q, 10)
            },
            group: 'AI',
          },
        ],
      })
    }

    return built
  }, [
    query,
    catalog,
    pinned,
    recent,
    index,
    generated,
    generating,
    semanticMatches,
    semanticQuery,
    runGenerate,
    goToList,
    randomFromSlug,
    copyText,
    pushRecent,
    closePalette,
  ])

  const flatRows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const g of groups) {
      for (const r of g.rows) {
        if (r.key === 'tip-jump' || r.key === 'tip-random') continue
        out.push(r)
      }
    }
    return out
  }, [groups])

  // Reset selection when rows change.
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, flatRows.length - 1)))
  }, [flatRows.length])

  // Auto-scroll selected row into view.
  useEffect(() => {
    if (!open) return
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-row="${selected}"]`,
    )
    row?.scrollIntoView({ block: 'nearest' })
  }, [selected, open])

  // When a new generation lands, jump back to the top so the new "Generated"
  // group is visible regardless of where the user was scrolled.
  useEffect(() => {
    if (!generated) return
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setSelected(0)
  }, [generated?.ts])

  // Global keyboard.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePalette()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(flatRows.length - 1, s + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(0, s - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        flatRows[selected]?.onActivate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, selected, flatRows, closePalette])

  if (!open) return null

  return (
    <div
      className="cmd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closePalette()
      }}
    >
      <div className="cmd-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lists, items, or actions…"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="cmd-scroll" ref={listRef}>
          {flatRows.length === 0 ? (
            <div className="cmd-empty">
              {query.trim().length === 0 ? (
                <>
                  <div className="cmd-empty-title">Search across {catalog.length} lists</div>
                  <div className="cmd-empty-sub">
                    Try <span className="cmd-kbd">names</span>,{' '}
                    <span className="cmd-kbd">stripe</span>,{' '}
                    <span className="cmd-kbd">random emoji</span>, or{' '}
                    <span className="cmd-kbd">10 hex</span>
                  </div>
                </>
              ) : (
                <>No matches for &ldquo;{query}&rdquo;.</>
              )}
            </div>
          ) : (
            (() => {
              let renderIdx = 0
              const blocks: ReactNode[] = []
              for (const g of groups) {
                const visibleRows = g.rows.filter(
                  (r) => r.key !== 'tip-jump' && r.key !== 'tip-random',
                )
                blocks.push(
                  <div key={g.label}>
                    <div className="cmd-group-label">{g.label}</div>
                    {g.rows.map((r) => {
                      const isInfo = r.key === 'tip-jump' || r.key === 'tip-random'
                      const rowIdx = isInfo ? -1 : renderIdx++
                      const on = rowIdx === selected && rowIdx >= 0
                      return (
                        <button
                          key={r.key}
                          type="button"
                          className={`cmd-row${on ? ' on' : ''}`}
                          data-cmd-row={rowIdx >= 0 ? rowIdx : undefined}
                          onMouseEnter={() => {
                            if (rowIdx >= 0) setSelected(rowIdx)
                          }}
                          onClick={r.onActivate}
                        >
                          <span
                            className="ic"
                            style={
                              r.iconBg
                                ? { background: r.iconBg, color: r.iconColor }
                                : undefined
                            }
                          >
                            {r.icon}
                          </span>
                          <span className="body">
                            <span className="t">{r.title}</span>
                            {r.subtitle && <span className="sub">{r.subtitle}</span>}
                          </span>
                          {r.pinSlug && (
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label={
                                isPinned(r.pinSlug) ? 'Unpin' : 'Pin'
                              }
                              title={isPinned(r.pinSlug) ? 'Unpin' : 'Pin'}
                              className={`pin${isPinned(r.pinSlug) ? ' on' : ''}`}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                togglePin(r.pinSlug!)
                              }}
                            >
                              {isPinned(r.pinSlug) ? <StarFilled /> : <Star />}
                            </button>
                          )}
                          {r.trailing && <span className="arr">{r.trailing}</span>}
                        </button>
                      )
                    })}
                  </div>,
                )
                if (visibleRows.length === 0) {
                  // group has only info rows — still rendered above
                }
              }
              return blocks
            })()
          )}
        </div>

        <div className="cmd-foot">
          <div className="cmd-foot-hints">
            <span>
              <span className="k">↑↓</span>Navigate
            </span>
            <span>
              <span className="k">↵</span>Open
            </span>
            <span>
              <span className="k">esc</span>Close
            </span>
          </div>
          <div className="cmd-foot-status">
            {semanticLoading
              ? 'Searching semantically…'
              : index
                ? `${index.items.length.toLocaleString()} items indexed`
                : 'Loading index…'}
          </div>
        </div>
      </div>

      <div
        className={`toast${toast ? ' show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <ArrowRight />
        <span>{toast}</span>
      </div>
    </div>
  )
}
