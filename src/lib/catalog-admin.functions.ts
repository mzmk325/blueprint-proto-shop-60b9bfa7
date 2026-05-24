// Admin-only catalog mutations. Every fn requires authenticated user + admin role.
// All writes go through supabaseAdmin so we control the projection explicitly.

import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Gate: caller must have admin role. Built on top of requireSupabaseAuth.
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Forbidden: admin role required");
    return next({ context });
  });

// ── Schemas ────────────────────────────────────────────────────────────────

const ProductStatus = z.enum(["draft", "published", "unpublished"]);

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9][a-z0-9-]*$/i, "slug must be url-safe (a-z, 0-9, -)"),
  legacy_id: z.string().max(255).nullable().optional(),
  name_en: z.string().min(1).max(255),
  name_zh: z.string().max(255).nullable().optional(),
  descriptor_en: z.string().max(500).nullable().optional(),
  descriptor_zh: z.string().max(500).nullable().optional(),
  description_en: z.string().max(10000).nullable().optional(),
  description_zh: z.string().max(10000).nullable().optional(),
  selling_points: z.array(z.object({ en: z.string().optional(), zh: z.string().optional() })).default([]),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  price: z.number().min(0).max(100000),
  original_price: z.number().min(0).max(100000).nullable().optional(),
  cost: z.number().min(0).max(100000).nullable().optional(),
  currency: z.string().min(3).max(8).default("USD"),
  gender: z.string().max(64).nullable().optional(),
  shape: z.string().max(64).nullable().optional(),
  material: z.string().max(64).nullable().optional(),
  badges: z.array(z.string().max(64)).default([]),
  is_featured: z.boolean().default(false),
  is_hot: z.boolean().default(false),
  is_new: z.boolean().default(false),
  frame_width_mm: z.number().int().min(0).max(1000).nullable().optional(),
  lens_width_mm: z.number().int().min(0).max(1000).nullable().optional(),
  lens_height_mm: z.number().int().min(0).max(1000).nullable().optional(),
  bridge_mm: z.number().int().min(0).max(1000).nullable().optional(),
  temple_length_mm: z.number().int().min(0).max(1000).nullable().optional(),
  weight_g: z.number().min(0).max(10000).nullable().optional(),
  status: ProductStatus.default("draft"),
});

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9][a-z0-9-]*$/i),
  name_en: z.string().min(1).max(255),
  name_zh: z.string().max(255).nullable().optional(),
  description_en: z.string().max(2000).nullable().optional(),
  description_zh: z.string().max(2000).nullable().optional(),
  hero_image_url: z.string().max(2000).nullable().optional(),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
});

const VariantInput = z.object({
  id: z.string().uuid().optional(),
  name_en: z.string().min(1).max(255),
  name_zh: z.string().max(255).nullable().optional(),
  color_hex: z.string().max(16).nullable().optional(),
  sku: z.string().max(64).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  sort_order: z.number().int().min(0).default(0),
});

const ImageInput = z.object({
  id: z.string().uuid().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  url: z.string().min(1).max(2000),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

const AssetInput = z.object({
  storage_path: z.string().max(1000).nullable().optional(),
  url: z.string().min(1).max(2000),
  name: z.string().min(1).max(255),
  note: z.string().max(1000).nullable().optional(),
  type: z.enum(["product", "category", "hero", "home_card", "other"]).default("other"),
  width: z.number().int().min(0).nullable().optional(),
  height: z.number().int().min(0).nullable().optional(),
  size_bytes: z.number().int().min(0).nullable().optional(),
  mime_type: z.string().max(128).nullable().optional(),
});

// ── Product mutations ──────────────────────────────────────────────────────

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => ProductInput.parse(d))
  .handler(async ({ data }) => {
    const isUpdate = !!data.id;
    const payload = {
      ...data,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    // Preserve published_at if was already published — fetch first to decide.
    if (isUpdate && data.status === "published") {
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("published_at, status")
        .eq("id", data.id!)
        .maybeSingle();
      if (existing?.status === "published" && existing.published_at) {
        payload.published_at = existing.published_at;
      }
    }
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .upsert(payload, { onConflict: "id" })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, slug: row.slug as string };
  });

export const setProductStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: ProductStatus }).parse(d))
  .handler(async ({ data }) => {
    const published_at = data.status === "published" ? new Date().toISOString() : null;
    const patch: { status: typeof data.status; published_at?: string | null } = { status: data.status };
    if (data.status === "published") {
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("published_at, status")
        .eq("id", data.id)
        .maybeSingle();
      patch.published_at =
        existing?.status === "published" && existing.published_at ? existing.published_at : published_at;
    } else {
      patch.published_at = null;
    }
    const { error } = await supabaseAdmin.from("products").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    // Cascades to product_variants, product_images, product_categories
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Replace the full set of categories linked to a product.
export const setProductCategories = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) =>
    z
      .object({ product_id: z.string().uuid(), category_ids: z.array(z.string().uuid()).max(50) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const del = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("product_id", data.product_id);
    if (del.error) throw new Error(del.error.message);
    if (data.category_ids.length === 0) return { ok: true };
    const rows = data.category_ids.map((cid, i) => ({
      product_id: data.product_id,
      category_id: cid,
      sort_order: i,
    }));
    const ins = await supabaseAdmin.from("product_categories").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true };
  });

