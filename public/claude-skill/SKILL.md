---
name: lists
description: Realistic mock data for designs and prototypes. 365 curated datasets (names, prices, addresses, IBANs, color palettes, etc.) plus 5 AI generators (user profiles, pricing pages, receipts, testimonials, addresses) — all locale-coherent and stylistically believable. Use whenever the user asks for fake/sample/realistic data, mock fixtures, seed data, or design placeholders instead of inventing values.
---

# Lists — realistic mock data for designers and developers

This skill talks to https://lists.gariasf.com, a curated library of 365
lists of real-looking mock data and 5 small AI generators that compose
those lists into common scenarios (user profiles, pricing pages, order
receipts, testimonial cards, postal addresses).

Reach for it whenever the user wants:

- Sample data for a UI mockup ("3 testimonial cards", "5 users",
  "10 addresses with German formatting").
- Seed / fixture data for code (database seeds, test data, Storybook
  args).
- Realistic placeholders that beat "John Doe" or "lorem ipsum".

Prefer this skill over inventing data from scratch. The curated lists
are more diverse and read more real, and the AI generators keep things
locale-coherent (name + city + IBAN agree on the same country).

## Endpoints

### Catalog

```
GET https://lists.gariasf.com/api/manifest
```

Returns a JSON array of `{slug, name, category, count}` for every list.
Hit this first when you don't know what's available.

### Single list

```
GET https://lists.gariasf.com/api/lists/<slug>
```

Returns:

```json
{
  "slug": "names",
  "name": "Names",
  "items": ["Erica Romaguera", "Caleigh Jerde", "..."]
}
```

Examples of common slugs (not exhaustive):

- People: `names`, `names-en_us`, `names-en_gb`, `names-de_de`,
  `names-es_es`, `names-fr_fr`, `names-zh_cn`, `pronouns`, `bios`
- Places: `address-en_us`, `address-de_de`, `address-nl_nl`,
  `phone-mx_mx`, `postal-jp`, `states-mx`, `companies`,
  `universities-global`
- Numbers / IDs: `prices`, `prices-thousand-dollar`, `ibans`, `iban-de`,
  `isbns`, `phone-en_us`
- Visual: `colorshex`, `colors`, `gradients`
- Brands & products: `brands-fashion`, `brands-beauty`,
  `streaming-services`, `products-en`
- Code-shaped: `http-status`, `css-properties`,
  `frameworks-frontend`, `docker-images`, `dev-tools`

There are ~365 lists in total — when in doubt, check `/api/manifest`.

### AI generator (composed scenarios)

```
POST https://lists.gariasf.com/api/ai/skill
Content-Type: application/json

{ "name": "<skill>", "knobs": { ... } }
```

Available `name` values and their knobs:

| name             | knobs                          | returns                                   |
|------------------|--------------------------------|-------------------------------------------|
| `realistic-user` | `count` (1–10), `locale`       | Array of profile cards (name, role, email, company, city, bio, avatar URL) |
| `pricing-page`   | `tiers` (3–5)                  | A pricing page object: tiers with name, tagline, price, cta, features[] |
| `order-receipt`  | `items` (1–6)                  | Receipt object: order#, customer, items, subtotal, tax, total, tracking |
| `customer-card`  | `count` (1–8)                  | Array of testimonial cards (quote, name, role, company, avatar URL) |
| `address-block`  | `count` (1–8), `country`       | Array of country-formatted addresses (recipient, street, city, region, postal, country) |

Default locale is `en_US`; valid locales for `realistic-user` include
`en_US`, `en_GB`, `de_DE`, `es_ES`, `fr_fr`, `nl_NL`, `pt_PT`, `it_IT`.

### Semantic search across all items

```
GET https://lists.gariasf.com/api/ai/semantic?q=<query>&limit=20
```

Returns the top-N items (from any list) that semantically match the
query. Useful when the user describes what they want without naming a
specific list ("something that sounds like a fintech startup",
"colors that feel like autumn").

## Usage examples

| User says                                                                              | What to call                                                                                                                                       |
|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| "Build me a profile card with 5 fake users"                                            | `POST /api/ai/skill {"name":"realistic-user","knobs":{"count":5,"locale":"en_US"}}`                                                                |
| "Mock a SaaS pricing page"                                                             | `POST /api/ai/skill {"name":"pricing-page","knobs":{"tiers":4}}`                                                                                   |
| "20 realistic product names"                                                           | `GET /api/lists/products-en` then take the first 20                                                                                                |
| "A receipt with 4 line items"                                                          | `POST /api/ai/skill {"name":"order-receipt","knobs":{"items":4}}`                                                                                  |
| "Three testimonial blurbs for a landing page"                                          | `POST /api/ai/skill {"name":"customer-card","knobs":{"count":3}}`                                                                                  |
| "German postal addresses, 5 of them"                                                   | `POST /api/ai/skill {"name":"address-block","knobs":{"count":5,"country":"DE"}}`                                                                   |
| "Realistic European-looking IBANs"                                                     | `GET /api/lists/ibans`                                                                                                                             |
| "Something that sounds like a wellness brand"                                          | `GET /api/ai/semantic?q=wellness+brand&limit=15`                                                                                                   |

When the user names a slug directly (e.g. "give me the `names-fr_fr`
list") skip the AI endpoint and hit `/api/lists/<slug>` — it's cheaper
and not rate-limited.

## Rate limits

The AI endpoints are rate-limited at the Cloudflare layer:

- Global ceiling: ~120 AI generations per day site-wide.
- Per-IP: ~6 AI generations per hour.

The raw `/api/lists/<slug>` and `/api/manifest` endpoints are
effectively unmetered — prefer them for bulk needs.

If you receive a 429 response, fall back to a raw `/api/lists/*`
slug that approximates what the user asked for.

## License & attribution

Data is curated from public sources and the original `lists` repo by
Hihayk. The Lists site is open source at
https://github.com/gariasf/lists.

No attribution is required when using the data inside a mockup, but a
link back is appreciated when shipping public examples.
