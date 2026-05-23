'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from '@/components/TLink'
import type { CatalogEntry } from '@/lib/palette-context'
import { usePalette } from '@/lib/palette-context'
import { useTheme } from '@/lib/use-theme'
import type { SkillDef } from '@/lib/skills'
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
  Download,
  ChevronR,
  Cart,
  Dollar,
  Map,
  Message,
  User,
  Cpu,
} from '@/components/icons'

const SKILL_ICONS: Record<string, React.ComponentType> = {
  user: User,
  dollar: Dollar,
  cart: Cart,
  message: Message,
  map: Map,
  sparkles: Sparkles,
  cpu: Cpu,
}

interface Props {
  skill: SkillDef
  allLists: CatalogEntry[]
}

interface SkillResponse {
  skill: string
  knobs: Record<string, unknown>
  payload: unknown
}

function toCSV(value: unknown): string {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    const rows = value as Record<string, unknown>[]
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [keys.map(esc).join(',')]
    for (const r of rows) lines.push(keys.map((k) => esc(r[k])).join(','))
    return lines.join('\n')
  }
  return JSON.stringify(value, null, 2)
}

export default function SkillRun({ skill, allLists }: Props) {
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

  const initialKnobs = useMemo(() => {
    const k: Record<string, unknown> = {}
    for (const knob of skill.knobs) k[knob.name] = knob.default
    return k
  }, [skill.knobs])

  const [knobs, setKnobs] = useState<Record<string, unknown>>(initialKnobs)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'preview' | 'json' | 'csv'>('preview')
  const [copied, setCopied] = useState(false)

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

  const run = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/skill', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: skill.slug, knobs }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error ?? `Failed (${res.status})`)
        return
      }
      const data = (await res.json()) as SkillResponse
      setResult(data.payload)
    } catch (err) {
      setError('Network error')
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  const handleCopy = async () => {
    if (result == null) return
    const text =
      view === 'csv' ? toCSV(result) : JSON.stringify(result, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (result == null) return
    const ext = view === 'csv' ? 'csv' : 'json'
    const text =
      view === 'csv' ? toCSV(result) : JSON.stringify(result, null, 2)
    const blob = new Blob([text], {
      type: ext === 'csv' ? 'text/csv' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.slug}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const SkillIcon = SKILL_ICONS[skill.icon] ?? Sparkles

  return (
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
          Skills
        </Link>

        <div className="ls-side-label">This skill</div>
        <div className="ls-side-link active" style={{ cursor: 'default' }}>
          <SkillIcon />
          {skill.name}
        </div>
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
          <div className="crumb">
            <Link href="/">All lists</Link>
            <ChevronR />
            <Link href="/skills">Skills</Link>
            <ChevronR />
            <span className="current">{skill.name}</span>
          </div>

          <div className="skill-detail">
            <div className="skill-detail-head">
              <h1 className="ls-detail-title">{skill.name}</h1>
              <p className="skill-detail-desc">{skill.description}</p>
            </div>

            <div className="skill-knobs">
              {skill.knobs.map((knob) => (
                <label key={knob.name} className="skill-knob">
                  <span className="skill-knob-label">{knob.label}</span>
                  {knob.type === 'select' && knob.options ? (
                    <select
                      value={String(knobs[knob.name] ?? knob.default)}
                      onChange={(e) =>
                        setKnobs((k) => ({ ...k, [knob.name]: e.target.value }))
                      }
                    >
                      {knob.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : knob.type === 'number' ? (
                    <input
                      type="number"
                      min={knob.min}
                      max={knob.max}
                      value={Number(knobs[knob.name] ?? knob.default)}
                      onChange={(e) =>
                        setKnobs((k) => ({
                          ...k,
                          [knob.name]: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={knob.placeholder}
                      value={String(knobs[knob.name] ?? knob.default)}
                      onChange={(e) =>
                        setKnobs((k) => ({ ...k, [knob.name]: e.target.value }))
                      }
                    />
                  )}
                </label>
              ))}

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={run}
                disabled={running}
              >
                <Sparkles />
                {running ? 'Generating…' : 'Generate'}
              </button>
            </div>

            {error && (
              <div className="skill-error">
                <strong>Something went wrong.</strong> {error}
              </div>
            )}

            {result != null && (
              <div className="skill-result">
                <div className="skill-result-head">
                  <div className="fmt-tabs">
                    <button
                      type="button"
                      className={view === 'preview' ? 'on' : ''}
                      onClick={() => setView('preview')}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className={view === 'json' ? 'on' : ''}
                      onClick={() => setView('json')}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      className={view === 'csv' ? 'on' : ''}
                      onClick={() => setView('csv')}
                    >
                      CSV
                    </button>
                  </div>
                  <div className="skill-result-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleDownload}
                    >
                      <Download />
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCopy}
                    >
                      {copied ? <Check /> : <Copy />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {view === 'preview' ? (
                  <SkillPreview skill={skill} result={result} />
                ) : (
                  <pre className="code-block">
                    <code>
                      {view === 'csv'
                        ? toCSV(result)
                        : JSON.stringify(result, null, 2)}
                    </code>
                  </pre>
                )}
              </div>
            )}
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
            Powered by Workers AI · Llama 3.1
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillPreview({ skill, result }: { skill: SkillDef; result: unknown }) {
  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
    const rows = result as Record<string, unknown>[]
    const keys = skill.primaryFields
      ? skill.primaryFields.filter((k) => rows.some((r) => k in r))
      : Array.from(new Set(rows.flatMap((r) => Object.keys(r))))

    return (
      <div className="skill-preview-table">
        {rows.map((row, i) => (
          <div key={i} className="skill-preview-row">
            {keys.map((k) => (
              <div key={k} className="skill-preview-cell">
                <div className="skill-preview-label">{k.replace(/_/g, ' ')}</div>
                <div className="skill-preview-value">{renderValue(row[k])}</div>
              </div>
            ))}
            {'avatar_url' in row && typeof row.avatar_url === 'string' && (
              <img
                className="skill-preview-avatar"
                src={row.avatar_url as string}
                alt=""
                width={48}
                height={48}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>
    return (
      <div className="skill-preview-record">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="skill-preview-record-row">
            <div className="skill-preview-label">{k.replace(/_/g, ' ')}</div>
            <div className="skill-preview-value">{renderValue(v)}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <pre className="code-block">
      <code>{JSON.stringify(result, null, 2)}</code>
    </pre>
  )
}

function renderValue(v: unknown): React.ReactNode {
  if (v == null) return <span className="dim">—</span>
  if (Array.isArray(v)) {
    return (
      <ul className="skill-preview-list">
        {v.map((x, i) => (
          <li key={i}>{typeof x === 'object' ? JSON.stringify(x) : String(x)}</li>
        ))}
      </ul>
    )
  }
  if (typeof v === 'object') return <code>{JSON.stringify(v)}</code>
  return String(v)
}
