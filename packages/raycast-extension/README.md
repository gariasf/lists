# Lists — Raycast extension

Search 430+ curated lists of realistic mock data and copy items straight to the
clipboard, without opening a browser.

## Commands

**Search Lists** — the catalog, filtered by Raycast's own search. The preview
pane shows the first dozen items, the item count, and when the list was last
verified. Actions on the selected list:

| Action | Shortcut |
| --- | --- |
| Copy 5 random | `↵` |
| Copy 10 random | `⌘1` |
| Copy one random | `⌘2` |
| Copy the whole list | `⌘⇧C` |
| Open on lists.gariasf.com | `⌘O` |
| Copy slug / API URL | `⌘⇧S` / `⌘⇧U` |
| Show or hide the preview | `⌘Y` |

**Copy Random Items** — no window at all: type the slug and an optional count
in Raycast's root search and the items land on your clipboard.

```
Copy Random Items   names-pt_br   5
```

## Running it

No account and no store submission needed — `ray develop` installs it into your
local Raycast and it stays there after you stop the dev server.

```bash
cd packages/raycast-extension
npm install
npm run dev      # installs into Raycast; ⌃C when it's there
```

Re-run `npm run dev` after editing. On another Mac, clone the repo and use
Raycast's **Import Extension** command on this folder.

## Notes

Everything comes from the public API at `lists.gariasf.com` — no key, no rate
limit, and each list is a static file behind a CDN, so it stays fast and free.
The catalog is cached between runs by `useFetch`, so the list paints instantly
after the first launch.

Publishing to the Raycast Store would need `npm run publish`, which opens a PR
against `raycast/extensions` for their review, and an `author` handle matching
a real Raycast account.
