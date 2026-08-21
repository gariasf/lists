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

// locale → { names: local file | {upstream}, native?: aligned local file, phone: local file }
const LOCALES = {
  en_US: { names: { upstream: 'names-en_US.txt' }, phone: 'phone-us_US.txt' },
  en_GB: { names: { upstream: 'names-en_GB.txt' }, phone: 'phone-gb_GB.txt' },
  de_DE: { names: { upstream: 'names-de_DE.txt' }, phone: 'phone-de_DE.txt' },
  it_IT: { names: 'names-it_IT.txt', phone: 'phone-it_IT.txt' },
  ja_JP: { names: 'names-ja_JP.txt', native: 'names-ja_JP-native.txt', phone: 'phone-jp_JP.txt' },
  pt_BR: { names: 'names-pt_BR.txt', phone: 'phone-br_BR.txt' },
  es_MX: { names: 'names-es_MX.txt', phone: 'phone-mx_MX.txt' },
  hi_IN: { names: 'names-hi_IN.txt', native: 'names-hi_IN-native.txt', phone: 'phone-in_IN.txt' },
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

  const phones = await readLines(cfg.phone)
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
    rows.push({
      value: `${names[ni]} — ${t.city}`,
      name: names[ni],
      ...(natives && natives[ni] ? { native_name: natives[ni] } : {}),
      city: t.city,
      region: t.region,
      postal: t.postal,
      phone: phones[Math.floor(rand() * phones.length)],
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
