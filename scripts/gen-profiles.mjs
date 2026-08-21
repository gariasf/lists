#!/usr/bin/env node
/**
 * Compose profile-<locale> bundles: rows where name, city, region, postal,
 * phone, and timezone all actually agree. The consistency core is
 * data/profile-cities.json (web-verified city/region/postal/timezone
 * tuples); names and phones come from the curated lists.
 *
 * Seeded PRNG → identical output every build, so the committed files
 * don't churn. Runs in `prebuild`.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data', 'lists')
const CITIES = path.join(process.cwd(), 'data', 'profile-cities.json')
const UPSTREAM = 'https://raw.githubusercontent.com/listsfordesign/Lists/master/Lists'
const ROWS = 40

// locale → { names: local file | {upstream}, native?: aligned local file,
//            subscriber: builds the digits after the city's dial prefix }
const digits = (rand, n) =>
  Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')

const LOCALES = {
  // US/UK use the reserved fictional ranges (555-01xx, Ofcom xxx 496 0xxx).
  en_US: { names: { upstream: 'names-en_US.txt' }, subscriber: (r) => `555-01${digits(r, 2)}` },
  en_GB: { names: { upstream: 'names-en_GB.txt' }, subscriber: (r) => `496 0${digits(r, 3)}` },
  de_DE: { names: { upstream: 'names-de_DE.txt' }, subscriber: (r) => digits(r, 7) },
  it_IT: { names: 'names-it_IT.txt', subscriber: (r) => `${digits(r, 4)} ${digits(r, 4)}` },
  ja_JP: { names: 'names-ja_JP.txt', native: 'names-ja_JP-native.txt', subscriber: (r) => `${digits(r, 4)}-${digits(r, 4)}` },
  pt_BR: { names: 'names-pt_BR.txt', subscriber: (r) => `9${digits(r, 4)}-${digits(r, 4)}` },
  es_MX: { names: 'names-es_MX.txt', subscriber: (r) => `${digits(r, 4)} ${digits(r, 4)}` },
  hi_IN: { names: 'names-hi_IN.txt', native: 'names-hi_IN-native.txt', subscriber: (r) => `${digits(r, 4)} ${digits(r, 4)}` },
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const readLines = async (file) =>
  (await fs.readFile(path.join(DIR, file), 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean)

async function loadNames(src) {
  if (typeof src === 'string') return readLines(src)
  const res = await fetch(`${UPSTREAM}/${src.upstream}`)
  if (!res.ok) throw new Error(`upstream ${src.upstream}: ${res.status}`)
  return (await res.text()).split('\n').map((l) => l.trim()).filter(Boolean)
}

let cities
try {
  cities = JSON.parse(await fs.readFile(CITIES, 'utf8'))
} catch {
  console.log('gen-profiles: no data/profile-cities.json, skipping')
  process.exit(0)
}
let generated = 0

for (const [locale, cfg] of Object.entries(LOCALES)) {
  const tuples = cities[locale]
  if (!Array.isArray(tuples) || tuples.length === 0) {
    console.error(`gen-profiles: no city tuples for ${locale}, skipping`)
    continue
  }
  const noPrefix = tuples.filter((t) => !t.prefix).map((t) => t.city)
  if (noPrefix.length > 0) {
    // A row without a city-matching dial code defeats the whole point.
    console.error(`gen-profiles: ${locale} cities missing a dial prefix: ${noPrefix.join(', ')}`)
    process.exit(1)
  }
  let names, natives
  try {
    names = await loadNames(cfg.names)
    natives = cfg.native ? await readLines(cfg.native) : null
  } catch (err) {
    // Upstream fetch hiccup: keep the previously committed file rather
    // than shipping an empty list.
    console.error(`gen-profiles: ${locale} names unavailable (${err.message}), keeping existing file`)
    continue
  }

  const rand = mulberry32(1337)
  const rows = []
  const usedNames = new Set()
  for (let i = 0; i < ROWS && usedNames.size < names.length; i++) {
    let ni
    do {
      ni = Math.floor(rand() * names.length)
    } while (usedNames.has(ni))
    usedNames.add(ni)
    const t = tuples[Math.floor(rand() * tuples.length)]
    // The whole point of these bundles: the phone's area code belongs to
    // the same city as the postal code, so no row contradicts itself.
    const phone = t.prefix ? `${t.prefix} ${cfg.subscriber(rand)}` : undefined
    rows.push({
      value: `${names[ni]} — ${t.city}`,
      name: names[ni],
      ...(natives && natives[ni] ? { native_name: natives[ni] } : {}),
      city: t.city,
      region: t.region,
      postal: t.postal,
      ...(phone ? { phone } : {}),
      timezone: t.timezone,
    })
  }
  await fs.writeFile(
    path.join(DIR, `profile-${locale}.json`),
    JSON.stringify(rows, null, 1) + '\n',
  )
  generated++
}

console.log(`gen-profiles: ${generated}/${Object.keys(LOCALES).length} locale bundles generated`)
