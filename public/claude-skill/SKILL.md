---
name: lists
description: Realistic, locale-coherent mock data for designers and developers — 365 curated lists (names, prices, addresses, IBANs, color palettes, brands, products, postal codes, …) all bundled locally as JSON files plus composition recipes for the 5 most common scenarios (user profiles, pricing pages, order receipts, testimonial cards, postal addresses). Reach for this whenever the user wants fake / sample / realistic / mock / seed / placeholder data. No network calls. No API keys. Everything is in `data/`.
---

# Lists — local mock data for designers and developers

This skill ships 365 curated lists of mock data and five composition
recipes, all bundled in this directory. There is no network call,
no rate limit, no API key — everything you need is in `data/`.

Use it whenever the user asks for realistic-looking data: fake users,
sample prices, test addresses, design placeholders, fixture rows,
seed values. The lists are curated to be locale-coherent (a German
name pairs with a German city pairs with a German IBAN) and to read
more real than "John Doe" / "lorem ipsum".

## Layout

```
.claude/skills/lists/
├── SKILL.md
└── data/
    ├── manifest.json     # every available slug + name + category + count
    ├── names.json        # one file per list (~365 total)
    ├── prices.json
    └── …
```

Each list file is shaped:

```json
{
  "slug": "names",
  "name": "Names",
  "category": "identity",
  "count": 500,
  "items": ["Erica Romaguera", "Caleigh Jerde", "..."]
}
```

## How to use

### Find a list

```bash
cat data/manifest.json | jq '.lists[] | select(.category=="location")'
cat data/manifest.json | jq '.lists[] | select(.name | test("name"; "i"))'
```

The manifest groups by `category` (identity, location, business,
communication, finance, shopping, food, entertainment, sports, tech,
design, numbers, time, text, education, transport, health, nature,
culture) and gives every slug a one-line name.

### Read a list

```bash
cat data/<slug>.json | jq '.items[:20]'
```

Take the first N, sample randomly, filter by predicate — process with
`jq` (or read inline) as you would any local file.

### Compose a scenario

When the user asks for a *scenario* (a user card, a pricing page, a
receipt) rather than a *list*, don't dump raw data. Use one of the
recipes below — each one tells you which lists to combine and how.

## Composition recipes

You are the LLM. The recipes below give you the inputs + composition
rules; you generate the output. No model call needed.

### 1. Realistic User

**Input:** `count` (1–20), `locale` (e.g. `en_US`, `en_GB`, `de_DE`,
`es_ES`, `fr_FR`, `nl_NL`, `pt_PT`, `it_IT`, `ja_JP`, `ko_KR`,
`zh_CN`, `ru_RU`, `pl_PL`, `sv_SE`, `tr_TR`, `hi_IN`, `ar`).

**Output:** array of `{name, role, email, company, city, bio, avatar_url}`.

**Steps:**
1. Pick `count` unique names from `data/names-<locale>.json`. Fall
   back to `data/names.json` if the locale-specific file is missing.
2. For each name:
   - role: random item from `data/jobs.json`
   - company: random item from `data/companies.json`
     (or `data/companies-modern.json` for SaaS feel)
   - city: random item from `data/address-<locale>.json` (extract the
     city portion; address lines are formatted per country)
   - email: `<first>.<last>@<company-slug>.com` (lowercase, ASCII-fold
     non-Latin characters)
   - bio: random item from `data/bios-short.json`
   - avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=<urlencoded full name>`

Pick without replacement so the same name doesn't repeat.

### 2. Pricing Page

**Input:** `tiers` (3–5).

**Output:** `{tiers: [{name, tagline, price, billing, cta, features[], highlighted}]}`.

**Steps:**
1. Tier names: take the first `tiers` items from
   `["Free", "Starter", "Pro", "Business", "Enterprise"]`.
2. Prices: geometric, never `.00`. Suggested:
   - 3 tiers → 0, $19, $79
   - 4 tiers → 0, $19, $49, $199
   - 5 tiers → 0, $9, $29, $79, $199 (top is "Custom" or "Contact us")
3. Features: 4–6 per tier from `data/dev-tools.json` /
   `data/css-properties.json` style language — or compose phrases
   like "Up to N users", "X GB storage", "Priority support",
   "SSO + SAML", "Audit logs". Higher tier is a SUPERSET of the lower.
4. Highlight the middle tier (`highlighted: true`).
5. CTA: lowest tier → "Get started"; middle → "Start free trial";
   top → "Contact sales".
6. billing: `"per month"` (or `"per user / month"` for B2B).

### 3. Order Receipt

**Input:** `items` (1–6).

**Output:** `{order_id, customer, items: [{name, qty, price, line_total}], subtotal, tax, total, tracking, carrier, eta}`.

**Steps:**
1. `order_id`: random item from `data/order-numbers.json` (or `#A-` + 6 digits).
2. `customer`: pick a name (`data/names.json`) and a US address
   (`data/address-en_us.json`). Keep them on one record:
   `{name, address}`.
