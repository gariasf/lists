'use client'

import { useEffect, useState } from 'react'
import Link from '@/components/TLink'
import type { CatalogEntry } from '@/lib/palette-context'
import { usePalette } from '@/lib/palette-context'
import { useTheme } from '@/lib/use-theme'
import { SKILLS } from '@/lib/skills'
import type { Category } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import {
  Search,
  Logo,
  Github,
  Monitor,
  Moon,
  Sun,
  Layers,
  Sparkles,
  ChevronR,
  CATEGORY_ICONS,
  Cart,
  Dollar,
  Map,
  Message,
  User,
  Copy,
  Check,
  Download,
} from '@/components/icons'

const SKILL_ICONS: Record<string, React.ComponentType> = {
  user: User,
  dollar: Dollar,
  cart: Cart,
  message: Message,
  map: Map,
  sparkles: Sparkles,
}

const SKILL_INSTALL_CMD =
  'mkdir -p .claude/skills/lists && curl -sL https://lists.gariasf.com/claude-skill/SKILL.md -o .claude/skills/lists/SKILL.md'
const MCP_INSTALL_CMD = 'claude mcp add lists https://lists.gariasf.com/mcp'

export default function SkillsShell({ allLists }: { allLists: CatalogEntry[] }) {
  const { openPalette } = usePalette()
  const { mode: themeMode, cycleMode: cycleTheme } = useTheme()
  const [copied, setCopied] = useState<string | null>(null)

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPalette])

  const counts: Record<string, number> = { all: allLists.length }
  for (const l of allLists)
    counts[l.category] = (counts[l.category] ?? 0) + 1
  const categoriesWithCount = CATEGORIES.filter(
    (c) => c.id === 'all' || counts[c.id] > 0,
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
          <Link href="/skills" className="ls-side-link active">
            <Sparkles />
            Skills
            <span className="count">{SKILLS.length}</span>
          </Link>

          <div className="ls-side-label">By category</div>
          {categoriesWithCount
            .filter((c) => c.id !== 'all')
            .map((c) => {
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
            })}
        </aside>

        <div className="ls-main">
          <div className="ls-topbar">
            <button
              type="button"
              className="ls-search"
              onClick={openPalette}
              aria-label="Open command palette"
            >
              <Search />
              <span>Search lists, items, or AI…</span>
              <span className="ls-search-kbd">⌘K</span>
            </button>
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
                <h1 className="ls-h1">Skills</h1>
                <div className="ls-meta">
                  Curated AI recipes. Compose lists + generation into
                  coherent mock-data scenarios.
                </div>
              </div>
            </div>

            <div className="skills-grid">
              {SKILLS.map((skill) => {
                const Icon = SKILL_ICONS[skill.icon] ?? Sparkles
                return (
                  <Link
                    key={skill.slug}
                    href={`/skills/${skill.slug}/`}
                    className="skill-card"
                  >
                    <div className="skill-card-head">
                      <span className="skill-card-icon">
                        <Icon />
                      </span>
                      <div className="skill-card-text">
                        <div className="skill-card-title">{skill.name}</div>
                        <div className="skill-card-tagline">{skill.tagline}</div>
                      </div>
                      <ChevronR />
                    </div>
                    <p className="skill-card-desc">{skill.description}</p>
                    {skill.example && (
                      <div className="skill-card-example">{skill.example}</div>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="claude-cta">
              <div className="claude-cta-head">
                <div className="claude-cta-eyebrow">Use with Claude Code</div>
                <div className="claude-cta-title">
                  Generate from any project
                </div>
                <p className="claude-cta-desc">
                  Drop a single SKILL.md into your project to give Claude
                  access to all 365 lists and 5 generators. Or wire the
                  MCP server up with one CLI command.
                </p>
              </div>
              <div className="claude-cta-grid">
                <div className="claude-cta-card">
                  <h3>Install as a Skill</h3>
                  <p>
                    Save SKILL.md into{' '}
                    <code>.claude/skills/lists/</code> in your repo.
                    Claude picks it up automatically.
                  </p>
                  <pre>{SKILL_INSTALL_CMD}</pre>
                  <div className="claude-cta-actions">
                    <a
                      className="btn btn-primary"
                      href="/claude-skill/SKILL.md"
                      download="SKILL.md"
                    >
                      <Download />
                      Download SKILL.md
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copyText(SKILL_INSTALL_CMD, 'skill')}
                    >
                      {copied === 'skill' ? <Check /> : <Copy />}
                      {copied === 'skill' ? 'Copied' : 'Copy command'}
                    </button>
                  </div>
                </div>
                <div className="claude-cta-card">
                  <h3>Or wire up via MCP</h3>
                  <p>
                    Already running MCP servers? Register Lists with one
                    line. Endpoint:{' '}
                    <code>https://lists.gariasf.com/mcp</code>.
                  </p>
                  <pre>{MCP_INSTALL_CMD}</pre>
                  <div className="claude-cta-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => copyText(MCP_INSTALL_CMD, 'mcp')}
                    >
                      {copied === 'mcp' ? <Check /> : <Copy />}
                      {copied === 'mcp' ? 'Copied' : 'Copy command'}
                    </button>
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
              {SKILLS.length} skills · powered by Workers AI
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
