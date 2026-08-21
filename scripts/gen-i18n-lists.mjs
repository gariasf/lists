#!/usr/bin/env node
/**
 * Generate locale-format lists from Intl at build time — ground truth by
 * construction, refreshed each deploy (dates use the build date).
 * Emits: date-formats-by-locale, number-formats-by-locale, prices-localized.
 *
 * These are structured JSON, not plain lines, because the locale label has to
 * stay OUT of the formatted value: gluing an LTR " · ar-EG" onto an RTL price
 * puts the two runs in one bidi paragraph, and the neutral characters (the
 * dots in ج.م.) get reordered on screen. Separate fields keep each value in
 * its own direction, and the copied item is just the value anyway.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data', 'lists')
const now = new Date()

const writeJson = (file, rows) =>
  fs.writeFile(path.join(DIR, file), JSON.stringify(rows, null, 1) + '\n')

const LOCALES = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'es-MX', 'it-IT', 'nl-NL',
  'pt-BR', 'sv-SE', 'pl-PL', 'tr-TR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
  'hi-IN', 'en-IN', 'ar-EG', 'he-IL',
]

const dates = []
for (const style of ['short', 'medium', 'long']) {
  for (const loc of LOCALES) {
    dates.push({
      value: new Intl.DateTimeFormat(loc, { dateStyle: style }).format(now),
      locale: loc,
      style,
    })
  }
}
await writeJson('date-formats-by-locale.json', dates)

const numbers = []
for (const n of [1234567.89, 0.72, -4520.5]) {
  for (const loc of LOCALES) {
    const formatted =
      n === 0.72
        ? new Intl.NumberFormat(loc, { style: 'percent', minimumFractionDigits: 1 }).format(n)
        : new Intl.NumberFormat(loc).format(n)
    numbers.push({ value: formatted, locale: loc, source: String(n) })
  }
}
await writeJson('number-formats-by-locale.json', numbers)

const PRICES = [
  ['en-US', 'USD', 49.99], ['en-US', 'USD', 1299], ['en-GB', 'GBP', 42.5],
  ['de-DE', 'EUR', 1234.56], ['fr-FR', 'EUR', 89.9], ['es-ES', 'EUR', 19.95],
  ['it-IT', 'EUR', 249], ['nl-NL', 'EUR', 74.95], ['pt-BR', 'BRL', 1234.56],
  ['es-MX', 'MXN', 899], ['ja-JP', 'JPY', 128000], ['ko-KR', 'KRW', 49000],
  ['zh-CN', 'CNY', 6999], ['hi-IN', 'INR', 74999], ['en-IN', 'INR', 1250000],
  ['sv-SE', 'SEK', 495], ['pl-PL', 'PLN', 219.99], ['tr-TR', 'TRY', 1899],
  ['ru-RU', 'RUB', 4990], ['ar-EG', 'EGP', 850], ['de-CH', 'CHF', 320],
  ['en-CA', 'CAD', 64.99], ['en-AU', 'AUD', 129], ['da-DK', 'DKK', 349.95],
]
const prices = PRICES.map(([loc, cur, amt]) => ({
  value: new Intl.NumberFormat(loc, { style: 'currency', currency: cur }).format(amt),
  currency: cur,
  locale: loc,
}))
await writeJson('prices-localized.json', prices)

console.log(`gen-i18n-lists: ${dates.length} dates, ${numbers.length} numbers, ${prices.length} prices`)
