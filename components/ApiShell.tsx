'use client'

import { useState } from 'react'
import Link from '@/components/TLink'
import type { CatalogEntry } from '@/lib/palette-context'
import { usePalette } from '@/lib/palette-context'
import { useTheme } from '@/lib/use-theme'
import { BASE_URL, TOOLS } from '@/lib/tools'
import {
  Search,
  Logo,
  Github,
  Monitor,
  Moon,
  Sun,
  Layers,
  Sparkles,
  Check,
  Copy,
  ChevronR,
  Cpu,
  CATEGORY_ICONS,
} from '@/components/icons'
import { CATEGORIES } from '@/lib/types'

interface Endpoint {
  method: string
  path: string
  blurb: string
  example: string
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/manifest',
    blurb: 'Every list: slug, name, category, and when it was last verified.',
    example: `curl -s ${BASE_URL}/api/manifest`,
  },
  {
    method: 'GET',
    path: '/api/lists/<slug>',
    blurb: 'One list as JSON. Structured lists also carry a `structured` array.',
    example: `curl -s ${BASE_URL}/api/lists/names-pt_br`,
  },
  {
    method: 'GET',
    path: '/api/lists/<slug>.txt',
    blurb: 'One item per line — pipe it straight into shell tools.',
    example: `curl -s ${BASE_URL}/api/lists/names-pt_br.txt | shuf -n 5`,
  },
  {
    method: 'GET',
    path: '/api/lists/<slug>.csv',
    blurb: 'Real columns for structured lists, a single value column otherwise.',
    example: `curl -s ${BASE_URL}/api/lists/profile-ja_jp.csv`,
  },
  {
    method: 'GET',
    path: '/api/sample/<slug>?n=5',
    blurb:
      'A random handful. Add &seed=42 and the same seed always returns the same items — safe to commit in tests.',
    example: `curl -s "${BASE_URL}/api/sample/names-pt_br?n=5&seed=42"`,
  },
]

export default function ApiShell({ allLists }: { allLists: CatalogEntry[] }) {
  const { openPalette } = usePalette()
  const { mode: themeMode, cycleMode: cycleTheme } = useTheme()
  const [copied, setCopied] = useState<string | null>(null)

  const themeIcon =
    themeMode === 'system' ? <Monitor /> : themeMode === 'dark' ? <Moon /> : <Sun />
  const themeLabel =
    themeMode === 'system'
      ? 'System theme (click for light)'
      : themeMode === 'light'
        ? 'Light theme (click for dark)'
        : 'Dark theme (click for system)'

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const counts: Record<string, number> = { all: allLists.length }
  for (const l of allLists) counts[l.category] = (counts[l.category] ?? 0) + 1

  const body = (
    <>
      <div className="ls-content-head">
        <div className="ls-h1-row">
          <h1 className="ls-h1">API</h1>
          <div className="ls-meta">
            Plain URLs, no key, no rate limit. Every list is a static file on a
            CDN.
          </div>
        </div>
      </div>

      <div className="api-endpoints">
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="api-endpoint">
            <div className="api-endpoint-head">
              <span className="api-method">{e.method}</span>
              <code className="api-path">{e.path}</code>
            </div>
            <p className="api-blurb">{e.blurb}</p>
            <div className="api-example">
              <pre>{e.example}</pre>
              <button
                type="button"
                className="api-copy"
                onClick={() => copyText(e.example, e.path)}
              >
                {copied === e.path ? <Check /> : <Copy />}
                {copied === e.path ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="api-note">
        <strong>CORS is open</strong>, so <code>fetch()</code> works from a
        prototype, a CodePen or a Storybook story without a proxy. Responses are
        cached at the edge and rebuilt on every deploy.
      </div>

      <div className="ls-content-head" style={{ marginTop: 34 }}>
        <div className="ls-h1-row">
          <h2 className="ls-h1" style={{ fontSize: 26 }}>
            Outside the browser
          </h2>
          <div className="ls-meta">
            The same data, wherever you already work.
          </div>
        </div>
      </div>

      <div className="tool-grid">
        {TOOLS.filter((t) => t.id !== 'api').map((tool) => (
          <a
            key={tool.id}
            className="tool-card"
            href={tool.href}
            {...(tool.href.startsWith('http')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            <div className="tool-card-head">
              <span className="tool-card-name">{tool.name}</span>
              {/* Status comes from lib/tools.ts, so this can't drift out of
                  date once something actually ships to a store. */}
              <span className={`tool-status ${tool.status}`}>
                {tool.status === 'live' ? 'Available' : 'From the repo'}
              </span>
            </div>
            <p className="tool-card-blurb">{tool.blurb}</p>
            {tool.note && <p className="tool-card-note">{tool.note}</p>}
          </a>
        ))}
      </div>
    </>
  )

  return (
    <>
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
            <span className="count">{allLists.length}</span>
          </Link>
          <Link href="/skills" className="ls-side-link">
            <Sparkles />
            Generators
            <span className="count">{5}</span>
          </Link>
          <Link href="/api" className="ls-side-link active">
            <Cpu />
            API
          </Link>

          <div className="ls-side-label">By category</div>
          {CATEGORIES.filter((c) => c.id !== 'all' && (counts[c.id] ?? 0) > 0).map(
            (c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? Layers
              return (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className="ls-side-link"
                >
                  <Icon />
                  {c.label}
                  <span className="count">{counts[c.id] ?? 0}</span>
                </Link>
              )
            },
          )}
        </aside>

        <div className="ls-main">
          <div className="ls-topbar">
            <button type="button" className="ls-search" onClick={openPalette} aria-label="Open command palette">
              <Search />
              <span className="ls-search-placeholder">
                Search lists, items, or AI…
              </span>
              <span className="ls-search-kbd">⌘K</span>
            </button>
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

          <div className="ls-content">{body}</div>

          <div className="ls-bottombar">
            <span>
              <span className="kbd">⌘K</span>Search
            </span>
            <div style={{ marginLeft: 'auto' }}>
              {allLists.length} lists · free, no key
            </div>
          </div>
        </div>
      </div>

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

        <div className="crumb m-crumb">
          <Link href="/">All lists</Link>
          <ChevronR />
          <span className="current">API</span>
        </div>

        <div className="ls-content">{body}</div>
      </div>
    </>
  )
}
