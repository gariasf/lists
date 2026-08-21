/**
 * Generic skill endpoint. POST { name, knobs } -> returns the skill's output.
 *
 * Each skill is a curated recipe that composes multiple lists + an LLM call
 * into a coherent multi-field record (or array of records). The frontend
 * passes user-tweaked knobs; this function builds the prompt, calls Workers
 * AI, parses + validates the JSON response, and applies any post-processing
 * (e.g. deterministic avatar URLs that don't depend on LLM accuracy).
 */

import {
  checkBodySize,
  checkRateLimit,
  LLM_LIMIT,
  type RateLimitEnv,
} from '../../_lib/ratelimit'

interface Env extends RateLimitEnv {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ response?: string | Record<string, unknown> | unknown[] }>
  }
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

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

/** Fetches a static list's items; used to seed prompts and to overwrite
 * fields the model can't be trusted with (phones, postals, names). */
type GetList = (slug: string) => Promise<string[]>

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffledSlice<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface SkillSpec {
  /** A description of expected output shape sent to the model.
   *  `seeds` is filled from `seedSlug` when configured. */
  buildPrompt?: (
    knobs: Record<string, unknown>,
    seeds?: string[],
  ) => {
    system: string
    user: string
    /** Top-level key in the model's JSON output that contains the result. */
    resultKey?: string
  }
  /** Static list whose items get few-shot-seeded into the prompt. */
  seedSlug?: (knobs: Record<string, unknown>) => string | undefined
  /** Optional post-processing after parse. May fetch curated lists to
   *  overwrite fields the model hallucinates (phones, postal codes). */
  postProcess?: (
    parsed: unknown,
    knobs: Record<string, unknown>,
    get: GetList,
  ) => unknown | Promise<unknown>
  /** Zero-LLM path: composes the payload entirely from curated lists.
   *  No AI call, no rate limit — free at any scale. */
  compose?: (knobs: Record<string, unknown>, get: GetList) => Promise<unknown>
}

// Person-like styles only: a robot or a frowning emoji beside a name and job
// title reads as broken, not as a realistic profile. Bottts/fun-emoji also
// carry different intrinsic padding, so mixing styles makes evenly-sized
// avatars look mismatched.
const PORTRAIT_STYLES = ['lorelei', 'avataaars', 'notionists', 'personas']

function avatarUrl(seed: string, style?: string): string {
  const s = style ?? PORTRAIT_STYLES[0]
  const safeSeed = encodeURIComponent(seed || `user-${Math.floor(Math.random() * 10000)}`)
  return `https://api.dicebear.com/9.x/${s}/svg?seed=${safeSeed}`
}

/** One style per response, so a set of profiles looks like one product. */
function pickAvatarStyle(): string {
  return PORTRAIT_STYLES[Math.floor(Math.random() * PORTRAIT_STYLES.length)]
}

/** Locale → curated romanized-names list, used to seed realistic-user. */
const LOCALE_NAME_SLUGS: Record<string, string> = {
  en_US: 'names-en_us',
  en_GB: 'names-en_gb',
  ja_JP: 'names-ja_jp',
  ko_KR: 'names-ko_kr',
  zh_CN: 'names-zh_cn',
  es_ES: 'names-es_es',
  fr_FR: 'names-fr_fr',
  de_DE: 'names-de_de',
  it_IT: 'names-it_it',
  pt_BR: 'names-pt_br',
  hi_IN: 'names-hi_in',
}

/** Country → curated phone / postal lists, used to overwrite what the
 * model invents in address-block. */
const COUNTRY_PHONE_SLUGS: Record<string, string> = {
  US: 'phone-us_us', GB: 'phone-gb_gb', DE: 'phone-de_de', FR: 'phone-fr_fr',
  IT: 'phone-it_it', ES: 'phone-es_es', JP: 'phone-jp_jp', KR: 'phone-kr_kr',
  IN: 'phone-in_in', BR: 'phone-br_br', MX: 'phone-mx_mx', AU: 'phone-au_au',
}
const COUNTRY_POSTAL_SLUGS: Record<string, string> = {
  US: 'postal-zip-us', GB: 'postal-uk', DE: 'postal-de', FR: 'postal-fr',
  IT: 'postal-it', ES: 'postal-es', NL: 'postal-nl', JP: 'postal-jp',
  IN: 'postal-in', BR: 'postal-br', MX: 'postal-mx', AU: 'postal-au',
  CA: 'postal-ca',
}
const COUNTRY_NAME_SLUGS: Record<string, string> = {
  US: 'names-en_us', GB: 'names-en_gb', DE: 'names-de_de', FR: 'names-fr_fr',
  IT: 'names-it_it', ES: 'names-es_es', NL: 'names-nl_nl', JP: 'names-ja_jp',
  KR: 'names-ko_kr', CN: 'names-zh_cn', IN: 'names-hi_in', BR: 'names-pt_br',
  MX: 'names-es_mx', AU: 'names-en_gb', CA: 'names-en_us',
}

