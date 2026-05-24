// Public storefront catalog reads. NEVER selects `cost`. Uses supabaseAdmin
// (service role) so anonymous storefront requests succeed regardless of session,
// but the column projection acts as the security boundary for the `cost` field.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Columns safe to expose publicly (NO cost).
const PUBLIC_PRODUCT_COLS = `
  id, slug, legacy_id,
  name_en, name_zh, descriptor_en, descriptor_zh, description_en, description_zh,
  selling_points, seo_title, seo_description,
  price, original_price, currency,
  gender, shape, material, badges,
  is_featured, is_hot, is_new,
  frame_width_mm, lens_width_mm, lens_height_mm, bridge_mm, temple_length_mm, weight_g,
  status, published_at, created_at, updated_at
`;

export type PublicProduct = {
  id: string;
  slug: string;
  legacy_id: string | null;
  name_en: string;
  name_zh: string | null;
  descriptor_en: string | null;
  descriptor_zh: string | null;
  description_en: string | null;
  description_zh: string | null;
  selling_points: unknown;
  seo_title: string | null;
  seo_description: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  gender: string | null;
  shape: string | null;
  material: string | null;
  badges: string[];
  is_featured: boolean;
  is_hot: boolean;
  is_new: boolean;
  frame_width_mm: number | null;
  lens_width_mm: number | null;
  lens_height_mm: number | null;
  bridge_mm: number | null;
  temple_length_mm: number | null;
  weight_g: number | null;
  status: "draft" | "published" | "unpublished";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicVariant = {
  id: string;
  product_id: string;
  name_en: string;
  name_zh: string | null;
  color_hex: string | null;
  sku: string | null;
  stock: number;
  sort_order: number;
};

export type PublicImage = {
  id: string;
  product_id: string;
  variant_id: string | null;
  asset_id: string | null;
  url: string;
  is_primary: boolean;
  sort_order: number;
};

export type PublicCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string | null;
  description_en: string | null;
  description_zh: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_published: boolean;
};

export type FullProduct = PublicProduct & {
  variants: PublicVariant[];
  images: PublicImage[];
  category_ids: string[];
};

// ── Bulk read for hydration ────────────────────────────────────────────────

export const listPublishedCatalog = createServerFn({ method: "GET" }).handler(
  async () => {
    const [productsRes, variantsRes, imagesRes, linksRes, categoriesRes, assetsRes] =
      await Promise.all([
        supabaseAdmin
          .from("products")
          .select(PUBLIC_PRODUCT_COLS)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("product_variants")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("product_images")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("product_categories")
          .select("product_id, category_id, sort_order"),
        supabaseAdmin
          .from("categories")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("assets")
          .select("id, url, name, note, type, width, height, mime_type, created_at")
          .order("created_at", { ascending: false }),
      ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (variantsRes.error) throw new Error(variantsRes.error.message);
    if (imagesRes.error) throw new Error(imagesRes.error.message);
    if (linksRes.error) throw new Error(linksRes.error.message);
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);
    if (assetsRes.error) throw new Error(assetsRes.error.message);

    const products = productsRes.data ?? [];
    const variants = variantsRes.data ?? [];
    const images = imagesRes.data ?? [];
    const links = linksRes.data ?? [];

    const productIds = new Set(products.map((p) => p.id));
    const linksByProduct = new Map<string, string[]>();
    for (const l of links) {
      if (!productIds.has(l.product_id)) continue;
      const arr = linksByProduct.get(l.product_id) ?? [];
      arr.push(l.category_id);
      linksByProduct.set(l.product_id, arr);
    }

    const variantsByProduct = new Map<string, PublicVariant[]>();
    for (const v of variants) {
      if (!productIds.has(v.product_id)) continue;
      const arr = variantsByProduct.get(v.product_id) ?? [];
      arr.push(v as PublicVariant);
      variantsByProduct.set(v.product_id, arr);
    }

    const imagesByProduct = new Map<string, PublicImage[]>();
    for (const im of images) {
      if (!productIds.has(im.product_id)) continue;
      const arr = imagesByProduct.get(im.product_id) ?? [];
      arr.push(im as PublicImage);
      imagesByProduct.set(im.product_id, arr);
    }

    const fullProducts: FullProduct[] = products.map((p) => ({
      ...(p as PublicProduct),
      variants: variantsByProduct.get(p.id) ?? [],
      images: imagesByProduct.get(p.id) ?? [],
      category_ids: linksByProduct.get(p.id) ?? [],
    }));

    return {
      products: fullProducts,
      categories: (categoriesRes.data ?? []) as PublicCategory[],
      assets: assetsRes.data ?? [],
    };
  },
);

// ── Single product lookup by slug OR legacy id ─────────────────────────────
// Returns canonical slug so the caller can redirect from legacy URLs.

export const getProductBySlugOrLegacyId = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) =>
    z.object({ key: z.string().min(1).max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Try slug first
    let { data: row, error } = await supabaseAdmin
      .from("products")
      .select(PUBLIC_PRODUCT_COLS)
      .eq("slug", data.key)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw new Error(error.message);

    let matchedBy: "slug" | "legacy" | null = row ? "slug" : null;

    if (!row) {
      const legacyRes = await supabaseAdmin
        .from("products")
        .select(PUBLIC_PRODUCT_COLS)
        .eq("legacy_id", data.key)
        .eq("status", "published")
        .maybeSingle();
      if (legacyRes.error) throw new Error(legacyRes.error.message);
      row = legacyRes.data;
      if (row) matchedBy = "legacy";
    }

    if (!row) return { product: null, matchedBy: null as const };

    const [vRes, iRes, lRes] = await Promise.all([
      supabaseAdmin
        .from("product_variants")
        .select("*")
        .eq("product_id", row.id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("product_images")
        .select("*")
        .eq("product_id", row.id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("product_categories")
        .select("category_id")
        .eq("product_id", row.id),
    ]);

    if (vRes.error) throw new Error(vRes.error.message);
    if (iRes.error) throw new Error(iRes.error.message);
    if (lRes.error) throw new Error(lRes.error.message);

    const full: FullProduct = {
      ...(row as PublicProduct),
      variants: (vRes.data ?? []) as PublicVariant[],
      images: (iRes.data ?? []) as PublicImage[],
      category_ids: (lRes.data ?? []).map((r) => r.category_id),
    };
    return { product: full, matchedBy };
  });
