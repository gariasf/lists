'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { ListItem } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import {
  Search,
  Logo,
  Github,
  Moon,
  Sun,
  Copy,
  Check,
  Download,
  Eye,
  ChevronL,
  ChevronR,
  ArrowUpRight,
  External,
  More,
  Layers,
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
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<Format>('list')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') searchRef.current?.blur()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return list.items
    return list.items.filter((item) => item.toLowerCase().includes(q))
  }, [list.items, query])

  const handleCopyItem = async (item: string, index: number) => {
    try {
      await navigator.clipboard.writeText(item)
      setCopiedIndex(index)
      setToast(`"${item}" copied`)
      setTimeout(() => setCopiedIndex(null), 1400)
      setTimeout(() => setToast(null), 1600)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const formattedPayload = useMemo(() => {
    const items = list.items
    const structured = list.structured
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
  }, [format, list.items, list.structured, list.slug])

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedPayload)
      setCopiedAll(true)
      const label =
        format === 'list'
          ? `Copied all ${list.items.length} items`
          : `Copied ${list.items.length} items as ${format.toUpperCase()}`
      setToast(label)
      setTimeout(() => setCopiedAll(false), 1400)
      setTimeout(() => setToast(null), 1800)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleDownload = () => {
    const exts: Record<Format, { ext: string; mime: string }> = {
      list: { ext: 'txt', mime: 'text/plain' },
      json: { ext: 'json', mime: 'application/json' },
      csv: { ext: 'csv', mime: 'text/csv' },
      ts: { ext: 'ts', mime: 'text/plain' },
    }
    const { ext, mime } = exts[format]
    const blob = new Blob([formattedPayload], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.slug}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenJson = () => {
    const blob = new Blob([toJSON(list.items, list.structured)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
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
    list.items.length === 0
      ? 0
      : list.items.reduce((sum, item) => sum + item.length, 0) / list.items.length

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

          <div className="ls-side-label">Categories</div>
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
              className="ls-icon-btn"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
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
                          onClick={handleOpenJson}
                        >
                          <Eye />
                          Preview JSON
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleDownload}
                        >
                          <Download />
                          Download .json
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
                      <span className="pill">
                        <CategoryIcon />
                        {category?.label}
                      </span>
                      <span className="pill">{list.items.length} items</span>
                      {list.structured && <span className="pill">structured</span>}
                      {query && (
                        <span className="pill">
                          {filteredItems.length} match{filteredItems.length === 1 ? '' : 'es'}
                        </span>
                      )}
                      <div style={{ marginLeft: 'auto' }}>
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
                    <ul className="ls-detail-list">
                      {filteredItems.map((item, i) => (
                        <li
                          key={`${item}-${i}`}
                          className={`ls-detail-item${copiedIndex === i ? ' copied' : ''}`}
                          onClick={() => handleCopyItem(item, i)}
                        >
                          <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                          <span className="v">{item}</span>
                          <span className="copy-btn">
                            {copiedIndex === i ? <Check /> : <Copy />}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <div className="rail-card">
                  <div className="rail-eyebrow">About this list</div>
                  <div className="rail-stat">
                    <span>Items</span>
                    <span className="v">{formatNumber(list.items.length)}</span>
                  </div>
                  <div className="rail-stat">
                    <span>Avg. length</span>
                    <span className="v">{avgLength.toFixed(1)}</span>
                  </div>
                  <div className="rail-stat">
                    <span>Category</span>
                    <span className="v">{list.category}</span>
                  </div>
                  <div className="rail-stat">
                    <span>Size</span>
                    <span className="v">{bytesToKb(list.items)} KB</span>
                  </div>
                  <div className="rail-stat">
                    <span>Slug</span>
                    <span className="v">{list.slug}</span>
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
                    Press <kbd>⌘K</kbd> to search inside this list, or click any value to copy it.
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
              <External />
            </a>
            <button
              type="button"
              className="ls-icon-btn"
              aria-label="More"
            >
              <More />
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
          <button type="button" className="btn btn-secondary" onClick={handleDownload}>
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

      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <Check />
        <span>{toast}</span>
      </div>
    </>
  )
}
