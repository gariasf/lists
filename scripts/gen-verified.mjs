#!/usr/bin/env node
/**
 * Record when each list's data was last touched, straight from git, so the
 * site can show an honest "verified" date instead of implying every list is
 * equally fresh. Writes data/verified.json (slug → YYYY-MM-DD).
 *
 * Falls back to the previous file when git history isn't available (shallow
 * clone, tarball) rather than blanking every date.
 */
import { promises as fs } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'data', 'verified.json')

const registry = await fs.readFile(path.join(ROOT, 'lib', 'lists-data.ts'), 'utf8')
const overrides = await fs.readFile(path.join(ROOT, 'lib', 'audit-overrides.ts'), 'utf8')
const overrideSlugs = new Set(
  [...overrides.matchAll(/^\s+'([a-z0-9-_]+)',$/gm)].map((m) => m[1]),
)

// slug → the file whose last commit actually decides what the site serves.
// One registry entry per line, and `local: { file: '…' }` nests braces, so
// scan line by line rather than trying to brace-match with a regex.
const entries = registry
  .split('\n')
  .map((line) => {
    const slug = line.match(/\{ slug: '([^']+)'/)?.[1]
    if (!slug) return null
    return [null, slug, line.match(/local: \{ file: '([^']+)'/)?.[1]]
  })
  .filter(Boolean)

function lastCommitDate(relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out || null
  } catch {
    return null
  }
}

let previous = {}
try {
  previous = JSON.parse(await fs.readFile(OUT, 'utf8'))
} catch {
  /* first run */
}

const verified = {}
let resolved = 0
for (const [, slug, localFile] of entries) {
  const rel = overrideSlugs.has(slug)
    ? `data/lists/audit-overrides/${slug}.txt`
    : localFile
      ? `data/lists/${localFile}`
      : null
  // Upstream-only lists have no local file to date; they inherit the
  // upstream fetch date, which we don't track — leave them out.
  const date = rel ? lastCommitDate(rel) : null
  if (date) {
    verified[slug] = date
    resolved++
  } else if (previous[slug]) {
    verified[slug] = previous[slug]
  }
}

if (resolved === 0 && Object.keys(previous).length > 0) {
  console.log('gen-verified: no git history available, keeping existing dates')
  process.exit(0)
}

await fs.writeFile(OUT, JSON.stringify(verified, null, 0) + '\n')
console.log(`gen-verified: dated ${Object.keys(verified).length} lists`)
