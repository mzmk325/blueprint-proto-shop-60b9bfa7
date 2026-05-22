import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { getProduct, products, type Product } from "@/lib/products";
import { getStorefrontProduct, getProductReviews, type StorefrontProduct } from "@/lib/storefront-cms";
import { useUser, user } from "@/lib/user-store";
import { Star, Truck, RefreshCw, ShieldCheck, Heart, Minus, Plus } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useActivePromotion, promoShortLabel } from "@/lib/promotions";
import { usePriceFormatter } from "@/lib/currency-store";


export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Frame"} — MIRAVUE` },
      { name: "description", content: loaderData?.descriptor ?? "" },
    ],
  }),
  component: PDP,
  notFoundComponent: () => <Layout><div className="p-20 text-center">Product not found.</div></Layout>,
});

function PDP() {
  const base = Route.useLoaderData() as Product;
  const p: StorefrontProduct = getStorefrontProduct(base.id) ?? ({ ...base, variants: [] } as StorefrontProduct);
  const variants = p.variants.length ? p.variants : base.colors.map((c) => ({ color: c.name, hex: c.hex, images: [] as string[] }));
  const [colorIdx, setColorIdx] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>("details");
  const { wishlist } = useUser();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const promo = useActivePromotion();
  const promoLabel = promo ? promoShortLabel(promo) : "";
  const wished = wishlist.includes(p.id);
  useEffect(() => { user.pushRecent(p.id); }, [p.id]);


  const v = variants[colorIdx] ?? variants[0];
  const galleryImgs = v?.images?.length ? v.images : [""];
  const heroImg = galleryImgs[activeImg] ?? galleryImgs[0];
  const reviews = getProductReviews(p.id);
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.stars, 0) / reviews.length) : 4.6;
  const reviewCount = reviews.length || 0;


  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t("common.home")}</Link>
        <span className="mx-2">/</span>
        <Link to="/category/$slug" params={{ slug: "all" }} className="hover:text-foreground">{t(`shape.${p.shape}` as TKey)}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{p.name}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid md:grid-cols-[80px_1fr_440px] gap-8">
        <div className="hidden md:flex flex-col gap-3 order-1">
          {galleryImgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`aspect-square w-full overflow-hidden bg-surface border ${activeImg === i ? "border-foreground" : "border-transparent hover:border-border"} transition-colors`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="order-2 relative aspect-[4/5] bg-surface overflow-hidden">
          <img src={heroImg} alt={p.name} className="w-full h-full object-cover" />
          <button className="absolute bottom-5 right-5 bg-background/95 text-foreground text-[10px] uppercase tracking-[0.18em] font-semibold px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            {t("common.tryOn")}
          </button>
          <button
            onClick={() => user.toggleWish(p.id)}
            className="absolute top-5 right-5 size-10 flex items-center justify-center bg-background/95 hover:scale-105 transition-transform"
            aria-label={t("a11y.wishlist")}
          >
            <Heart className={`size-5 ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
          </button>
        </div>

        <div className="order-3 space-y-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t(`shape.${p.shape}` as TKey)} · {p.collection}</p>
              {p.badge === "NEW" && <span className="text-[10px] bg-foreground text-background px-2 py-0.5 uppercase tracking-wider">{t("pdp.newArrival")}</span>}
              {promoLabel && <span className="text-[10px] bg-sale text-white px-2 py-0.5 uppercase tracking-wider">{promoLabel}</span>}
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight leading-tight">{p.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{p.descriptor}</p>
          </div>

          <div className="pb-5 border-b border-border/60 space-y-2">
            <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("pdp.frameFrom")}</span>
              <span className="font-display text-2xl">{fmt(p.price)}</span>
              {p.saleEnabled && p.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{fmt(p.originalPrice)}</span>
              )}
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className={`size-3 ${i <= Math.round(avgRating) ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />)}</div>
                <span>({reviewCount || "—"})</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("pdp.framePriceNote")}</p>
          </div>


          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">{t("pdp.frameColor")}</span>
              <span className="text-xs text-muted-foreground">{variants[colorIdx]?.color ?? ""}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {variants.map((cc, i) => (
                <button
                  key={cc.color + i}
                  onClick={() => { setColorIdx(i); setActiveImg(0); }}
                  className={`size-14 overflow-hidden border-2 transition ${i === colorIdx ? "border-foreground" : "border-transparent hover:border-border"}`}
                  aria-label={cc.color}
                >
                  <img src={cc.images[0]} alt={cc.color} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              to="/lens/$id"
              params={{ id: p.id }}
              search={{ color: variants[colorIdx]?.color ?? p.colors[0]?.name }}
              className="block w-full bg-sale text-white text-center py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              {t("pdp.selectLenses")}
            </Link>
            <Link
              to="/lens/$id"
              params={{ id: p.id }}
              search={{ color: variants[colorIdx]?.color ?? p.colors[0]?.name, frameOnly: true }}
              className="block w-full bg-foreground text-background text-center py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              {t("pdp.frameOnly")}
            </Link>
            <p className="text-[11px] text-muted-foreground text-center pt-1">{t("pdp.lensesAvailable")}</p>
          </div>


          <ul className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60 text-[11px]">
            <li className="flex items-center gap-2 text-muted-foreground"><Truck className="size-3.5" /> {t("pdp.freeShip", { ship: fmt(75) })}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="size-3.5" /> {t("pdp.returns")}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="size-3.5" /> {t("pdp.warranty")}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Truck className="size-3.5" /> {t("pdp.shipTime")}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="border-t border-border/60">
          {[
            { k: "details", tt: t("pdp.sec.details") },
            { k: "lens", tt: t("pdp.sec.lens") },
            { k: "shipping", tt: t("pdp.sec.shipping") },
            { k: "reviews", tt: `${t("pdp.sec.reviews")}${reviewCount ? ` (${reviewCount})` : ""}` },
          ].map(({ k, tt }) => {
            const open = openSection === k;
            return (
              <div key={k} className="border-b border-border/60">
                <button
                  onClick={() => setOpenSection(open ? null : k)}
                  className="w-full flex justify-between items-center py-4 text-left"
                >
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">{tt}</span>
                  {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </button>
                {open && (
                  <div className="pb-6 text-sm text-muted-foreground">
                    {k === "details" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60">
                        <div className="bg-surface/60 px-8 md:px-14 py-12 flex flex-col">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-8 text-center">
                            {t("pdp.spec.dimensions" as TKey) !== "pdp.spec.dimensions" ? t("pdp.spec.dimensions" as TKey) : "Dimensions"}
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <svg viewBox="0 0 300 130" className="w-full h-auto text-foreground/80">
                              <g fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="40" y="40" width="80" height="50" rx="6" />
                                <rect x="180" y="40" width="80" height="50" rx="6" />
                                <line x1="120" y1="65" x2="180" y2="65" />
                                <line x1="40" y1="20" x2="260" y2="20" strokeDasharray="2 3" />
                                <line x1="40" y1="100" x2="40" y2="115" />
                                <line x1="120" y1="100" x2="120" y2="115" />
                                <line x1="120" y1="40" x2="120" y2="25" />
                                <line x1="180" y1="40" x2="180" y2="25" />
                              </g>
                              <g fill="currentColor" fontSize="9" fontFamily="DM Sans" textAnchor="middle">
                                <text x="150" y="15">{p.dims.frameWidth} mm</text>
                                <text x="80" y="115">{p.dims.lensWidth} mm</text>
                                <text x="150" y="60">{p.dims.bridge}</text>
                                <text x="280" y="65">{p.dims.lensHeight}</text>
                              </g>
                            </svg>
                          </div>
                        </div>
                        <div className="bg-surface/60 px-8 md:px-14 py-12 flex flex-col">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-8 text-center">
                            Specifications
                          </div>
                          <dl className="flex-1 grid grid-cols-2 gap-x-10 gap-y-7 content-center">
                            {([
                              [t("pdp.spec.model"), p.modelCode, undefined, undefined],
                              [t("pdp.spec.frameW"), `${p.dims.frameWidth}`, "mm", t("pdp.specHelp.frameW")],
                              [t("pdp.spec.lensW"), `${p.dims.lensWidth}`, "mm", t("pdp.specHelp.lensW")],
                              [t("pdp.spec.lensH"), `${p.dims.lensHeight}`, "mm", t("pdp.specHelp.lensH")],
                              [t("pdp.spec.bridge"), `${p.dims.bridge}`, "mm", t("pdp.specHelp.bridge")],
                              [t("pdp.spec.temple"), `${p.dims.temple}`, "mm", t("pdp.specHelp.temple")],
                              [t("pdp.spec.material"), p.material, undefined, undefined],
                              [t("pdp.spec.weight"), p.weight, undefined, undefined],
                            ] as const).map(([k2, v, unit, help]) => (
                              <div key={k2 as string}>
                                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{k2}</dt>
                                <dd className="font-display text-2xl text-foreground mt-1.5 leading-none">
                                  {v}
                                  {unit && <span className="text-xs text-muted-foreground ml-1 font-sans tracking-normal">{unit}</span>}
                                </dd>
                                {help && <p className="text-[11px] text-muted-foreground mt-1.5 font-sans leading-snug">{help}</p>}
                              </div>
                            ))}
                          </dl>
                          <div className="mt-6 pt-5 border-t border-border/60 text-[11px] text-muted-foreground space-y-1.5">
                            <p>{p.dims.frameWidth < 135 ? t("pdp.fitNarrow") : p.dims.frameWidth < 142 ? t("pdp.fitMedium") : p.dims.frameWidth < 150 ? t("pdp.fitWide") : t("pdp.fitXWide")}</p>
                            <p>{t("pdp.tipCompare")}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {k === "lens" && <p className="max-w-3xl">{t("pdp.lensRec")}</p>}
                    {k === "shipping" && <p className="max-w-3xl">{t("pdp.shipDesc")}</p>}
                    {k === "reviews" && (
                      <div className="space-y-4 max-w-3xl">
                        <div className="flex items-baseline gap-3">
                          <span className="font-display text-3xl text-foreground">{avgRating.toFixed(1)}</span>
                          <span className="text-xs">{t("pdp.basedOn")} {reviewCount} {t("pdp.reviews")}</span>
                        </div>
                        {reviews.length === 0 && (
                          <p className="text-xs text-muted-foreground pt-3 border-t border-border/60">No reviews yet for this frame.</p>
                        )}
                        {reviews.map((r) => (
                          <div key={r.id} className="pt-3 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground font-medium text-sm">{r.user} · {r.country}</span>
                              <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className={`size-3 ${i <= r.stars ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />)}</div>
                            </div>
                            <p className="text-xs mt-1">{r.body}</p>
                            {r.images.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {r.images.slice(0, 4).map((src, i) => (
                                  <img key={i} src={src} alt="" className="size-16 object-cover rounded" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <RecentlyViewed excludeId={p.id} />

      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border/60 pb-24 md:pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">{t("pdp.alsoLike")}</h2>
          <Link to="/category/$slug" params={{ slug: "all" }} className="text-[11px] uppercase tracking-[0.18em] underline underline-offset-4">{t("common.viewAll")}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {products.filter((x) => x.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
        </div>
      </section>

      {/* Mobile sticky purchase bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t("pdp.frameFrom")}</span>
          <span className="font-display text-lg font-semibold">{fmt(p.price)}</span>
        </div>
        <Link
          to="/lens/$id"
          params={{ id: p.id }}
          search={{ color: variants[colorIdx]?.color ?? p.colors[0]?.name }}
          className="ml-auto flex-1 bg-sale text-white text-center py-3 text-[11px] uppercase tracking-[0.18em] font-semibold hover:opacity-90 transition-opacity"
        >
          {t("pdp.selectLenses")}
        </Link>
      </div>
    </Layout>
  );
}
