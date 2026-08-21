#!/usr/bin/env node
/**
 * Data linter for data/lists (including audit-overrides/, which fully
 * replaces the content of 139 slugs — skipping it would exempt exactly
 * the files that get served). Fails the build on:
 *  - exact duplicate lines within a file
 *  - impossible calendar dates in YYYY-MM-DD tokens (e.g. 2027-02-29)
 *  - a registry slug whose data file is missing
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

for (const file of (await fs.readdir(DIR, { recursive: true })).sort()) {
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

// IBANs carry their own mod-97 checksum, so a typo is machine-detectable —
// and an IBAN that fails validation is worse than useless in a mockup, since
// any real form will reject it.
function ibanValid(raw) {
  const iban = raw.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false
  const shifted = iban.slice(4) + iban.slice(0, 4)
  let rem = 0
  for (const ch of shifted) {
    const digits = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55)
    for (const d of digits) rem = (rem * 10 + Number(d)) % 97
  }
  return rem === 1
}

for (const file of ['iban-by-country.json']) {
  const p = path.join(DIR, file)
  try {
    const rows = JSON.parse(await fs.readFile(p, 'utf8'))
    for (const row of rows) {
      const value = row.example ?? row.value ?? row
      if (typeof value !== 'string') continue
      if (!ibanValid(value)) errors.push(`${file}: IBAN fails checksum: ${value}`)
      if (row.iso2 && !value.startsWith(row.iso2)) {
        errors.push(`${file}: ${value} does not start with its country code ${row.iso2}`)
      }
      if (row.length && value.replace(/\s+/g, '').length !== row.length) {
        errors.push(
          `${file}: ${value} is ${value.replace(/\s+/g, '').length} chars, declared ${row.length}`,
        )
      }
    }
  } catch {
    /* file absent — nothing to check */
  }
}

// A renamed slug whose data file didn't move ships an empty list silently
// (lib/lists.ts swallows ENOENT), so check both sides of the registry.
const registry = await fs.readFile(path.join(process.cwd(), 'lib', 'lists-data.ts'), 'utf8')
for (const [, file] of registry.matchAll(/file: '([^']+)'/g)) {
  if (file.includes('/')) continue // upstream-relative names
  try {
    await fs.access(path.join(DIR, file))
  } catch {
    // Upstream-only entries have no local file; only flag `local:` sources.
    if (registry.includes(`local: { file: '${file}'`)) {
      errors.push(`lib/lists-data.ts: local file missing from data/lists: ${file}`)
    }
  }
}

const overrides = await fs.readFile(path.join(process.cwd(), 'lib', 'audit-overrides.ts'), 'utf8')
for (const [, slug] of overrides.matchAll(/^\s+'([a-z0-9-_]+)',$/gm)) {
  try {
    await fs.access(path.join(DIR, 'audit-overrides', `${slug}.txt`))
  } catch {
    errors.push(`lib/audit-overrides.ts: no override file for slug ${slug}`)
  }
}

if (errors.length) {
  console.error(`check-lists: ${errors.length} problem(s)\n` + errors.join('\n'))
  process.exit(1)
}
console.log('check-lists: OK')
