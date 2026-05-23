/**
 * Generic skill endpoint. POST { name, knobs } -> returns the skill's output.
 *
 * Each skill is a curated recipe that composes multiple lists + an LLM call
 * into a coherent multi-field record (or array of records). The frontend
 * passes user-tweaked knobs; this function builds the prompt, calls Workers
 * AI, parses + validates the JSON response, and applies any post-processing
 * (e.g. deterministic avatar URLs that don't depend on LLM accuracy).
 */

import { checkRateLimit, LLM_LIMIT, type RateLimitEnv } from '../../_lib/ratelimit'

interface Env extends RateLimitEnv {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ response?: string }>
  }
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct'

interface Body {
  name?: string
  knobs?: Record<string, unknown>
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function asString(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v.slice(0, 200)
  return fallback
}

function extractJson(raw: string): unknown | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : raw
  try {
    return JSON.parse(candidate)
  } catch {
    // Try to find the first {...} or [...] block
    const start = candidate.search(/[\[{]/)
    if (start === -1) return null
    const stack: string[] = []
    let end = -1
    for (let i = start; i < candidate.length; i++) {
      const c = candidate[i]
      if (c === '{' || c === '[') stack.push(c)
      else if (c === '}' || c === ']') {
        stack.pop()
        if (stack.length === 0) {
          end = i + 1
          break
        }
      }
    }
    if (end === -1) return null
    try {
      return JSON.parse(candidate.slice(start, end))
    } catch {
      return null
    }
  }
}

const LOCALE_HINTS: Record<string, string> = {
  en_US: 'United States: American English names, US cities/states, $USD prices, +1 phone, ZIP codes.',
  en_GB: 'United Kingdom: British names, UK cities/counties, £GBP prices, +44 phone, UK postcodes.',
  ja_JP: 'Japan: Japanese names (romanized or kana), Tokyo / Osaka / Kyoto cities, ¥JPY prices, +81 phone, 7-digit postal codes like 100-0001. Email domains often .co.jp.',
  ko_KR: 'South Korea: Korean names (romanized), Seoul / Busan cities, ₩KRW prices, +82 phone.',
  zh_CN: 'China: Chinese names (pinyin), Shanghai / Beijing / Shenzhen cities, ¥CNY prices, +86 phone.',
  es_ES: 'Spain: Spanish names, Madrid / Barcelona / Valencia cities, €EUR prices, +34 phone, 5-digit postal codes.',
  fr_FR: 'France: French names, Paris / Lyon / Marseille cities, €EUR prices, +33 phone, 5-digit postal codes.',
  de_DE: 'Germany: German names, Berlin / Munich / Hamburg cities, €EUR prices, +49 phone, 5-digit postal codes.',
  it_IT: 'Italy: Italian names, Rome / Milan / Florence cities, €EUR prices, +39 phone.',
  pt_BR: 'Brazil: Brazilian Portuguese names, São Paulo / Rio cities, R$BRL prices, +55 phone, CEP postal codes like 01310-100.',
  hi_IN: 'India: Indian names, Mumbai / Bangalore / Delhi cities, ₹INR prices, +91 phone, 6-digit PIN codes.',
}

const COUNTRY_HINTS: Record<string, string> = {
  US: 'United States. Format: name / street + apt / city, STATE ZIP / USA. Phone +1.',
  GB: 'United Kingdom. Format: name / street / town / county / POSTCODE. Phone +44.',
  DE: 'Germany. Format: name / Straße + number / PLZ Stadt / Deutschland. Phone +49.',
  FR: 'France. Format: name / number street / postal_code CITY / France. Phone +33.',
  IT: 'Italy. Format: name / via + number / postal_code CITY (PROVINCE) / Italia. Phone +39.',
  ES: 'Spain. Format: name / calle + number / postal_code CITY / Spain. Phone +34.',
  NL: 'Netherlands. Format: name / street + number / postcode CITY / Nederland. Phone +31.',
  JP: 'Japan. Format: postal_code FIRST (like 〒100-0001), then prefecture, city, ward, building. Phone +81. Postal codes are 7 digits with a dash.',
  KR: 'South Korea. Format: zipcode + region + district + street + building. Phone +82.',
  CN: 'China. Format: province + city + district + street + house number. Phone +86.',
  IN: 'India. Format: name / flat + building / area / city - PIN STATE / India. PIN is 6 digits. Phone +91.',
  BR: 'Brazil. Format: name / street, number, complemento / bairro / city - UF / CEP / Brasil. Phone +55. CEPs are 5 digits + dash + 3 digits.',
  MX: 'Mexico. Format: name / street + number / colonia / municipio / postal_code STATE / México. Phone +52.',
  AU: 'Australia. Format: name / unit/street / SUBURB STATE POSTCODE / Australia. Postcodes are 4 digits. Phone +61.',
  CA: 'Canada. Format: name / street / city PROVINCE postal_code / Canada. Postal codes look like K1A 0B1. Phone +1.',
}

interface SkillSpec {
  /** A description of expected output shape sent to the model. */
  buildPrompt: (knobs: Record<string, unknown>) => {
    system: string
    user: string
    /** Top-level key in the model's JSON output that contains the result. */
    resultKey?: string
  }
  /** Optional post-processing after parse. */
  postProcess?: (parsed: unknown, knobs: Record<string, unknown>) => unknown
}

const DICEBEAR_STYLES = ['lorelei', 'avataaars', 'fun-emoji', 'thumbs', 'bottts']

function avatarUrl(seed: string, style?: string): string {
  const s = style ?? DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)]
  const safeSeed = encodeURIComponent(seed || `user-${Math.floor(Math.random() * 10000)}`)
  return `https://api.dicebear.com/9.x/${s}/svg?seed=${safeSeed}`
}

