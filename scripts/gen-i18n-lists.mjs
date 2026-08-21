#!/usr/bin/env node
/**
 * Generate locale-format lists from Intl at build time — ground truth by
 * construction, refreshed each deploy (dates use the build date).
 * Emits: date-formats-by-locale, number-formats-by-locale, prices-localized.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'data', 'lists')
const now = new Date()

const LOCALES = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'es-MX', 'it-IT', 'nl-NL',
  'pt-BR', 'sv-SE', 'pl-PL', 'tr-TR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
  'hi-IN', 'en-IN', 'ar-EG', 'he-IL',
]

const dates = []
for (const style of ['short', 'medium', 'long']) {
  for (const loc of LOCALES) {
    dates.push(`${new Intl.DateTimeFormat(loc, { dateStyle: style }).format(now)} · ${loc} ${style}`)
  }
}
await fs.writeFile(path.join(DIR, 'date-formats-by-locale.txt'), dates.join('\n') + '\n')

const numbers = []
for (const n of [1234567.89, 0.72, -4520.5]) {
  for (const loc of LOCALES) {
    const formatted =
      n === 0.72
        ? new Intl.NumberFormat(loc, { style: 'percent', minimumFractionDigits: 1 }).format(n)
        : new Intl.NumberFormat(loc).format(n)
    numbers.push(`${formatted} · ${loc}`)
  }
}
await fs.writeFile(path.join(DIR, 'number-formats-by-locale.txt'), numbers.join('\n') + '\n')

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
const prices = PRICES.map(
  ([loc, cur, amt]) =>
    `${new Intl.NumberFormat(loc, { style: 'currency', currency: cur }).format(amt)} · ${cur} ${loc}`,
)
await fs.writeFile(path.join(DIR, 'prices-localized.txt'), prices.join('\n') + '\n')

console.log(`gen-i18n-lists: ${dates.length} dates, ${numbers.length} numbers, ${prices.length} prices`)