3. Line items: pick `items` unique products from
   `data/product-names-modern.json`. For each:
   - `qty`: 1–3
   - `price`: pick from `data/prices.json` (a single dollar amount)
   - `line_total`: `qty × price`, 2 decimals
4. `subtotal`: sum of all `line_total`.
5. `tax`: `subtotal × 0.08875`, 2 decimals (NYC sales tax — adjust if
   the user names a different state).
6. `total`: `subtotal + tax`, 2 decimals.
7. `carrier`: random of UPS, FedEx, USPS, DHL.
8. `tracking`: random item from `data/tracking-<carrier>.json`
   (e.g. `tracking-ups.json`).
9. `eta`: today + 3–7 calendar days, `YYYY-MM-DD`.

All numbers MUST add up. Do the math; don't fake it.

### 4. Customer Card (testimonial)

**Input:** `count` (1–8).

**Output:** array of `{quote, name, role, company, avatar_url}`.

**Steps:**
1. Quote: compose a 1–2 sentence testimonial in the user's voice. Use
   `data/quotes-tech.json` or `data/lorem-hipster.json` as
   inspiration. Keep it specific: mention a benefit, not "great
   product".
2. name, role, company, avatar_url: same as Realistic User.

### 5. Address Block

**Input:** `count` (1–8), `country` (`US`, `GB`, `DE`, `FR`, `ES`,
`IT`, `NL`, `PT`, `CA`, `BR`, `MX`, `JP`, ...).

**Output:** array of `{recipient, address_lines: [...], country}`.

**Steps:**
1. Recipient: pick a name from the matching locale list.
2. Address lines: read `data/address-<country-lowercase>.json` and
   pick one — the format already matches the country's postal
   convention (Germany's `PLZ` comes before city; UK's postcode after;
   Japan's prefecture pattern; etc.).
3. Country: full English name.

## Locale fallback chain

When the user doesn't specify a locale and the data isn't obvious from
context, default to `en_US`. When they do specify, follow this chain
if the exact list is missing:

| Requested | Falls back to |
|-----------|---------------|
| `en_US` | `en_GB` → `names.json` |
| `en_GB` | `en_US` → `names.json` |
| `de_DE` | `nl_NL` → `names.json` |
| `es_ES` | `pt_PT` → `names.json` |
| `fr_FR` | `it_IT` → `names.json` |
| `ja_JP` native | `ja_JP` romanized → `zh_CN` → `names.json` |

## Examples

- "Build me a sign-up flow with 5 fake users from Germany"
  → Realistic User recipe, `count=5`, `locale=de_DE`.

- "Mock a SaaS pricing table"
  → Pricing Page recipe, `tiers=4` (the default).

- "Three testimonial cards for a marketing site"
  → Customer Card recipe, `count=3`.

- "Just 20 realistic product names"
  → No recipe. `cat data/product-names-modern.json | jq '.items[:20]'`.

- "Hex colors that feel autumnal"
  → No recipe. Read `data/colorshex.json`, pick items in oranges /
  reds / browns using your judgement; return ~8 of them.

- "Give me an IBAN that looks German"
  → `cat data/iban-de.json | jq '.items | .[0]'` (or sample randomly).

## When NOT to use this skill

- The user explicitly wants real, current data (live stock prices,
  current weather, actual user data). This skill is for *mock* data.
- The user asks for a list that doesn't exist locally. Check
  `data/manifest.json` first; if nothing matches and the request is
  niche, decline and explain.

## Attribution

Data is curated from the open-source Lists project. See
https://github.com/gariasf/lists for the source and to suggest new
lists.
