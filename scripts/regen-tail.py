#!/usr/bin/env python3
"""
Fix audit tail items that the main triage pass couldn't auto-apply.

- creditcardexpiration: original was 500 entries, all 2017-2020 (all
  expired in 2026). Regenerate 500 forward-dated MM/YY entries in
  the 2026-12..2031-12 range.
- hashtags-trending: was empty (count:0). Populate with current
  plausible hashtags.
- iban-by-country: 1 line override (entry 49, Seychelles IBAN had
  spurious "USD" currency suffix).
"""
import json
import random
import re
from pathlib import Path

random.seed(7)
ROOT = Path("/Users/guillem.arias/Documents/gariasf/lists")
OVERRIDE_DIR = ROOT / "data/lists/audit-overrides"
DATA = ROOT / "data/lists"


# ----------------------------------------------------- credit card expiry ---
def gen_credit_card_expirations(n: int = 500):
    """MM/YY across 2026-07 → 2031-12. Non-unique (list, not set) — credit
    card expiry dates repeat in real life across millions of cards."""
    out = []
    pool = []
    for year in range(26, 32):
        for month in range(1, 13):
            if year == 26 and month < 7:
                continue
            pool.append((year, month))
    weights = []
    for y, m in pool:
        # closer years more likely
        w = max(1, 8 - (y - 26))
        weights.append(w)
    while len(out) < n:
        y, m = random.choices(pool, weights=weights)[0]
        out.append(f"{m:02d}/{y:02d}")
    return out


# ---------------------------------------------------- hashtags trending ----
def gen_hashtags():
    return [
        "#AI",
        "#GenAI",
        "#OpenSource",
        "#TypeScript",
        "#Rust",
        "#Bitcoin",
        "#Ethereum",
        "#Web3",
        "#WebDev",
        "#Frontend",
        "#Design",
        "#UX",
        "#UIDesign",
        "#Figma",
        "#100DaysOfCode",
        "#DevOps",
        "#Kubernetes",
        "#Docker",
        "#CloudComputing",
        "#Cybersecurity",
        "#DataScience",
        "#MachineLearning",
        "#DeepLearning",
        "#LLM",
        "#GPT5",
        "#Claude",
        "#Gemini",
        "#Llama3",
        "#Anthropic",
        "#OpenAI",
        "#GoogleAI",
        "#Apple",
        "#WWDC",
        "#iOS18",
        "#Android15",
        "#macOS",
        "#NixOS",
        "#ArchLinux",
        "#NotionAI",
        "#StableDiffusion",
        "#Midjourney",
        "#VercelShip",
        "#NextJS",
        "#ReactJS",
        "#SvelteKit",
        "#SolidJS",
        "#TailwindCSS",
        "#Astro",
        "#Bun",
        "#Deno",
        "#TypeScript5",
        "#TypeFest",
        "#Productivity",
        "#RemoteWork",
        "#Startup",
        "#YCombinator",
        "#ProductHunt",
        "#IndieHacker",
        "#BuildInPublic",
        "#SaaS",
        "#Ecommerce",
        "#Crypto",
        "#NFT",
        "#DeFi",
        "#Coinbase",
        "#Stripe",
        "#FinTech",
        "#Climate",
        "#Sustainability",
        "#ClimateChange",
        "#RenewableEnergy",
        "#EV",
        "#Tesla",
        "#Rivian",
        "#SpaceX",
        "#Mars",
        "#Starlink",
        "#NASA",
        "#JWST",
        "#Olympics2028",
        "#Paris2024",
        "#WorldCup2026",
        "#EuroChamps",
        "#NBA",
        "#NFL",
        "#MLB",
        "#PremierLeague",
        "#LaLiga",
        "#Bundesliga",
        "#F1",
        "#Verstappen",
        "#Hamilton",
        "#Music",
        "#Spotify",
        "#AppleMusic",
        "#NowPlaying",
        "#NewMusicFriday",
        "#GRAMMYs",
        "#Eurovision",
        "#KPop",
        "#BTS",
        "#TaylorSwift",
        "#Movies",
        "#FilmTwitter",
        "#Oscars",
        "#Cannes",
        "#A24",
        "#NetflixAndChill",
        "#StreamingWars",
        "#Gaming",
        "#PS5",
        "#XboxSeriesX",
        "#NintendoSwitch2",
        "#SteamDeck",
        "#Twitch",
        "#Esports",
        "#GameDev",
        "#Indie",
        "#Photography",
        "#NaturePhotography",
        "#StreetPhotography",
        "#Travel",
        "#Wanderlust",
        "#Foodie",
        "#PlantBased",
        "#Fitness",
        "#Yoga",
        "#Running",
        "#Marathon",
        "#Mindfulness",
        "#MentalHealth",
        "#SelfCare",
        "#Books",
        "#BookTok",
        "#Reading",
        "#Writing",
        "#AuthorLife",
        "#Poetry",
        "#Art",
        "#DigitalArt",
        "#Illustration",
        "#3DArt",
        "#Pixel",
        "#GenerativeArt",
        "#Architecture",
        "#InteriorDesign",
        "#TypeDesign",
        "#FontFriday",
        "#Lettering",
        "#TGIF",
        "#MondayMotivation",
        "#MotivationMonday",
        "#WisdomWednesday",
        "#ThrowbackThursday",
        "#FridayFeeling",
        "#WeekendVibes",
    ]


def patch_iban_by_country():
    # iban-by-country is JSON-structured. Patch entry 49 in place.
    path = DATA / "iban-by-country.json"
    if not path.exists():
        print(f"  iban-by-country.json missing — skipping")
        return False
    arr = json.loads(path.read_text())
    if not isinstance(arr, list):
        print("  iban-by-country.json not an array — skipping")
        return False
    target = "SC18SSCB11010000000000001497USD"
    fixed = "SC18SSCB1101000000000000149700"
    patched = 0
    for row in arr:
        if isinstance(row, dict):
            for k, v in row.items():
                if v == target:
                    row[k] = fixed
                    patched += 1
    if patched:
        path.write_text(json.dumps(arr, indent=2) + "\n")
        print(f"  patched {patched} occurrences in iban-by-country.json")
    else:
        # Already correct, or stored elsewhere
        print("  iban-by-country.json had no matching entry")
    return True


def main():
    OVERRIDE_DIR.mkdir(parents=True, exist_ok=True)

    # 1) creditcardexpiration
    items = gen_credit_card_expirations(500)
    (OVERRIDE_DIR / "creditcardexpiration.txt").write_text("\n".join(items) + "\n")
    print(f"creditcardexpiration: {len(items)} entries")

    # 2) hashtags-trending
    items = gen_hashtags()
    (OVERRIDE_DIR / "hashtags-trending.txt").write_text("\n".join(items) + "\n")
    print(f"hashtags-trending: {len(items)} entries")

    # 3) iban-by-country
    print("iban-by-country:")
    patch_iban_by_country()


if __name__ == "__main__":
    main()
