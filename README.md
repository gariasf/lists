# Lists

Copy-paste data for your designs. Names, places, companies, prices, and more.

**Live site:** https://lists.gariasf.com

## What is this?

When you're designing a UI, you need realistic content. Not "Lorem ipsum" or "John Doe" repeated fifty times. This site gives you actual data you can copy with one click.

365 lists across 19 categories:
- Names (20+ locales, romanized + native scripts for JA / KO / ZH)
- Addresses, cities, postal codes, IBANs
- Companies, job titles, products, brands
- Prices, durations, dates
- Colors, gradients, hex / RGB
- HTTP statuses, CSS properties, dev tools, Docker images
- And more

Plus 5 AI generators (user profiles, pricing pages, receipts, testimonials,
addresses) and a Claude Code skill bundle so the data is one curl away
from any project.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Building

```bash
npm run build
```

This generates a static export in the `out/` folder. No server required.

## Deploying

The site runs on Cloudflare Pages:

```bash
npm run build
wrangler pages deploy out --project-name lists
```

Works on any static host: Vercel, Netlify, GitHub Pages, or your own server.

## Tech stack

- Next.js 15 (static export, App Router)
- React 19
- TypeScript
- Cloudflare Pages + Pages Functions for the AI endpoints
- Workers AI (Llama 3.1 8B) for the generators
- Workers KV for rate-limit counters
- fuzzysort for client-side fuzzy search
- View Transitions API for navigation crossfade

## Data source

Upstream list data is fetched from the original
[Lists](https://github.com/listsfordesign/Lists) project at build time.
Local additions live in `data/lists/`.

The upstream repository does not ship an explicit LICENSE file. We
redistribute the data with attribution in good faith for the original
intent (designer mockups and prototypes). See `LICENSE` for the full
notice.

## Credits

This is a rebuild of [Lists.design](https://web.archive.org/web/20180110210859/http://lists.design/), originally created by [Hernan Franco](https://twitter.com/hfranco) and [Matt D. Smith](https://twitter.com/mds).

## License

The code in this repository is released under the [MIT License](./LICENSE).
See `LICENSE` for details on bundled data and third-party attributions.
