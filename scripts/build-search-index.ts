import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { LIST_DEFINITIONS } from '../lib/lists-data'
import { getList } from '../lib/lists'

// Lists that are browsable but not useful to search by item content.
// Mostly long-text, prose, or commentary lists where item search adds noise.
const EXCLUDE_SLUGS = new Set<string>([
  'lorem-bacon',
  'lorem-corporate',
  'lorem-hipster',
  'customer-testimonials',
  'bios-short',
  'okrs',
  'product-taglines',
  'slogans',
  'quotes-design',
  'quotes-tech',
  'faq-questions',
  'reviews-5star',
  'reviews-1star',
  'linkedin-updates',
  'tweets',
  'hn-titles',
  'pr-titles',
  'bug-report-titles',
  'commit-messages-real',
  'empty-state-copy',
  'loading-messages',
  'error-messages-user',
  'notification-titles',
  'push-notifications',
  'toast-messages',
  'cta-button-copy',
  'email-signatures',
  'meeting-titles',
  'articlessports-en',
  'articlestech-en',
  'articlesscience-en',
  'articlesworld-en',
  'headlinessports-en',
  'headlinestech-en',
  'headlinesscience-en',
  'headlinesworld-en',
  'emailsubjects-en',
  'budgetbusiness-en',
  'budgetspendings-en',
  'excuses-en',
  // High-entropy random strings — nobody searches by value
  'hashmd5',
  'hashsha1',
  'ipv4',
  'ipv6',
  'bitcoinaddresses',
  'creditcardnumber',
  'gpscoordinates',
  'booksisbn',
  'dunsnumber-en_us',
  'ein-en_us',
  'iban',
  'swift-bic',
  'routing-numbers-us',
  'vat-ids-eu',
  // Numeric ranges — synthetic + repetitive
  'numbers0to99',
  'numbers0to099',
  'numbers100to999',
  'numbersthousand',
  'numberpercentages',
  'prices0to99-dollar',
  'prices0to099-dollar',
  'prices100to999-dollar',
  'pricesthousand-dollar',
  'prices0to99-euro',
  'prices0to099-euro',
  'prices100to999-euro',
  'pricesthousand-euro',
  'prices0to99-pound',
  'prices0to099-pound',
  'prices100to999-pound',
  'pricesthousand-pound',
  'durationmarathon',
  'durationsong',
  'durationmovie',
  'durationshortfilm',
  'durationsleep',
  'otp-codes',
  'phone-pins',
  'hex-numbers',
  'binary-numbers',
  'octal-numbers',
  'scientific-notation',
  'large-numbers',
  'invoice-numbers',
  'order-numbers',
  'product-skus',
  'tracking-ups',
  'tracking-fedex',
  'tracking-dhl',
  'tracking-usps',
  'license-plates-us',
  'license-plates-eu',
  'license-plates-jp',
  'discount-codes',
  // Random date formats — also synthetic
  'datesddmmy',
  'datesddmmyslash-en',
  'datesmmddydash',
  'datesmmddyslash',
  'datestimestamps-en',
  'iso-timestamps-modern',
  'calendar-en',
  'subscription-prices',
  // Phone numbers (already covered by phone-* by-locale lists; numeric only)
  'phone-en_us',
  'phone-en_gb',
  'phone-de_de',
  'phone-fr_fr',
  'phone-jp_jp',
  'phone-in_in',
  'phone-au_au',
  'phone-br_br',
  'phone-mx_mx',
])

const MAX_ITEM_LENGTH = 80

interface IndexList {
  slug: string
  name: string
  cat: string
  items: string[]
}

async function main() {
  const outLists: IndexList[] = []
  let totalItems = 0

  for (const def of LIST_DEFINITIONS) {
    if (EXCLUDE_SLUGS.has(def.slug)) continue
    const list = await getList(def.slug)
    if (!list || list.items.length === 0) continue

    // Deduplicate within the list and cap at MAX_ITEM_LENGTH.
    const seen = new Set<string>()
    const items: string[] = []
    for (const v of list.items) {
      const trimmed = v.trim()
      if (!trimmed || trimmed.length > MAX_ITEM_LENGTH) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      items.push(trimmed)
    }
    if (items.length === 0) continue

    outLists.push({
      slug: def.slug,
      name: def.name,
      cat: def.category,
      items,
    })
    totalItems += items.length
  }

  const payload = { version: 1, lists: outLists }
  const json = JSON.stringify(payload)
  const outDir = path.join(process.cwd(), 'public')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'search-index.json'), json, 'utf8')

  const kb = (json.length / 1024).toFixed(1)
  console.log(
    `[search-index] ${outLists.length} lists, ${totalItems} items, ${kb} KB raw → public/search-index.json`,
  )
}

main().catch((err) => {
  console.error('[search-index] build failed:', err)
  process.exit(1)
})
