# Publishing to the Raycast Store

Everything the store requires is in place except the screenshots, which have to
be captured from the running extension — there's no headless way to make them,
and faked ones are a rejection risk.

| Requirement | Status |
| --- | --- |
| `package.json` (title, author, MIT licence, platforms, categories) | ✅ |
| `assets/icon.png` 512×512 | ✅ |
| `CHANGELOG.md` with the literal `{PR_MERGE_DATE}` placeholder | ✅ |
| `package-lock.json`, committed | ✅ |
| `README.md` | ✅ |
| `metadata/` screenshots, exactly 2000×1250 PNG | ⬜ **you** |

`author` is `gariasf` — this must be your **Raycast** handle, not the GitHub
one, or the submission is rejected.

## 1. Capture the screenshots

```bash
cd packages/raycast-extension
npm install
npm run dev          # installs into Raycast and hot-reloads
```

In Raycast: Settings → Advanced → **Window Capture**, assign a hotkey. Run
`Search Lists`, press the hotkey, tick **Save to Metadata**. It writes
`metadata/lists-mock-data-1.png` at the correct 2000×1250.

Take 2–4: the catalog with the preview pane open, a copy action firing, and the
`Copy Random Items` command with its arguments filled in. Keep the same
background in all of them, no other apps visible, no personal data on screen.

## 2. Submit

```bash
npm run build && npm run lint     # both must be clean
npm run publish
```

`publish` opens a browser for **GitHub** OAuth — it forks `raycast/extensions`
and opens a PR on your behalf. Run it again to push follow-up commits to the
same PR.

If a reviewer edits the PR, pull their changes back first:

```bash
npx @raycast/api@latest pull-contributions
```

## Review

Community managers work first-in-first-out; expect first contact within about a
week. PRs go stale after 14 days of inactivity and close after 21. On merge,
`{PR_MERGE_DATE}` is rewritten automatically and the extension goes live.

## Known review risks for this extension

- **The title is "Lists"**, which is generic. It's the product's real name, so
  it's defensible, but a reviewer may ask for something more distinctive —
  `Lists Mock Data` is the fallback if they push back.
- Extensions are rejected for duplicating an existing store extension; check the
  store for another mock-data extension before submitting.
