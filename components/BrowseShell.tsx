'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from '@/components/TLink'
import { useSearchParams } from 'next/navigation'
import type { ListItem, Category } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { usePalette } from '@/lib/palette-context'
import { useTheme } from '@/lib/use-theme'
import {
  Search,
  Logo,
  Github,
  Monitor,
  Moon,
  Sun,
  Layers,
  Copy,
  Check,
  ChevronR,
  Sparkles,
  X,
  CATEGORY_ICONS,
} from '@/components/icons'

interface BrowseShellProps {
  lists: ListItem[]
}

const HEX_SLUG = 'colorshex'

function ListIcon({ list }: { list: ListItem }) {
  const Icon = CATEGORY_ICONS[list.category] ?? Layers
  return <Icon />
}

function HexSwatchPreview({ items, mode }: { items: string[]; mode: 'card' | 'row' }) {
  const sample = items.slice(0, mode === 'card' ? 10 : 8)
  if (mode === 'card') {
    return (
      <div className="ls-card-preview" style={{ height: 'auto', padding: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {sample.map((hex, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1.6 / 1',
                borderRadius: 5,
                background: hex,
                boxShadow: 'inset 0 0 0 1px rgba(11, 11, 11, 0.06)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="m-row-preview" style={{ maxHeight: 'none', padding: 8 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {sample.map((hex, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 5,
              background: hex,
              boxShadow: 'inset 0 0 0 1px rgba(11, 11, 11, 0.06)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewCard({ list, onCopyAll }: { list: ListItem; onCopyAll: (list: ListItem) => void }) {
  const isHex = list.slug === HEX_SLUG
  const preview = list.items.slice(0, 5)
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCopyAll(list)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <Link href={`/list/${list.slug}/`} className="ls-card">
      <div className="ls-card-head">
        <span className="ls-card-icon">
          <ListIcon list={list} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="ls-card-title">{list.name}</h2>
          <div className="ls-card-sub">
            {list.items.length} items{isHex ? ' · hex' : ''}
          </div>
        </div>
      </div>
      {isHex ? (
        <HexSwatchPreview items={list.items} mode="card" />
      ) : (
        <div className="ls-card-preview">
          {preview.map((s, i) => (
            <div key={i} className="ln">
              {s}
            </div>
          ))}
        </div>
      )}
      <div className="ls-card-foot">
        <button
          type="button"
          className={`copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          aria-label={`Copy all ${list.name}`}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>
    </Link>
  )
}

function MobileRow({ list }: { list: ListItem }) {
  const isHex = list.slug === HEX_SLUG
  const preview = list.items.slice(0, 3).join(',  ')
  return (
    <Link href={`/list/${list.slug}/`} className="m-row">
      <div className="m-row-top">
        <span className="m-row-icon">
          <ListIcon list={list} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="m-row-title">{list.name}</div>
          <div className="m-row-sub">{list.items.length} items</div>
        </div>
        <span className="m-row-chev">
          <ChevronR />
        </span>
      </div>
      {isHex ? (
        <HexSwatchPreview items={list.items} mode="row" />
      ) : (
        <div className="m-row-preview">
          <div className="ln">{preview}</div>
        </div>
      )}
    </Link>
  )
}

export default function BrowseShell({ lists }: BrowseShellProps) {
  const searchParams = useSearchParams()
  const initialCategory = (() => {
    const c = searchParams?.get('category') as Category | null
    if (c && CATEGORIES.some((cat) => cat.id === c)) return c
    return 'all' as Category
  })()
  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showTip, setShowTip] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { openPalette } = usePalette()
  const { mode: themeMode, cycleMode: cycleTheme } = useTheme()
  const themeIcon =
    themeMode === 'system' ? <Monitor /> : themeMode === 'dark' ? <Moon /> : <Sun />
  const themeLabel =
    themeMode === 'system'
      ? 'System theme (click for light)'
      : themeMode === 'light'
        ? 'Light theme (click for dark)'
        : 'Dark theme (click for system)'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
        if (showTip) dismissTip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPalette, showTip])

  useEffect(() => {
    try {
      if (localStorage.getItem('lists.onboarded') !== '1') setShowTip(true)
    } catch {
      /* localStorage unavailable */
    }
  }, [])

  const dismissTip = () => {
    setShowTip(false)
    try {
      localStorage.setItem('lists.onboarded', '1')
    } catch {
      /* ignore */
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: lists.length }
    for (const l of lists) map[l.category] = (map[l.category] ?? 0) + 1
    return map
  }, [lists])

  const totalItems = useMemo(
    () => lists.reduce((sum, l) => sum + l.items.length, 0),
    [lists],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lists.filter(
      (l) =>
        (activeCategory === 'all' || l.category === activeCategory) &&
        (q === '' || l.name.toLowerCase().includes(q)),
    )
  }, [lists, activeCategory, query])

  const handleCopyAll = async (list: ListItem) => {
    try {
      await navigator.clipboard.writeText(list.items.join('\n'))
      setToast(`${list.name} copied (${list.items.length} items)`)
      setTimeout(() => setToast(null), 1800)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const activeLabel =
    CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'All Lists'

  const categoriesWithCount = CATEGORIES.filter((c) => c.id === 'all' || counts[c.id] > 0)

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
          <button
            type="button"
            className={`ls-side-link${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <Layers />
            All lists
            <span className="count">{counts.all}</span>
          </button>
          <Link href="/skills" className="ls-side-link">
            <Sparkles />
            Skills
            <span className="count">{5}</span>
          </Link>

          <div className="ls-side-label">By category</div>
          {categoriesWithCount
            .filter((c) => c.id !== 'all')
            .map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? Layers
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`ls-side-link${activeCategory === c.id ? ' active' : ''}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  <Icon />
                  {c.label}
                  <span className="count">{counts[c.id] ?? 0}</span>
                </button>
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
                placeholder={`Search ${lists.length} lists…`}
                aria-label="Search lists"
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
            <div className="ls-content-head">
              <div className="ls-h1-row">
                <h1 className="ls-h1">{activeLabel}</h1>
                <div className="ls-meta">
                  {filtered.length === lists.length
                    ? `${lists.length} lists · ${totalItems.toLocaleString()} items`
                    : `${filtered.length} of ${lists.length} lists · ${totalItems.toLocaleString()} items`}
                </div>
              </div>
            </div>

            {showTip && (
              <div className="onboarding-tip" role="status">
                <span className="onboarding-tip-icon">
                  <Sparkles />
                </span>
                <div className="onboarding-tip-body">
                  <strong>New here?</strong> Press{' '}
                  <span className="kbd">⌘K</span> to fuzzy-search lists, jump
                  to an item, or generate fresh mock data with AI.
                </div>
                <button
                  type="button"
                  onClick={dismissTip}
                  aria-label="Dismiss tip"
                  className="onboarding-tip-close"
                >
                  <X />
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="ls-empty">
                <p>No lists match that filter.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setActiveCategory('all')
                    setQuery('')
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="ls-grid">
                {filtered.map((list) => (
                  <PreviewCard key={list.slug} list={list} onCopyAll={handleCopyAll} />
                ))}
              </div>
            )}
          </div>

          <div className="ls-bottombar">
            <span>
              <span className="kbd">⌘K</span>Search
            </span>
            <span>
              <span className="kbd">Esc</span>Clear
            </span>
            <div style={{ marginLeft: 'auto' }}>Made for designers · Open source on GitHub</div>
          </div>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="m-frame m-only">
        <div className="m-nav">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Logo />
            </span>
            <span className="brand-name">Lists</span>
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
              {themeIcon}
            </button>
          </div>
        </div>

        <div className="m-hero">
          <h1>
            Real content
            <br />
            for your designs.
          </h1>
          <p>{lists.length} lists. Tap to open, tap copy to grab the whole set.</p>
        </div>

        {showTip && (
          <div className="onboarding-tip m-tip" role="status">
            <span className="onboarding-tip-icon">
              <Sparkles />
            </span>
            <div className="onboarding-tip-body">
              <strong>Tip:</strong> Hit the search bar to filter — or open a
              list and tap any value to copy it.
            </div>
            <button
              type="button"
              onClick={dismissTip}
              aria-label="Dismiss tip"
              className="onboarding-tip-close"
            >
              <X />
            </button>
          </div>
        )}

        <label className="m-search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names, prices, IBANs…"
            aria-label="Search lists"
          />
        </label>

        <div className="m-chip-scroll">
          {categoriesWithCount.map((c) => {
            const Icon = CATEGORY_ICONS[c.id] ?? Layers
            const on = activeCategory === c.id
            return (
              <button
                key={c.id}
                type="button"
                className={`m-chip${on ? ' on' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >
                <Icon />
                {c.label}
                <span className="n">{counts[c.id] ?? 0}</span>
              </button>
            )
          })}
        </div>

        <div className="m-list">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 4px' }}>
              No lists match that filter.
            </p>
          ) : (
            filtered.map((list) => <MobileRow key={list.slug} list={list} />)
          )}
        </div>
      </div>

      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <Check />
        <span>{toast}</span>
      </div>
    </>
  )
}
