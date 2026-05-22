// Storefront ↔ CMS bridge layer. Single source of truth for storefront reads.
//
// Reads from the in-memory CMS snapshot (cms-store) when available, otherwise
// falls back to the static mock catalog in products.ts. Returns objects that
// are backward-compatible with the existing Product shape, but enriched with
// per-variant image arrays so ProductCard / PDP can do hover swap and color
// gallery switching.

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

// Decorate a base Product with CMS-side variant images, dims, flags.
function enrichProduct(p: Product, cmsP?: CMSProduct): StorefrontProduct {
  // Build variants: prefer CMS variant.images, fall back to SVG productImage.
  const variants: StorefrontVariant[] = (cmsP?.variants?.length
    ? cmsP.variants
    : p.colors.map((c) => ({ color: c.name, hex: c.hex, images: [] }))
  ).map((v, i) => {
    const imgs = (v.images ?? []).filter(Boolean);
    if (imgs.length === 0) imgs.push(productImage(p, i));
    if (imgs.length === 1) imgs.push(imgs[0]); // ensure hover has a fallback
    return { color: v.color, hex: v.hex, images: imgs };
  });

  return {
    ...p,
    variants,
    publishedAt: cmsP?.publishedAt,
    featured: cmsP?.featured,
    hot: cmsP?.hot,
    newOverride: cmsP?.newOverride,
    isNew: cmsP ? cmsIsNewArrival(cmsP) : p.badge === "NEW",
    categoryIds: cmsP?.categoryIds,
    measurements: cmsP ? { ...cmsP.dims } : { ...p.dims, weight: p.weight },
  };
}

function allEnriched(): StorefrontProduct[] {
  const s = safeCMS();
  return mockProducts.map((p) => enrichProduct(p, s?.products.find((x) => x.id === p.id)));
}

// ── Products ────────────────────────────────────────────────────────────────

export function getStorefrontProducts(): StorefrontProduct[] {
  return allEnriched();
}

export function getStorefrontProduct(id: string): StorefrontProduct | undefined {
  const base = getMockProduct(id);
  if (!base) return undefined;
  const s = safeCMS();
  return enrichProduct(base, s?.products.find((x) => x.id === id));
}

export function getBestsellers(limit = 4): StorefrontProduct[] {
  const all = allEnriched();
  const hot = all.filter((p) => p.hot || p.badge === "BESTSELLER");
  return (hot.length ? hot : all).slice(0, limit);
}

export function getNewArrivals(limit = 4): StorefrontProduct[] {
  const all = allEnriched();
  const newer = all
    .filter((p) => p.isNew)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return (newer.length ? newer : all.slice(4, 4 + limit)).slice(0, limit);
}

export function getProductsByCategorySlug(slug: string): StorefrontProduct[] {
  const all = allEnriched();
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