const SKILLS: Record<string, SkillSpec> = {
  'realistic-user': {
    seedSlug: (knobs) => LOCALE_NAME_SLUGS[asString(knobs.locale, 'en_US')],
    buildPrompt: (knobs, seeds) => {
      const count = clampInt(knobs.count, 1, 20, 5)
      const locale = asString(knobs.locale, 'en_US')
      const hint = LOCALE_HINTS[locale] ?? LOCALE_HINTS.en_US
      const seedLine =
        seeds && seeds.length > 0
          ? `\nUse names in exactly this style (romanized, culturally accurate): ${seeds.join(', ')}.`
          : ''
      return {
        system:
          'You generate locale-coherent user profiles for designer mockups. Output strict JSON only: { "users": [{ "name": string, "role": string, "email": string, "company": string, "city": string, "country": string, "bio": string }] }. No prose, no markdown fences. All JSON string values in Latin script (romanized). Names must match the locale culture. Emails should use plausible domains for the locale. Bios are 6-12 words.',
        user: `Generate exactly ${count} user profiles. Locale: ${locale}. Locale guidance: ${hint}${seedLine}\n\nRespond with JSON only.`,
        resultKey: 'users',
      }
    },
    postProcess: (parsed) => {
      if (!Array.isArray(parsed)) return parsed
      const style = pickAvatarStyle()
      return parsed.map((u: Record<string, unknown>) => ({
        ...u,
        avatar_url: avatarUrl(String(u.name ?? ''), style),
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
        user: `Generate a receipt with exactly ${itemCount} line items. Product category: ${category}. Today is ${today()}; the order date must be within the last 7 days and the ETA within the next 10 days.\n\nRespond with JSON only.`,
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
        user: `Generate exactly ${count} addresses for country ${country}.\nCountry guidance: ${hint}\n\nstreet1 must be an actual street line (building/house number + street or block), never the city or region name; street2 is only for apartment/floor/suite. Never repeat the city in street1 or street2.\n\nRespond with JSON only.`,
        resultKey: 'addresses',
      }
    },
    // The 8B model hallucinates phone/postal shapes and falls back to
    // "John Doe" — overwrite all three from the curated country lists.
    postProcess: async (parsed, knobs, get) => {
      if (!Array.isArray(parsed)) return parsed
      const country = asString(knobs.country, 'US').toUpperCase()
      const [phones, postals, names] = await Promise.all([
        COUNTRY_PHONE_SLUGS[country] ? get(COUNTRY_PHONE_SLUGS[country]) : [],
        COUNTRY_POSTAL_SLUGS[country] ? get(COUNTRY_POSTAL_SLUGS[country]) : [],
        COUNTRY_NAME_SLUGS[country] ? get(COUNTRY_NAME_SLUGS[country]) : [],
      ])
      const usedNames = new Set<string>()
      return parsed.map((a: Record<string, unknown>) => {
        let name: string | undefined
        if (names.length > 0) {
          for (let i = 0; i < 10; i++) {
            name = pick(names)
            if (!usedNames.has(name)) break
          }
          if (name) usedNames.add(name)
        }
        return {
          ...a,
          ...(name ? { name } : {}),
          ...(phones.length > 0 ? { phone: pick(phones) } : {}),
          ...(postals.length > 0 ? { postal_code: pick(postals) } : {}),
        }
      })
    },
  },

  'flight-itinerary': {
    compose: async (knobs, get) => {
      const count = clampInt(knobs.count, 1, 10, 3)
      const [routes, airlines, seats, gates, statuses] = await Promise.all([
        get('flight-routes'),
        get('airline-codes'),
        get('seat-numbers'),
        get('gate-numbers'),
        get('flight-statuses'),
      ])
      const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const pnr = () =>
        Array.from({ length: 6 }, () => PNR_ALPHABET[Math.floor(Math.random() * PNR_ALPHABET.length)]).join('')
      const itineraries = Array.from({ length: count }, () => {
        const [origin, destination] = pick(routes).split('-')
        const [code, airline] = pick(airlines).split(' — ')
        const dep = new Date(Date.now() + Math.floor(Math.random() * 60) * 86400000)
        const depH = 6 + Math.floor(Math.random() * 16)
        const depM = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
        const durationMin = 75 + Math.floor(Math.random() * 540)
        const arr = new Date(dep.getTime())
        arr.setUTCHours(depH, depM + durationMin, 0, 0)
        const hh = (n: number) => String(n).padStart(2, '0')
        return {
          booking_reference: pnr(),
          airline: airline ?? code,
          flight_number: `${code}${100 + Math.floor(Math.random() * 4900)}`,
          origin,
          destination,
          date: dep.toISOString().slice(0, 10),
          departure_time: `${hh(depH)}:${hh(depM)}`,
          arrival_time: `${hh(arr.getUTCHours())}:${hh(arr.getUTCMinutes())}`,
          duration: `${Math.floor(durationMin / 60)}h ${hh(durationMin % 60)}m`,
          seat: pick(seats),
          gate: pick(gates),
          status: pick(statuses),
        }
      })
      return itineraries
    },
  },

  'package-tracking': {
    compose: async (knobs, get) => {
      const count = clampInt(knobs.count, 1, 10, 3)
      const CARRIERS: Record<string, string> = {
        UPS: 'tracking-ups',
        FedEx: 'tracking-fedex',
        USPS: 'tracking-usps',
        DHL: 'tracking-dhl',
      }
      const wanted = asString(knobs.carrier, 'random')
      // ponytail: fixed canonical timeline; shipping-statuses.txt has more
      // exotic states but a coherent history needs a known order.
      const TIMELINE = [
        'Label created',
        'Picked up',
        'In transit',
        'Arrived at sorting facility',
        'Out for delivery',
        'Delivered',
      ]
      // Fetch each carrier's list once, not once per row, and hand out
      // distinct tracking numbers.
      const numbersByCarrier = new Map<string, string[]>()
      const taken = new Set<string>()
      const packages = await Promise.all(
        Array.from({ length: count }, async () => {
          // Object.hasOwn, not `in`: `in` walks the prototype chain, so
          // "constructor" / "__proto__" would pass as a carrier name.
          const carrier = Object.hasOwn(CARRIERS, wanted)
            ? wanted
            : pick(Object.keys(CARRIERS))
          if (!numbersByCarrier.has(carrier)) {
            numbersByCarrier.set(carrier, await get(CARRIERS[carrier]))
          }
          const numbers = numbersByCarrier.get(carrier)!
          let tracking = pick(numbers)
          for (let i = 0; i < 10 && taken.has(tracking); i++) tracking = pick(numbers)
          taken.add(tracking)
          const stage = 1 + Math.floor(Math.random() * TIMELINE.length)
          const start = Date.now() - (2 + Math.floor(Math.random() * 4)) * 86400000
          const step = (Date.now() - start) / stage
          const events = TIMELINE.slice(0, stage).map((status, i) => ({
            status,
            timestamp: new Date(start + i * step).toISOString(),
          }))
          const delivered = events[events.length - 1].status === 'Delivered'
          return {
            carrier,
            tracking_number: tracking,
            status: events[events.length - 1].status,
            events: events.reverse(),
            ...(delivered
              ? {}
              : { eta: new Date(Date.now() + (1 + Math.floor(Math.random() * 3)) * 86400000).toISOString().slice(0, 10) }),
          }
        }),
      )
      return packages
    },
  },
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  const tooLarge = checkBodySize(request)
  if (tooLarge) return tooLarge

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
  const origin = new URL(request.url).origin
  const getList: GetList = async (slug) => {
    try {
      const res = await fetch(`${origin}/api/lists/${slug}`)
      if (!res.ok) return []
      const data = (await res.json()) as { items?: string[] }
      return Array.isArray(data.items) ? data.items : []
    } catch {
      return []
    }
  }

  // Zero-LLM skills: pure composition of curated lists. No neurons, no
  // rate limit — a static read is free at any scale.
  if (spec.compose) {
    const payload = await spec.compose(knobs, getList)
    return jsonResponse({ skill: name, knobs, payload, model: null })
  }

  const limited = await checkRateLimit(env, request, LLM_LIMIT)
  if (limited) return limited

  const seedSlug = spec.seedSlug?.(knobs)
  const seeds = seedSlug ? shuffledSlice(await getList(seedSlug), 8) : undefined
  const { system, user, resultKey } = spec.buildPrompt!(knobs, seeds)

  let aiResult: { response?: string | Record<string, unknown> | unknown[] }
  try {
    aiResult = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 3072,
      temperature: 0.75,
    })
  } catch (err) {
    // 500, not 502: Cloudflare's edge replaces origin 502 bodies with its
    // own plain-text error page on proxied domains, hiding the JSON detail.
    return jsonResponse(
      { error: 'AI request failed', detail: String((err as Error).message ?? err) },
      500,
    )
  }

  // Newer Workers AI models may return `response` as an already-parsed
  // object instead of a JSON string.
  const resp = aiResult?.response
  const parsed =
    resp !== null && typeof resp === 'object' ? resp : extractJson((resp ?? '').toString())

  if (parsed == null) {
    const raw = String(resp ?? '')
    if (!raw) return jsonResponse({ error: 'Empty response from model' }, 500)
    return jsonResponse(
      { error: 'Could not parse JSON from model output', raw: raw.slice(0, 400) },
      500,
    )
  }

  // Pick result inside top-level wrapper if specified
  let payload: unknown = parsed
  if (resultKey && typeof parsed === 'object' && parsed !== null && resultKey in parsed) {
    payload = (parsed as Record<string, unknown>)[resultKey]
  }

  if (spec.postProcess) payload = await spec.postProcess(payload, knobs, getList)

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
