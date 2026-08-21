#!/usr/bin/env node
/**
 * Print the lists due for a refresh this month, as GitHub-issue markdown.
 * Driven by CHURN in lib/lists-data.ts and the git-derived dates in
 * data/verified.json. Used by .github/workflows/refresh-reminder.yml;
 * run it locally any time: node scripts/refresh-due.mjs
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const now = new Date()
const MONTH = now.getUTCMonth() + 1
const YEAR = now.getUTCFullYear()

const registry = await fs.readFile(path.join(ROOT, 'lib', 'lists-data.ts'), 'utf8')
const verified = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'verified.json'), 'utf8'))

const churn = [...registry.matchAll(/^  '([a-z0-9-_]+)': \{ every: '(\w+)', month: (\d+) \}/gm)].map(
  ([, slug, every, month]) => ({ slug, every, month: Number(month) }),
)

// Quarterly lists come due in their month and every third month after.
const due = churn.filter((c) =>
  c.every === 'quarter' ? (MONTH - c.month) % 3 === 0 : c.month === MONTH,
)

if (due.length === 0) {
  console.log(`NOTHING_DUE`)
  process.exit(0)
}

const lines = [
  `Lists on a ${MONTH}/${YEAR} refresh cycle. Check each against current reality, update the data file, and commit — the verified date updates itself from git.`,
  '',
]
for (const c of due.sort((a, b) => a.slug.localeCompare(b.slug))) {
  const last = verified[c.slug] ?? 'unknown'
  lines.push(`- [ ] \`${c.slug}\` — ${c.every}ly · last verified ${last}`)
}
lines.push('', '_Opened automatically by `.github/workflows/refresh-reminder.yml`._')

console.log(lines.join('\n'))
