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
//            subscriber: digits after the city's dial prefix }
//
// `subscriber` receives the prefix's area-code length, because national
// number length is fixed while area codes vary: London is +44 20 with 8
// local digits, Manchester +44 161 with 7. A fixed digit count per locale
// produces undialable numbers for half the cities.
const digits = (rand, n) =>
  Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')

const areaLen = (prefix) => prefix.split(' ').slice(1).join('').replace(/\D/g, '').length

// Ofcom reserves a per-area fictional block; it is not the same digits
// everywhere, so map the three 2-digit areas explicitly.
const UK_DRAMA = { '20': '7946 0', '29': '2018 0', '28': '9018 0', '191': '498 0' }

const LOCALES = {
  // Reserved fictional ranges: US 555-01xx, UK Ofcom drama blocks.
  en_US: { names: { upstream: 'names-en_US.txt' }, subscriber: (r) => `555-01${digits(r, 2)}` },
  en_GB: {
    names: { upstream: 'names-en_GB.txt' },
    subscriber: (r, _len, area) => `${UK_DRAMA[area] ?? '496 0'}${digits(r, 3)}`,
  },
  // German subscriber numbers shrink as the Vorwahl grows.
  de_DE: { names: { upstream: 'names-de_DE.txt' }, subscriber: (r, len) => digits(r, 10 - len) },
  // Italian prefixes keep their leading 0, which doesn't count toward length.
  it_IT: { names: 'names-it_IT.txt', subscriber: (r, len) => `${digits(r, 3)} ${digits(r, 10 - len - 3)}` },
  ja_JP: { names: 'names-ja_JP.txt', native: 'names-ja_JP-native.txt', subscriber: (r, len) => `${digits(r, 5 - len)}-${digits(r, 4)}` },
  // Brazilian mobiles: 9 + 8 digits after the 2-digit DDD.
  pt_BR: { names: 'names-pt_BR.txt', subscriber: (r) => `9${digits(r, 4)}-${digits(r, 4)}` },
  es_MX: { names: 'names-es_MX.txt', subscriber: (r, len) => `${digits(r, 10 - len - 4)} ${digits(r, 4)}` },
  hi_IN: { names: 'names-hi_IN.txt', native: 'names-hi_IN-native.txt', subscriber: (r, len) => `${digits(r, 10 - len - 4)} ${digits(r, 4)}` },
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
    // A 200 with an empty body would otherwise overwrite good committed
    // data with [].
    if (names.length === 0) throw new Error('empty name list')
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
    const area = t.prefix.split(' ').slice(1).join('').replace(/\D/g, '')
    const phone = `${t.prefix} ${cfg.subscriber(rand, areaLen(t.prefix), area)}`
    rows.push({
      value: `${names[ni]} — ${t.city}`,
      name: names[ni],
      ...(natives && natives[ni] ? { native_name: natives[ni] } : {}),
      city: t.city,
      region: t.region,
      postal: t.postal,
      phone,
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
