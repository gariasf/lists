'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Drawer } from 'vaul'
import Link from '@/components/TLink'
import type { ListItem } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { usePalette } from '@/lib/palette-context'
import { useTheme } from '@/lib/use-theme'
import { useAugment } from '@/lib/use-augment'
import {
  Search,
  Logo,
  Github,
  Monitor,
  Moon,
  Sun,
  Phone,
  Copy,
  Check,
  Download,
  ChevronL,
  ChevronR,
  ArrowUpRight,
  External,
  Layers,

  Sparkles,
  CATEGORY_ICONS,
} from '@/components/icons'

interface DetailShellProps {
  list: ListItem
  relatedLists: ListItem[]
  allLists: ListItem[]
}

const HEX_SLUG = 'colorshex'

type Format = 'list' | 'json' | 'csv' | 'ts'

function formatNumber(n: number) {
  return n.toLocaleString()
}

function bytesToKb(items: string[]) {
  const total = items.reduce((sum, item) => sum + item.length + 1, 0)
  return (total / 1024).toFixed(1)
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCSV(items: string[], structured?: Record<string, unknown>[]): string {
  if (structured && structured.length > 0) {
    const keys = Array.from(
      new Set(structured.flatMap((row) => Object.keys(row))),
    )
    const header = keys.map(csvEscape).join(',')
    const rows = structured.map((row) =>
      keys.map((k) => csvEscape(row[k])).join(','),
    )
    return [header, ...rows].join('\n')
  }
  return ['value', ...items.map((v) => csvEscape(v))].join('\n')
}

function slugToCamel(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part, i) =>
      i === 0
        ? part.toLowerCase()
        : part[0].toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join('')
}

function toTS(
  slug: string,
  items: string[],
  structured?: Record<string, unknown>[],
): string {
  const name = slugToCamel(slug) || 'list'
  if (structured && structured.length > 0) {
    return `export const ${name} = ${JSON.stringify(structured, null, 2)} as const\n`
  }
  return `export const ${name}: string[] = ${JSON.stringify(items, null, 2)}\n`
}

function toJSON(
  items: string[],
  structured?: Record<string, unknown>[],
): string {
  return JSON.stringify(structured ?? items, null, 2)
}

