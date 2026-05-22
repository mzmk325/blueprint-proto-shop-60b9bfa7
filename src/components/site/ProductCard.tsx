import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { type Product, isProductOnSale } from "@/lib/products";
import { useUser, user } from "@/lib/user-store";
import { useI18n } from "@/lib/i18n";
import { useActivePromotion, promoShortLabel } from "@/lib/promotions";
import { getStorefrontProduct, type StorefrontProduct } from "@/lib/storefront-cms";
import { usePriceFormatter } from "@/lib/currency-store";


type CardProduct = Product | StorefrontProduct;

export function ProductCard({ p }: { p: CardProduct }) {
  const { wishlist } = useUser();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const promo = useActivePromotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  // Lazily enrich legacy Product callers so variant images always exist.
  const enriched: StorefrontProduct =
    "variants" in p && Array.isArray((p as StorefrontProduct).variants)
      ? (p as StorefrontProduct)
      : (getStorefrontProduct(p.id) ?? ({ ...(p as Product), variants: [] } as StorefrontProduct));

  const variants = enriched.variants;
  const [variantIdx, setVariantIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const v = variants[variantIdx] ?? variants[0];
  const img0 = v?.images[0];
  const img1 = v?.images[1] ?? img0;

  const wished = mounted && wishlist.includes(p.id);
  const promoLabel = promo ? promoShortLabel(promo) : "";

  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group block">
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
        <button
          onClick={(e) => { e.preventDefault(); user.toggleWish(p.id); }}
          aria-label={t("a11y.wishlist")}
          className="absolute top-3 right-3 z-10 size-8 flex items-center justify-center text-foreground hover:scale-110 transition-transform"
        >
          <Heart className={`size-[18px] ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
        </button>
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
        <div className="flex items-center gap-1.5 mt-2.5">
          {variants.slice(0, 5).map((vv, i) => (
            <button
              key={vv.color + i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVariantIdx(i); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
    </Link>
  );
}
