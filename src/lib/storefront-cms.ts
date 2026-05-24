// Storefront ↔ CMS bridge layer. The CMS store is the source of truth for the
// storefront. Static seed products in products.ts only exist to make the very
// first load show something — once CMS state is hydrated (which happens
// automatically on first render), every public storefront read goes through
// this file and respects publish status.

import {
  products as mockProducts,
  getProduct as getMockProduct,
  categories as mockCategories,
  productImage,
  type Product,
} from "./products";
import {
  cmsSnapshot,
  activePromotion as cmsActivePromotion,
  isNewArrival as cmsIsNewArrival,
  type CMSPromotion,
  type CMSProduct,
  type CMSHero,
  type CMSHomeCard,
  type CMSShapeBanner,
  type CMSPromoBar,
  type CMSReview,
} from "./cms-store";

// ── Types ───────────────────────────────────────────────────────────────────

export type StorefrontVariant = {
  color: string;
  hex: string;
  images: string[]; // at least 1 image; cards use [0] and [1]
};

export type StorefrontProduct = Product & {
  variants: StorefrontVariant[];      // enriched (always present)
  status?: "draft" | "published" | "unpublished";
  publishedAt?: number;
  featured?: boolean;
  hot?: boolean;
  newOverride?: "auto" | "force-in" | "force-out";
  isNew?: boolean;
  categoryIds?: string[];
  measurements?: {
    frameWidth: number;
    lensWidth: number;
    lensHeight: number;
    bridge: number;
    temple: number;
    weight: string;
  };
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeCMS() {
  try { return cmsSnapshot(); } catch { return null; }
}

function makeVariants(cmsP: CMSProduct | undefined, base?: Product): StorefrontVariant[] {
  const raw = cmsP?.variants?.length
    ? cmsP.variants
    : (base?.colors ?? []).map((c) => ({ color: c.name, hex: c.hex, images: [] as string[] }));
  return raw.map((v, i) => {
    const imgs = (v.images ?? []).filter(Boolean);
    if (imgs.length === 0 && base) imgs.push(productImage(base, i));
    if (imgs.length === 0) {
      // pure CMS product with no images yet — generic placeholder
      const hex = v.hex || "#222";
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='#f3ede4'/><circle cx='80' cy='100' r='28' fill='none' stroke='${hex}' stroke-width='5'/><circle cx='150' cy='100' r='28' fill='none' stroke='${hex}' stroke-width='5'/><path d='M108 100 q11 -6 22 0' fill='none' stroke='${hex}' stroke-width='4' stroke-linecap='round'/></svg>`;
      imgs.push(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
    if (imgs.length === 1) imgs.push(imgs[0]); // hover fallback
    return { color: v.color, hex: v.hex, images: imgs };
  });
}

// Decorate a base Product with CMS-side variant images, dims, flags.
function enrichProduct(p: Product, cmsP?: CMSProduct): StorefrontProduct {
  return {
    ...p,
    variants: makeVariants(cmsP, p),
    status: cmsP?.status,
    publishedAt: cmsP?.publishedAt,
    featured: cmsP?.featured,
    hot: cmsP?.hot,
    newOverride: cmsP?.newOverride,
    isNew: cmsP ? cmsIsNewArrival(cmsP) : p.badge === "NEW",
    categoryIds: cmsP?.categoryIds,
    measurements: cmsP ? { ...cmsP.dims } : { ...p.dims, weight: p.weight },
  };
}

// Convert a CMS-only product (no static seed) into a StorefrontProduct.
function cmsToStorefront(cp: CMSProduct): StorefrontProduct {
  const collection = ((["Bold", "Dark", "Daily", "El Dorado"] as const).includes(cp.styleTags[0] as never)
    ? cp.styleTags[0]
    : "Daily") as Product["collection"];
  const gender = ((["Women", "Men", "Unisex"] as const).includes(cp.styleTags[1] as never)
    ? cp.styleTags[1]
    : "Unisex") as Product["gender"];
  const shape = (([
    "Rectangle", "Square", "Round", "Aviator", "Cat eye", "Geometric", "Butterfly", "Oval",
  ] as const).includes(cp.shape as never) ? cp.shape : "Square") as Product["shape"];
  const colors = cp.variants.length
    ? cp.variants.map((v) => ({ name: v.color, hex: v.hex }))
    : [{ name: "Black", hex: "#1a1a1a" }];
  const badge: Product["badge"] | undefined = cp.hot
    ? "BESTSELLER"
    : cp.newOverride === "force-in"
      ? "NEW"
      : undefined;
  const saleEnabled = !!cp.originalPrice && cp.originalPrice > cp.price;
  const base: Product = {
    id: cp.id,
    name: cp.nameEn || cp.name,
    descriptor: cp.subtitle || cp.description.slice(0, 80),
    price: cp.price,
    originalPrice: cp.originalPrice,
    shape,
    gender,
    colors,
    collection,
    material: cp.material || "Acetate",
    badge,
    saleEnabled,
    dims: {
      frameWidth: cp.dims.frameWidth,
      lensHeight: cp.dims.lensHeight,
      lensWidth: cp.dims.lensWidth,
      bridge: cp.dims.bridge,
      temple: cp.dims.temple,
    },
    weight: cp.dims.weight,
    modelCode: cp.sku,
  };
  return {
    ...base,
    variants: makeVariants(cp, base),
    status: cp.status,
    publishedAt: cp.publishedAt,
    featured: cp.featured,
    hot: cp.hot,
    newOverride: cp.newOverride,
    isNew: cmsIsNewArrival(cp),
    categoryIds: cp.categoryIds,
    measurements: { ...cp.dims },
  };
}

// Build the full enriched catalog, CMS-first. Includes draft & unpublished —
// callers must filter as appropriate.
function allEnriched(): StorefrontProduct[] {
  const s = safeCMS();
  const cmsProducts = s?.products ?? [];
  const result: StorefrontProduct[] = [];
  const seen = new Set<string>();

  for (const cp of cmsProducts) {
    seen.add(cp.id);
    const base = getMockProduct(cp.id);
    result.push(base ? enrichProduct(base, cp) : cmsToStorefront(cp));
  }
  // Safety net: any seed product not yet in CMS (first paint before hydrate)
  for (const p of mockProducts) {
    if (!seen.has(p.id)) result.push(enrichProduct(p));
  }
  return result;
}

function publishedOnly(list: StorefrontProduct[]): StorefrontProduct[] {
  // If a product has no CMS status (pre-hydration seed paint), treat as published
  // so the storefront isn't empty during first render.
  return list.filter((p) => !p.status || p.status === "published");
}

// ── Products ────────────────────────────────────────────────────────────────

export function getStorefrontProducts(): StorefrontProduct[] {
  return publishedOnly(allEnriched());
}

// Public read — strips drafts/unpublished. Returns undefined for missing/hidden.
export function getStorefrontProduct(id: string): StorefrontProduct | undefined {
  const p = allEnriched().find((x) => x.id === id);
  if (!p) return undefined;
  if (p.status && p.status !== "published") return undefined;
  return p;
}

// Lookup by slug (canonical URL) — published only.
export function getStorefrontProductBySlug(slug: string): StorefrontProduct | undefined {
  const s = safeCMS();
  const match = s?.products.find((cp) => cp.slug === slug);
  if (!match) return undefined;
  return getStorefrontProduct(match.id);
}

// Lookup by legacy id — published only, returns the product so caller can redirect.
export function getStorefrontProductByLegacyId(legacyId: string): StorefrontProduct | undefined {
  const s = safeCMS();
  const match = s?.products.find((cp) => cp.legacyId === legacyId || cp.id === legacyId);
  if (!match) return undefined;
  return getStorefrontProduct(match.id);
}

// Admin/preview read — returns drafts and unpublished too.
export function getStorefrontProductForPreview(id: string): StorefrontProduct | undefined {
  return allEnriched().find((x) => x.id === id);
}

// Admin/preview read by slug.
export function getStorefrontProductForPreviewBySlug(slug: string): StorefrontProduct | undefined {
  const s = safeCMS();
  const match = s?.products.find((cp) => cp.slug === slug);
  if (!match) return undefined;
  return getStorefrontProductForPreview(match.id);
}

// Resolve the canonical slug for a product id OR legacy id. Used by the legacy
// /product/:id route to redirect to /product/:slug.
export function resolveProductSlug(idOrLegacy: string): string | undefined {
  const s = safeCMS();
  const match = s?.products.find((cp) => cp.id === idOrLegacy || cp.legacyId === idOrLegacy);
  return match?.slug;
}

export function getBestsellers(limit = 4): StorefrontProduct[] {
  const all = getStorefrontProducts();
  const hot = all.filter((p) => p.hot || p.badge === "BESTSELLER");
  return (hot.length ? hot : all).slice(0, limit);
}

export function getNewArrivals(limit = 4): StorefrontProduct[] {
  const all = getStorefrontProducts();
  const newer = all
    .filter((p) => p.isNew)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return (newer.length ? newer : all.slice(4, 4 + limit)).slice(0, limit);
}

export function getProductsByCategorySlug(slug: string): StorefrontProduct[] {
  const all = getStorefrontProducts();
  if (slug === "all") return all;
  if (slug === "best-sellers") return all.filter((p) => p.hot || p.badge === "BESTSELLER");
  if (slug === "new-arrivals") return all.filter((p) => p.isNew);

  // CMS category match by slug → categoryIds
  const s = safeCMS();
  const cmsCat = s?.categories.find((c) => c.slug === slug);
  if (cmsCat) {
    return all.filter((p) => p.categoryIds?.includes(cmsCat.id));
  }
  // Fallback: legacy mock category gender mapping
  const mock = mockCategories.find((c) => c.slug === slug);
  if (mock?.gender) return all.filter((p) => p.gender === mock.gender || p.gender === "Unisex");
  return all;
}

export type StorefrontSort =
  | "recommend" | "sort" | "new" | "price-asc" | "price-desc" | "hot";

export function sortStorefrontProducts(list: StorefrontProduct[], sort: StorefrontSort = "recommend"): StorefrontProduct[] {
  const arr = [...list];
  switch (sort) {
    case "price-asc":  return arr.sort((a, b) => a.price - b.price);
    case "price-desc": return arr.sort((a, b) => b.price - a.price);
    case "new":        return arr.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    case "hot":        return arr.sort((a, b) => Number(!!b.hot) - Number(!!a.hot));
    case "sort":
    case "recommend":
    default:           return arr; // already in CMS sort order from seed
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

export function getStorefrontCategories(): Array<{ slug: string; title: string; image?: string }> {
  const s = safeCMS();
  if (s && s.categories.length) {
    return s.categories
      .filter((c) => c.enabled)
      .map((c) => ({ slug: c.slug, title: c.nameEn || c.name, image: c.image }));
  }
  return mockCategories.map((c) => ({ slug: c.slug, title: c.title }));
}
export function getStorefrontCategoryBySlug(slug: string) {
  return getStorefrontCategories().find((c) => c.slug === slug);
}

// ── Homepage CMS bundle ─────────────────────────────────────────────────────

export type HomepageCMS = {
  heroes: CMSHero[];
  homeCards: CMSHomeCard[];
  shapeBanners: CMSShapeBanner[];
  promoBar: CMSPromoBar | null;
};

// Tasteful fallback eyewear imagery per shape — used when a CMS shape banner
// is enabled but has no image uploaded yet.
const SHAPE_FALLBACK: Record<string, string> = {
  Aviator:    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=900&q=80",
  "Cat eye":  "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=900&q=80",
  Rectangle:  "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=900&q=80",
  Square:     "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=900&q=80",
  Round:      "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=900&q=80",
  Geometric:  "https://images.unsplash.com/photo-1551803091-e20673f15770?w=900&q=80",
  Butterfly:  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80",
  Oval:       "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&q=80",
};
export function shapeBannerImage(b: CMSShapeBanner): string {
  return b.image || SHAPE_FALLBACK[b.shape] || SHAPE_FALLBACK.Rectangle;
}

export function getHomepageCMS(): HomepageCMS {
  const s = safeCMS();
  if (!s) return { heroes: [], homeCards: [], shapeBanners: [], promoBar: null };
  return {
    heroes:       s.heroes.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    homeCards:    s.homeCards.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    shapeBanners: s.shapeBanners.filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    promoBar:     s.promoBar,
  };
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export function getProductReviews(productId: string): CMSReview[] {
  const s = safeCMS();
  if (!s) return [];
  return s.reviews
    .filter((r) => r.productId === productId && r.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Promotion ───────────────────────────────────────────────────────────────

export function getActivePromotion(): CMSPromotion | null {
  return cmsActivePromotion();
}

// ── Image library helpers ───────────────────────────────────────────────────

/**
 * Where, across the CMS, is this image URL referenced? Used by the image
 * library to show usage chips and to gate destructive deletes.
 */
export function assetUsages(url: string): string[] {
  if (!url) return [];
  const s = safeCMS();
  if (!s) return [];
  const out: string[] = [];
  for (const p of s.products) {
    for (const v of p.variants) {
      if (v.images.includes(url)) {
        out.push(`${p.nameEn || p.name} · ${v.color}`);
      }
    }
  }
  for (const h of s.heroes) {
    if (h.desktopImage === url || h.mobileImage === url) out.push(`Hero · ${h.title || h.id}`);
  }
  for (const c of s.homeCards) {
    if (c.image === url) out.push(`Home card · ${c.title || c.id}`);
  }
  for (const b of s.shapeBanners) {
    if (b.image === url) out.push(`Shape · ${b.shape}`);
  }
  for (const c of s.categories) {
    if (c.image === url) out.push(`Category · ${c.nameEn || c.name}`);
  }
  for (const r of s.reviews) {
    if (r.images.includes(url)) out.push(`Review · ${r.user}`);
  }
  return out;
}
