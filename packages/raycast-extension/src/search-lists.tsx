import { useState } from "react";
import { Action, ActionPanel, Clipboard, Icon, List, showHUD, Keyboard } from "@raycast/api";
import { showFailureToast, useFetch } from "@raycast/utils";
import { API, SITE, type Catalog, type CatalogEntry, type ListPayload, fetchAll, fetchSample } from "./lists-api";

const PREVIEW_ITEMS = 12;

async function copyItems(slug: string, name: string, n: number | "all") {
  try {
    const items = n === "all" ? await fetchAll(slug) : await fetchSample(slug, n);
    if (items.length === 0) {
      await showFailureToast(new Error("That list came back empty"), { title: "Nothing to copy" });
      return;
    }
    await Clipboard.copy(items.join("\n"));
    await showHUD(`Copied ${items.length} from ${name}`);
  } catch (error) {
    await showFailureToast(error, { title: "Could not reach lists.gariasf.com" });
  }
}

function Preview({ slug }: { slug: string }) {
  const { data, isLoading } = useFetch<ListPayload>(`${API}/lists/${slug}`);

  if (isLoading && !data) {
    return <List.Item.Detail isLoading />;
  }

  const items = data?.items ?? [];
  const shown = items.slice(0, PREVIEW_ITEMS);
  const markdown = [
    `### ${data?.name ?? slug}`,
    "",
    ...shown.map((item) => `- ${item}`),
    items.length > shown.length ? `\n_…and ${items.length - shown.length} more_` : "",
  ].join("\n");

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Items" text={String(data?.count ?? items.length)} />
          <List.Item.Detail.Metadata.Label title="Category" text={data?.category ?? "—"} />
          {data?.verified ? <List.Item.Detail.Metadata.Label title="Verified" text={data.verified} /> : null}
          <List.Item.Detail.Metadata.Link title="Web" target={`${SITE}/list/${slug}/`} text={slug} />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function ListActions({
  entry,
  showDetail,
  onToggleDetail,
}: {
  entry: CatalogEntry;
  showDetail: boolean;
  onToggleDetail: () => void;
}) {
  return (
    <ActionPanel>
      <ActionPanel.Section>
        {/* Five random is the everyday case: enough to fill a mockup, without
            dumping a whole catalog into the clipboard. */}
        <Action title="Copy 5 Random" icon={Icon.Clipboard} onAction={() => copyItems(entry.slug, entry.name, 5)} />
        <Action
          title="Copy 10 Random"
          icon={Icon.Clipboard}
          shortcut={{ modifiers: ["cmd"], key: "1" }}
          onAction={() => copyItems(entry.slug, entry.name, 10)}
        />
        <Action
          title="Copy One Random"
          icon={Icon.Dot}
          shortcut={{ modifiers: ["cmd"], key: "2" }}
          onAction={() => copyItems(entry.slug, entry.name, 1)}
        />
        <Action
          title="Copy Whole List"
          icon={Icon.CopyClipboard}
          shortcut={Keyboard.Shortcut.Common.Copy}
          onAction={() => copyItems(entry.slug, entry.name, "all")}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action.OpenInBrowser
          title="Open on Lists"
          url={`${SITE}/list/${entry.slug}/`}
          shortcut={Keyboard.Shortcut.Common.Open}
        />
        <Action.CopyToClipboard title="Copy Slug" content={entry.slug} shortcut={Keyboard.Shortcut.Common.Duplicate} />
        <Action.CopyToClipboard
          title="Copy API URL"
          content={`${API}/lists/${entry.slug}`}
          shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
        />
        <Action
          title={showDetail ? "Hide Preview" : "Show Preview"}
          icon={Icon.Sidebar}
          shortcut={Keyboard.Shortcut.Common.ToggleQuickLook}
          onAction={onToggleDetail}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

export default function SearchLists() {
  // Raycast filters the 431 entries natively; passing onSearchTextChange would
  // silently disable that and leave us reimplementing it worse.
  // No initialData: it breaks useFetch's overload resolution (it types the
  // paginated variant), and `data` is guarded below anyway.
  const { data, isLoading } = useFetch<Catalog>(`${API}/manifest`, {
    failureToastOptions: { title: "Could not load the catalog" },
  });
  const [showDetail, setShowDetail] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const entries = data?.lists ?? [];

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={showDetail}
      searchBarPlaceholder={entries.length ? `Search ${entries.length} lists…` : "Search lists…"}
      onSelectionChange={setSelected}
    >
      {entries.map((entry) => (
        // Stable id, or Raycast generates one per render and the selection
        // jumps back to the top on every revalidate.
        <List.Item
          key={entry.slug}
          id={entry.slug}
          title={entry.name}
          subtitle={showDetail ? undefined : entry.slug}
          accessories={showDetail ? undefined : [{ text: entry.category }]}
          // Only the selected row's detail is mounted, so browsing the catalog
          // doesn't fire 431 requests.
          detail={showDetail && selected === entry.slug ? <Preview slug={entry.slug} /> : undefined}
          actions={
            <ListActions entry={entry} showDetail={showDetail} onToggleDetail={() => setShowDetail((v) => !v)} />
          }
        />
      ))}
    </List>
  );
}
