#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import { createReadStream, createWriteStream } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'out')
const API_LISTS = path.join(OUT_DIR, 'api', 'lists')
const API_MANIFEST = path.join(OUT_DIR, 'api', 'manifest')
const SKILL_MD_SRC = path.join(ROOT, 'public', 'claude-skill', 'SKILL.md')

const BUNDLE_DIR = path.join(OUT_DIR, 'claude-skill')
const SKILL_ROOT = path.join(BUNDLE_DIR, 'lists')
const DATA_DIR = path.join(SKILL_ROOT, 'data')
const TARBALL = path.join(BUNDLE_DIR, 'lists.tar.gz')

async function copyJsonFile(src, dest) {
  const buf = await fs.readFile(src)
  await fs.writeFile(dest, buf)
}

async function main() {
  for (const p of [SKILL_MD_SRC, API_MANIFEST]) {
    try {
      await fs.access(p)
    } catch {
      console.error(`Missing input: ${p}`)
      console.error('Run `next build` first so api/* and claude-skill/SKILL.md exist.')
      process.exit(1)
    }
  }

  await fs.rm(SKILL_ROOT, { recursive: true, force: true })
  await fs.mkdir(DATA_DIR, { recursive: true })

  await copyJsonFile(SKILL_MD_SRC, path.join(SKILL_ROOT, 'SKILL.md'))

  const manifestRaw = JSON.parse(await fs.readFile(API_MANIFEST, 'utf8'))
  const localManifest = {
    count: manifestRaw.count,
    lists: manifestRaw.lists.map(({ slug, name, category }) => ({
      slug,
      name,
      category,
      path: `data/${slug}.json`,
    })),
  }
  await fs.writeFile(
    path.join(DATA_DIR, 'manifest.json'),
    JSON.stringify(localManifest, null, 0),
  )

  const slugs = await fs.readdir(API_LISTS)
  let bytes = 0
  for (const slug of slugs) {
    const src = path.join(API_LISTS, slug)
    const stat = await fs.stat(src)
    if (!stat.isFile()) continue
    const dest = path.join(DATA_DIR, `${slug}.json`)
    await copyJsonFile(src, dest)
    bytes += stat.size
  }

  await fs.rm(TARBALL, { force: true })
  execSync(`tar -czf ${TARBALL} -C ${BUNDLE_DIR} lists`, { stdio: 'inherit' })

  const tarStat = await fs.stat(TARBALL)
  console.log(
    `claude-skill bundle: ${slugs.length} lists, ${(bytes / 1024 / 1024).toFixed(2)} MB raw, ${(tarStat.size / 1024).toFixed(0)} KB gzipped`,
  )
  console.log(`→ ${path.relative(ROOT, TARBALL)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
