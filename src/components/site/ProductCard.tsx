import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { type Product, isProductOnSale } from "@/lib/products";
import { useUser, user } from "@/lib/user-store";
import { useI18n } from "@/lib/i18n";
import { useActivePromotion, promoShortLabel } from "@/lib/promotions";
import { type StorefrontProduct } from "@/lib/storefront-cms";
import { usePriceFormatter } from "@/lib/currency-store";


type CardProduct = Product | StorefrontProduct;

export function ProductCard({ p }: { p: CardProduct }) {
  const { wishlist } = useUser();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const promo = useActivePromotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // DB-first: callers (category, homepage, PDP) pass already-enriched products
  // (StorefrontProduct, typically marked _source:"db"). For legacy callers that
  // only pass a bare Product, render with empty variants — we no longer reach
  // into the seed cache to invent images.
  const enriched: StorefrontProduct =
    "variants" in p && Array.isArray((p as StorefrontProduct).variants)
      ? (p as StorefrontProduct)
      : ({ ...(p as Product), variants: [] } as StorefrontProduct);

  const variants = enriched.variants;
  const [variantIdx, setVariantIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const v = variants[variantIdx] ?? variants[0];
  const img0 = v?.images[0];
  const img1 = v?.images[1] ?? img0;

  const wished = mounted && wishlist.includes(p.id);
  const promoLabel = promo ? promoShortLabel(promo) : "";

  // Prefer slug-based canonical URL when available; fall back to legacy id route.
  const slug = (enriched as { slug?: string }).slug;

  const linkProps = slug
    ? ({ to: "/product/$slug", params: { slug } } as const)
    : ({ to: "/product/$id", params: { id: p.id } } as const);

  // Lightweight verification marker: lets admins/devs inspect the DOM and
  // confirm whether the card was rendered from a DB-mapped product. Not shown
  // visually anywhere.
  const sourceMarker = (enriched as { _source?: string })._source ?? "legacy";

  return (
    <div className="group block" data-product-source={sourceMarker} data-product-id={p.id}>
      <Link {...linkProps} className="block">
        <div
          className="relative aspect-[4/5] overflow-hidden bg-surface"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {img0 && (
            <img
              src={img0}
              alt={p.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hover && img1 !== img0 ? "opacity-0" : "opacity-100"}`}
            />
          )}
          {img1 && img1 !== img0 && (
            <img
              src={img1}
              alt=""
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"}`}
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {promoLabel ? (
              <span className="bg-sale text-white text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5">{promoLabel}</span>
            ) : null}
            {p.badge ? (
              <span className="bg-background/90 backdrop-blur text-foreground text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5">{p.badge}</span>
            ) : null}
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); user.toggleWish(p.id); }}
            aria-label={t("a11y.wishlist")}
            className="absolute top-3 right-3 z-10 size-8 flex items-center justify-center text-foreground hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart className={`size-[18px] ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
          </span>
          <span className="absolute bottom-3 right-3 z-10 bg-background/95 text-foreground text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {t("common.tryOn")}
          </span>
        </div>
        <div className="mt-4 px-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold tracking-tight">{p.name}</h3>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Frame from</span>
              <span className="font-display text-[15px] font-semibold">{fmt(p.price)}</span>
              {isProductOnSale(p) && (
                <span className="text-[11px] text-muted-foreground line-through">{fmt(p.originalPrice!)}</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{p.descriptor}</p>
        </div>
      </Link>
      <div className="flex items-center gap-1.5 mt-2.5 px-0.5" onMouseLeave={() => setVariantIdx(0)}>
        {variants.slice(0, 5).map((vv, i) => (
          <button
            key={vv.color + i}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantIdx(i); }}
            onMouseEnter={() => setVariantIdx(i)}
            aria-label={vv.color}
            title={vv.color}
            className={`size-2.5 rounded-full ring-1 ring-offset-1 ring-offset-background transition ${
              i === variantIdx ? "ring-foreground" : "ring-border hover:ring-foreground/60"
            }`}
            style={{ background: vv.hex }}
          />
        ))}
        {variants.length > 5 && <span className="text-[10px] text-muted-foreground ml-1">+{variants.length - 5}</span>}
      </div>
    </div>
  );
}

