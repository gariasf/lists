/**
 * Minimal Model Context Protocol (MCP) server over Streamable HTTP.
 *
 * Compatible with Claude Desktop, Cursor, Zed, and any other client that
 * speaks JSON-RPC 2.0 over POST. Each request is independent (stateless).
 *
 * Tools exposed:
 *   lists_manifest   - list every available list with slug + name + category
 *   lists_get        - return a single list's items by slug
 *   lists_search     - fuzzy match list names
 *   lists_random     - return N random items from a list
 *   lists_generate   - generate N novel items via Workers AI (free-form prompt)
 *
 * Configure clients with:
 *   { "mcpServers": { "lists": { "url": "https://lists.gariasf.com/mcp" } } }
 */

interface Env {
  AI: {
    run: (
      model: string,
      input: Record<string, unknown>,
    ) => Promise<{ response?: string }>
  }
}

const SERVER_INFO = {
  name: 'lists.gariasf.com',
  version: '1.0.0',
}

const PROTOCOL_VERSION = '2025-03-26'

const TOOLS = [
  {
    name: 'lists_manifest',
    description:
      'Return every available list as { slug, name, category }. ~365 entries. Use this first to discover what is available.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'lists_search',
    description:
      'Fuzzy search list names. Returns the top N matches as { slug, name, category }. Use this to find a list when the user describes it loosely ("US addresses", "japanese names").',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text' },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Max results',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'lists_get',
    description:
      'Return all items from a specific list by slug. Slug comes from lists_manifest or lists_search.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'List slug, e.g. "names-en_us"' },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          description: 'Optional cap on number of items returned',
        },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'lists_random',
    description:
      'Return N random items from a list. Use when the user just needs a few realistic values (e.g. "give me 3 random US addresses").',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'List slug' },
        count: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 5,
          description: 'How many items to return',
        },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'lists_generate',
    description:
      'Generate N novel mock-data items via an LLM. Use when no existing list matches what the user wants (e.g. "10 Korean food truck names").',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Free-form description of what to generate',
        },
        count: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
        },
        listSlug: {
          type: 'string',
          description:
            'Optional: seed the model with examples from this existing list so output matches its shape',
        },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
  },
]

const MODEL = '@cf/meta/llama-3.1-8b-instruct'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
  id?: number | string | null
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

function rpcResult(id: number | string | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(
  id: number | string | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } }
}

function toolText(content: string): unknown {
  return {
    content: [{ type: 'text', text: content }],
  }
}

function toolJson(value: unknown): unknown {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  }
}

interface ManifestEntry {
  slug: string
  name: string
  category: string
  url: string
}

async function fetchManifest(origin: string): Promise<ManifestEntry[]> {
  const res = await fetch(`${origin}/api/manifest`)
  if (!res.ok) throw new Error(`manifest ${res.status}`)
  const data = (await res.json()) as { lists: ManifestEntry[] }
  return data.lists
}

async function fetchList(
  origin: string,
  slug: string,
): Promise<{ name: string; items: string[] } | null> {
  if (!/^[a-z0-9-_]+$/.test(slug)) return null
  const res = await fetch(`${origin}/api/lists/${slug}`)
  if (!res.ok) return null
  return (await res.json()) as { name: string; items: string[] }
}

