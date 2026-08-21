/** Shared API surface for both commands. Node 22 runtime: fetch is global. */

export const API = "https://lists.gariasf.com/api";
export const SITE = "https://lists.gariasf.com";

export interface CatalogEntry {
  slug: string;
  name: string;
  category: string;
  url: string;
  verified?: string;
  churn?: string;
}

export interface Catalog {
  count: number;
  lists: CatalogEntry[];
}

export interface ListPayload {
  slug: string;
  name: string;
  category: string;
  count: number;
  items: string[];
  verified?: string;
}

/**
 * The sample endpoint caps n at 20 and needs no auth or rate limiting — it's a
 * static read. Falls back to the full list when more items are asked for.
 */
export async function fetchSample(slug: string, n: number): Promise<string[]> {
  if (n > 20) {
    const res = await fetch(`${API}/lists/${slug}`);
    if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
    const data = (await res.json()) as ListPayload;
    return data.items ?? [];
  }
  const res = await fetch(`${API}/sample/${slug}?n=${n}`);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const data = (await res.json()) as { items?: string[] };
  return data.items ?? [];
}

export async function fetchAll(slug: string): Promise<string[]> {
  const res = await fetch(`${API}/lists/${slug}`);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const data = (await res.json()) as ListPayload;
  return data.items ?? [];
}