export default function DetailShell({ list, relatedLists, allLists }: DetailShellProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<Format>('list')
  const [augmenting, setAugmenting] = useState(false)
  const [augmentError, setAugmentError] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { openPalette, pushRecent } = usePalette()
  const { extras, append, removeAt, clear } = useAugment(list.slug)
  const { mode: themeMode, cycleMode: cycleTheme } = useTheme()
  const themeIcon =
    themeMode === 'system' ? <Monitor /> : themeMode === 'dark' ? <Moon /> : <Sun />
  const mobileThemeIcon =
    themeMode === 'system' ? <Phone /> : themeMode === 'dark' ? <Moon /> : <Sun />
  const themeLabel =
    themeMode === 'system'
      ? 'System theme (click for light)'
      : themeMode === 'light'
        ? 'Light theme (click for dark)'
        : 'Dark theme (click for system)'

  useEffect(() => {
    pushRecent(list.slug)
  }, [list.slug, pushRecent])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
      }
      if (e.key === 'Escape') searchRef.current?.blur()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPalette])

  const combinedItems = useMemo(
    () => [...list.items, ...extras],
    [list.items, extras],
  )

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return combinedItems
    return combinedItems.filter((item) => item.toLowerCase().includes(q))
  }, [combinedItems, query])

  const handleCopyItem = async (item: string, index: number) => {
    try {
      await navigator.clipboard.writeText(item)
      setCopiedIndex(index)
      toast.success(`"${item}" copied`)
      setTimeout(() => setCopiedIndex(null), 1400)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const formattedPayload = useMemo(() => {
    const items = combinedItems
    // Structured exports use original structured payload only (extras
    // are plain strings; we don't know their structured shape).
    const structured = extras.length === 0 ? list.structured : undefined
    switch (format) {
      case 'json':
        return toJSON(items, structured)
      case 'csv':
        return toCSV(items, structured)
      case 'ts':
        return toTS(list.slug, items, structured)
      default:
        return items.join('\n')
    }
  }, [format, combinedItems, list.structured, list.slug, extras.length])

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedPayload)
      setCopiedAll(true)
      const label =
        format === 'list'
          ? `Copied all ${combinedItems.length} items`
          : `Copied ${combinedItems.length} items as ${format.toUpperCase()}`
      toast.success(label)
      setTimeout(() => setCopiedAll(false), 1400)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const augment = useCallback(
    async (count: number) => {
      setAugmenting(true)
      setAugmentError(null)
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            prompt: `more items matching the existing list "${list.name}"`,
            count,
            listSlug: list.slug,
          }),
        })
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          setAugmentError(err.error ?? `Failed (${res.status})`)
          return
        }
        const data = (await res.json()) as { items: string[] }
        if (data.items?.length) {
          append(data.items)
          toast.success(`Added ${data.items.length} new items`)
        }
      } catch (err) {
        console.error('augment failed', err)
        setAugmentError('Network error')
      } finally {
        setAugmenting(false)
      }
    },
    [list.slug, list.name, append],
  )

  const handleDownload = (forceFormat?: Format) => {
    const exts: Record<Format, { ext: string; mime: string }> = {
      list: { ext: 'txt', mime: 'text/plain' },
      json: { ext: 'json', mime: 'application/json' },
      csv: { ext: 'csv', mime: 'text/csv' },
      ts: { ext: 'ts', mime: 'text/plain' },
    }
    const fmt = forceFormat ?? format
    const { ext, mime } = exts[fmt]
    const structured = extras.length === 0 ? list.structured : undefined
    const body =
      fmt === 'json'
        ? toJSON(combinedItems, structured)
        : fmt === 'csv'
          ? toCSV(combinedItems, structured)
          : fmt === 'ts'
            ? toTS(list.slug, combinedItems, structured)
            : combinedItems.join('\n')
    const blob = new Blob([body], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.slug}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const category = CATEGORIES.find((c) => c.id === list.category)
  const CategoryIcon = CATEGORY_ICONS[list.category] ?? Layers
  const sidebarCategories = useMemo(() => {
    const counts: Record<string, number> = { all: allLists.length }
    for (const l of allLists) counts[l.category] = (counts[l.category] ?? 0) + 1
    return CATEGORIES.filter((c) => c.id === 'all' || counts[c.id] > 0).map((c) => ({
      ...c,
      count: counts[c.id] ?? 0,
    }))
  }, [allLists])

  const isHex = list.slug === HEX_SLUG
  const avgLength =
    combinedItems.length === 0
      ? 0
      : combinedItems.reduce((sum, item) => sum + item.length, 0) / combinedItems.length

  return (
    <>
      {/* Desktop shell */}
      <div className="ls-app d-only">
        <aside className="ls-sidebar">
          <Link href="/" className="ls-brand">
            <span className="ls-brand-mark">
              <Logo />
            </span>
            <span className="ls-brand-name">Lists</span>
          </Link>

          <div className="ls-side-label">Browse</div>
          <Link href="/" className="ls-side-link">
            <Layers />
            All lists
            <span className="count">{sidebarCategories[0]?.count ?? allLists.length}</span>
          </Link>
          <Link href="/skills" className="ls-side-link">
            <Sparkles />
            Skills
            <span className="count">{5}</span>
          </Link>

          <div className="ls-side-label">By category</div>
          {sidebarCategories
            .filter((c) => c.id !== 'all')
            .map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? Layers
              const active = c.id === list.category
              return (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className={`ls-side-link${active ? ' active' : ''}`}
                >
                  <Icon />
                  {c.label}
                  <span className="count">{c.count}</span>
                </Link>
              )
            })}
        </aside>

        <div className="ls-main">
          <div className="ls-topbar">
            <label className="ls-search">
              <Search />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search inside ${list.name}…`}
                aria-label="Search inside list"
              />
              <span className="ls-search-kbd">⌘K</span>
            </label>
            <div className="ls-spacer" />
            <a
              href="https://github.com/gariasf/lists"
              target="_blank"
              rel="noopener noreferrer"
              className="ls-icon-btn"
              aria-label="GitHub"
            >
              <Github />
            </a>
            <button
              type="button"
              className="ls-icon-btn ghost"
              onClick={cycleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {themeIcon}
            </button>
          </div>

          <div className="ls-content">
            <div className="crumb">
              <Link href="/">All lists</Link>
              <ChevronR />
              <Link href={`/?category=${list.category}`}>{category?.label ?? list.category}</Link>
              <ChevronR />
              <span className="current">{list.name}</span>
            </div>

            <div className="ls-detail">
              <div>
                <div className="ls-detail-card">
                  <div className="ls-detail-head">
                    <div className="ls-detail-title-row">
                      <h1 className="ls-detail-title">{list.name}</h1>
                      <div className="ls-detail-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => augment(10)}
                          disabled={augmenting}
                          title="Generate more items in the same style with AI"
                        >
                          <Sparkles />
                          {augmenting ? 'Generating…' : 'Add with AI'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDownload()}
                          title={`Download .${format === 'list' ? 'txt' : format}`}
                        >
                          <Download />
                          Download
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleCopyAll}
                        >
                          {copiedAll ? <Check /> : <Copy />}
                          {copiedAll ? 'Copied' : 'Copy all'}
                        </button>
                      </div>
                    </div>
                    <div className="ls-detail-meta-row">
                      <span className="pill">{list.items.length} items</span>
                      {extras.length > 0 && (
                        <span className="pill pill-accent" title="Locally added via AI">
                          + {extras.length} yours
                        </span>
                      )}
                      {list.structured && <span className="pill">structured</span>}
                      {query && (
                        <span className="pill">
                          {filteredItems.length} match{filteredItems.length === 1 ? '' : 'es'}
                        </span>
                      )}
                    </div>
                    {augmentError && (
                      <div className="skill-error">
                        <strong>Generation failed.</strong> {augmentError}
                      </div>
                    )}
                  </div>

                  <div className="ls-detail-tabs">
                    <div className="fmt-tabs" role="tablist" aria-label="Output format">
                      {(['list', 'json', 'csv', 'ts'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          role="tab"
                          aria-selected={format === f}
                          className={format === f ? 'on' : ''}
                          onClick={() => setFormat(f)}
                        >
                          {f === 'ts' ? 'TS' : f === 'csv' ? 'CSV' : f === 'json' ? 'JSON' : 'List'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {format !== 'list' ? (
                    <pre className="code-block" aria-label={`${format.toUpperCase()} output`}>
                      <code>{formattedPayload}</code>
                    </pre>
                  ) : filteredItems.length === 0 ? (
                    <div style={{ padding: '24px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      No items match &ldquo;{query}&rdquo;.
                    </div>
                  ) : isHex ? (
                    <div style={{ padding: '14px 18px 22px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: 8,
                        }}
                      >
                        {filteredItems.map((hex, i) => (
                          <button
                            key={`${hex}-${i}`}
                            type="button"
                            onClick={() => handleCopyItem(hex, i)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: 8,
                              borderRadius: 8,
                              background: 'var(--bg-container-inset)',
                              border: 0,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              color: copiedIndex === i ? 'var(--color-success)' : 'var(--text-primary)',
                              textAlign: 'left',
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                background: hex,
                                boxShadow: 'inset 0 0 0 1px rgba(11, 11, 11, 0.06)',
                                flex: '0 0 22px',
                              }}
                            />
                            <span style={{ flex: 1, minWidth: 0 }}>{hex}</span>
                            {copiedIndex === i ? <Check /> : <Copy />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="ls-detail-list">
                        {filteredItems.map((item, i) => {
                          const extraOffset = combinedItems.indexOf(item)
                          const isExtra = extraOffset >= list.items.length
                          const extraIdx = isExtra ? extraOffset - list.items.length : -1
                          return (
                            <li
                              key={`${item}-${i}`}
                              className={`ls-detail-item${copiedIndex === i ? ' copied' : ''}${isExtra ? ' is-extra' : ''}`}
                              title={item}
                              onClick={() => handleCopyItem(item, i)}
                            >
                              <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                              <span className="v">{item}</span>
                              {isExtra && (
                                <span
                                  className="extra-badge"
                                  title="Locally added via AI"
                                >
                                  AI
                                </span>
                              )}
                              {isExtra ? (
                                <button
                                  type="button"
                                  className="copy-btn extra-remove"
                                  title="Remove this addition"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeAt(extraIdx)
                                  }}
                                >
                                  ×
                                </button>
                              ) : (
                                <span className="copy-btn">
                                  {copiedIndex === i ? <Check /> : <Copy />}
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                      {extras.length > 0 && !query && (
                        <div className="ls-detail-extras-foot">
                          <span className="ls-detail-extras-note">
                            {extras.length} item{extras.length === 1 ? '' : 's'} added
                            locally · stored in this browser
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={clear}
                          >
                            Clear additions
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="rail-card rail-card-hero">
                  <div className="rail-hero">
                    <div className="rail-hero-value">{formatNumber(combinedItems.length)}</div>
                    <div className="rail-hero-label">
                      {combinedItems.length === 1 ? 'item' : 'items'}
                      {extras.length > 0 && (
                        <> · {extras.length} from AI</>
                      )}
                    </div>
                  </div>
                  <div className="rail-stats-grid">
                    <div className="rail-stat">
                      <span className="lbl">AVG LENGTH</span>
                      <span className="v">{avgLength.toFixed(1)}</span>
                    </div>
                    <div className="rail-stat">
                      <span className="lbl">SIZE</span>
                      <span className="v">{bytesToKb(combinedItems)} KB</span>
                    </div>
                  </div>
                </div>

                {relatedLists.length > 0 && (
                  <div className="rail-card">
                    <div className="rail-eyebrow">Related lists</div>
                    <div className="rail-related">
                      {relatedLists.map((r) => {
                        const Icon = CATEGORY_ICONS[r.category] ?? Layers
                        return (
                          <Link key={r.slug} href={`/list/${r.slug}/`}>
                            <Icon />
                            {r.name}
                            <span className="arrow">
                              <ArrowUpRight />
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="rail-card dark">
                  <div className="rail-eyebrow">Tip</div>
                  <div className="tip-body">
                    Click any value to copy it. Use the search above to filter this list, or press <kbd>⌘K</kbd> to jump anywhere.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ls-bottombar">
            <span>
              <span className="kbd">⌘K</span>Search
            </span>
            <span>
              <span className="kbd">Esc</span>Back
            </span>
            <div style={{ marginLeft: 'auto' }}>
              {list.items.length} items in {list.name}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="m-frame m-only">
        <div className="m-nav" style={{ paddingBottom: 6 }}>
          <Link href="/" className="m-back">
            <ChevronL />
            All lists
          </Link>
          <div className="right">
            <a
              href="https://github.com/gariasf/lists"
              target="_blank"
              rel="noopener noreferrer"
              className="ls-icon-btn"
              aria-label="GitHub"
            >
              <Github />
            </a>
            <button
              type="button"
              className="ls-icon-btn ghost"
              onClick={cycleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {mobileThemeIcon}
            </button>
            <button
              type="button"
              className="ls-icon-btn"
              aria-label="Download formats"
              onClick={() => setShowMobileMenu(true)}
            >
              <Download />
            </button>
          </div>
        </div>

        <div className="m-detail-head">
          <h1 className="m-detail-title">{list.name}</h1>
          <div className="m-detail-meta">
            <span className="pill">
              <CategoryIcon />
              {category?.label}
            </span>
            <span className="pill">{list.items.length} items</span>
          </div>
        </div>

        <div className="m-detail-actions">
          <button type="button" className="btn btn-primary" onClick={handleCopyAll}>
            {copiedAll ? <Check /> : <Copy />}
            {copiedAll ? 'Copied' : 'Copy all'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleDownload('json')}>
            <Download />
            Download JSON
          </button>
        </div>

        <div className="m-detail-list">
          {isHex
            ? list.items.map((hex, i) => (
                <button
                  key={`${hex}-${i}`}
                  type="button"
                  className={`m-item${copiedIndex === i ? ' copied' : ''}`}
                  onClick={() => handleCopyItem(hex, i)}
                >
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: hex,
                      boxShadow: 'inset 0 0 0 1px rgba(11, 11, 11, 0.06)',
                      flex: '0 0 18px',
                    }}
                  />
                  <span className="v">{hex}</span>
                  <span className="cp">
                    {copiedIndex === i ? <Check /> : <Copy />}
                  </span>
                </button>
              ))
            : list.items.map((item, i) => (
                <button
                  key={`${item}-${i}`}
                  type="button"
                  className={`m-item${copiedIndex === i ? ' copied' : ''}`}
                  onClick={() => handleCopyItem(item, i)}
                >
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="v">{item}</span>
                  <span className="cp">
                    {copiedIndex === i ? <Check /> : <Copy />}
                  </span>
                </button>
              ))}
        </div>
      </div>

      <Drawer.Root open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <Drawer.Portal>
          <Drawer.Overlay className="m-sheet-overlay" />
          <Drawer.Content className="m-sheet" aria-describedby={undefined}>
            <div className="m-sheet-grip" aria-hidden="true" />
            <Drawer.Title className="m-sheet-title">Download</Drawer.Title>
            {(['list', 'json', 'csv', 'ts'] as const).map((fmt) => {
              const label =
                fmt === 'list' ? 'Plain text (.txt)'
                  : fmt === 'json' ? 'JSON (.json)'
                    : fmt === 'csv' ? 'CSV (.csv)'
                      : 'TypeScript (.ts)'
              return (
                <button
                  key={fmt}
                  type="button"
                  className="m-sheet-row"
                  onClick={() => {
                    handleDownload(fmt)
                    setShowMobileMenu(false)
                  }}
                >
                  <Download />
                  <span>{label}</span>
                </button>
              )
            })}
            <button
              type="button"
              className="m-sheet-row"
              onClick={async () => {
                setShowMobileMenu(false)
                try {
                  if (typeof navigator.share === 'function') {
                    await navigator.share({
                      url: window.location.href,
                      title: list.name,
                      text: `${list.items.length} ${list.name.toLowerCase()} — realistic mock data`,
                    })
                  } else {
                    await navigator.clipboard.writeText(window.location.href)
                    toast.success('Link copied')
                  }
                } catch {
                  /* user cancelled share */
                }
              }}
            >
              <External />
              <span>Share this list</span>
            </button>
            <button
              type="button"
              className="m-sheet-row m-sheet-cancel"
              onClick={() => setShowMobileMenu(false)}
            >
              Cancel
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
