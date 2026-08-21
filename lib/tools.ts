/**
 * Ways to get the data out of the browser, and whether a stranger can
 * actually install each one today.
 *
 * Availability lives here as data, not as a sentence repeated across the
 * rail card, the API page, the README and llms.txt — three of these are
 * waiting on store review, and that status is the only thing about them
 * that will change. The day one goes live, flip `status` here and every
 * surface updates together instead of one of them quietly lying.
 */

export type ToolStatus = 'live' | 'from-repo'

export interface Tool {
  id: string
  name: string
  /** One line, written for someone deciding whether to click. */
  blurb: string
  status: ToolStatus
  href: string
  /** Shown when status is 'from-repo': what it takes to run it today. */
  note?: string
}

export const TOOLS: Tool[] = [
  {
    id: 'api',
    name: 'HTTP API',
    blurb: 'Every list as JSON, plain text or CSV. No key, CORS open.',
    status: 'live',
    href: '/api/',
  },
  {
    id: 'claude-skill',
    name: 'Claude Code skill',
    blurb: 'One tarball, then no network calls at all.',
    status: 'live',
    href: '/skills/',
  },
  {
    id: 'npm',
    name: 'npm package',
    blurb: 'Typed slugs and seeded sampling for test fixtures.',
    status: 'from-repo',
    href: 'https://github.com/gariasf/lists/tree/main/packages/npm',
    note: 'Not on npm yet — build it with npm run build:npm.',
  },
  {
    id: 'figma',
    name: 'Figma plugin',
    blurb: 'Fills selected text layers in reading order.',
    status: 'from-repo',
    href: 'https://github.com/gariasf/lists/tree/main/packages/figma-plugin',
    note: 'Not on Figma Community yet — import the manifest from the repo.',
  },
  {
    id: 'raycast',
    name: 'Raycast extension',
    blurb: 'Search the catalog and copy without leaving the keyboard.',
    status: 'from-repo',
    href: 'https://github.com/gariasf/lists/tree/main/packages/raycast-extension',
    note: 'Not on the Raycast Store yet — npm run dev from the repo.',
  },
]

export const BASE_URL = 'https://lists.gariasf.com'

/** The snippets shown on a list page, for that list's own slug. */
export function snippetsFor(slug: string) {
  return {
    curl: `curl -s ${BASE_URL}/api/lists/${slug}.txt`,
    sample: `curl -s "${BASE_URL}/api/sample/${slug}?n=5"`,
    seeded: `curl -s "${BASE_URL}/api/sample/${slug}?n=5&seed=42"`,
    json: `${BASE_URL}/api/lists/${slug}`,
  }
}
