#!/usr/bin/env node
/**
 * Regenerate date-bearing lists around the build date so they can never
 * go stale: sprint-dates, quarters, fiscal-years are rewritten wholesale,
 * plus two targeted year rewrites in tweets / courses-online.
 *
 * Runs in `prebuild`. Output files are tracked in git but treated as
 * generated: CI rewrites them on every deploy.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data', 'lists')
const now = new Date()
const Y = now.getUTCFullYear()
const yy = (y) => String(y).slice(2)
const iso = (d) => d.toISOString().slice(0, 10)

async function write(file, lines) {
  await fs.writeFile(path.join(DIR, file), lines.join('\n') + '\n')
}

// --- sprint-dates: 30 two-week sprints, ~6 back / ~24 ahead of today ---
const monday = new Date(now)
monday.setUTCHours(0, 0, 0, 0)
monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
const start = new Date(monday)
start.setUTCDate(start.getUTCDate() - 6 * 14)
const sprints = []
for (let i = 0; i < 30; i++) {
  const a = new Date(start)
  a.setUTCDate(a.getUTCDate() + i * 14)
  const b = new Date(a)
  b.setUTCDate(b.getUTCDate() + 13)
  sprints.push(`Sprint ${i + 1}: ${iso(a)} → ${iso(b)}`)
}
await write('sprint-dates.txt', sprints)

// --- quarters: same shapes as the hand-written original, centered on Y ---
const quarters = [
  ...[Y - 1, Y, Y + 1].flatMap((y) => [1, 2, 3, 4].map((q) => `Q${q} ${y}`)),
  ...[Y - 1, Y, Y + 1].flatMap((y) => [1, 2].map((h) => `H${h} ${y}`)),
  ...[Y - 1, Y, Y + 1].map((y) => `FY${y}`),
  ...[Y - 1, Y, Y + 1].map((y) => `FY${yy(y)}`),
  'Q1', 'Q2', 'Q3', 'Q4',
  'First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter',
  'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4',
  ...[1, 2, 3, 4].map((q) => `${q}Q${yy(Y)}`),
  ...[1, 2, 3, 4].map((q) => `Q${q} FY${yy(Y)}`),
  'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)',
]
await write('quarters.txt', quarters)

// --- fiscal-years: same shapes as the original, centered on Y ---
const fiscal = [
  ...[Y - 1, Y, Y + 1, Y + 2, Y + 3].map((y) => `FY${y}`),
  ...[Y - 1, Y, Y + 1].map((y) => `FY ${y}-${y + 1}`),
  ...[Y - 1, Y, Y + 1].map((y) => `April ${y} - March ${y + 1}`),
  ...[Y - 1, Y].map((y) => `July ${y} - June ${y + 1}`),
  ...[Y - 1, Y].map((y) => `October ${y} - September ${y + 1}`),
  ...[Y - 1, Y, Y + 1].map((y) => `January ${y} - December ${y}`),
  ...[Y, Y + 1].map((y) => `US Federal FY${y} (Oct 1, ${y - 1} – Sep 30, ${y})`),
  ...[Y - 1, Y].map((y) => `UK FY ${y}/${yy(y + 1)} (Apr 6 - Apr 5)`),
  ...[Y - 1, Y].map((y) => `Indian FY ${y}-${yy(y + 1)} (Apr 1 - Mar 31)`),
  ...[Y - 1, Y].map((y) => `Japan FY${y} (Apr 1, ${y} - Mar 31, ${y + 1})`),
  ...[Y - 1, Y].map((y) => `Australia FY ${y}-${yy(y + 1)} (Jul 1 - Jun 30)`),
  ...[Y, Y + 1].map((y) => `Calendar Year ${y}`),
]
await write('fiscal-years.txt', fiscal)

// --- targeted year rewrites in otherwise hand-curated lists ---
const patches = [
  ['tweets.txt', /finish a book in 20\d\d/, `finish a book in ${Y + 1}`],
  ['courses-online.txt', /The Web Developer Bootcamp 20\d\d/, `The Web Developer Bootcamp ${Y}`],
]
for (const [file, re, replacement] of patches) {
  const p = path.join(DIR, file)
  const src = await fs.readFile(p, 'utf8')
  const out = src.replace(re, replacement)
  if (out !== src) await fs.writeFile(p, out)
}

console.log(`gen-dated-lists: sprint-dates, quarters, fiscal-years regenerated around ${iso(now)}`)
