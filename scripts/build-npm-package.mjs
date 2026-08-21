#!/usr/bin/env node
/**
 * Assemble the publishable npm package from the already-built static API
 * output. Runs after `next build`, so the package can never drift from the
 * site: same data, same slugs, same day.
 *
 * Output: packages/npm/  (gitignored — rebuilt on demand)
 *   index.js / index.d.ts   list(), sample(), slugs, meta
 *   data/<slug>.json        one module per list, tree-shakeable
 *   bin/lists.js            npx lists-design <slug> [n]
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const API_LISTS = path.join(ROOT, 'out', 'api', 'lists')
const API_MANIFEST = path.join(ROOT, 'out', 'api', 'manifest')
const PKG = path.join(ROOT, 'packages', 'npm')
const DATA = path.join(PKG, 'data')

const VERSION = process.env.NPM_PACKAGE_VERSION ?? '0.1.0'
const NAME = 'lists-design'

const manifest = JSON.parse(await fs.readFile(API_MANIFEST, 'utf8'))

await fs.rm(PKG, { recursive: true, force: true })
await fs.mkdir(DATA, { recursive: true })
await fs.mkdir(path.join(PKG, 'bin'), { recursive: true })

// One JSON module per list: `import names from 'lists-design/data/names-pt_br.json'`
// pulls in only that file.
let count = 0
const meta = {}
for (const entry of manifest.lists) {
  const src = path.join(API_LISTS, entry.slug)
  let list
  try {
    list = JSON.parse(await fs.readFile(src, 'utf8'))
  } catch {
    continue // list produced no output (upstream fetch failure)
  }
  if (!Array.isArray(list.items) || list.items.length === 0) continue
  await fs.writeFile(
    path.join(DATA, `${entry.slug}.json`),
    JSON.stringify(list.structured ?? list.items),
  )
  meta[entry.slug] = {
    name: list.name,
    category: list.category,
    count: list.items.length,
    structured: Boolean(list.structured),
    ...(list.verified ? { verified: list.verified } : {}),
  }
  count++
}

const slugs = Object.keys(meta).sort()

await fs.writeFile(
  path.join(PKG, 'meta.json'),
  JSON.stringify({ version: VERSION, generated: manifest.count, lists: meta }),
)

await fs.writeFile(
  path.join(PKG, 'index.js'),
  `const fs = require('node:fs')
const path = require('node:path')
const meta = require('./meta.json')

const SLUGS = Object.keys(meta.lists).sort()
const cache = new Map()

function load(slug) {
  if (!Object.hasOwn(meta.lists, slug)) {
    throw new Error(\`Unknown list: \${slug}. See require('${NAME}').slugs\`)
  }
  if (!cache.has(slug)) {
    cache.set(slug, JSON.parse(fs.readFileSync(path.join(__dirname, 'data', slug + '.json'), 'utf8')))
  }
  return cache.get(slug)
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

/** Every item in a list. */
function list(slug) {
  return load(slug)
}

/** n items. Pass a seed for the same n items every time (CI-safe). */
function sample(slug, n = 1, seed) {
  const items = load(slug)
  const rand = seed === undefined ? Math.random : mulberry32(seed)
  const idx = items.map((_, i) => i)
  const take = Math.min(n, idx.length)
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rand() * (idx.length - i))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, take).map((i) => items[i])
}

/** One item. */
function one(slug, seed) {
  return sample(slug, 1, seed)[0]
}

module.exports = { list, sample, one, slugs: SLUGS, meta: meta.lists }
`,
)

const slugUnion = slugs.map((s) => `  | '${s}'`).join('\n')
await fs.writeFile(
  path.join(PKG, 'index.d.ts'),
  `export type Slug =
${slugUnion}

export interface ListMeta {
  name: string
  category: string
  count: number
  structured: boolean
  verified?: string
}

/** Every item in a list. Structured lists return objects, others strings. */
export declare function list(slug: Slug): string[] | Record<string, unknown>[]

/** n items; pass a seed for deterministic picks. */
export declare function sample(
  slug: Slug,
  n?: number,
  seed?: number,
): string[] | Record<string, unknown>[]

