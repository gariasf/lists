import { Clipboard, LaunchProps, showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { fetchSample } from "./lists-api";

/**
 * no-view command: default export must be an async function, not a component.
 * `lists names-pt_br 5` straight from the root search, no window.
 */
export default async function CopyRandom(props: LaunchProps<{ arguments: { slug: string; count?: string } }>) {
  const slug = props.arguments.slug.trim().toLowerCase();
  const parsed = parseInt(props.arguments.count ?? "", 10);
  const count = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 5;

  if (!/^[a-z0-9-_]+$/.test(slug)) {
    await showFailureToast(new Error(`"${slug}" isn't a list slug`), {
      title: "Try something like names-pt_br",
    });
    return;
  }

  try {
    const items = await fetchSample(slug, count);
    if (items.length === 0) {
      await showFailureToast(new Error(`No list called "${slug}"`), {
        title: "Check the slug in Search Lists",
      });
      return;
    }
    await Clipboard.copy(items.join("\n"));
    await showHUD(`Copied ${items.length} from ${slug}`);
  } catch (error) {
    await showFailureToast(error, { title: "Could not reach lists.gariasf.com" });
  }
}
