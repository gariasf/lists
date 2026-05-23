/**
 * Semantic search over the items in every list.
 *
 * Reads from Vectorize index "lists-items" populated by
 * scripts/build-vectorize-index.ts. Item vectors come from
 * @cf/baai/bge-base-en-v1.5 (768 dims, cosine).
 *
 * POST { query: string, limit?: number }
 * → { matches: [{ score, value, slug, list }] }
 */

interface VectorizeBinding {
  query: (
    vector: number[],
    options?: {
      topK?: number
      returnValues?: boolean
      returnMetadata?: boolean | 'all' | 'indexed'
      namespace?: string
    },
  ) => Promise<{
    matches: Array<{
      id: string
      score: number
      metadata?: Record<string, unknown>
    }>
  }>
}

interface Env {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ data?: number[][] } | { response?: string }>
  }
  VECTORIZE: VectorizeBinding
}

interface Body {
  query?: string
  limit?: number
}

const MODEL = '@cf/baai/bge-base-en-v1.5'
const MAX_LIMIT = 20
const DEFAULT_LIMIT = 10

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const query = (body.query ?? '').trim()
  if (!query) return jsonResponse({ error: 'query is required' }, 400)
  if (query.length > 200)
    return jsonResponse({ error: 'query too long (max 200 chars)' }, 400)

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(body.limit ?? DEFAULT_LIMIT)),
  )

  // Embed the query
  let queryVec: number[]
  try {
    const result = (await env.AI.run(MODEL, { text: [query] })) as {
      data?: number[][]
    }
    if (!result?.data?.[0]) {
      return jsonResponse({ error: 'No embedding returned' }, 502)
    }
    queryVec = result.data[0]
  } catch (err) {
    return jsonResponse(
      { error: 'Embedding failed', detail: String((err as Error).message ?? err) },
      502,
    )
  }

  let queryResult
  try {
    queryResult = await env.VECTORIZE.query(queryVec, {
      topK: limit,
      returnMetadata: 'all',
    })
  } catch (err) {
    return jsonResponse(
      { error: 'Vectorize query failed', detail: String((err as Error).message ?? err) },
      502,
    )
  }

  const matches = queryResult.matches.map((m) => {
    const md = (m.metadata ?? {}) as Record<string, unknown>
    return {
      score: m.score,
      value: typeof md.value === 'string' ? md.value : '',
      slug: typeof md.slug === 'string' ? md.slug : '',
      list: typeof md.list === 'string' ? md.list : '',
    }
  })

  return jsonResponse({ query, matches, model: MODEL })
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonResponse(
    {
      error: 'Use POST with { query, limit? }',
      model: MODEL,
      maxLimit: MAX_LIMIT,
    },
    405,
  )
}