/** A single item. */
export declare function one(slug: Slug, seed?: number): string | Record<string, unknown>

export declare const slugs: Slug[]
export declare const meta: Record<Slug, ListMeta>
`,
)

await fs.writeFile(
  path.join(PKG, 'bin', 'lists.js'),
  `#!/usr/bin/env node
const { list, sample, slugs, meta } = require('../index.js')

const [slug, nRaw] = process.argv.slice(2)

if (!slug || slug === '--help' || slug === '-h') {
  console.log('Usage: npx ${NAME} <slug> [n]')
  console.log('       npx ${NAME} --list')
  console.log('')
  console.log('Examples:')
  console.log('  npx ${NAME} names-pt_br 5')
  console.log('  npx ${NAME} uuids 3')
  process.exit(slug ? 0 : 1)
}

if (slug === '--list') {
  for (const s of slugs) console.log(s.padEnd(34), meta[s].count)
  process.exit(0)
}

if (!Object.hasOwn(meta, slug)) {
  console.error(\`Unknown list: \${slug}\`)
  const near = slugs.filter((s) => s.includes(slug)).slice(0, 8)
  if (near.length > 0) console.error('Did you mean:\\n  ' + near.join('\\n  '))
  else console.error('Run \`npx ${NAME} --list\` to see all ' + slugs.length + ' lists.')
  process.exit(1)
}

const n = nRaw ? parseInt(nRaw, 10) : 0
const out = n > 0 ? sample(slug, n) : list(slug)
for (const item of out) {
  console.log(typeof item === 'string' ? item : JSON.stringify(item))
}
`,
)

await fs.writeFile(
  path.join(PKG, 'package.json'),
  JSON.stringify(
    {
      name: NAME,
      version: VERSION,
      description:
        'Curated, realistic mock data for designers and developers — names, addresses, microcopy, UI states, and locale-coherent profiles. The anti-lorem-ipsum.',
      keywords: ['mock-data', 'fixtures', 'faker', 'placeholder', 'seed-data', 'testing', 'design'],
      homepage: 'https://lists.gariasf.com',
      repository: { type: 'git', url: 'git+https://github.com/gariasf/lists.git' },
      license: 'MIT',
      main: 'index.js',
      types: 'index.d.ts',
      bin: { [NAME]: 'bin/lists.js' },
      files: ['index.js', 'index.d.ts', 'meta.json', 'data', 'bin', 'README.md'],
      exports: {
        '.': { types: './index.d.ts', default: './index.js' },
        './data/*': './data/*',
        './meta.json': './meta.json',
      },
      sideEffects: false,
      engines: { node: '>=18' },
    },
    null,
    2,
  ) + '\n',
)

await fs.writeFile(
  path.join(PKG, 'README.md'),
  `# ${NAME}

Curated, realistic mock data — ${count} lists of names, addresses, microcopy,
UI states, dev fixtures, and locale-coherent profiles. Generated from
[lists.gariasf.com](https://lists.gariasf.com); no network calls at runtime,
no dependencies.

\`\`\`bash
npm i -D ${NAME}
\`\`\`

\`\`\`js
const { list, sample, one } = require('${NAME}')

sample('names-pt_br', 3)          // 3 Brazilian names
sample('uuids', 5, 42)            // same 5 uuids every run — safe in CI
one('chat-messages')              // 'sounds good, pushing at 3'
list('profile-ja_jp')             // rows where name/city/postal/phone agree
\`\`\`

Import a single list directly and bundlers keep only that file:

\`\`\`js
import names from '${NAME}/data/names-pt_br.json'
\`\`\`

From the terminal:

\`\`\`bash
npx ${NAME} names-pt_br 5
npx ${NAME} --list
\`\`\`

Slugs are typed, so \`sample('nmaes-pt_br')\` fails at compile time.
Browse every list at [lists.gariasf.com](https://lists.gariasf.com).

## License

MIT for the code. The bundled data is redistributed with attribution —
see the [repository](https://github.com/gariasf/lists) for details.
`,
)

console.log(`build-npm-package: ${count} lists → packages/npm (v${VERSION})`)
