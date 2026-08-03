/**
 * Mini Store catalog queries (Dashboard → Mini Store).
 *
 * The catalog is a reusable list of sellable items per workspace. Bio pages
 * still render items from the block JSON, so public pages stay a single
 * request with no extra round-trip.
 */
import { supabase } from "@/integrations/supabase/client";
import type { StoreItem, StoreItemAction, StoreItemKind } from "@/features/builder/types";

export interface StoreCatalogItem {
  id: string;
  workspace_id: string;
  kind: StoreItemKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  long_description: string | null;
  cover_image: string | null;
  gallery: string[];
  price: number | null;
  old_price: number | null;
  currency: string;
  badge: string;
  action: StoreItemAction;
  button_label: string | null;
  url: string | null;
  download_url: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type StoreCatalogInput = Partial<
  Omit<StoreCatalogItem, "id" | "workspace_id" | "created_at" | "updated_at">
> & { title: string };

export async function listStoreItems(workspaceId: string): Promise<StoreCatalogItem[]> {
  const { data, error } = await supabase
    .from("bio_store_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as StoreCatalogItem[];
}

export async function createStoreItem(workspaceId: string, input: StoreCatalogInput) {
  const { data, error } = await supabase
    .from("bio_store_items")
    .insert({ ...input, workspace_id: workspaceId } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as StoreCatalogItem;
}

export async function updateStoreItem(id: string, patch: Partial<StoreCatalogInput>) {
  const { error } = await supabase
    .from("bio_store_items")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStoreItem(id: string) {
  const { error } = await supabase.from("bio_store_items").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateStoreItem(item: StoreCatalogItem) {
  const { id, created_at, updated_at, workspace_id, ...rest } = item;
  void id;
  void created_at;
  void updated_at;
  return createStoreItem(workspace_id, {
    ...rest,
    title: `${item.title} (copy)`,
    sort_order: item.sort_order + 1,
  });
}

export async function reorderStoreItems(ids: string[]) {
  await Promise.all(ids.map((id, i) => updateStoreItem(id, { sort_order: i })));
}

/** Converts a catalog row into a block item for the builder. */
export function catalogToBlockItem(row: StoreCatalogItem): StoreItem {
  return {
    id: Math.random().toString(36).slice(2, 10),
    catalogId: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description ?? row.subtitle ?? undefined,
    longDescription: row.long_description ?? undefined,
    coverImage: row.cover_image ?? undefined,
    gallery: row.gallery ?? [],
    price: row.price ?? undefined,
    oldPrice: row.old_price ?? undefined,
    currency: row.currency,
    badge: (row.badge ?? "none") as StoreItem["badge"],
    action: row.action,
    buttonLabel: row.button_label ?? undefined,
    url: row.url ?? undefined,
    downloadUrl: row.download_url ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    whatsappMessage: row.whatsapp_message ?? undefined,
    hidden: row.hidden,
  };
}
