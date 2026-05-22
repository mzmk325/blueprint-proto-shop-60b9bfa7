// Storefront ↔ CMS bridge layer.
//
// Future source of truth for storefront data reads. In this round these helpers
// proxy the existing mock catalog (src/lib/products.ts) and the CMS store so
// callers can begin migrating without breaking the current ProductCard/route
// contracts. Next round will fully back the storefront with CMS state.

import { products as mockProducts, getProduct as getMockProduct, categories as mockCategories, type Product } from "./products";
import {
  activePromotion as cmsActivePromotion,
  type CMSPromotion,
  type CMSCategory,
  type CMSHero,
  type CMSHomeCard,
  type CMSShapeBanner,
  type CMSPromoBar,
  type CMSReview,
  type CMSState,
} from "./cms-store";

// Minimal accessor — read CMS state without subscribing.
function readCMS<T>(selector: (s: CMSState) => T): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("miravue_cms_v1");
    if (!raw) return null;
    return selector(JSON.parse(raw));
  } catch { return null; }
}

// Products — keep returning the existing Product shape for backward compat.
export function getStorefrontProducts(): Product[] {
  return mockProducts;
}
export function getStorefrontProduct(id: string): Product | undefined {
  return getMockProduct(id);
}

// Categories — prefer CMS categories (admin-editable) when available, fall back
// to the static storefront list.
export function getStorefrontCategories(): Array<{ slug: string; title: string; image?: string }> {
  const cms = readCMS((s) => s.categories) as CMSCategory[] | null;
  if (cms && cms.length) {
    return cms.filter((c) => c.enabled).map((c) => ({ slug: c.slug, title: c.nameEn || c.name, image: c.image }));
  }
  return mockCategories.map((c) => ({ slug: c.slug, title: c.title }));
}
export function getStorefrontCategoryBySlug(slug: string) {
  return getStorefrontCategories().find((c) => c.slug === slug);
}

// Homepage CMS bundle: heroes, category cards, shape banners, promo bar.
export type HomepageCMS = {
  heroes: CMSHero[];
  homeCards: CMSHomeCard[];
  shapeBanners: CMSShapeBanner[];
  promoBar: CMSPromoBar | null;
};
export function getHomepageCMS(): HomepageCMS {
  const heroes = readCMS((s) => s.heroes.filter((h) => h.active)) ?? [];
  const homeCards = readCMS((s) => s.homeCards.filter((h) => h.active)) ?? [];
  const shapeBanners = readCMS((s) => s.shapeBanners.filter((h) => h.active)) ?? [];
  const promoBar = readCMS((s) => s.promoBar);
  return { heroes, homeCards, shapeBanners, promoBar };
}

// Reviews per product (visible only, sorted).
export function getProductReviews(productId: string): CMSReview[] {
  const all = readCMS((s) => s.reviews) ?? [];
  return all
    .filter((r) => r.productId === productId && r.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Active promotion — re-exported so storefront code has one import path.
export function getActivePromotion(): CMSPromotion | null {
  return cmsActivePromotion();
}
