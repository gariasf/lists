#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'

const BASE = 'https://lists.gariasf.com'
const OUT_DIR = path.join(process.cwd(), 'out')
const MANIFEST = path.join(OUT_DIR, 'api', 'manifest')
const SITEMAP_OUT = path.join(OUT_DIR, 'sitemap.xml')

const SKILL_SLUGS = [
  'realistic-user',
  'pricing-page',
  'order-receipt',
  'customer-card',
  'address-block',
]

function xmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'))
  const today = new Date().toISOString().split('T')[0]

  const urls = [
    { loc: `${BASE}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${BASE}/skills/`, priority: '0.9', changefreq: 'monthly' },
    ...SKILL_SLUGS.map((slug) => ({
      loc: `${BASE}/skills/${slug}/`,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    ...manifest.lists.map((l) => ({
      loc: `${BASE}/list/${l.slug}/`,
      priority: '0.7',
      changefreq: 'monthly',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  await fs.writeFile(SITEMAP_OUT, xml)
  console.log(`sitemap.xml: ${urls.length} URLs → ${path.relative(process.cwd(), SITEMAP_OUT)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
