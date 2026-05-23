import { checkRateLimit, LLM_LIMIT, type RateLimitEnv } from '../../_lib/ratelimit'

interface Env extends RateLimitEnv {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ response?: string } | { response: string }>
  }
}

interface GenerateBody {
  prompt?: string
  count?: number
  /** Optional list slug — when provided we seed the model with up to 20 sample items so output matches the list's shape/style */
  listSlug?: string
}

const MAX_COUNT = 50
const DEFAULT_COUNT = 10
const MODEL = '@cf/meta/llama-3.1-8b-instruct'

const SYSTEM_PROMPT = `You generate realistic mock data for designers.

Rules:
- Output STRICT JSON only. No prose, no markdown fences, no commentary.
- Schema: { "items": ["string1", "string2", ...] }
- Each item is one short, plausible value matching the user's request.
- No duplicates. No numbering. No commentary inside items.
- Locale-coherent (names, prices, addresses match a consistent culture).
- Match the shape of any seed examples given.`

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function buildUserPrompt(
  prompt: string,
  count: number,
  seedItems?: string[],
): string {
  const lines: string[] = [
    `Generate exactly ${count} items.`,
    `Request: ${prompt.trim()}`,
  ]
  if (seedItems && seedItems.length > 0) {
    lines.push('')
    lines.push('Seed examples (match this shape and style):')
    for (const s of seedItems.slice(0, 20)) lines.push(`- ${s}`)
  }
  lines.push('')
  lines.push('Respond with JSON only.')
  return lines.join('\n')
}

function tryParseItems(raw: string, count: number): string[] {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : raw

  try {
    const obj = JSON.parse(candidate)
    if (obj && Array.isArray(obj.items)) {
      return obj.items
        .filter((v: unknown): v is string => typeof v === 'string')
        .map((v: string) => v.trim())
        .filter(Boolean)
        .slice(0, count)
    }
    if (Array.isArray(obj)) {
      return obj
        .filter((v: unknown): v is string => typeof v === 'string')
        .map((v: string) => v.trim())
        .filter(Boolean)
        .slice(0, count)
    }
  } catch {
    /* fall through */
  }

  // Last resort: split lines, strip bullets/numbers
  return candidate
    .split('\n')
    .map((l) => l.replace(/^\s*[-*\d.)]+\s*/, '').trim())
    .filter((l) => l && !l.startsWith('{') && !l.startsWith('['))
    .slice(0, count)
}

async function fetchSeeds(
  listSlug: string | undefined,
  origin: string,
): Promise<string[] | undefined> {
  if (!listSlug) return undefined
  if (!/^[a-z0-9-_]+$/.test(listSlug)) return undefined
  try {
    const res = await fetch(`${origin}/api/lists/${listSlug}`)
    if (!res.ok) return undefined
    const data = (await res.json()) as { items?: string[] }
    if (!Array.isArray(data.items)) return undefined
    const shuffled = [...data.items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, 20)
  } catch {
    return undefined
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  const limited = await checkRateLimit(env, request, LLM_LIMIT)
  if (limited) return limited

  let body: GenerateBody
  try {
    body = (await request.json()) as GenerateBody
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) return jsonResponse({ error: 'prompt is required' }, 400)
  if (prompt.length > 500)
    return jsonResponse({ error: 'prompt too long (max 500 chars)' }, 400)

  const count = Math.min(MAX_COUNT, Math.max(1, Math.floor(body.count ?? DEFAULT_COUNT)))
  const origin = new URL(request.url).origin
  const seeds = await fetchSeeds(body.listSlug, origin)

  const userPrompt = buildUserPrompt(prompt, count, seeds)

  let result: { response?: string }
  try {
    result = (await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.8,
    })) as { response?: string }
  } catch (err) {
    return jsonResponse(
      { error: 'AI request failed', detail: String((err as Error).message ?? err) },
      502,
    )
  }

  const raw = (result?.response ?? '').toString()
  if (!raw) return jsonResponse({ error: 'Empty response from model' }, 502)

  const items = tryParseItems(raw, count)
  if (items.length === 0) {
    return jsonResponse(
      { error: 'Could not parse items from model output', raw: raw.slice(0, 400) },
      502,
    )
  }

  return jsonResponse({
    items,
    model: MODEL,
    requested: count,
    returned: items.length,
    prompt,
  })
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonResponse({
    error: 'Use POST with { prompt, count, listSlug? }',
  }, 405)
}