const SKILLS: Record<string, SkillSpec> = {
  'realistic-user': {
    buildPrompt: (knobs) => {
      const count = clampInt(knobs.count, 1, 20, 5)
      const locale = asString(knobs.locale, 'en_US')
      const hint = LOCALE_HINTS[locale] ?? LOCALE_HINTS.en_US
      return {
        system:
          'You generate locale-coherent user profiles for designer mockups. Output strict JSON only: { "users": [{ "name": string, "role": string, "email": string, "company": string, "city": string, "country": string, "bio": string }] }. No prose, no markdown fences. Names must match the locale culture. Emails should use plausible domains for the locale. Bios are 6-12 words.',
        user: `Generate exactly ${count} user profiles. Locale: ${locale}. Locale guidance: ${hint}\n\nRespond with JSON only.`,
        resultKey: 'users',
      }
    },
    postProcess: (parsed) => {
      if (!Array.isArray(parsed)) return parsed
      return parsed.map((u: Record<string, unknown>) => ({
        ...u,
        avatar_url: avatarUrl(String(u.name ?? '')),
      }))
    },
  },

  'pricing-page': {
    buildPrompt: (knobs) => {
      const productType = asString(knobs.productType, 'a SaaS productivity tool')
      const tierCount = clampInt(knobs.tierCount, 3, 5, 4)
      return {
        system:
          'You generate SaaS pricing pages for mockups. Output strict JSON only: { "tiers": [{ "name": string, "tagline": string, "price": string (e.g. "$0" or "$29" or "Custom"), "billing": string (e.g. "/mo billed annually"), "cta": string (e.g. "Start free trial"), "features": string[] (4-6 entries), "highlight": boolean }] }. Prices grow geometrically. First tier should be Free/Hobby at $0. Last tier should say "Custom" or "Contact us" for price. Exactly ONE tier has highlight=true (usually the second from last).',
        user: `Generate exactly ${tierCount} tiers for: ${productType}.\n\nRespond with JSON only.`,
        resultKey: 'tiers',
      }
    },
  },

  'order-receipt': {
    buildPrompt: (knobs) => {
      const category = asString(knobs.category, 'consumer electronics')
      const itemCount = clampInt(knobs.itemCount, 1, 10, 3)
      return {
        system:
          'You generate e-commerce receipts for designer mockups. Output strict JSON only: { "receipt": { "order_number": string (looks like #A1029384 or ORD-2025-00042), "date": string (ISO yyyy-mm-dd), "customer_name": string, "items": [{ "name": string, "qty": number, "unit_price": string ("$12.99"), "subtotal": string }], "subtotal": string, "shipping": string, "tax": string, "total": string, "tracking_number": string (real-shape: UPS 1Z* / FedEx 12-digit / USPS 9400... / DHL 10-digit), "carrier": string ("UPS"|"FedEx"|"USPS"|"DHL"), "eta": string (e.g. "Tue, Jun 4") } }. All monetary values use the same currency. Subtotals + tax + shipping = total (close enough).',
        user: `Generate a receipt with exactly ${itemCount} line items. Product category: ${category}.\n\nRespond with JSON only.`,
        resultKey: 'receipt',
      }
    },
  },

  'customer-card': {
    buildPrompt: (knobs) => {
      const count = clampInt(knobs.count, 1, 10, 4)
      const tone = asString(knobs.tone, 'warm')
      return {
        system:
          'You generate testimonial cards for designer mockups. Output strict JSON only: { "testimonials": [{ "quote": string (1-3 sentences), "name": string, "role": string, "company": string, "rating": number (1-5, usually 4 or 5) }] }. Quotes are specific, not generic — mention a concrete benefit or moment. No marketing fluff.',
        user: `Generate exactly ${count} testimonials. Tone: ${tone}.\n\nRespond with JSON only.`,
        resultKey: 'testimonials',
      }
    },
    postProcess: (parsed) => {
      if (!Array.isArray(parsed)) return parsed
      return parsed.map((t: Record<string, unknown>) => ({
        ...t,
        avatar_url: avatarUrl(String(t.name ?? ''), 'lorelei'),
      }))
    },
  },

  'address-block': {
    buildPrompt: (knobs) => {
      const country = asString(knobs.country, 'US').toUpperCase()
      const count = clampInt(knobs.count, 1, 15, 3)
      const hint = COUNTRY_HINTS[country] ?? COUNTRY_HINTS.US
      return {
        system:
          'You generate postal addresses with locale-correct formatting. Output strict JSON only: { "addresses": [{ "name": string, "street1": string, "street2": string (optional, can be empty), "city": string, "state_or_region": string, "postal_code": string, "country": string (full name), "country_code": string (ISO 2), "phone": string (with country code) }] }. Every field must match the country\'s real conventions. Phone numbers include the country dial code.',
        user: `Generate exactly ${count} addresses for country ${country}.\nCountry guidance: ${hint}\n\nRespond with JSON only.`,
        resultKey: 'addresses',
      }
    },
  },
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  const limited = await checkRateLimit(env, request, LLM_LIMIT)
  if (limited) return limited

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const name = String(body.name ?? '')
  const spec = SKILLS[name]
  if (!spec) return jsonResponse({ error: `Unknown skill: ${name}` }, 404)

  const knobs = (body.knobs ?? {}) as Record<string, unknown>
  const { system, user, resultKey } = spec.buildPrompt(knobs)

  let aiResult: { response?: string }
  try {
    aiResult = (await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 3072,
      temperature: 0.75,
    })) as { response?: string }
  } catch (err) {
    return jsonResponse(
      { error: 'AI request failed', detail: String((err as Error).message ?? err) },
      502,
    )
  }

  const raw = (aiResult?.response ?? '').toString()
  if (!raw) return jsonResponse({ error: 'Empty response from model' }, 502)

  const parsed = extractJson(raw)
  if (parsed == null)
    return jsonResponse(
      { error: 'Could not parse JSON from model output', raw: raw.slice(0, 400) },
      502,
    )

  // Pick result inside top-level wrapper if specified
  let payload: unknown = parsed
  if (resultKey && typeof parsed === 'object' && parsed !== null && resultKey in parsed) {
    payload = (parsed as Record<string, unknown>)[resultKey]
  }

  if (spec.postProcess) payload = spec.postProcess(payload, knobs)

  return jsonResponse({
    skill: name,
    knobs,
    payload,
    model: MODEL,
  })
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonResponse(
    { error: 'Use POST with { name, knobs }', skills: Object.keys(SKILLS) },
    405,
  )
}
