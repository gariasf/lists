# Lists

Copy-paste data for your designs. Names, places, companies, prices, and more.

**Live site:** https://lists.gariasf.com

## What is this?

When you're designing a UI, you need realistic content. Not "Lorem ipsum" or "John Doe" repeated fifty times. This site gives you actual data you can copy with one click.

118 lists across 17 categories:
- Names (various locales)
- Addresses and cities
- Companies and job titles
- Prices and currencies
- Dates and times
- And more

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

- Next.js 15 (static export)
- React 19
- TypeScript
- Typed.js for the hero animation

## Data source

List data comes from the original [Lists](https://github.com/listsfordesign/Lists) project, fetched at build time.

## Credits

This is a rebuild of [Lists.design](https://web.archive.org/web/20180110210859/http://lists.design/), originally created by [Hernan Franco](https://twitter.com/hfranco) and [Matt D. Smith](https://twitter.com/mds).

## License

MIT
