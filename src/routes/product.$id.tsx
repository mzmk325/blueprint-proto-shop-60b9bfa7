import { createFileRoute, Link, Navigate, notFound, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { getStorefrontProducts, getStorefrontProduct, getStorefrontProductForPreview, getProductReviews, resolveProductSlug, type StorefrontProduct } from "@/lib/storefront-cms";
import { getProductBySlugOrLegacyId } from "@/lib/catalog.functions";
import { useUser, user } from "@/lib/user-store";
import { Star, Truck, RefreshCw, ShieldCheck, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useActivePromotion, promoShortLabel } from "@/lib/promotions";
import { usePriceFormatter } from "@/lib/currency-store";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const searchSchema = z.object({
  preview: z.enum(["admin"]).optional(),
});

export const Route = createFileRoute("/product/$id")({
  validateSearch: searchSchema,
  loader: async ({ params }) => {
    // DB-first: try to resolve the id (slug OR legacy_id) to a canonical slug
    // and redirect. Falls back to the seed CMS lookup only if DB has nothing.
    try {
      const res = await getProductBySlugOrLegacyId({ data: { key: params.id } });
      if (res.product) {
        throw redirect({
          to: "/product/$slug",
          params: { slug: res.product.slug },
          replace: true,
        });
      }
    } catch (e) {
      // Re-throw redirects; swallow network errors so seed fallback still works.
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
      console.error("[product.$id] DB lookup failed", e);
    }
    const exists = getStorefrontProductForPreview(params.id);
    if (!exists) throw notFound();
    return { id: params.id, name: exists.name, descriptor: exists.descriptor };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Frame"} — MIRAVUE` },
      { name: "description", content: loaderData?.descriptor ?? "" },
    ],
  }),
  component: PDP,
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Product not available</h1>
        <p className="text-sm text-muted-foreground mb-6">This frame is no longer available or has not been published yet.</p>
        <Link to="/category/$slug" params={{ slug: "all" }} className="inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4">Browse all frames</Link>
      </div>
    </Layout>
  ),
});


function PDP() {
  const { id } = Route.useParams();
  const { preview } = Route.useSearch();
  const isPreview = preview === "admin";

  // Backward compat: if the URL id resolves to a canonical slug (and they
  // differ), redirect to /product/:slug — keeps old links working.
  const canonicalSlug = resolveProductSlug(id);
  if (canonicalSlug && canonicalSlug !== id) {
    return (
      <Navigate
        to="/product/$slug"
        params={{ slug: canonicalSlug }}
        search={isPreview ? { preview: "admin" } : {}}
        replace
      />
    );
  }

  const p = isPreview ? getStorefrontProductForPreview(id) : getStorefrontProduct(id);

  if (!p) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl mb-3">Product unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This product is currently {getStorefrontProductForPreview(id)?.status === "draft" ? "in draft" : "unpublished"} and not visible to customers.
            Append <code>?preview=admin</code> to view it from the admin.
          </p>
          <Link to="/category/$slug" params={{ slug: "all" }} className="inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4">Browse all frames</Link>
        </div>
      </Layout>
    );
  }

  return <PDPBody p={p} isPreview={isPreview} />;
}

export { PDPBody };

