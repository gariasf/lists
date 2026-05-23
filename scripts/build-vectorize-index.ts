/**
 * Build + populate the Vectorize index for semantic search.
 *
 * Runs locally (or in CI) — call with wrangler-authenticated CLI nearby:
 *   npm run build:semantic
 *
 * Steps:
 *   1. Read every searchable item via lib/lists (same exclusion list as
 *      the static search index — drops lorem / hashes / IPs etc.).
 *   2. Stable content-hash IDs so re-running upserts in place without
 *      duplicating vectors.
 *   3. Batch-embed with Workers AI bge-base-en-v1.5 via REST.
 *   4. Stream NDJSON into a temp file.
 *   5. wrangler vectorize insert.
 *
 * Required env (loaded via wrangler whoami's existing auth):
 *   CLOUDFLARE_API_TOKEN      - same one CI uses for Pages deploys
 *   CLOUDFLARE_ACCOUNT_ID
 */
import { createHash } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { homedir, platform } from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { LIST_DEFINITIONS } from '../lib/lists-data'
import { getList } from '../lib/lists'

const INDEX_NAME = 'lists-items'
const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5'
const BATCH_SIZE = 96
const MAX_ITEM_LENGTH = 120

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
  'datesddmmy',
  'datesddmmyslash-en',
  'datesmmddydash',
  'datesmmddyslash',
  'datestimestamps-en',
  'iso-timestamps-modern',
  'calendar-en',
  'subscription-prices',
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

interface IndexedItem {
  id: string
  value: string
  slug: string
  listName: string
}

interface Vector {
  id: string
  values: number[]
  metadata: {
    value: string
    slug: string
    list: string
  }
}

function contentHash(slug: string, value: string): string {
  return createHash('sha1').update(`${slug}|${value}`).digest('hex').slice(0, 32)
}

async function callEmbeddings(
  accountId: string,
  apiToken: string,
  texts: string[],
): Promise<number[][]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EMBED_MODEL}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text: texts }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`embeddings ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as {
    result?: { data?: number[][] }
    success?: boolean
    errors?: unknown[]
  }
  if (!json.success || !json.result?.data) {
    throw new Error(`embeddings response shape: ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json.result.data
}

async function gatherItems(): Promise<IndexedItem[]> {
  const out: IndexedItem[] = []
  let total = 0
  for (const def of LIST_DEFINITIONS) {
    if (EXCLUDE_SLUGS.has(def.slug)) continue
    const list = await getList(def.slug)
    if (!list || list.items.length === 0) continue

    const seen = new Set<string>()
    for (const v of list.items) {
      const trimmed = v.trim()
      if (!trimmed || trimmed.length > MAX_ITEM_LENGTH) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        id: contentHash(def.slug, trimmed),
        value: trimmed,
        slug: def.slug,
        listName: def.name,
      })
      total++
    }
  }
  console.log(`[semantic] collected ${total} items across ${out.length > 0 ? new Set(out.map((i) => i.slug)).size : 0} lists`)
  return out
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function runWranglerInsert(ndjsonPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npx',
      ['wrangler', 'vectorize', 'upsert', INDEX_NAME, `--file=${ndjsonPath}`],
      { stdio: 'inherit' },
    )
    proc.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`wrangler exited with code ${code}`))
    })
  })
}

function wranglerConfigPath(): string {
  const env = process.env.WRANGLER_HOME
  if (env) return path.join(env, 'config', 'default.toml')
  const home = homedir()
  if (platform() === 'darwin')
    return path.join(home, 'Library', 'Preferences', '.wrangler', 'config', 'default.toml')
  if (platform() === 'win32')
    return path.join(process.env.APPDATA ?? home, '.wrangler', 'config', 'default.toml')
  return path.join(home, '.wrangler', 'config', 'default.toml')
}

async function readOAuthToken(): Promise<string | null> {
  try {
    const raw = await readFile(wranglerConfigPath(), 'utf8')
    const m = raw.match(/oauth_token\s*=\s*"([^"]+)"/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

async function resolveAccountId(token: string): Promise<string> {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`accounts ${res.status}`)
  const json = (await res.json()) as {
    result?: { id: string; name: string }[]
    success: boolean
  }
  if (!json.success || !json.result?.[0]?.id)
    throw new Error('Could not resolve account ID from /accounts')
  return json.result[0].id
}

async function main() {
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN ?? (await readOAuthToken())
  if (!apiToken) {
    throw new Error(
      'No Cloudflare credentials found. Set CLOUDFLARE_API_TOKEN or run `npx wrangler login` first.',
    )
  }
  const accountId = await resolveAccountId(apiToken)
  console.log(`[semantic] using account ${accountId.slice(0, 8)}…`)

  const items = await gatherItems()
  if (items.length === 0) {
    console.error('[semantic] no items — aborting')
    process.exit(1)
  }

  const batches = chunk(items, BATCH_SIZE)
  console.log(`[semantic] embedding ${items.length} items in ${batches.length} batches`)

  const vectors: Vector[] = []
  let embedded = 0
  for (const [i, batch] of batches.entries()) {
    const embeddings = await callEmbeddings(
      accountId,
      apiToken,
      batch.map((b) => b.value),
    )
    if (embeddings.length !== batch.length) {
      throw new Error(
        `batch ${i}: expected ${batch.length} embeddings, got ${embeddings.length}`,
      )
    }
    for (let j = 0; j < batch.length; j++) {
      vectors.push({
        id: batch[j].id,
        values: embeddings[j],
        metadata: {
          value: batch[j].value,
          slug: batch[j].slug,
          list: batch[j].listName,
        },
      })
    }
    embedded += batch.length
    if (i % 10 === 0 || i === batches.length - 1) {
      console.log(`[semantic] ${embedded}/${items.length} embedded`)
    }
  }

  const outDir = path.join(process.cwd(), '.vectorize')
  await mkdir(outDir, { recursive: true })
  const ndjsonPath = path.join(outDir, 'vectors.ndjson')
  await writeFile(
    ndjsonPath,
    vectors.map((v) => JSON.stringify(v)).join('\n') + '\n',
    'utf8',
  )
  const sizeKB = (
    vectors.reduce((s, v) => s + JSON.stringify(v).length, 0) / 1024
  ).toFixed(0)
  console.log(`[semantic] wrote ${ndjsonPath} (${sizeKB} KB)`)

  console.log(`[semantic] upserting into Vectorize index "${INDEX_NAME}"`)
  await runWranglerInsert(ndjsonPath)
  console.log(`[semantic] done — ${vectors.length} vectors live`)
}

main().catch((err) => {
  console.error('[semantic] failed:', err)
  process.exit(1)
})