// Replace the full set of variants for a product (preserves ids when provided).
export const upsertVariants = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        variants: z.array(VariantInput).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    // Strategy: delete missing ids, upsert provided ones.
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("product_variants")
      .select("id")
      .eq("product_id", data.product_id);
    if (exErr) throw new Error(exErr.message);
    const keepIds = new Set(
      data.variants.filter((v) => v.id).map((v) => v.id!) as string[],
    );
    const toDelete = (existing ?? [])
      .map((r) => r.id as string)
      .filter((id) => !keepIds.has(id));
    if (toDelete.length) {
      const d = await supabaseAdmin
        .from("product_variants")
        .delete()
        .in("id", toDelete);
      if (d.error) throw new Error(d.error.message);
    }
    if (data.variants.length === 0) return { ok: true, variants: [] };
    const rows = data.variants.map((v, i) => ({
      ...v,
      product_id: data.product_id,
      sort_order: v.sort_order ?? i,
    }));
    const up = await supabaseAdmin
      .from("product_variants")
      .upsert(rows, { onConflict: "id" })
      .select("id, name_en, color_hex, sort_order");
    if (up.error) throw new Error(up.error.message);
    return { ok: true, variants: up.data };
  });

// Replace the full set of images for a product (optionally scoped to a variant).
export const setProductImages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        images: z.array(ImageInput).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const del = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("product_id", data.product_id);
    if (del.error) throw new Error(del.error.message);
    if (data.images.length === 0) return { ok: true };
    // Enforce at most one primary per (product, variant_id)
    const seenPrimary = new Set<string>();
    const rows = data.images.map((im, i) => {
      const key = `${data.product_id}|${im.variant_id ?? ""}`;
      let isPrimary = im.is_primary;
      if (isPrimary) {
        if (seenPrimary.has(key)) isPrimary = false;
        else seenPrimary.add(key);
      }
      return {
        product_id: data.product_id,
        variant_id: im.variant_id ?? null,
        asset_id: im.asset_id ?? null,
        url: im.url,
        is_primary: isPrimary,
        sort_order: im.sort_order ?? i,
      };
    });
    const ins = await supabaseAdmin.from("product_images").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true };
  });

// ── Category mutations ─────────────────────────────────────────────────────

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => CategoryInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("categories")
      .upsert(data, { onConflict: "id" })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, slug: row.slug as string };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    // Unlink first (no FK cascade declared in schema)
    const unlink = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("category_id", data.id);
    if (unlink.error) throw new Error(unlink.error.message);
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Asset mutations ────────────────────────────────────────────────────────

export const createAsset = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => AssetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("assets")
      .insert({ ...data, uploaded_by: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    // Check usage in product_images
    const { count, error: cErr } = await supabaseAdmin
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("asset_id", data.id);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      throw new Error(
        `Asset is used by ${count} product image(s). Remove those references first.`,
      );
    }
    // Look up storage path to also delete the binary
    const { data: asset } = await supabaseAdmin
      .from("assets")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (asset?.storage_path) {
      await supabaseAdmin.storage.from("product-images").remove([asset.storage_path]);
    }
    return { ok: true };
  });

// ── Admin reads ────────────────────────────────────────────────────────────

// Returns ALL products (incl. drafts/unpublished) for admin grid + draft preview.
export const adminListCatalog = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const [pRes, vRes, iRes, lRes, cRes, aRes] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("product_variants").select("*").order("sort_order"),
      supabaseAdmin.from("product_images").select("*").order("sort_order"),
      supabaseAdmin.from("product_categories").select("product_id, category_id, sort_order"),
      supabaseAdmin.from("categories").select("*").order("sort_order"),
      supabaseAdmin.from("assets").select("*").order("created_at", { ascending: false }),
    ]);
    for (const r of [pRes, vRes, iRes, lRes, cRes, aRes]) {
      if (r.error) throw new Error(r.error.message);
    }
    return {
      products: pRes.data ?? [],
      variants: vRes.data ?? [],
      images: iRes.data ?? [],
      links: lRes.data ?? [],
      categories: cRes.data ?? [],
      assets: aRes.data ?? [],
    };
  });

// Admin-only preview by slug OR legacy_id OR uuid. Includes drafts/unpublished.
export const getProductForPreview = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ key: z.string().min(1).max(255) }).parse(d))
  .handler(async ({ data }) => {
    // Try id (uuid), slug, then legacy_id
    const uuidish = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let row: { id: string; slug: string } | null = null;
    if (uuidish.test(data.key)) {
      const r = await supabaseAdmin.from("products").select("id, slug").eq("id", data.key).maybeSingle();
      if (r.error) throw new Error(r.error.message);
      row = r.data;
    }
    if (!row) {
      const r = await supabaseAdmin
        .from("products")
        .select("id, slug")
        .eq("slug", data.key)
        .maybeSingle();
      if (r.error) throw new Error(r.error.message);
      row = r.data;
    }
    if (!row) {
      const r = await supabaseAdmin
        .from("products")
        .select("id, slug")
        .eq("legacy_id", data.key)
        .maybeSingle();
      if (r.error) throw new Error(r.error.message);
      row = r.data;
    }
    if (!row) return { product: null };
    const [pRes, vRes, iRes, lRes] = await Promise.all([
      supabaseAdmin.from("products").select("*").eq("id", row.id).single(),
      supabaseAdmin.from("product_variants").select("*").eq("product_id", row.id).order("sort_order"),
      supabaseAdmin.from("product_images").select("*").eq("product_id", row.id).order("sort_order"),
      supabaseAdmin.from("product_categories").select("category_id").eq("product_id", row.id),
    ]);
    for (const r of [pRes, vRes, iRes, lRes]) {
      if (r.error) throw new Error(r.error.message);
    }
    return {
      product: {
        ...pRes.data,
        variants: vRes.data ?? [],
        images: iRes.data ?? [],
        category_ids: (lRes.data ?? []).map((r) => r.category_id),
      },
    };
  });