function PDPBody({ p, isPreview }: { p: StorefrontProduct; isPreview: boolean }) {
  const variants = p.variants.length ? p.variants : p.colors.map((c) => ({ color: c.name, hex: c.hex, images: [] as string[] }));
  const [colorIdx, setColorIdx] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
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

  // Mobile: sticky CTA visibility — show only after the in-flow CTA scrolls out.
  const primaryCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { rootMargin: "0px 0px -80px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobile carousel scroll → active index
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Reset on variant change
    setActiveImg(0);
    if (mobileScrollRef.current) mobileScrollRef.current.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }, [colorIdx]);

  const onMobileScroll = () => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeImg) setActiveImg(idx);
  };
  const scrollMobileTo = (idx: number) => {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  return (
    <Layout>
      {isPreview && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs px-6 py-2 text-center">
          Admin preview · status: <strong>{p.status ?? "published"}</strong> · this view is not visible to customers
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 pt-6 pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t("common.home")}</Link>
        <span className="mx-2">/</span>
        <Link to="/category/$slug" params={{ slug: "all" }} className="hover:text-foreground">{t(`shape.${p.shape}` as TKey)}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{p.name}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid md:grid-cols-[80px_1fr_440px] gap-8">
        {/* Desktop thumbnail rail */}
        <div className="hidden md:flex flex-col gap-3 order-1">
          {galleryImgs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImg(i)}
              className={`aspect-square w-full overflow-hidden bg-surface border ${activeImg === i ? "border-foreground" : "border-transparent hover:border-border"} transition-colors`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Desktop main image */}
        <div className="hidden md:block order-2 relative aspect-[4/5] bg-surface overflow-hidden">
          <img src={heroImg} alt={p.name} className="w-full h-full object-cover" />
          <button type="button" className="absolute bottom-5 right-5 bg-background/95 text-foreground text-[10px] uppercase tracking-[0.18em] font-semibold px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            {t("common.tryOn")}
          </button>
          <button
            type="button"
            onClick={() => user.toggleWish(p.id)}
            className="absolute top-5 right-5 size-10 flex items-center justify-center bg-background/95 hover:scale-105 transition-transform"
            aria-label={t("a11y.wishlist")}
          >
            <Heart className={`size-5 ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile gallery — swipeable carousel + thumbnails */}
        <div className="md:hidden order-2 col-span-full -mx-6">
          <div className="relative">
            <div
              ref={mobileScrollRef}
              onScroll={onMobileScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {galleryImgs.map((src, i) => (
                <div key={i} className="shrink-0 w-full snap-center aspect-[4/5] bg-surface">
                  <img src={src} alt={`${p.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {galleryImgs.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => scrollMobileTo(Math.max(0, activeImg - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/85 backdrop-blur rounded-full disabled:opacity-30"
                  disabled={activeImg === 0}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => scrollMobileTo(Math.min(galleryImgs.length - 1, activeImg + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/85 backdrop-blur rounded-full disabled:opacity-30"
                  disabled={activeImg === galleryImgs.length - 1}
                >
                  <ChevronRight className="size-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/85 backdrop-blur text-[11px] tabular-nums">
                  {activeImg + 1} / {galleryImgs.length}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => user.toggleWish(p.id)}
              className="absolute top-3 right-3 size-10 grid place-items-center bg-background/95 rounded-full"
              aria-label={t("a11y.wishlist")}
            >
              <Heart className={`size-5 ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
            </button>
          </div>

          {galleryImgs.length > 1 && (
            <div className="flex gap-2 px-6 mt-3 overflow-x-auto">
              {galleryImgs.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollMobileTo(i)}
                  className={`size-14 shrink-0 overflow-hidden bg-surface border-2 ${activeImg === i ? "border-foreground" : "border-transparent"}`}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
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
                  type="button"
                  onClick={() => { setColorIdx(i); setActiveImg(0); }}
                  className={`size-14 overflow-hidden border-2 transition ${i === colorIdx ? "border-foreground" : "border-transparent hover:border-border"}`}
                  aria-label={cc.color}
                >
                  <img src={cc.images[0]} alt={cc.color} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTAs (in-flow) */}
          <div ref={primaryCtaRef} className="space-y-2.5 pt-2">
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

      {/* Sections — Radix Accordion, no scroll jump */}
      <div className="mx-auto max-w-7xl px-6 pb-10">
        <Accordion type="single" collapsible defaultValue="details" className="border-t border-border/60">
          {[
            { k: "details", tt: t("pdp.sec.details") },
            { k: "lens", tt: t("pdp.sec.lens") },
            { k: "shipping", tt: t("pdp.sec.shipping") },
            { k: "reviews", tt: `${t("pdp.sec.reviews")}${reviewCount ? ` (${reviewCount})` : ""}` },
          ].map(({ k, tt }) => (
            <AccordionItem key={k} value={k} className="border-b border-border/60">
              <AccordionTrigger className="py-4 text-[11px] uppercase tracking-[0.18em] font-semibold hover:no-underline">
                {tt}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm text-muted-foreground">
                {k === "details" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60">
                    <div className="bg-surface/60 px-8 md:px-14 py-12 flex flex-col">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-8 text-center">Dimensions</div>
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
                          <g fill="currentColor" fontSize="9" textAnchor="middle">
                            <text x="150" y="15">{p.dims.frameWidth} mm</text>
                            <text x="80" y="115">{p.dims.lensWidth} mm</text>
                            <text x="150" y="60">{p.dims.bridge}</text>
                            <text x="280" y="65">{p.dims.lensHeight}</text>
                          </g>
                        </svg>
                      </div>
                    </div>
                    <div className="bg-surface/60 px-8 md:px-14 py-12 flex flex-col">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-8 text-center">Specifications</div>
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
                        ] as const).map(([k2, v2, unit, help]) => (
                          <div key={k2 as string}>
                            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{k2}</dt>
                            <dd className="font-display text-2xl text-foreground mt-1.5 leading-none">
                              {v2}
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
                {k === "shipping" && <p className="max-w-3xl">{t("pdp.shipDesc", { ship: fmt(75) })}</p>}
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <RecentlyViewed excludeId={p.id} />

      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border/60 pb-32 md:pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">{t("pdp.alsoLike")}</h2>
          <Link to="/category/$slug" params={{ slug: "all" }} className="text-[11px] uppercase tracking-[0.18em] underline underline-offset-4">{t("common.viewAll")}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {getStorefrontProducts().filter((x) => x.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
        </div>
      </section>

      {/* Mobile sticky purchase bar — only after primary CTA scrolls out */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-200 ${showStickyCta ? "translate-y-0" : "translate-y-full"}`}
        aria-hidden={!showStickyCta}
      >
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">{variants[colorIdx]?.color ?? ""}</span>
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
