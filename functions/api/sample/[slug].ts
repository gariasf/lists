/**
 * GET /api/sample/<slug>?n=5&seed=42
 *
 * Random (or seed-deterministic) sample from a prebuilt static list.
 * Reads the static JSON via the ASSETS binding — no KV, no rate limit,
 * no AI: it's a static read, free at any scale. Same seed → same rows,
 * forever (CI-safe fixtures).
 */

interface Env {
  ASSETS: { fetch: (req: Request | URL) => Promise<Response> }
}

const MAX_N = 20

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
  })
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const slug = String(params.slug ?? '')
  if (!/^[a-z0-9-_]+$/.test(slug)) return jsonResponse({ error: 'Invalid slug' }, 400)

  const url = new URL(request.url)
  const n = Math.min(MAX_N, Math.max(1, parseInt(url.searchParams.get('n') ?? '5', 10) || 5))
  const seedParam = url.searchParams.get('seed')

  const asset = await env.ASSETS.fetch(new URL(`/api/lists/${slug}`, url.origin))
  if (!asset.ok) return jsonResponse({ error: `Unknown list: ${slug}` }, 404)
  const list = (await asset.json()) as { items?: string[]; structured?: unknown[] }
  const items = Array.isArray(list.items) ? list.items : []
  if (items.length === 0) return jsonResponse({ error: `Unknown list: ${slug}` }, 404)

  const seed = seedParam == null ? null : parseInt(seedParam, 10)
  const rand =
    seed != null && Number.isFinite(seed) ? mulberry32(seed) : () => Math.random()

  // Partial Fisher-Yates: shuffle just the first n positions.
  const idx = items.map((_, i) => i)
  const count = Math.min(n, idx.length)
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (idx.length - i))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const picked = idx.slice(0, count)

  return jsonResponse({
    slug,
    n: count,
    ...(seed != null && Number.isFinite(seed) ? { seed } : {}),
    items: picked.map((i) => items[i]),
    ...(Array.isArray(list.structured)
      ? { structured: picked.map((i) => (list.structured as unknown[])[i]) }
      : {}),
  })
}
