// DB-backed storefront layer. Converts the typed DB DTOs from
// catalog.functions.ts (or the admin preview variant) into the StorefrontProduct
// shape that ProductCard / PDPBody already consume.
//
// This bypasses the localStorage CMS store entirely so route loaders can read
// DB content directly without depending on client-side hydration timing.

import type { FullProduct, PublicCategory } from "./catalog.functions";
import type { Product } from "./products";
import type { StorefrontProduct, StorefrontVariant } from "./storefront-cms";

const PLACEHOLDER_BG = ["#f3ede4", "#e8e2d4", "#efe6d8", "#e4dfd3"];

function placeholderImage(name: string, hex: string, i: number): string {
  const bg = PLACEHOLDER_BG[i % PLACEHOLDER_BG.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${bg}'/><circle cx='80' cy='100' r='28' fill='none' stroke='${hex}' stroke-width='5'/><circle cx='150' cy='100' r='28' fill='none' stroke='${hex}' stroke-width='5'/><path d='M108 100 q11 -6 22 0' fill='none' stroke='${hex}' stroke-width='4' stroke-linecap='round'/><text x='100' y='180' text-anchor='middle' font-size='10' fill='#666'>${name}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SHAPE_SET = new Set([
  "Rectangle", "Square", "Round", "Aviator", "Cat eye", "Geometric", "Butterfly", "Oval",
]);
const GENDER_SET = new Set(["Women", "Men", "Unisex"]);
const COLLECTION_SET = new Set(["Bold", "Dark", "Daily", "El Dorado"]);

function coerceShape(s: string | null | undefined): Product["shape"] {
  return (s && SHAPE_SET.has(s) ? s : "Square") as Product["shape"];
}
function coerceGender(g: string | null | undefined): Product["gender"] {
  return (g && GENDER_SET.has(g) ? g : "Unisex") as Product["gender"];
}
function inferCollection(badges: string[]): Product["collection"] {
  for (const b of badges) if (COLLECTION_SET.has(b)) return b as Product["collection"];
  return "Daily";
}
function inferBadge(p: FullProduct): Product["badge"] | undefined {
  if (p.is_hot) return "BESTSELLER";
  if (p.is_new) return "NEW";
  if (p.badges?.includes("ECO")) return "ECO";
  return undefined;
}

export type DbStorefrontProduct = StorefrontProduct & {
  /** Marker so the UI / tests can confirm this object came from the DB. */
  _source: "db";
};

/**
 * Convert a DB FullProduct (variants + images) into the StorefrontProduct shape
 * used by ProductCard / PDPBody. Groups product_images by variant_id; images
 * with no variant_id become a "default" set used as fallback per variant.
 */
export function dbToStorefront(p: FullProduct): DbStorefrontProduct {
  const variantImages = new Map<string, string[]>();
  const unattached: string[] = [];
  for (const im of p.images) {
    if (im.variant_id) {
      const arr = variantImages.get(im.variant_id) ?? [];
      arr.push(im.url);
      variantImages.set(im.variant_id, arr);
    } else {
      unattached.push(im.url);
    }
  }

  const rawVariants = p.variants.length
    ? p.variants.map((v) => ({
        id: v.id,
        color: v.name_en,
        hex: v.color_hex ?? "#1a1a1a",
        sku: v.sku ?? "",
      }))
    : [{ id: "default", color: "Default", hex: "#1a1a1a", sku: "" }];

  const variants: StorefrontVariant[] = rawVariants.map((v, i) => {
    const own = variantImages.get(v.id) ?? [];
    const imgs = [...own, ...unattached];
    if (imgs.length === 0) imgs.push(placeholderImage(p.name_en, v.hex, i));
    if (imgs.length === 1) imgs.push(imgs[0]);
    return { color: v.color, hex: v.hex, images: imgs };
  });

  const colors = rawVariants.map((v) => ({ name: v.color, hex: v.hex }));
  const saleEnabled = !!p.original_price && p.original_price > p.price;

  const dims = {
    frameWidth: p.frame_width_mm ?? 140,
    lensWidth: p.lens_width_mm ?? 52,
    lensHeight: p.lens_height_mm ?? 44,
    bridge: p.bridge_mm ?? 18,
    temple: p.temple_length_mm ?? 145,
  };
  const weight = p.weight_g ? `${p.weight_g}g` : "—";

  const base: Product = {
    id: p.id,
    name: p.name_en,
    descriptor: p.descriptor_en ?? "",
    price: Number(p.price),
    originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
    shape: coerceShape(p.shape),
    gender: coerceGender(p.gender),
    colors,
    collection: inferCollection(p.badges ?? []),
    material: p.material ?? "Acetate",
    badge: inferBadge(p),
    saleEnabled,
    dims,
    weight,
    modelCode: rawVariants[0]?.sku || "",
  };

  return {
    ...base,
    // Carry the canonical slug so ProductCard links to /product/$slug.
    ...({ slug: p.slug } as { slug: string }),
    variants,
    status: p.status,
    publishedAt: p.published_at ? new Date(p.published_at).getTime() : undefined,
    featured: p.is_featured,
    hot: p.is_hot,
    isNew: p.is_new,
    categoryIds: p.category_ids,
    measurements: { ...dims, weight },
    _source: "db",
  };
}

export type DbStorefrontCategory = {
  slug: string;
  title: string;
  titleZh: string | null;
  description: string | null;
  descriptionZh: string | null;
  heroImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function dbToStorefrontCategory(c: PublicCategory): DbStorefrontCategory {
  return {
    slug: c.slug,
    title: c.name_en,
    titleZh: c.name_zh,
    description: c.description_en,
    descriptionZh: c.description_zh,
    heroImage: c.hero_image_url,
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
  };
}
