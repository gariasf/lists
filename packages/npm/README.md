# lists-design (npm package)

Curated, realistic mock data as a zero-dependency npm package: 431 lists of
names, addresses, microcopy, UI states, dev fixtures and locale-coherent
profiles, with typed slugs and seeded sampling for test fixtures.

> **This folder is generated.** Everything except this README is built from the
> site's own static API output by `scripts/build-npm-package.mjs`, so the
> package and [lists.gariasf.com](https://lists.gariasf.com) can never drift
> apart. That's why you won't find `index.js` or `data/` committed here.

## Build it

From the repo root:

```bash
npm install
npm run build:npm      # builds the site, then generates packages/npm/
```

That produces `index.js`, `index.d.ts` (with a union type of every slug),
`meta.json`, `data/<slug>.json` (one module per list, so bundlers keep only
what you import), and a `bin/` for the CLI.

## Use it

```js
const { list, sample, one } = require('lists-design')

sample('names-pt_br', 3)     // 3 Brazilian names
sample('uuids', 5, 42)       // same 5 uuids every run — safe in CI
one('chat-messages')         // 'sounds good, pushing at 3'
list('profile-ja_jp')        // rows where name/city/postal/phone agree
```

Import one list directly and bundlers drop the rest:

```js
import names from 'lists-design/data/names-pt_br.json'
```

From the terminal:

```bash
npx lists-design names-pt_br 5
npx lists-design --list
```

## Publish it

```bash
npm run build:npm
npm login
cd packages/npm && npm publish
```

`publishConfig.access` is already `public` and the licence is MIT. The data is
redistributed with attribution — see the repository's `LICENSE`.

## Prefer no install?

The same data is a plain URL away, no key and no rate limit:

```bash
curl -s https://lists.gariasf.com/api/lists/names-pt_br.txt | shuf -n 5
curl -s "https://lists.gariasf.com/api/sample/uuids?n=5&seed=42"
```

See [lists.gariasf.com/api](https://lists.gariasf.com/api/).
