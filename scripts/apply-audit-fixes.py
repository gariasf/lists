#!/usr/bin/env python3
"""
Apply audit findings to data/lists overrides.

Parses audit-reports/*.txt (tab-separated): slug\tindex\tvalue\tproblem\tsuggestion
- suggestion = "DROP" → remove entry
- suggestion = anything else → replace entry

For each affected slug, writes data/lists/<slug>.override.txt with the
patched item list (one per line). Prints per-slug summary so we can
update lists-data.ts to add `layer: 'replace'` overrides afterward.

Reads source items from out/api/lists/<slug> (built JSON manifest).
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path("/Users/guillem.arias/Documents/gariasf/lists")
REPORTS_DIR = ROOT / "audit-reports"
API_LISTS = ROOT / "out/api/lists"
DATA_LISTS = ROOT / "data/lists"
OVERRIDE_DIR = DATA_LISTS / "audit-overrides"

# Slugs to SKIP — structured JSON, sensitive (names), or stylistic-only flags.
SKIP_SLUGS = {
    "avatars-dicebear",   # structured JSON
    "country-codes",      # structured JSON
}


def parse_reports():
    findings = defaultdict(list)
    total = 0
    seen = set()
    for r in sorted(REPORTS_DIR.glob("*.txt")):
        for raw in r.read_text().splitlines():
            line = raw.strip()
            if not line:
                continue
            if line.startswith("DONE:") or line.startswith("TRUNCATED:"):
                continue
            parts = line.split("\t")
            if len(parts) < 5:
                continue
            slug, idx_s, current, problem, sug = parts[0], parts[1], parts[2], parts[3], "\t".join(parts[4:])
            try:
                idx = int(idx_s)
            except ValueError:
                continue
            key = (slug, idx)
            if key in seen:
                continue  # dedupe within reports
            seen.add(key)
            findings[slug].append({
                "idx": idx,
                "current": current,
                "problem": problem,
                "suggestion": sug.strip(),
            })
            total += 1
    return findings, total


def is_dropable(suggestion: str) -> bool:
    s = suggestion.strip().upper()
    return s == "DROP"


def is_concrete_replacement(suggestion: str) -> bool:
    s = suggestion.strip()
    if not s:
        return False
    if is_dropable(s):
        return False
    # Reject suggestions that look like meta-guidance rather than a value
    bad_prefixes = (
        "use ", "should ", "replace with ", "see ", "review", "tbd", "n/a",
        "various ", "rotate ", "regenerate ", "rebuild ", "needs ",
    )
    low = s.lower()
    for p in bad_prefixes:
        if low.startswith(p):
            return False
    # Reject suggestions with placeholder ellipses indicating uncertainty
    if "..." in s or "etc" in low:
        return False
    return True


def apply_to_slug(slug: str, finds: list) -> dict:
    src = API_LISTS / slug
    if not src.exists():
        return {"slug": slug, "status": "no_source"}
    data = json.loads(src.read_text())
    items = list(data.get("items", []))
    fmt = data.get("format", "txt")
    if fmt != "txt":
        return {"slug": slug, "status": "non_txt_format", "format": fmt}

    drops = set()
    replacements = {}  # idx (1-based) -> new value
    skipped = []
    for f in finds:
        idx = f["idx"]
        if not (1 <= idx <= len(items)):
            skipped.append(("oob", f))
            continue
        sug = f["suggestion"]
        if is_dropable(sug):
            drops.add(idx)
        elif is_concrete_replacement(sug):
            # Strip outer quotes if present (some agents wrapped suggestions)
            if (sug.startswith('"') and sug.endswith('"')) or (
                sug.startswith("'") and sug.endswith("'")
            ):
                sug = sug[1:-1]
            replacements[idx] = sug
        else:
            skipped.append(("vague", f))

    new_items = []
    for i, val in enumerate(items, 1):
        if i in drops:
            continue
        new_items.append(replacements.get(i, val))

    # Dedup exact case-sensitive duplicates while preserving first-occurrence order
    seen = set()
    deduped = []
    dup_dropped = 0
    for v in new_items:
        key = v.strip()
        if not key:
            dup_dropped += 1
            continue  # also drop empty
        if key in seen:
            dup_dropped += 1
            continue
        seen.add(key)
        deduped.append(key)

    out_path = OVERRIDE_DIR / f"{slug}.txt"
    out_path.write_text("\n".join(deduped) + "\n")
    return {
        "slug": slug,
        "status": "ok",
        "before": len(items),
        "after": len(deduped),
        "drops": len(drops),
        "replacements": len(replacements),
        "skipped": len(skipped),
        "dedup_removed": dup_dropped,
        "out": str(out_path.relative_to(ROOT)),
    }


def main():
    OVERRIDE_DIR.mkdir(parents=True, exist_ok=True)
    findings, total = parse_reports()
    print(f"parsed {total} findings across {len(findings)} slugs\n")

    results = []
    for slug in sorted(findings.keys()):
        if slug in SKIP_SLUGS:
            results.append({"slug": slug, "status": "skipped_intentional"})
            continue
        r = apply_to_slug(slug, findings[slug])
        results.append(r)

    # Summary
    ok = [r for r in results if r["status"] == "ok"]
    no_src = [r for r in results if r["status"] == "no_source"]
    non_txt = [r for r in results if r["status"] == "non_txt_format"]
    skipped = [r for r in results if r["status"] == "skipped_intentional"]

    print(f"applied: {len(ok)}")
    print(f"  no source: {len(no_src)}  ({', '.join(r['slug'] for r in no_src) or '—'})")
    print(f"  non-txt format: {len(non_txt)}  ({', '.join(r['slug'] for r in non_txt) or '—'})")
    print(f"  skipped (manual review): {len(skipped)}  ({', '.join(r['slug'] for r in skipped) or '—'})")
    print()

    # Per-slug detail table
    print(f"{'slug':<35} {'before':>7} {'after':>7} {'drop':>5} {'repl':>5} {'skip':>5} {'dedup':>6}")
    for r in ok:
        print(
            f"{r['slug']:<35} {r['before']:>7} {r['after']:>7} {r['drops']:>5} {r['replacements']:>5} {r['skipped']:>5} {r['dedup_removed']:>6}"
        )

    # Write summary JSON for downstream
    summary_path = REPORTS_DIR / "apply-summary.json"
    summary_path.write_text(json.dumps(results, indent=2))
    print(f"\nsummary → {summary_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
