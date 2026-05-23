/**
 * Per-IP + global rate limiting for AI endpoints, backed by Workers KV.
 *
 * Two kinds:
 *   - "llm"   for any Llama-grade call (generate / skill / augment / mcp gen)
 *   - "embed" for the much cheaper bge embedding (semantic search)
 *
 * Hard ceilings are deliberately well below the Workers AI 10K-neurons-per-day
 * free-tier limit so a botted run still can't push our account into paid
 * territory. Anyone who hits the daily cap gets a 429 with Retry-After and a
 * friendly JSON error.
 *
 * KV is eventually consistent so two parallel requests racing the same counter
 * may both succeed once across the limit. That's acceptable — we set ceilings
 * comfortably under the free tier, and reads/writes are cheap.
 */

export interface RateLimitEnv {
  RATELIMIT: KVNamespace
}

export interface LimitKind {
  /** Bucket name used in both global and per-IP keys. */
  bucket: string
  /** Total daily calls allowed across ALL users for this bucket. */
  globalMax: number
  /** Per-IP calls allowed per hour. */
  ipMax: number
  /** Optional human label for error messages. */
  label?: string
}

/** Llama-grade generators. Each call ≈ 100–250 neurons. */
export const LLM_LIMIT: LimitKind = {
  bucket: 'llm',
  globalMax: 120,
  ipMax: 6,
  label: 'AI generation',
}

/** Embedding queries. Each call ≈ 10–40 neurons. Used per palette keystroke. */
export const EMBED_LIMIT: LimitKind = {
  bucket: 'embed',
  globalMax: 800,
  ipMax: 40,
  label: 'semantic search',
}

function clientIp(request: Request): string {
  // Cloudflare populates CF-Connecting-IP. Fall back to a stable placeholder so
  // we still rate-limit something rather than running unbounded.
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

function dayKey(bucket: string): string {
  const now = new Date()
  return `global:${bucket}:${now.toISOString().slice(0, 10)}`
}

function hourKey(bucket: string, ip: string): string {
  const now = new Date()
  return `ip:${bucket}:${ip}:${now.toISOString().slice(0, 13)}`
}

function tooManyResponse(retryAfter: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message, retry_after_seconds: retryAfter }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(retryAfter),
        'cache-control': 'no-store',
      },
    },
  )
}

/**
 * Throws a 429 Response if the caller is over either the global or per-IP
 * budget. Otherwise increments both counters and returns null.
 */
export async function checkRateLimit(
  env: RateLimitEnv,
  request: Request,
  kind: LimitKind,
): Promise<Response | null> {
  const ip = clientIp(request)
  const gKey = dayKey(kind.bucket)
  const iKey = hourKey(kind.bucket, ip)

  const [globalRaw, ipRaw] = await Promise.all([
    env.RATELIMIT.get(gKey),
    env.RATELIMIT.get(iKey),
  ])

  const globalCount = parseInt(globalRaw ?? '0', 10)
  const ipCount = parseInt(ipRaw ?? '0', 10)

  if (globalCount >= kind.globalMax) {
    // Quota burnt for the day. Retry after midnight UTC.
    const now = new Date()
    const midnight = new Date(now)
    midnight.setUTCHours(24, 0, 0, 0)
    const secondsToMidnight = Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000))
    return tooManyResponse(
      secondsToMidnight,
      `Daily ${kind.label ?? 'AI'} quota reached for everyone. Try again tomorrow.`,
    )
  }

  if (ipCount >= kind.ipMax) {
    return tooManyResponse(
      3600,
      `Hourly ${kind.label ?? 'AI'} rate limit reached for your IP. Try again in an hour.`,
    )
  }

  // Increment with TTL. Global TTL is ~25h so it survives slow cross-midnight rollover.
  await Promise.all([
    env.RATELIMIT.put(gKey, String(globalCount + 1), {
      expirationTtl: 25 * 3600,
    }),
    env.RATELIMIT.put(iKey, String(ipCount + 1), {
      expirationTtl: 2 * 3600,
    }),
  ])

  return null
}