function fuzzyScore(query: string, target: string): number {
  // Lightweight subsequence scoring (no fuzzysort dep on the Worker side).
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t.includes(q)) return 100 - Math.abs(t.length - q.length)
  let qi = 0
  let matched = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      matched++
      qi++
    }
  }
  if (qi < q.length) return -Infinity
  return matched - Math.abs(t.length - q.length) * 0.5
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  env: Env,
  origin: string,
): Promise<unknown> {
  switch (name) {
    case 'lists_manifest': {
      const manifest = await fetchManifest(origin)
      return toolJson(
        manifest.map((e) => ({ slug: e.slug, name: e.name, category: e.category })),
      )
    }

    case 'lists_search': {
      const query = String(args.query ?? '')
      const limit = Math.min(50, Math.max(1, Number(args.limit ?? 10)))
      if (!query.trim()) return toolJson([])
      const manifest = await fetchManifest(origin)
      const scored = manifest
        .map((e) => ({ entry: e, score: fuzzyScore(query, e.name) }))
        .filter((s) => Number.isFinite(s.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => ({
          slug: s.entry.slug,
          name: s.entry.name,
          category: s.entry.category,
        }))
      return toolJson(scored)
    }

    case 'lists_get': {
      const slug = String(args.slug ?? '')
      const limit = args.limit != null ? Math.max(1, Number(args.limit)) : undefined
      const list = await fetchList(origin, slug)
      if (!list) return toolText(`No list found for slug "${slug}"`)
      const items = limit ? list.items.slice(0, limit) : list.items
      return toolJson({ slug, name: list.name, count: items.length, items })
    }

    case 'lists_random': {
      const slug = String(args.slug ?? '')
      const count = Math.min(100, Math.max(1, Number(args.count ?? 5)))
      const list = await fetchList(origin, slug)
      if (!list) return toolText(`No list found for slug "${slug}"`)
      const pool = [...list.items]
      const picks: string[] = []
      const take = Math.min(count, pool.length)
      for (let i = 0; i < take; i++) {
        const j = Math.floor(Math.random() * pool.length)
        picks.push(pool.splice(j, 1)[0])
      }
      return toolJson({ slug, name: list.name, items: picks })
    }

    case 'lists_generate': {
      const prompt = String(args.prompt ?? '').trim()
      if (!prompt) return toolText('prompt is required')
      const count = Math.min(50, Math.max(1, Number(args.count ?? 10)))
      const listSlug = args.listSlug ? String(args.listSlug) : undefined

      let seeds: string[] | undefined
      if (listSlug) {
        const list = await fetchList(origin, listSlug)
        if (list) {
          const pool = [...list.items]
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[pool[i], pool[j]] = [pool[j], pool[i]]
          }
          seeds = pool.slice(0, 20)
        }
      }

      const lines: string[] = [
        `Generate exactly ${count} items.`,
        `Request: ${prompt}`,
      ]
      if (seeds && seeds.length > 0) {
        lines.push('', 'Seed examples (match this shape and style):')
        for (const s of seeds) lines.push(`- ${s}`)
      }
      lines.push('', 'Respond with JSON only.')

      const aiResult = await env.AI.run(MODEL, {
        messages: [
          {
            role: 'system',
            content:
              'You generate realistic mock data for designers. Output strict JSON only: { "items": ["string1", "string2", ...] }. No prose, no markdown fences. No duplicates. Locale-coherent.',
          },
          { role: 'user', content: lines.join('\n') },
        ],
        max_tokens: 2048,
        temperature: 0.8,
      })

      const raw = (aiResult?.response ?? '').toString()
      let items: string[] = []
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
      const candidate = fenced ? fenced[1] : raw
      try {
        const obj = JSON.parse(candidate)
        if (obj && Array.isArray(obj.items)) {
          items = obj.items.filter((v: unknown): v is string => typeof v === 'string')
        } else if (Array.isArray(obj)) {
          items = obj.filter((v: unknown): v is string => typeof v === 'string')
        }
      } catch {
        items = candidate
          .split('\n')
          .map((l: string) => l.replace(/^\s*[-*\d.)]+\s*/, '').trim())
          .filter((l: string) => l && !l.startsWith('{') && !l.startsWith('['))
      }
      items = items.slice(0, count)
      return toolJson({ prompt, count: items.length, items })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function handleRpc(
  req: JsonRpcRequest,
  env: Env,
  origin: string,
): Promise<JsonRpcResponse | null> {
  const id = req.id ?? null

  try {
    switch (req.method) {
      case 'initialize':
        return rpcResult(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        })

      case 'notifications/initialized':
        // Notifications have no response in JSON-RPC.
        return null

      case 'tools/list':
        return rpcResult(id, { tools: TOOLS })

      case 'tools/call': {
        const params = req.params ?? {}
        const name = String(params.name ?? '')
        const args = (params.arguments ?? {}) as Record<string, unknown>
        try {
          const result = await callTool(name, args, env, origin)
          return rpcResult(id, result)
        } catch (err) {
          return rpcResult(id, {
            content: [
              {
                type: 'text',
                text: `Error: ${(err as Error).message ?? String(err)}`,
              },
            ],
            isError: true,
          })
        }
      }

      case 'ping':
        return rpcResult(id, {})

      default:
        return rpcError(id, -32601, `Method not found: ${req.method}`)
    }
  } catch (err) {
    return rpcError(id, -32603, 'Internal error', String((err as Error).message ?? err))
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const origin = new URL(request.url).origin

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, -32700, 'Parse error')),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
  }

  if (Array.isArray(body)) {
    // Batched requests
    const responses: JsonRpcResponse[] = []
    for (const req of body as JsonRpcRequest[]) {
      const r = await handleRpc(req, env, origin)
      if (r) responses.push(r)
    }
    return new Response(JSON.stringify(responses), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    })
  }

  const response = await handleRpc(body as JsonRpcRequest, env, origin)
  if (!response) return new Response(null, { status: 204 })

  return new Response(JSON.stringify(response), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(
    JSON.stringify({
      server: SERVER_INFO,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'streamable-http',
      tools: TOOLS.map((t) => t.name),
      docs: 'POST JSON-RPC 2.0 messages to this endpoint. See https://modelcontextprotocol.io',
    }, null, 2),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    },
  )
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, mcp-session-id, mcp-protocol-version',
      'access-control-max-age': '86400',
    },
  })
}
