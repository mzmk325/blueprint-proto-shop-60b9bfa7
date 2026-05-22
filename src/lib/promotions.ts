// Promotion utilities shared by storefront (PromoBar / ProductCard / Cart / Checkout).
// Reads active promotion from CMS store and computes auto-applied discounts.
//
// Business rules:
// - Only ONE main promotion is active at a time (highest priority enabled one).
// - First-order discount is automatic — no coupon code required.
// - Coupon input has been removed from storefront.

import { useSyncExternalStore } from "react";
import { activePromotion, type CMSPromotion } from "./cms-store";

const HAS_ORDERED_KEY = "miravue_hasOrdered";

export function hasOrderedBefore(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(HAS_ORDERED_KEY) === "1"; } catch { return false; }
}

export function markOrderedNow() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(HAS_ORDERED_KEY, "1"); } catch { /* noop */ }
}

// Reactive subscription to the same "miravue_cms_v1" key so storefront updates
// when admin changes the promotion in another tab. Mostly a no-op in this prototype
// because both live on the same page, but harmless.
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "miravue_cms_v1" || e.key === HAS_ORDERED_KEY) listeners.forEach((l) => l());
  });
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useActivePromotion(): CMSPromotion | null {
  return useSyncExternalStore(subscribe, activePromotion, () => null as CMSPromotion | null);
}

// Short label rendered on product cards / promo bar fallback.
export function promoShortLabel(p: CMSPromotion | null): string {
  if (!p) return "";
  switch (p.type) {
    case "first-order": return `First pair ${p.percent}% off`;
    case "second-half": return `Second pair 50% off`;
    case "sitewide":    return `${p.percent}% off sitewide`;
  }
}

// Long marketing copy for the top promo bar. Falls back to a sensible default
// so the bar is never empty while admin is being configured.
export function promoBarCopy(opts: {
  promoBarText?: string;
  promo: CMSPromotion | null;
}): string {
  if (opts.promoBarText && opts.promoBarText.trim()) return opts.promoBarText;
  if (opts.promo) return `${opts.promo.frontCopy} · Free shipping over $75`;
  return "First pair 15% off · Free shipping over $75";
}

// Auto-applied discount calculation.
// First-order: applies to entire subtotal for guests/users who never ordered.
// Sitewide:    applies to subtotal for everyone.
// Second-half: not implemented in this round (returns 0) — admin can preview only.
export type AppliedDiscount = {
  amount: number;
  promo: CMSPromotion;
  label: string;
};

export function computeAutoDiscount(opts: {
  subtotal: number;
  hasOrdered: boolean;
  promo?: CMSPromotion | null;
}): AppliedDiscount | null {
  const promo = opts.promo === undefined ? activePromotion() : opts.promo;
  if (!promo || !promo.enabled) return null;
  const { subtotal, hasOrdered } = opts;
  if (subtotal <= 0) return null;

  if (promo.type === "first-order") {
    if (hasOrdered) return null;
    return {
      amount: round2((subtotal * promo.percent) / 100),
      promo,
      label: "First-order discount",
    };
  }
  if (promo.type === "sitewide") {
    return {
      amount: round2((subtotal * promo.percent) / 100),
      promo,
      label: promo.title,
    };
  }
  // second-half: not auto-applied in this round
  return null;
}

function round2(n: number) { return Math.round(n * 100) / 100; }
