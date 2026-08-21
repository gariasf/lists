#!/usr/bin/env node
/**
 * Data linter for data/lists/*. Fails the build on:
 *  - exact duplicate lines within a file
 *  - impossible calendar dates in YYYY-MM-DD tokens (e.g. 2027-02-29)
 * Runs in CI before the build and can be run locally: node scripts/check-lists.mjs
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data', 'lists')
const errors = []

function validDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

for (const file of (await fs.readdir(DIR)).sort()) {
  const p = path.join(DIR, file)
  if (!(await fs.stat(p)).isFile()) continue
  const raw = await fs.readFile(p, 'utf8')

  if (file.endsWith('.txt')) {
    const seen = new Map()
    raw.split('\n').forEach((line, i) => {
      const l = line.trim()
      if (l === '' || l.startsWith('# ')) return
      if (seen.has(l)) errors.push(`${file}:${i + 1}: duplicate line (first at ${seen.get(l)}): ${l}`)
      else seen.set(l, i + 1)
    })
  }

  for (const m of raw.matchAll(/(?<!\d)(\d{4}-\d{2}-\d{2})/g)) {
    if (!validDate(m[1])) errors.push(`${file}: impossible date ${m[1]}`)
  }
}

if (errors.length) {
  console.error(`check-lists: ${errors.length} problem(s)\n` + errors.join('\n'))
  process.exit(1)
}
console.log('check-lists: OK')
